import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextInput } from "../../components/ui/AppTextInput";
import { Screen } from "../../components/ui/Screen";
import {
  cancelLessonSeries,
  deleteLesson,
  getLesson,
  updateLesson,
  updateLessonSeries,
  type SeriesScope,
} from "../../services/dataService";
import { findConflictsForLesson, describeConflicts } from "../../services/calendarConflict";
import { hapticSuccess, hapticTap, hapticWarning } from "../../utils/haptics";
import { describeFirestoreError } from "../../utils/firestoreError";
import { useAuth } from "../../context/AuthContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Lesson } from "../../types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Nav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

const COMMON_TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const DURATIONS: Array<{ label: string; hours: number }> = [
  { label: "1h", hours: 1 },
  { label: "1.5h", hours: 1.5 },
  { label: "2h", hours: 2 },
  { label: "3h", hours: 3 },
];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function buildDateOptions(currentDate?: string) {
  const out: Array<{ label: string; value: string; sub: string }> = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : shortLabel(d),
      sub: i < 2 ? shortLabel(d) : "",
      value: formatDate(d),
    });
  }
  if (currentDate && !out.some((o) => o.value === currentDate)) {
    out.unshift({ label: "Current", sub: currentDate, value: currentDate });
  }
  return out;
}

export function EditLessonScreen({
  route,
  navigation,
}: {
  route: { params?: { lessonId?: string } };
  navigation: Nav;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const lessonId = route?.params?.lessonId;
  const { user } = useAuth();
  const mayBeUnverified = !user?.emailVerified;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(2);
  const [pickup, setPickup] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(lesson?.date), [lesson?.date]);

  const load = useCallback(async () => {
    if (!lessonId) return;
    try {
      const l = await getLesson(lessonId);
      if (!l) {
        Alert.alert("Lesson not found");
        navigation.goBack();
        return;
      }
      setLesson(l);
      setDate(l.date);
      setTime(l.time);
      setDuration(l.durationMinutes / 60);
      setPickup(l.pickup);
      setPrice(String(l.price));
      setNotes(l.notes || "");
    } catch (e) {
      Alert.alert("Couldn't load lesson", describeFirestoreError(e, { action: "loadLesson", mayBeUnverified }));
    } finally {
      setLoading(false);
    }
  }, [lessonId, navigation]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function save() {
    if (!lessonId || !lesson) return;
    if (!date || !time) {
      Alert.alert("Missing info", "Date and time are required.");
      return;
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      Alert.alert("Invalid price", "Enter a valid price.");
      return;
    }

    hapticTap();

    // Skip conflict check if date/time/duration didn't change
    const dateChanged = date !== lesson.date || time !== lesson.time
      || Math.round(duration * 60) !== lesson.durationMinutes;
    if (dateChanged) {
      const durationMinutes = Math.round(duration * 60);
      const conflicts = await findConflictsForLesson(date, time, durationMinutes);
      if (conflicts.length > 0) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Calendar conflict",
            `Your phone calendar already has something at this time:\n\n${describeConflicts(conflicts)}\n\nSave anyway?`,
            [
              { text: "Pick another time", style: "cancel", onPress: () => resolve(false) },
              { text: "Save anyway", style: "destructive", onPress: () => resolve(true) },
            ],
          );
        });
        if (!proceed) return;
      }
    }

    // If this lesson is part of a recurring series, ask the instructor what
    // scope to apply the changes to. Date is intentionally excluded from the
    // bulk path — moving "all future" by date doesn't make sense (would
    // re-anchor the series).
    const seriesId = lesson?.recurringGroupId;
    const seriesIdx = lesson?.recurringIndex;
    const seriesTotal = lesson?.recurringWeeks;
    const seriesDateChanged = date !== lesson?.date;
    const timeChanged = time !== lesson?.time;

    let scope: SeriesScope = "this";
    if (seriesId && !seriesDateChanged) {
      const choice = await new Promise<SeriesScope | null>((resolve) => {
        Alert.alert(
          "Recurring lesson",
          `This is lesson ${seriesIdx} of ${seriesTotal} in a weekly series. Apply changes to:`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
            { text: "This lesson only", onPress: () => resolve("this") },
            { text: "This + future", onPress: () => resolve("future") },
          ],
        );
      });
      if (!choice) return;
      scope = choice;
    }

    setSaving(true);
    try {
      if (seriesId && scope !== "this") {
        // Bulk patch — date is excluded by updateLessonSeries
        await updateLessonSeries(
          seriesId,
          {
            time: timeChanged ? time : undefined,
            durationHours: duration,
            pickup,
            price: numericPrice,
            notes,
          },
          scope,
          lessonId,
        );
      } else {
        await updateLesson(lessonId, {
          date,
          time,
          durationHours: duration,
          pickup,
          price: numericPrice,
          notes,
        });
      }
      hapticSuccess();
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't save", describeFirestoreError(e, { action: "updateLesson", mayBeUnverified }));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!lessonId || !lesson) return;
    hapticWarning();
    const seriesId = lesson.recurringGroupId;

    if (seriesId) {
      Alert.alert(
        "Cancel recurring lesson?",
        `This is lesson ${lesson.recurringIndex} of ${lesson.recurringWeeks} in a weekly series. Cancel:`,
        [
          { text: "Keep all", style: "cancel" },
          { text: "Just this one", style: "destructive", onPress: () => doDeleteScope("this") },
          { text: "This + future", style: "destructive", onPress: () => doDeleteScope("future") },
        ],
      );
      return;
    }

    Alert.alert(
      "Cancel this lesson?",
      `This permanently removes ${lesson.studentName}'s lesson on ${lesson.date} at ${lesson.time}.`,
      [
        { text: "Keep lesson", style: "cancel" },
        { text: "Cancel lesson", style: "destructive", onPress: doDelete },
      ],
    );
  }

  async function doDelete() {
    if (!lessonId) return;
    setDeleting(true);
    try {
      await deleteLesson(lessonId);
      navigation.navigate("InstructorTabs");
    } catch (e) {
      Alert.alert("Couldn't cancel", describeFirestoreError(e, { action: "deleteLesson", mayBeUnverified }));
      setDeleting(false);
    }
  }

  async function doDeleteScope(scope: SeriesScope) {
    if (!lessonId || !lesson?.recurringGroupId) return;
    setDeleting(true);
    try {
      // Series cancel = soft (review.status: cancelled). Single-only delete
      // for backward consistency with the non-series path uses hard delete.
      if (scope === "this") {
        await deleteLesson(lessonId);
      } else {
        const cancelled = await cancelLessonSeries(lesson.recurringGroupId, scope, lessonId);
        Alert.alert("Cancelled", `${cancelled} lesson${cancelled === 1 ? "" : "s"} cancelled.`);
      }
      navigation.navigate("InstructorTabs");
    } catch (e) {
      Alert.alert(
        "Couldn't cancel",
        describeFirestoreError(e, { action: "cancelLessonSeries", mayBeUnverified }),
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  if (!lesson) return null;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={c.slate900} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit lesson</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.studentName}>{lesson.studentName}</Text>

          <Section title="Date">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {dateOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  active={date === opt.value}
                  onPress={() => setDate(opt.value)}
                />
              ))}
            </ScrollView>
          </Section>

          <Section title="Time">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {COMMON_TIMES.map((t) => (
                <Chip key={t} label={t} active={time === t} onPress={() => setTime(t)} />
              ))}
            </ScrollView>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="HH:mm"
              placeholderTextColor={c.slate500}
              style={styles.timeInput}
              keyboardType="numbers-and-punctuation"
            />
          </Section>

          <Section title="Duration">
            <View style={styles.chipRow}>
              {DURATIONS.map((d) => (
                <Chip
                  key={d.label}
                  label={d.label}
                  active={duration === d.hours}
                  onPress={() => setDuration(d.hours)}
                />
              ))}
            </View>
          </Section>

          <Section title="Pickup">
            <AppTextInput label="" value={pickup} onChangeText={setPickup} autoCapitalize="words" />
          </Section>

          <Section title="Price (£)">
            <AppTextInput label="" value={price} onChangeText={setPrice} keyboardType="number-pad" />
          </Section>

          <Section title="Notes">
            <AppTextInput
              label=""
              value={notes}
              onChangeText={setNotes}
              multiline
              autoCapitalize="sentences"
              style={styles.notesInput}
            />
          </Section>

          <View style={styles.footer}>
            <AppButton
              label={saving ? "Saving…" : "Save changes"}
              onPress={save}
              disabled={saving || deleting}
            />
            <AppButton
              label={deleting ? "Cancelling…" : "Cancel lesson"}
              variant="danger"
              onPress={confirmDelete}
              disabled={saving || deleting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <View>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        {!!sub && (
          <Text style={[styles.chipSub, active && styles.chipSubActive]}>{sub}</Text>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  headerTitle: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  body: {
    paddingBottom: spacing.xl,
  },
  studentName: {
    color: c.slate900,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.slate100,
    minHeight: 44,
  },
  chipActive: {
    backgroundColor: c.emerald,
    borderColor: c.emerald,
  },
  chipText: {
    color: c.slate900,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: {
    color: c.white,
  },
  chipSub: {
    color: c.slate500,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  chipSubActive: {
    color: "rgba(255,255,255,0.85)",
  },
  timeInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.slate300,
    backgroundColor: c.surface,
    paddingHorizontal: spacing.lg,
    color: c.slate900,
    fontSize: 16,
    marginTop: spacing.sm,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: "top" as const,
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

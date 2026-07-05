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
import { useAuth } from "../../context/AuthContext";
import {
  createLesson,
  createRecurringLessons,
  getStudents,
  previewRecurringDates,
} from "../../services/dataService";
import { findConflictsForLesson, describeConflicts } from "../../services/calendarConflict";
import { hapticSuccess, hapticTap } from "../../utils/haptics";
import { describeFirestoreError } from "../../utils/firestoreError";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Student } from "../../types";

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

function buildDateOptions() {
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
  return out;
}

export function BookLessonScreen({
  route,
  navigation,
}: {
  route: { params?: { studentId?: string; date?: string } };
  navigation: Nav;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const dateOptions = useMemo(buildDateOptions, []);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string>(route?.params?.studentId || "");
  const [date, setDate] = useState<string>(route?.params?.date || dateOptions[0].value);
  const [time, setTime] = useState<string>("10:00");
  const [duration, setDuration] = useState<number>(2);
  const [pickup, setPickup] = useState("");
  const [price, setPrice] = useState("76");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(8);
  const [skipDates, setSkipDates] = useState<string[]>([]);

  // Preview the dates the recurring series would land on. Drives the skip-list UI.
  const recurringPreview = useMemo(
    () => (recurring ? previewRecurringDates(date, recurringWeeks) : []),
    [recurring, date, recurringWeeks],
  );

  function toggleSkip(date: string) {
    setSkipDates((current) =>
      current.includes(date) ? current.filter((d) => d !== date) : [...current, date],
    );
  }

  const loadStudents = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setStudents(await getStudents(user.uid, 200));
    } catch {
      // ignore — empty student list is okay
    } finally {
      setLoadingStudents(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedStudent = students.find((s) => s.id === studentId);

  // Auto-fill price by duration (assume £38/hr default)
  useEffect(() => {
    const hourly = 38;
    setPrice(String(Math.round(hourly * duration)));
  }, [duration]);

  async function submit() {
    if (!studentId || !selectedStudent) {
      Alert.alert("Pick a student", "Choose which student this lesson is for.");
      return;
    }
    if (!date || !time) {
      Alert.alert("Pick a date and time", "Both date and time are required.");
      return;
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      Alert.alert("Invalid price", "Enter a valid price.");
      return;
    }

    hapticTap();

    // Phone-calendar conflict check (silent if permission denied or no clash)
    const durationMinutes = Math.round(duration * 60);
    const conflicts = await findConflictsForLesson(date, time, durationMinutes);
    if (conflicts.length > 0) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Calendar conflict",
          `Your phone calendar already has something at this time:\n\n${describeConflicts(conflicts)}\n\nBook anyway?`,
          [
            { text: "Pick another time", style: "cancel", onPress: () => resolve(false) },
            { text: "Book anyway", style: "destructive", onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    setSaving(true);
    try {
      const seed = {
        studentId,
        studentName: selectedStudent.name,
        date,
        time,
        durationHours: duration,
        pickup: pickup.trim(),
        price: numericPrice,
        notes: notes.trim() || undefined,
        transmission: selectedStudent.transmission,
      };

      if (recurring) {
        const weeks = Math.max(2, Math.min(52, recurringWeeks));
        const result = await createRecurringLessons(seed, weeks, skipDates);
        hapticSuccess();
        const created = result.lessonIds.length;
        Alert.alert(
          "Recurring lessons booked",
          result.skipped > 0
            ? `${created} weekly lessons created (${result.skipped} skipped) for ${selectedStudent.name}, starting ${date} at ${time}.`
            : `${created} weekly lessons created for ${selectedStudent.name}, starting ${date} at ${time}.`,
          [
            {
              text: "Open first lesson",
              onPress: () => navigation.navigate("LessonDetail", { lessonId: result.lessonIds[0] }),
            },
            { text: "Done", style: "cancel", onPress: () => navigation.goBack() },
          ],
        );
      } else {
        const id = await createLesson(seed);
        hapticSuccess();
        Alert.alert("Lesson booked", `${selectedStudent.name} on ${date} at ${time}.`, [
          {
            text: "Open lesson",
            onPress: () => navigation.navigate("LessonDetail", { lessonId: id }),
          },
          { text: "Done", style: "cancel", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert(
        "Couldn't book lesson",
        describeFirestoreError(e, {
          action: "createLesson",
          mayBeUnverified: !user?.emailVerified,
        }),
      );
    } finally {
      setSaving(false);
    }
  }

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
          <Text style={styles.headerTitle}>Book lesson</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="Student">
            {loadingStudents ? (
              <ActivityIndicator color={c.emerald} />
            ) : students.length === 0 ? (
              <Text style={styles.emptyText}>
                No students yet. Add a student first from the Students tab.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {students.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    sub={s.transmission}
                    icon="person"
                    active={studentId === s.id}
                    onPress={() => setStudentId(s.id)}
                  />
                ))}
              </ScrollView>
            )}
          </Section>

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
                <Chip
                  key={t}
                  label={t}
                  active={time === t}
                  onPress={() => setTime(t)}
                />
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
            <AppTextInput
              label=""
              value={pickup}
              onChangeText={setPickup}
              placeholder="Address or postcode"
              autoCapitalize="words"
            />
          </Section>

          <Section title="Price (£)">
            <AppTextInput
              label=""
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
            />
          </Section>

          <Section title="Notes (optional)">
            <AppTextInput
              label=""
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Anything to remember for this lesson"
              autoCapitalize="sentences"
              style={styles.notesInput}
            />
          </Section>

          <Section title="Repeat weekly">
            <Pressable
              onPress={() => setRecurring(!recurring)}
              style={({ pressed }) => [styles.recurringToggle, pressed && { opacity: 0.7 }]}
              accessibilityRole="switch"
              accessibilityState={{ checked: recurring }}
            >
              <View style={[styles.recurringTrack, recurring && styles.recurringTrackOn]}>
                <View style={[styles.recurringThumb, recurring && styles.recurringThumbOn]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recurringTitle}>
                  {recurring ? `Book ${recurringWeeks} weekly lessons` : "Single lesson"}
                </Text>
                <Text style={styles.recurringHelp}>
                  {recurring
                    ? `Same time, same pickup, every week starting ${date}.`
                    : "Toggle on to repeat every week from this date."}
                </Text>
              </View>
            </Pressable>
            {recurring ? (
              <View style={styles.weeksRow}>
                {[4, 6, 8, 10, 12, 16].map((w) => {
                  const active = recurringWeeks === w;
                  return (
                    <Pressable
                      key={w}
                      onPress={() => setRecurringWeeks(w)}
                      style={({ pressed }) => [
                        styles.weekChip,
                        active && styles.weekChipActive,
                        pressed && !active && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.weekChipText, active && styles.weekChipTextActive]}>
                        {w} weeks
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {recurring && recurringPreview.length > 0 ? (
              <View style={styles.previewBlock}>
                <Text style={styles.previewKicker}>
                  Tap a date to skip it (e.g. holiday week)
                </Text>
                <View style={styles.previewList}>
                  {recurringPreview.map((d) => {
                    const skipped = skipDates.includes(d);
                    const dt = new Date(`${d}T00:00:00`);
                    const label = dt.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    });
                    return (
                      <Pressable
                        key={d}
                        onPress={() => toggleSkip(d)}
                        style={({ pressed }) => [
                          styles.previewChip,
                          skipped && styles.previewChipSkipped,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.previewChipText,
                            skipped && styles.previewChipTextSkipped,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {skipDates.length > 0 ? (
                  <Text style={styles.previewSummary}>
                    {recurringPreview.length - skipDates.length} lessons will be created
                    {" "}({skipDates.length} skipped)
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Section>

          <View style={styles.footer}>
            <AppButton
              label={saving ? "Booking…" : "Book lesson"}
              onPress={submit}
              disabled={saving || !studentId}
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
  icon,
  active,
  onPress,
}: {
  label: string;
  sub?: string;
  icon?: IoniconName;
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
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? c.white : c.emeraldDark}
          style={{ marginRight: 4 }}
        />
      )}
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
  emptyText: {
    color: c.slate500,
    fontSize: 13,
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
  recurringToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  recurringTrack: {
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: c.slate300,
    padding: 3,
    justifyContent: "center",
  },
  recurringTrackOn: { backgroundColor: c.emerald },
  recurringThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: c.surface,
  },
  recurringThumbOn: { transform: [{ translateX: 18 }] },
  recurringTitle: { color: c.slate900, fontSize: 14, fontWeight: "600" },
  recurringHelp: { color: c.slate600, fontSize: 12, marginTop: 2 },
  weeksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  weekChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  weekChipActive: { backgroundColor: c.emerald, borderColor: c.emerald },
  weekChipText: { color: c.slate900, fontSize: 12, fontWeight: "700" },
  weekChipTextActive: { color: c.white },
  previewBlock: { marginTop: spacing.md, gap: 8 },
  previewKicker: { color: c.slate600, fontSize: 11, fontWeight: "700" },
  previewList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  previewChipSkipped: {
    backgroundColor: c.slate100,
    borderColor: c.slate300,
  },
  previewChipText: { color: c.slate900, fontSize: 11, fontWeight: "700" },
  previewChipTextSkipped: {
    color: c.slate500,
    textDecorationLine: "line-through",
  },
  previewSummary: { color: c.slate700, fontSize: 11, fontWeight: "700", marginTop: 4 },
  footer: {
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

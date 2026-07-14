import { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  getLesson,
  getStudent,
  rateLessonSkill,
  setLessonAttendance,
  setLessonSkillNote,
  type LessonAttendance,
} from "../../services/dataService";
import { hapticConfirm, hapticSuccess } from "../../utils/haptics";
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

// DVSA-aligned syllabus — keep in sync with src/utils/instructorInsights.js
// SKILL_DEFINITIONS so the same student record renders identically on web.
const SKILLS: Array<{ key: string; label: string }> = [
  { key: "cockpitChecks", label: "Cockpit checks" },
  { key: "movingOff", label: "Moving off and stopping" },
  { key: "mirrors", label: "Mirrors and signals" },
  { key: "useOfSpeed", label: "Use of speed" },
  { key: "junctions", label: "Junctions and emerging" },
  { key: "roundabouts", label: "Roundabouts" },
  { key: "pedestrianCrossings", label: "Pedestrian crossings" },
  { key: "positioning", label: "Position and lane discipline" },
  { key: "awareness", label: "Awareness and planning" },
  { key: "dualCarriageways", label: "Dual carriageways" },
  { key: "independentDriving", label: "Independent driving" },
  { key: "parallelParking", label: "Parallel parking" },
  { key: "forwardParking", label: "Forward bay parking" },
  { key: "reverseParking", label: "Reverse bay parking" },
];

function computeOverall(ratings?: Record<string, number>): { score: number; rated: number } {
  if (!ratings) return { score: 0, rated: 0 };
  const values = SKILLS.map((s) => ratings[s.key]).filter((v) => typeof v === "number" && v > 0);
  if (values.length === 0) return { score: 0, rated: 0 };
  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  return { score: Math.round(avg * 2 * 10) / 10, rated: values.length };
}

export function LessonDetailScreen({
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceSaving, setAttendanceSaving] = useState<LessonAttendance | null>(null);
  const [studentPhone, setStudentPhone] = useState<string>("");

  const load = useCallback(async () => {
    if (!lessonId) {
      setError("This lesson seems to have moved. Tap back and try again.");
      return;
    }
    setError(null);
    try {
      const next = await getLesson(lessonId);
      if (!next) {
        setError("This lesson seems to have moved. Tap back and try again.");
      } else {
        setLesson(next);
        // Best-effort phone lookup so the Call/Text actions can work.
        if (next.studentId) {
          getStudent(next.studentId)
            .then((student) => setStudentPhone(student?.phone || ""))
            .catch(() => setStudentPhone(""));
        }
      }
    } catch (err) {
      setError(describeFirestoreError(err, { action: "loadLesson", mayBeUnverified }));
    }
  }, [lessonId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function openMaps(pickup: string) {
    const q = encodeURIComponent(pickup);
    const url = Platform.select({
      ios: `maps://?q=${q}`,
      android: `geo:0,0?q=${q}`,
      default: `https://maps.google.com/?q=${q}`,
    })!;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${q}`),
    );
  }

  function call(phone?: string) {
    if (!phone) return;
    const clean = phone.replace(/\s+/g, "");
    Linking.openURL(`tel:${clean}`).catch(() =>
      Alert.alert("Phone app did not open", `Call ${phone} from the student profile instead.`),
    );
  }

  function text(phone?: string) {
    if (!phone) return;
    const clean = phone.replace(/\s+/g, "");
    Linking.openURL(`sms:${clean}`).catch(() =>
      Alert.alert("Messages did not open", `Text ${phone} from the student profile instead.`),
    );
  }

  function isPastLesson(value: Lesson | null): boolean {
    if (!value?.date) return false;
    try {
      const start = new Date(`${value.date}T${value.time || "23:59"}:00`);
      if (Number.isNaN(start.getTime())) return false;
      const minutes = Number.isFinite(value.durationMinutes) ? value.durationMinutes : 60;
      const end = new Date(start.getTime() + minutes * 60 * 1000);
      return end.getTime() < Date.now();
    } catch {
      return false;
    }
  }

  async function handleAttendance(value: LessonAttendance) {
    if (!lesson || attendanceSaving) return;
    setAttendanceSaving(value);
    try {
      await setLessonAttendance(lesson.id, value);
      setLesson({ ...lesson, attendance: value, attendanceUpdatedAt: Date.now() });
      hapticSuccess();
    } catch (e) {
      Alert.alert("Could not update attendance", describeFirestoreError(e, { action: "setAttendance", mayBeUnverified }));
    } finally {
      setAttendanceSaving(null);
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

  if (error || !lesson) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} title="Lesson" />
        <EmptyState
          iconName="alert-circle-outline"
          title="This lesson seems to have moved"
          message={error || "Tap back and open it from your calendar again."}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const paid = lesson.paymentStatus === "paid";

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <BackHeader
        onBack={() => navigation.goBack()}
        title="Lesson"
        rightIcon="create-outline"
        onRight={() => navigation.navigate("EditLesson", { lessonId: lesson.id })}
      />

      <View style={styles.hero}>
        <Text style={styles.studentName}>{lesson.studentName}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color={c.emeraldDark} />
            <Text style={styles.metaChipText}>
              {lesson.time || "TBC"} · {lesson.durationMinutes}m
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={14} color={c.emeraldDark} />
            <Text style={styles.metaChipText}>{lesson.date || "Today"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={20} color={c.slate700} />
            <Text style={styles.cardText} numberOfLines={2}>
              {lesson.pickup || "Pickup to be confirmed"}
            </Text>
          </View>
          {!!lesson.pickup && (
            <ActionRow
              icon="navigate"
              label="Open in Maps"
              onPress={() => openMaps(lesson.pickup)}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons
              name={paid ? "checkmark-circle" : "time"}
              size={20}
              color={paid ? c.green : c.amber}
            />
            <View style={styles.flex}>
              <Text style={styles.cardText}>£{lesson.price}</Text>
              <Text style={styles.cardSub}>
                {paid ? "Paid" : lesson.paymentStatus === "pending" ? "Pending" : "Unpaid"}
              </Text>
            </View>
          </View>
          {!paid && (
            <ActionRow
              icon="cash-outline"
              label="Review in Payments"
              onPress={() => navigation.navigate("Payments", { lessonId: lesson.id })}
              accent
            />
          )}
        </View>
      </View>

      {(isPastLesson(lesson) || lesson.attendance) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons
                name={
                  lesson.attendance === "attended" ? "checkmark-circle"
                  : lesson.attendance === "noshow" ? "close-circle"
                  : lesson.attendance === "cancelled" ? "ban-outline"
                  : "alert-circle-outline"
                }
                size={20}
                color={
                  lesson.attendance === "attended" ? c.green
                  : lesson.attendance === "noshow" ? c.red
                  : c.amber
                }
              />
              <View style={styles.flex}>
                <Text style={styles.cardText}>
                  {lesson.attendance === "attended" ? "Attended"
                    : lesson.attendance === "noshow" ? "No-show"
                    : lesson.attendance === "cancelled" ? "Cancelled"
                    : "Pending"}
                </Text>
                <Text style={styles.cardSub}>
                  {lesson.attendance ? "Tap to change" : "Tracks no-shows so you can see what they cost."}
                </Text>
              </View>
            </View>
            <ActionRow
              icon="checkmark-done-outline"
              label={attendanceSaving === "attended" ? "Saving…" : "Mark attended"}
              onPress={() => handleAttendance("attended")}
              disabled={attendanceSaving !== null}
              accent={lesson.attendance !== "attended"}
            />
            <ActionRow
              icon="alert-circle-outline"
              label={attendanceSaving === "noshow" ? "Saving…" : "Mark no-show"}
              onPress={() => handleAttendance("noshow")}
              disabled={attendanceSaving !== null}
            />
            <ActionRow
              icon="ban-outline"
              label={attendanceSaving === "cancelled" ? "Saving…" : "Mark cancelled"}
              onPress={() => handleAttendance("cancelled")}
              disabled={attendanceSaving !== null}
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact student</Text>
        <View style={styles.card}>
          <ActionRow
            icon="call-outline"
            label={studentPhone ? `Call ${studentPhone}` : "Call student"}
            onPress={() => call(studentPhone)}
            disabled={!studentPhone}
          />
          <ActionRow
            icon="paper-plane-outline"
            label="Text via SMS"
            onPress={() => text(studentPhone)}
            disabled={!studentPhone}
          />
          <ActionRow
            icon="chatbubble-outline"
            label="Open in-app chat"
            onPress={() =>
              navigation.navigate("Conversation", {
                studentId: lesson.studentId,
                studentName: lesson.studentName,
              })
            }
          />
        </View>
        {!studentPhone && (
          <Text style={styles.helperText}>
            Add a phone number on the student profile to enable Call and SMS.
          </Text>
        )}
      </View>

      {!!lesson.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{lesson.notes}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning record</Text>
        <View style={styles.card}>
          <ActionRow
            icon="document-text-outline"
            label="Add structured lesson summary"
            onPress={() => navigation.navigate("StudentLearningHub", {
              studentId: lesson.studentId,
              studentName: lesson.studentName,
              lessonId: lesson.id,
              openSummary: true,
            })}
            accent
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Rate skills</Text>
          <OverallScoreBadge ratings={lesson.skillRatings} />
        </View>
        <View style={styles.card}>
          {SKILLS.map((skill, idx) => (
            <SkillRow
              key={skill.key}
              label={skill.label}
              rating={lesson.skillRatings?.[skill.key] || 0}
              note={lesson.skillNotes?.[skill.key] || ""}
              isLast={idx === SKILLS.length - 1}
              onRate={async (rating) => {
                hapticConfirm();
                const next = { ...(lesson.skillRatings || {}), [skill.key]: rating };
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setLesson({ ...lesson, skillRatings: next });
                try {
                  await rateLessonSkill(lesson.id, skill.key, rating, next);
                } catch (e) {
                  Alert.alert(
                    "Rating did not save",
                    describeFirestoreError(e, { action: "rateLessonSkill", mayBeUnverified }),
                  );
                }
              }}
              onSaveNote={async (text) => {
                const trimmed = text.trim();
                const nextNotes = { ...(lesson.skillNotes || {}) };
                if (trimmed) nextNotes[skill.key] = trimmed;
                else delete nextNotes[skill.key];
                setLesson({ ...lesson, skillNotes: nextNotes });
                try {
                  await setLessonSkillNote(lesson.id, skill.key, trimmed);
                } catch (e) {
                  Alert.alert(
                    "Note did not save",
                    describeFirestoreError(e, { action: "setLessonSkillNote", mayBeUnverified }),
                  );
                }
              }}
            />
          ))}
        </View>
        <Text style={styles.helperText}>
          Tap a star to rate — saved automatically. Score updates as you rate.
        </Text>
      </View>
    </Screen>
  );
}

function OverallScoreBadge({ ratings }: { ratings?: Record<string, number> }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { score, rated } = computeOverall(ratings);
  if (rated === 0) {
    return (
      <View style={[styles.scorePill, styles.scorePillEmpty]}>
        <Text style={styles.scoreEmptyText}>Not rated</Text>
      </View>
    );
  }
  const tone = score >= 7 ? c.green : score >= 4 ? c.amber : c.red;
  const bg = score >= 7 ? c.greenSoft : score >= 4 ? c.amberSoft : c.redSoft;
  return (
    <View style={[styles.scorePill, { backgroundColor: bg }]}>
      <Text style={[styles.scoreText, { color: tone }]}>
        {score.toFixed(1)}
        <Text style={styles.scoreOutOf}>/10</Text>
      </Text>
      <Text style={[styles.scoreSubText, { color: tone }]}>
        {rated} of {SKILLS.length} rated
      </Text>
    </View>
  );
}

function SkillRow({
  label,
  rating,
  note,
  isLast,
  onRate,
  onSaveNote,
}: {
  label: string;
  rating: number;
  note: string;
  isLast: boolean;
  onRate: (n: number) => void;
  onSaveNote: (text: string) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);

  // Reset the draft if the upstream note changes (e.g. another tab edited it)
  useEffect(() => {
    if (!editing) setDraft(note);
  }, [note, editing]);

  function commit() {
    setEditing(false);
    if ((draft || "").trim() !== (note || "").trim()) onSaveNote(draft);
  }

  return (
    <View style={[styles.skillRow, !isLast && styles.skillDivider]}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillLabel}>{label}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => onRate(n === rating ? 0 : n)}
              style={({ pressed }) => [styles.star, pressed && styles.pressed]}
              hitSlop={10}
            >
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={18}
                color={n <= rating ? c.amber : c.slate300}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoFocus
          multiline
          maxLength={500}
          placeholder="Add a comment for this skill"
          placeholderTextColor={c.slate500}
          style={styles.skillNoteInput}
          returnKeyType="done"
          blurOnSubmit
        />
      ) : note ? (
        <Pressable onPress={() => setEditing(true)} hitSlop={6}>
          <Text style={styles.skillNoteText}>{note}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => setEditing(true)} hitSlop={6}>
          <Text style={styles.skillAddNote}>+ Add comment</Text>
        </Pressable>
      )}
    </View>
  );
}

function BackHeader({
  onBack,
  title,
  rightIcon,
  onRight,
}: {
  onBack: () => void;
  title: string;
  rightIcon?: IoniconName;
  onRight?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={c.slate900} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {rightIcon && onRight ? (
        <Pressable
          onPress={onRight}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name={rightIcon} size={20} color={c.slate900} />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  disabled,
  accent,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        accent && styles.actionRowAccent,
        disabled && styles.actionRowDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={accent ? c.white : c.emeraldDark}
      />
      <Text style={[styles.actionLabel, accent && styles.actionLabelAccent]}>{label}</Text>
      {!accent && (
        <Ionicons name="chevron-forward" size={16} color={c.slate300} />
      )}
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
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
    marginBottom: spacing.lg,
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
  hero: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  studentName: {
    color: c.slate900,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: c.emeraldSoft,
    borderRadius: 999,
  },
  metaChipText: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "600",
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
  card: {
    backgroundColor: c.surface,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  flex: {
    flex: 1,
  },
  cardText: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  cardSub: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  actionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionRowAccent: {
    backgroundColor: c.emerald,
  },
  actionRowDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    flex: 1,
    color: c.slate900,
    fontSize: 14,
    fontWeight: "600",
  },
  actionLabelAccent: {
    color: c.white,
  },
  helperText: {
    color: c.slate500,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  notesText: {
    color: c.slate700,
    fontSize: 14,
    lineHeight: 22,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  scorePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "flex-end",
  },
  scorePillEmpty: {
    backgroundColor: c.slate100,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  scoreOutOf: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.7,
  },
  scoreSubText: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.85,
    marginTop: -1,
  },
  scoreEmptyText: {
    color: c.slate500,
    fontSize: 11,
    fontWeight: "600",
  },
  skillRow: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skillDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  skillLabel: {
    flex: 1,
    color: c.slate900,
    fontSize: 13,
    fontWeight: "700",
  },
  skillNoteInput: {
    fontSize: 13,
    color: c.slate900,
    backgroundColor: c.slate100,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 38,
  },
  skillNoteText: {
    fontSize: 13,
    color: c.slate700,
    lineHeight: 18,
    paddingVertical: 2,
  },
  skillAddNote: {
    fontSize: 12,
    color: c.emerald,
    fontWeight: "600",
    paddingVertical: 2,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
  },
  star: {
    padding: 4,
  },
});

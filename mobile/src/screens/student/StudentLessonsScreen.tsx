import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { FadeInView } from "../../components/ui/FadeInView";
import { Pill } from "../../components/ui/Pill";
import { Screen } from "../../components/ui/Screen";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { getStudentByUid, getStudentLessons } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson, Student } from "../../types";

type Nav = { navigate: (screen: string, params?: Record<string, unknown>) => void };

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isUpcomingLesson(lesson: Lesson) {
  return !lesson.date || lesson.date >= todayKey();
}

export function StudentLessonsScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const studentDoc = await getStudentByUid(user.uid);
      setStudent(studentDoc);
      if (studentDoc) {
        setLessons(await getStudentLessons(studentDoc.id, 50));
      } else {
        setLessons([]);
      }
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading your lessons. Pull down to retry."));
    }
  }, [user?.uid]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    return lessons.reduce(
      (groups, lesson) => {
        if (isUpcomingLesson(lesson)) groups.upcoming.push(lesson);
        else groups.past.push(lesson);
        return groups;
      },
      { upcoming: [] as Lesson[], past: [] as Lesson[] },
    );
  }, [lessons]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((item) => (
            <SkeletonRow key={item} />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <Text style={styles.title}>Lessons</Text>
      <Text style={styles.copy}>Upcoming and past lessons from your instructor.</Text>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {!student ? (
        <EmptyState
          iconName="link-outline"
          title="You're nearly connected"
          message={`Ask your instructor to add you with ${user?.email || "this email"}. Lessons appear here after linking.`}
        />
      ) : lessons.length === 0 ? (
        <EmptyState
          iconName="calendar-outline"
          title="Lessons will land here"
          message="After your instructor books one, you can review the time, pickup and notes."
        />
      ) : (
        <>
          <LessonGroup title="Upcoming" lessons={upcoming} baseDelay={0} />
          <LessonGroup
            title="Past"
            lessons={past}
            baseDelay={upcoming.length * 60}
            onGiveFeedback={(lessonId) => navigation.navigate("LessonFeedback", { lessonId })}
          />
          <Pill label="Your instructor controls bookings" tone="info" />
        </>
      )}
    </Screen>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m = "00"] = time.split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m.padStart(2, "0")}${suffix}`;
}

function paymentTone(status: Lesson["paymentStatus"]): "success" | "warning" | "neutral" {
  if (status === "paid") return "success";
  if (status === "not_paid" || status === "unpaid") return "warning";
  return "neutral";
}

function paymentLabel(status: Lesson["paymentStatus"]): string {
  if (status === "paid") return "Paid";
  if (status === "not_paid") return "Not paid";
  if (status === "pending") return "Pending";
  return "Unpaid";
}

function DateBox({ date }: { date: string }) {
  const styles = useThemedStyles(makeStyles);
  if (!date) {
    return (
      <View style={styles.dateBox}>
        <Text style={styles.dateBoxDay}>—</Text>
      </View>
    );
  }
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    return (
      <View style={styles.dateBox}>
        <Text style={styles.dateBoxDay}>TBC</Text>
      </View>
    );
  }
  const day = d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  const num = String(d.getDate());
  return (
    <View style={styles.dateBox}>
      <Text style={styles.dateBoxDay}>{day}</Text>
      <Text style={styles.dateBoxNum}>{num}</Text>
    </View>
  );
}

function LessonGroup({
  title,
  lessons,
  baseDelay,
  onGiveFeedback,
}: {
  title: string;
  lessons: Lesson[];
  baseDelay: number;
  onGiveFeedback?: (lessonId: string) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  if (lessons.length === 0) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {lessons.map((lesson, index) => {
        const subtitle = [
          `${lesson.durationMinutes} mins`,
          lesson.pickup || "Pickup TBC",
        ]
          .filter(Boolean)
          .join(" · ");

        const isPast = Boolean(onGiveFeedback);

        return (
          <FadeInView key={lesson.id} delay={baseDelay + index * 60}>
            {isPast ? (
              <Pressable
                onPress={() => onGiveFeedback?.(lesson.id)}
                accessibilityRole="button"
                accessibilityLabel={`Give anonymous feedback for ${lesson.date} lesson`}
                style={({ pressed }) => [styles.lessonRow, pressed && { opacity: 0.7 }]}
              >
                <DateBox date={lesson.date} />
                <View style={styles.lessonRowBody}>
                  <Text style={styles.lessonRowTitle}>
                    {lesson.time ? formatTime(lesson.time) : "Time TBC"}
                  </Text>
                  <Text style={styles.lessonRowSubtitle}>{subtitle}</Text>
                  <View style={styles.lessonRowFeedback}>
                    <Pill label="Give feedback" tone="success" />
                  </View>
                </View>
                <View style={styles.lessonRowEnd}>
                  <Pill label={paymentLabel(lesson.paymentStatus)} tone={paymentTone(lesson.paymentStatus)} />
                  <Ionicons name="chevron-forward" size={16} color={c.slate500} />
                </View>
              </Pressable>
            ) : (
              <View style={styles.lessonRow}>
                <DateBox date={lesson.date} />
                <View style={styles.lessonRowBody}>
                  <Text style={styles.lessonRowTitle}>
                    {lesson.time ? formatTime(lesson.time) : "Time TBC"}
                  </Text>
                  <Text style={styles.lessonRowSubtitle}>{subtitle}</Text>
                </View>
                <Pill label={paymentLabel(lesson.paymentStatus)} tone={paymentTone(lesson.paymentStatus)} />
              </View>
            )}
          </FadeInView>
        );
      })}
    </Card>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  title: {
    color: c.slate900,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  copy: {
    ...typography.subhead,
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  skeletonList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  sectionTitle: {
    color: c.slate900,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: c.redSoft,
    marginBottom: spacing.md,
  },
  errorText: {
    color: c.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.slate100,
  },
  dateBox: {
    width: 46,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: c.emeraldSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    gap: 1,
    paddingVertical: 6,
  },
  dateBoxDay: {
    color: c.emerald,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    lineHeight: 13,
  },
  dateBoxNum: {
    color: c.emeraldDark,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  lessonRowBody: {
    flex: 1,
    gap: 3,
  },
  lessonRowTitle: {
    color: c.slate900,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  lessonRowSubtitle: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  lessonRowFeedback: {
    marginTop: 6,
  },
  lessonRowEnd: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});

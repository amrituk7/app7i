import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { FadeInView } from "../../components/ui/FadeInView";
import { ListRow } from "../../components/ui/ListRow";
import { Screen } from "../../components/ui/Screen";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { getTodayLessons, getUpcomingLessons, getUpcomingTests } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson, Student } from "../../types";
import { formatGBP } from "../../utils/currency";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type MobileNavigation = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

const statusCopy: Record<Lesson["status"], { label: string; icon: IoniconName }> = {
  scheduled: { label: "Scheduled", icon: "time-outline" },
  completed: { label: "Done", icon: "checkmark-circle-outline" },
  cancelled: { label: "Cancelled", icon: "close-circle-outline" },
};

export function TodayLessonsScreen({ navigation }: { navigation: MobileNavigation }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const [today, upcoming, tests] = await Promise.all([
        getTodayLessons(user.uid),
        getUpcomingLessons(user.uid, 20),
        getUpcomingTests(user.uid),
      ]);
      setLessons(today);
      setUpcomingLessons(
        upcoming.filter((lesson) => lesson.date > todayISO() && lesson.status !== "cancelled").slice(0, 3),
      );
      setUpcomingTests(tests.slice(0, 3));
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading today's lessons. Pull down to retry."));
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
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toUpperCase()}</Text>
          <Text style={styles.title}>Schedule</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
          onPress={() => navigation.navigate("ModuleCalendar")}
          accessibilityRole="button"
          accessibilityLabel="Open schedule calendar"
        >
          <Ionicons name="calendar-outline" size={20} color={c.emeraldDark} />
        </Pressable>
      </View>

      {error ? <NativeNotice icon="warning-outline" message={error} /> : null}

      {lessons.length === 0 ? (
        <Card style={styles.emptyTodayCard}>
          <View style={styles.emptyTodayIcon}>
            <Ionicons name="calendar-outline" size={20} color={c.emeraldDark} />
          </View>
          <View style={styles.emptyTodayCopy}>
            <Text style={styles.emptyTodayTitle}>No lessons today</Text>
            <Text style={styles.emptyTodayText}>
              Your next bookings and practical tests are still visible below.
            </Text>
          </View>
          <AppButton label="Book a lesson" onPress={() => navigation.navigate("BookLesson")} />
        </Card>
      ) : (
        <View style={styles.list}>
          {lessons.map((lesson, index) => (
            <FadeInView key={lesson.id} delay={index * 80}>
              <LessonRow
                lesson={lesson}
                isLast={index === lessons.length - 1}
                onPress={() => navigation.navigate("LessonDetail", { lessonId: lesson.id })}
              />
            </FadeInView>
          ))}
        </View>
      )}

      <SectionHeader title="Coming up" />
      <Card style={styles.upcomingCard}>
        {upcomingLessons.length === 0 ? (
          <View style={styles.compactEmpty}>
            <Ionicons name="time-outline" size={20} color={c.slate300} />
            <View style={styles.compactEmptyCopy}>
              <Text style={styles.compactEmptyTitle}>No upcoming lessons</Text>
              <Text style={styles.compactEmptyText}>New bookings will appear here.</Text>
            </View>
          </View>
        ) : (
          upcomingLessons.map((lesson) => (
            <ListRow
              key={lesson.id}
              title={lesson.studentName}
              subtitle={`${formatLessonDate(lesson.date)} at ${lesson.time || "Time TBC"}`}
              right={formatGBP(lesson.price)}
              onPress={() => navigation.navigate("LessonDetail", { lessonId: lesson.id })}
            />
          ))
        )}
      </Card>

      <SectionHeader
        title="Practical tests"
        actionLabel="View all"
        onAction={() => navigation.navigate("PracticalTests")}
      />
      <Pressable
        onPress={() => navigation.navigate("PracticalTests")}
        style={({ pressed }) => [styles.testSummary, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.testSummaryIcon}>
          <Ionicons name="ribbon-outline" size={20} color={c.emeraldDark} />
        </View>
        <View style={styles.testSummaryCopy}>
          <Text style={styles.testSummaryTitle}>
            {upcomingTests.length > 0
              ? `${upcomingTests.length} upcoming ${upcomingTests.length === 1 ? "test" : "tests"}`
              : "No practical tests booked"}
          </Text>
          <Text style={styles.testSummaryText} numberOfLines={1}>
            {upcomingTests[0]?.practicalTestDate
              ? `${upcomingTests[0].name} - ${formatLessonDate(upcomingTests[0].practicalTestDate)}`
              : "Add a test date from a student's profile."}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.slate300} />
      </Pressable>
    </Screen>
  );
}

function todayISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatLessonDate(iso: string): string {
  const value = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(value.getTime())) return iso || "Date TBC";
  return value.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function LessonRow({
  lesson,
  isLast,
  onPress,
}: {
  lesson: Lesson;
  isLast: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const paymentPaid = lesson.paymentStatus === "paid";
  const status = statusCopy[lesson.status];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.lessonRow,
        !isLast && styles.rowDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{lesson.time || "TBC"}</Text>
        <Text style={styles.duration}>{lesson.durationMinutes}m</Text>
      </View>

      <View style={styles.timeline}>
        <View style={styles.timelineDot} />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={styles.lessonCopy}>
        <View style={styles.rowTop}>
          <Text style={styles.name} numberOfLines={1}>
            {lesson.studentName}
          </Text>
          <View style={[styles.paymentPill, paymentPaid ? styles.paymentPaid : styles.paymentDue]}>
            <Text style={[styles.paymentText, paymentPaid ? styles.paymentTextPaid : styles.paymentTextDue]}>
              {paymentPaid ? "Paid" : "Owed"}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={c.slate500} />
          <Text style={styles.metaText} numberOfLines={1}>
            {lesson.pickup || "Pickup to confirm"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name={status.icon} size={14} color={c.slate500} />
          <Text style={styles.metaText}>{status.label}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{formatGBP(lesson.price)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.slate300} />
    </Pressable>
  );
}

function NativeNotice({ icon, message }: { icon: IoniconName; message: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={18} color={c.red} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kicker: {
    color: c.emerald,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  emptyTodayCard: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyTodayIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  emptyTodayCopy: {
    gap: 4,
  },
  emptyTodayTitle: {
    color: c.slate900,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyTodayText: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 18,
  },
  upcomingCard: {
    paddingVertical: 0,
  },
  compactEmpty: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  compactEmptyCopy: {
    flex: 1,
    gap: 3,
  },
  compactEmptyTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "600",
  },
  compactEmptyText: {
    color: c.slate500,
    fontSize: 12,
  },
  testSummary: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  testSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  testSummaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  testSummaryTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "600",
  },
  testSummaryText: {
    color: c.slate500,
    fontSize: 12,
  },
  list: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  skeletonList: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  lessonRow: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  timeColumn: {
    width: 54,
    paddingTop: 3,
  },
  time: {
    color: c.slate900,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  duration: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  timeline: {
    width: 12,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.emerald,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 5,
    backgroundColor: c.emeraldSoft,
  },
  lessonCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    ...typography.headline,
    color: c.slate900,
  },
  paymentPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  paymentPaid: {
    backgroundColor: c.greenSoft,
  },
  paymentDue: {
    backgroundColor: c.amberSoft,
  },
  paymentText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  paymentTextPaid: {
    color: c.green,
  },
  paymentTextDue: {
    color: c.amber,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  dot: {
    color: c.slate300,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  notice: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: c.redSoft,
  },
  noticeText: {
    flex: 1,
    color: c.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

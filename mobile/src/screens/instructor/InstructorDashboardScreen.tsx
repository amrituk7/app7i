import { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { FadeInView } from "../../components/ui/FadeInView";
import { ListRow } from "../../components/ui/ListRow";
import { MetricCard } from "../../components/ui/MetricCard";
import { NotificationBell } from "../../components/ui/NotificationBell";
import { Pill } from "../../components/ui/Pill";
import { Screen } from "../../components/ui/Screen";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { InviteSheet } from "../../components/ui/InviteSheet";
import { Skeleton, SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import {
  getStudents,
  getTodayLessons,
  getUnpaidInvoices,
  getUpcomingTests,
} from "../../services/dataService";
import type { Lesson, Student, Invoice } from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function londonHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(new Date()),
    10,
  );
}

function greeting() {
  const h = londonHour();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

function initials(name?: string | null) {
  if (!name) return "I";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function InstructorDashboardScreen({ navigation }: { navigation: any }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const [l, s, inv, tests] = await Promise.all([
        getTodayLessons(user.uid),
        getStudents(user.uid, 100),
        getUnpaidInvoices(user.uid, 50),
        getUpcomingTests(user.uid),
      ]);
      setTodayLessons(l);
      setStudents(s);
      setInvoices(inv);
      setUpcomingTests(tests.slice(0, 5));
    } catch (e) {
      setError(toFriendlyError(e, "We're having trouble loading this. Pull down to retry."));
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

  const unpaidTotal = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paidToday = todayLessons
    .filter((l) => l.paymentStatus === "paid")
    .reduce((sum, l) => sum + l.price, 0);
  const nextLesson = todayLessons[0];
  // Friendly first name — displayName now resolves from the users doc
  // (profile name / username) before the auth provider name. Never show the
  // email id under the greeting; a plain "Instructor" beats a raw mail id.
  const firstName = user?.displayName?.split(" ")[0] || "Instructor";

  if (loading) {
    return (
      <Screen>
        <DashboardSkeleton />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={c.emerald}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell onPress={() => navigation.navigate("Notifications")} />
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{initials(user?.displayName || user?.email)}</Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metrics}
      >
        {(() => {
          const tested = students.filter((s) => s.testResult === "pass" || s.testResult === "fail");
          const passes = students.filter((s) => s.testResult === "pass").length;
          const passRate = tested.length > 0 ? Math.round((passes / tested.length) * 100) : null;
          const metrics: Array<{ label: string; value: string | number; helper: string; prefix?: string }> = [
            { label: "Today", value: todayLessons.length, helper: "Lessons" },
            { label: "Earned", value: paidToday, helper: "today", prefix: "£" },
            { label: "Owed", value: unpaidTotal, helper: "outstanding", prefix: "£" },
            { label: "Students", value: students.length, helper: "Active" },
          ];
          if (passRate !== null) {
            metrics.push({
              label: "Pass rate",
              value: `${passRate}%`,
              helper: `${passes} of ${tested.length} passed`,
            });
          }
          return metrics.map((metric, index) => (
            <FadeInView key={metric.label} delay={index * 60}>
              <MetricCard {...metric} />
            </FadeInView>
          ));
        })()}
      </ScrollView>

      {nextLesson ? (
        <FadeInView delay={200}>
          <Card style={styles.nextCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Next up</Text>
              <Pill
                label={nextLesson.paymentStatus}
                tone={nextLesson.paymentStatus === "paid" ? "success" : "warning"}
              />
            </View>
            <Text style={styles.bigName}>{nextLesson.studentName}</Text>
            <Text style={styles.meta}>
              {nextLesson.time} · {nextLesson.durationMinutes} mins
            </Text>
            {!!nextLesson.pickup && <Text style={styles.meta}>{nextLesson.pickup}</Text>}
            <View style={styles.actionRow}>
              <AppButton
                label="Open"
                onPress={() =>
                  navigation.navigate("LessonDetail", { lessonId: nextLesson.id })
                }
                style={styles.flexButton}
              />
              <AppButton
                label="Progress"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("ProgressTracker", {
                    studentId: nextLesson.studentId,
                  })
                }
                style={styles.flexButton}
              />
            </View>
          </Card>
        </FadeInView>
      ) : (
        <FadeInView delay={200}>
          <Card style={styles.nextCard}>
            <EmptyState
              iconName="calendar-clear-outline"
              title="No lessons today"
              description="Tap below to add one."
              actionLabel="Book a lesson"
              onAction={() => navigation.navigate("BookLesson")}
            />
            <AppButton
              label="Book a lesson"
              onPress={() => navigation.navigate("BookLesson")}
            />
          </Card>
        </FadeInView>
      )}

      <SectionHeader title="Quick actions" />
      <View style={styles.quickGrid}>
        <QuickAction
          icon="calendar"
          label="Book lesson"
          onPress={() => navigation.navigate("BookLesson")}
        />
        <QuickAction
          icon="person-add"
          label="Add student"
          onPress={() => navigation.navigate("AddStudent")}
        />
        <QuickAction
          icon="receipt"
          label="Invoices"
          onPress={() => navigation.navigate("Invoices")}
        />
        <QuickAction
          icon="qr-code"
          label="Invite student"
          onPress={() => setInviteOpen(true)}
        />
        <QuickAction
          icon="chatbubble-ellipses"
          label="Feedback"
          onPress={() => navigation.navigate("FeedbackSummary")}
        />
        <QuickAction
          icon="chatbubbles"
          label="Messages"
          onPress={() => navigation.navigate("InstructorMessages")}
        />
        <QuickAction
          icon="library"
          label="Tips"
          onPress={() => navigation.navigate("Tips")}
        />
      </View>

      <SectionHeader title="Upcoming tests" />
      <Card style={styles.testsCard}>
        {upcomingTests.length === 0 ? (
          <View style={styles.testsEmpty}>
            <Ionicons name="ribbon-outline" size={24} color={c.slate300} />
            <Text style={styles.testsEmptyText}>
              No tests booked yet. Add a test date from a student's profile.
            </Text>
          </View>
        ) : (
          upcomingTests.map((student, idx) => (
            <FadeInView key={student.id} delay={idx * 60 + 300}>
              <TestRow
                student={student}
                showDivider={idx < upcomingTests.length - 1}
                onPress={() => navigation.navigate("StudentProfile", { studentId: student.id })}
              />
            </FadeInView>
          ))
        )}
      </Card>

      <SectionHeader title="Today's timeline" />
      {todayLessons.length === 0 ? (
        <Card>
          <EmptyState
            iconName="calendar-clear-outline"
            title="Nothing booked here"
            description="Tap + to slot in a lesson on this day."
            actionLabel="Book lesson"
            onAction={() => navigation.navigate("BookLesson")}
          />
        </Card>
      ) : (
        <Card>
          {todayLessons.map((lesson, index) => (
            <FadeInView key={lesson.id} delay={index * 80 + 240}>
              <ListRow
                title={lesson.studentName}
                subtitle={`${lesson.time} · ${lesson.pickup || "Pickup TBC"}`}
                right={`£${lesson.price}`}
                onPress={() =>
                  navigation.navigate("LessonDetail", { lessonId: lesson.id })
                }
              />
            </FadeInView>
          ))}
        </Card>
      )}
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Screen>
  );
}

function DashboardSkeleton() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Skeleton width={112} height={12} borderRadius={999} style={styles.skeletonGap} />
          <Skeleton width={150} height={30} borderRadius={999} />
        </View>
        <Skeleton width={42} height={42} borderRadius={21} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metrics}
      >
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} width={120} height={86} borderRadius={20} />
        ))}
      </ScrollView>
      <Skeleton height={156} borderRadius={24} style={styles.nextCard} />
      <View style={styles.skeletonList}>
        {[0, 1, 2].map((item) => (
          <SkeletonRow key={item} />
        ))}
      </View>
    </View>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function QuickAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.quickCard,
        disabled && styles.quickCardDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={22} color={c.white} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function todayStr(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London" }).format(new Date());
}

function daysUntilTest(dateStr: string): number {
  const today = todayStr();
  const t = new Date(`${dateStr}T12:00:00Z`);
  const b = new Date(`${today}T12:00:00Z`);
  return Math.round((t.getTime() - b.getTime()) / 86_400_000);
}

function testDaysBadge(days: number): { label: string; bg: string; text: string } {
  if (days === 0) return { label: "TODAY", bg: "#FFF2F1", text: "#FF3B30" };
  if (days === 1) return { label: "Tomorrow", bg: "#FFF5E6", text: "#FF9500" };
  if (days <= 7) return { label: `in ${days}d`, bg: "#FFF5E6", text: "#FF9500" };
  return { label: `in ${days}d`, bg: "#E8F5EE", text: "#115c37" };
}

function TestRow({
  student,
  showDivider,
  onPress,
}: {
  student: Student;
  showDivider: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const days = student.practicalTestDate ? daysUntilTest(student.practicalTestDate) : null;
  const badge = days !== null ? testDaysBadge(days) : null;

  const meta = [
    student.testCentre,
    student.practicalTestTime,
    student.testBookingFee != null ? `£${student.testBookingFee} fee` : null,
  ].filter(Boolean).join("  ·  ");

  const dateDisplay = student.practicalTestDate
    ? new Date(`${student.practicalTestDate}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.testRow,
        showDivider && styles.testRowDivider,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.testIconWrap}>
        <Ionicons name="ribbon" size={18} color={c.emeraldDark} />
      </View>
      <View style={styles.testInfo}>
        <View style={styles.testNameRow}>
          <Text style={styles.testName} numberOfLines={1}>{student.name}</Text>
          {badge ? (
            <View style={[styles.testBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.testBadgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          ) : null}
        </View>
        {dateDisplay ? <Text style={styles.testDate}>{dateDisplay}</Text> : null}
        {meta ? <Text style={styles.testMeta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.slate300} />
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
  skeletonGap: {
    marginBottom: spacing.sm,
  },
  skeletonList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  greeting: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  name: {
    color: c.slate900,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: c.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
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
  metrics: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  nextCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: c.slate900,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  bigName: {
    ...typography.title2,
    color: c.slate900,
  },
  meta: {
    color: c.slate500,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  quickCard: {
    width: "48%",
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  quickIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: c.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardDisabled: {
    opacity: 0.4,
  },
  quickLabel: {
    color: c.slate900,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    flex: 1,
  },

  // ── Upcoming tests ──
  testsEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  testsEmptyText: {
    flex: 1,
    color: c.slate500,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  testsCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 68,
  },
  testRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  testIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
    flexShrink: 0,
  },
  testInfo: {
    flex: 1,
    gap: 2,
  },
  testNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  testName: {
    flex: 1,
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  testBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  testBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  testDate: {
    color: c.slate700,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  testMeta: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
});


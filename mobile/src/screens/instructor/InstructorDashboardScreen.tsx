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
import { InviteSheet } from "../../components/ui/InviteSheet";
import { Skeleton, SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import {
  getStudents,
  getTodayLessons,
  getOpenLessonPayments,
  getUpcomingTests,
} from "../../services/dataService";
import type { Lesson, LessonPayment, Student } from "../../types";
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
  const [openPayments, setOpenPayments] = useState<LessonPayment[]>([]);
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
        getOpenLessonPayments(user.uid, 50),
        getUpcomingTests(user.uid),
      ]);
      setTodayLessons(l);
      setStudents(s);
      setOpenPayments(inv);
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

  const unpaidTotal = openPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidToday = todayLessons
    .filter((l) => l.paymentStatus === "paid")
    .reduce((sum, l) => sum + l.price, 0);
  const nextLesson = todayLessons[0];
  const isNewInstructor = students.length === 0 && openPayments.length === 0 && upcomingTests.length === 0;
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
          tintColor={c.emeraldDark}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.navigate("MyProfile")}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Text style={styles.avatarText}>{initials(user?.displayName || user?.email)}</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={20} color={c.slate900} />
          </Pressable>
          <NotificationBell onPress={() => navigation.navigate("Notifications")} />
        </View>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <View style={styles.metrics}>
        {(() => {
          const metrics: Array<{ label: string; value: string | number; helper: string; prefix?: string }> = [
            { label: "Today", value: todayLessons.length, helper: "Lessons" },
            { label: "Earned", value: paidToday, helper: "today", prefix: "£" },
            { label: "Owed", value: unpaidTotal, helper: "outstanding", prefix: "£" },
          ];
          return metrics.map((metric, index) => (
            <FadeInView key={metric.label} delay={index * 60} style={styles.metricItem}>
              <MetricCard {...metric} compact />
            </FadeInView>
          ));
        })()}
      </View>

      {nextLesson ? (
        <FadeInView delay={200}>
          <Card style={styles.nextCard}>
            <View style={styles.nextHeader}>
              <View style={styles.nextIconWrap}>
                <Ionicons name="navigate-outline" size={21} color={c.emeraldDark} />
              </View>
              <View style={styles.nextHeaderCopy}>
                <Text style={styles.kickerLabel}>Next lesson</Text>
                <Text style={styles.bigName} numberOfLines={1}>{nextLesson.studentName}</Text>
              </View>
              <Pill
                label={nextLesson.paymentStatus}
                tone={nextLesson.paymentStatus === "paid" ? "success" : "warning"}
              />
            </View>
            <View style={styles.lessonMetaGrid}>
              <View style={styles.metaTile}>
                <Text style={styles.metaLabel}>Time</Text>
                <Text style={styles.metaValue}>{nextLesson.time}</Text>
              </View>
              <View style={styles.metaTile}>
                <Text style={styles.metaLabel}>Duration</Text>
                <Text style={styles.metaValue}>{nextLesson.durationMinutes} mins</Text>
              </View>
              <View style={styles.metaTile}>
                <Text style={styles.metaLabel}>Fee</Text>
                <Text style={styles.metaValue}>£{nextLesson.price}</Text>
              </View>
            </View>
            {!!nextLesson.pickup && (
              <View style={styles.pickupRow}>
                <Ionicons name="location-outline" size={17} color={c.slate600} />
                <Text style={styles.pickupText} numberOfLines={2}>{nextLesson.pickup}</Text>
              </View>
            )}
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
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeIcon}><Ionicons name="calendar-outline" size={20} color={c.emeraldDark} /></View>
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcomeTitle}>
                {isNewInstructor ? "Welcome to App7i" : "No lessons today"}
              </Text>
              <Text style={styles.welcomeText}>
                {isNewInstructor
                  ? "Today's lessons, practical tests and earnings will appear here after your first booking."
                  : "Your day is clear. Upcoming tests, payments and recent activity remain visible below."}
              </Text>
            </View>
            {isNewInstructor ? (
              <AppButton label="Create your first booking" onPress={() => navigation.navigate("BookLesson")} />
            ) : null}
          </Card>
        </FadeInView>
      )}

      <SectionHeader title="Quick actions" />
      <View style={styles.quickGrid}>
        {!isNewInstructor ? (
          <QuickAction
            icon="calendar-outline"
            label="Book lesson"
            onPress={() => navigation.navigate("BookLesson")}
          />
        ) : null}
        <QuickAction
          icon="person-add-outline"
          label="Add student"
          onPress={() => navigation.navigate("AddStudent")}
        />
        <QuickAction
          icon="checkmark-done-outline"
          label="Payments"
          onPress={() => navigation.navigate("Payments")}
        />
        <QuickAction
          icon="qr-code"
          label="Invite student"
          onPress={() => setInviteOpen(true)}
        />
        <QuickAction
          icon="chatbubble-ellipses-outline"
          label="Feedback"
          onPress={() => navigation.navigate("FeedbackSummary")}
        />
        <QuickAction
          icon="ribbon-outline"
          label="Practical tests"
          onPress={() => navigation.navigate("PracticalTests")}
        />
        <QuickAction
          icon="library-outline"
          label="Learning Hub"
          onPress={() => navigation.navigate("ResourceLibrary")}
        />
      </View>

      <SectionHeader title="Upcoming practical tests" actionLabel="View all" onAction={() => navigation.navigate("PracticalTests")} />
      <Card style={styles.testsCard}>
        {upcomingTests.length === 0 ? (
          <View style={styles.testsEmpty}>
            <Ionicons name="ribbon-outline" size={24} color={c.slate300} />
            <Text style={styles.testsEmptyText}>
              No tests booked yet. Book and manage practical tests from the test register.
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
        <Card style={styles.overviewCard}>
          <OverviewRow icon="calendar-outline" title="Today's lessons" value="No lessons scheduled" />
          <OverviewRow icon="ribbon-outline" title="Upcoming practical tests" value={upcomingTests.length ? `${upcomingTests.length} booked` : "No practical tests booked"} />
          <OverviewRow icon="card-outline" title="Pending payments" value={openPayments.length ? `${openPayments.length} awaiting review` : "No payments to review"} />
          <OverviewRow icon="pulse-outline" title="Recent activity" value="Activity will appear after your first booking" last />
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
        <Ionicons name={icon} size={22} color={c.emeraldDark} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function OverviewRow({ icon, title, value, last }: { icon: IoniconName; title: string; value: string; last?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={[styles.overviewRow, last && styles.overviewRowLast]}>
      <View style={styles.overviewIcon}><Ionicons name={icon} size={17} color={c.slate600} /></View>
      <View style={styles.overviewCopy}>
        <Text style={styles.overviewTitle}>{title}</Text>
        <Text style={styles.overviewValue}>{value}</Text>
      </View>
    </View>
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

function testDaysBadge(days: number, c: ColorPalette): { label: string; bg: string; text: string } {
  if (days === 0) return { label: "TODAY", bg: c.redSoft, text: c.red };
  if (days === 1) return { label: "Tomorrow", bg: c.amberSoft, text: c.amber };
  if (days <= 7) return { label: `in ${days}d`, bg: c.amberSoft, text: c.amber };
  return { label: `in ${days}d`, bg: c.emeraldSoft, text: c.emeraldDark };
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
  const badge = days !== null ? testDaysBadge(days, c) : null;

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
    backgroundColor: c.surfaceRaised,
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
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
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
    fontWeight: "700",
    letterSpacing: 0,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: c.slate900,
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
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  metricItem: { flex: 1, minWidth: 0 },
  nextCard: {
    gap: spacing.lg,
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
  nextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  nextIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  nextHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  kickerLabel: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  bigName: {
    ...typography.title2,
    color: c.slate900,
    letterSpacing: 0,
  },
  lessonMetaGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaTile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  metaLabel: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  metaValue: {
    color: c.slate900,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  pickupRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: c.surfaceMuted,
  },
  pickupText: {
    flex: 1,
    color: c.slate700,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
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
  welcomeCard: { gap: spacing.md, marginTop: spacing.md, padding: spacing.lg },
  welcomeIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: c.emeraldSoft },
  welcomeCopy: { gap: 4 },
  welcomeTitle: { color: c.slate900, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  welcomeText: { color: c.slate500, fontSize: 13, lineHeight: 19 },
  overviewCard: { padding: 0, overflow: "hidden" },
  overviewRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  overviewRowLast: { borderBottomWidth: 0 },
  overviewIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted },
  overviewCopy: { flex: 1, gap: 2 },
  overviewTitle: { color: c.slate900, fontSize: 13, fontWeight: "700" },
  overviewValue: { color: c.slate500, fontSize: 12, lineHeight: 16 },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  quickCard: {
    width: "47.8%",
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  quickIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: c.surfaceMuted,
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

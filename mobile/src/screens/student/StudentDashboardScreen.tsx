import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListRow } from "../../components/ui/ListRow";
import { MetricCard } from "../../components/ui/MetricCard";
import { NextLessonCard } from "../../components/student/NextLessonCard";
import { NotificationBell } from "../../components/ui/NotificationBell";
import { TestReadinessCard } from "../../components/TestReadinessCard";
import { computeTestReadiness } from "../../utils/testReadiness";
import { Screen } from "../../components/ui/Screen";
import { Skeleton, SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentByUid,
  getStudentLessons,
  getStudentProgressSummary,
  type StudentProgressSummary,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson, Student } from "../../types";
import { formatGBP } from "../../utils/currency";

type MobileNavigation = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

function londonHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(new Date()),
    10,
  );
}

function londonDateStr(): string {
  // sv-SE locale produces YYYY-MM-DD format
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London" }).format(new Date());
}

function timeOfDayGreeting(): string {
  const h = londonHour();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

function todayKey() {
  return londonDateStr();
}

function isUpcomingLesson(lesson: Lesson) {
  return !lesson.date || lesson.date >= todayKey();
}

export function StudentDashboardScreen({ navigation }: { navigation: MobileNavigation }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<StudentProgressSummary>({
    percent: 0,
    ratedCount: 0,
    competentCount: 0,
    weakestKey: null,
    weakestLabel: null,
  });
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
        // Lessons + progress summary share a source — same numbers as Progress tab.
        const [lessonsList, progressSummary] = await Promise.all([
          getStudentLessons(studentDoc.id, 30),
          getStudentProgressSummary(studentDoc.id),
        ]);
        setLessons(lessonsList);
        setProgress(progressSummary);
      } else {
        setLessons([]);
        setProgress({ percent: 0, ratedCount: 0, competentCount: 0, weakestKey: null, weakestLabel: null });
      }
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading this. Pull down to retry."));
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

  const upcomingLessons = useMemo(() => lessons.filter(isUpcomingLesson), [lessons]);
  const nextLesson = upcomingLessons[0] || lessons[0] || null;
  const paidLessons = lessons.filter((lesson) => lesson.paymentStatus === "paid").length;
  const unpaidLessons = lessons.filter((lesson) => lesson.paymentStatus === "unpaid").length;

  if (loading) {
    return (
      <Screen>
        <StudentDashboardSkeleton />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.kicker}>{timeOfDayGreeting()}</Text>
          <Text style={styles.title}>{student ? student.name.split(" ")[0] : "Your driving progress"}</Text>
        </View>
        <NotificationBell onPress={() => navigation.navigate("Notifications")} />
      </View>
      <Text style={styles.copy}>Lessons, notes, progress and learning resources from your instructor.</Text>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {!student ? (
        <EmptyState
          iconName="link-outline"
          title="You're nearly connected"
          message={`Ask your instructor to add you with ${user?.email || "this email"}. Once they do, this app links automatically.`}
        />
      ) : (
        <>
          <NextLessonCard
            nextLesson={nextLesson}
            instructorName={undefined}
            weakestSkillLabel={progress.weakestLabel}
            unpaidCount={unpaidLessons}
          />

          <TestReadinessCard
            readiness={computeTestReadiness(student, lessons, progress.competentCount)}
            showEditAction={false}
          />

          <View style={styles.metrics}>
            <MetricCard
              label="Progress"
              value={`${progress.percent}%`}
              helper={
                progress.ratedCount === 0
                  ? "First lesson coming"
                  : `${progress.competentCount} skill${progress.competentCount === 1 ? "" : "s"} test-ready`
              }
            />
            <MetricCard label="Lessons" value={String(lessons.length)} helper={`${paidLessons} paid`} />
            <MetricCard label="Unpaid" value={String(unpaidLessons)} helper="Needs review" />
          </View>

          <Card style={styles.card}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconWrap}>
                <Ionicons name="sparkles" size={15} color={c.emeraldDark} />
              </View>
              <Text style={styles.sectionTitle}>From your instructor</Text>
            </View>
            {student.practiceFocus ? (
              <View style={styles.tipBlock}>
                <Text style={styles.tipLabel}>Practice focus</Text>
                <Text style={styles.tipText}>{student.practiceFocus}</Text>
              </View>
            ) : (
              <View style={styles.tipBlock}>
                <Text style={styles.tipLabel}>
                  Practice focus{progress.weakestLabel ? " · suggested" : ""}
                </Text>
                <Text style={styles.tipText}>
                  {progress.weakestLabel
                    ? `Your weakest area right now is ${progress.weakestLabel.toLowerCase()}. Practise it with a parent or full-licence holder before your next lesson.`
                    : "After your first rated lesson, your weakest skill will appear here as a focus area."}
                </Text>
              </View>
            )}
            {student.practiceTips ? (
              <View style={styles.tipBlock}>
                <Text style={styles.tipLabel}>Before your next lesson</Text>
                <Text style={styles.tipText}>{student.practiceTips}</Text>
              </View>
            ) : (
              <View style={styles.tipBlock}>
                <Text style={styles.tipLabel}>Lesson preparation · suggested</Text>
                <Text style={styles.tipText}>
                  {lessons.length === 0
                    ? "Bring your provisional licence and any glasses you need to drive. Wear flat shoes if you can."
                    : lessons.length < 5
                      ? "Re-watch your last lesson in your head. Tell your instructor what felt hardest so they can plan accordingly."
                      : lessons.length < 12
                        ? "You're past the basics — start asking your instructor exam-style questions, like \"what would the examiner mark me on here?\""
                        : "Test territory. Ask your instructor for a 10-minute mock-test segment in your next lesson."}
                </Text>
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Progress stats</Text>
            <ListRow title="Transmission" right={student.transmission} />
            <ListRow title="Test date" right={student.testDate || "Not set"} />
            <ListRow title="Outstanding balance" right={formatGBP(student.outstandingBalance)} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function StudentDashboardSkeleton() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <Skeleton width={120} height={12} borderRadius={999} style={styles.skeletonGap} />
      <Skeleton width={220} height={34} borderRadius={999} style={styles.skeletonGap} />
      <Skeleton width="88%" height={14} borderRadius={999} style={styles.skeletonWideGap} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metrics}
      >
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} width={120} height={86} borderRadius={20} />
        ))}
      </ScrollView>
      <Skeleton height={150} borderRadius={24} style={styles.card} />
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

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  kicker: {
    color: c.emerald,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: c.slate900,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  copy: {
    ...typography.subhead,
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  skeletonGap: {
    marginBottom: spacing.sm,
  },
  skeletonWideGap: {
    marginBottom: spacing.lg,
  },
  skeletonList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: c.slate900,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tipsIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: c.emeraldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBlock: {
    gap: 4,
  },
  tipLabel: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tipText: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
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
});

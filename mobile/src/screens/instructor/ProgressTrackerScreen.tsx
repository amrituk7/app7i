import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import {
  getStudent,
  getStudentSkillsAggregate,
  type StudentSkillAggregate,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Student } from "../../types";

type Route = { params?: { studentId?: string } };

export function ProgressTrackerScreen({ route }: { route: Route }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const studentId = route.params?.studentId;
  const [student, setStudent] = useState<Student | null>(null);
  const [skills, setSkills] = useState<StudentSkillAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setError("This learner could not be found. Tap back and try again.");
      return;
    }
    setError(null);
    try {
      const [next, aggregate] = await Promise.all([
        getStudent(studentId),
        getStudentSkillsAggregate(studentId, 50),
      ]);
      setStudent(next);
      setSkills(aggregate);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/permission|denied/i.test(message)) {
        setError("Looks like you don't have access. Sign out and back in?");
      } else {
        setError("We're having trouble loading progress. Pull down to retry.");
      }
    }
  }, [studentId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const overall = useMemo(() => {
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum, skill) => sum + skill.percent, 0);
    return Math.round(total / skills.length);
  }, [skills]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
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
      <Text style={styles.title}>{student ? student.name : "Student performance"}</Text>
      <Text style={styles.copy}>Progress and skill ratings across this learner's lessons.</Text>

      {error ? (
        <EmptyState
          iconName="alert-circle-outline"
          title="Progress needs a refresh"
          message={error}
          actionLabel="Try again"
          onAction={onRefresh}
        />
      ) : skills.length === 0 ? (
        <EmptyState
          iconName="trending-up-outline"
          title="Progress builds with each lesson"
          message="Rate skills on a lesson to see this learner's progression here."
        />
      ) : (
        <>
          <Card style={styles.summary}>
            <Text style={styles.score}>{overall}%</Text>
            <Text style={styles.summaryText}>Overall readiness</Text>
          </Card>

          <View style={styles.stack}>
            {skills.map((skill) => (
              <Card key={skill.key} style={styles.skillCard}>
                <View style={styles.row}>
                  <Text style={styles.skill}>{skill.label}</Text>
                  <Text style={styles.percent}>{skill.percent}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${skill.percent}%` }]} />
                </View>
                <Text style={styles.skillMeta}>
                  {skill.lessonsRated} {skill.lessonsRated === 1 ? "lesson" : "lessons"} rated
                </Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
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
    fontSize: 30,
    fontWeight: "700",
  },
  copy: {
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  summary: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  score: {
    color: c.emerald,
    fontSize: 44,
    fontWeight: "700",
  },
  summaryText: {
    color: c.slate500,
    fontWeight: "700",
  },
  stack: {
    gap: spacing.md,
  },
  skillCard: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skill: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  percent: {
    color: c.slate500,
    fontWeight: "700",
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: c.slate100,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: c.emerald,
  },
  skillMeta: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
  },
});

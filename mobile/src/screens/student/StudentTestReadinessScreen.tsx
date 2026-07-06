import { useCallback, useEffect, useState } from "react";
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
import { TestReadinessCard } from "../../components/TestReadinessCard";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentByUid,
  getStudentLessons,
  getStudentSkillsAggregate,
} from "../../services/dataService";
import {
  computeTestReadiness,
  describeMockResult,
  isMockPass,
} from "../../utils/testReadiness";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Lesson, Student } from "../../types";

export function StudentTestReadinessScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [competentCount, setCompetentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const s = await getStudentByUid(user.uid);
      setStudent(s);
      if (!s) {
        setLessons([]);
        setCompetentCount(0);
        return;
      }
      const [ls, agg] = await Promise.all([
        getStudentLessons(s.id, 50),
        getStudentSkillsAggregate(s.id, 50),
      ]);
      setLessons(ls);
      setCompetentCount(agg.filter((a) => a.averageRating >= 4).length);
    } catch (err) {
      console.error("[StudentTestReadiness] load failed", err);
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
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  if (!student) {
    return (
      <Screen>
        <EmptyState
          iconName="link-outline"
          title="You're nearly connected"
          message={`Ask your instructor to add you with ${user?.email || "this email"}. Test details appear after linking.`}
        />
      </Screen>
    );
  }

  const readiness = computeTestReadiness(student, lessons, competentCount);
  const mocks = student.mockTests || [];

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <Text style={styles.kicker}>My test</Text>
      <Text style={styles.title}>Where you're at</Text>

      <TestReadinessCard readiness={readiness} showEditAction={false} />

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Practical test</Text>
        <Row
          label="Booked for"
          value={
            student.practicalTestDate
              ? `${student.practicalTestDate}${student.practicalTestTime ? ` at ${student.practicalTestTime}` : ""}`
              : "Not booked yet"
          }
        />
        <Row label="Test centre" value={student.testCentre || "—"} />
        {student.testBookingRef ? (
          <Row label="Booking reference" value={student.testBookingRef} />
        ) : null}
        {student.testCandidateNumber ? (
          <Row label="Licence number" value={student.testCandidateNumber} />
        ) : null}
        {student.testBookingFee ? (
          <Row
            label="Booking fee"
            value={`£${student.testBookingFee}${student.testBookingPaid ? " · paid" : " · to pay"}`}
          />
        ) : null}
        <Row
          label="Result"
          value={
            student.testResult === "pass"
              ? `Pass · ${student.testFaults?.minor ?? 0} minor faults`
              : student.testResult === "fail"
                ? `Fail · ${student.testFaults?.minor ?? 0} minor, ${student.testFaults?.serious ?? 0} serious, ${student.testFaults?.dangerous ?? 0} dangerous`
                : "—"
          }
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Mock tests</Text>
        {mocks.length === 0 ? (
          <Text style={styles.helpText}>
            No mocks yet. Your instructor will run one once you're consistently competent.
          </Text>
        ) : (
          <View style={styles.mockList}>
            {mocks.map((m) => {
              const pass = isMockPass(m);
              return (
                <View
                  key={m.id}
                  style={[styles.mockRow, pass ? styles.mockPass : styles.mockFail]}
                >
                  <Text style={styles.mockDate}>{m.date}</Text>
                  <Text
                    style={[
                      styles.mockResult,
                      pass ? styles.mockResultPass : styles.mockResultFail,
                    ]}
                  >
                    {describeMockResult(m)}
                  </Text>
                  {m.instructorNote ? (
                    <Text style={styles.mockNote}>{m.instructorNote}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Text style={styles.footnote}>
        Your instructor sets these. Tap their profile to ask if anything looks wrong.
      </Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
  kicker: {
    color: c.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: { gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: c.slate900, fontSize: 15, fontWeight: "700" },
  helpText: { color: c.slate600, fontSize: 12, lineHeight: 17 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { color: c.slate700, fontSize: 13, fontWeight: "600" },
  rowValue: { color: c.slate900, fontSize: 13, fontWeight: "600" },
  mockList: { gap: spacing.sm },
  mockRow: { padding: spacing.md, borderRadius: 12, gap: 2 },
  mockPass: { backgroundColor: c.greenSoft },
  mockFail: { backgroundColor: c.amberSoft },
  mockDate: { color: c.slate900, fontSize: 13, fontWeight: "600" },
  mockResult: { fontSize: 12, fontWeight: "700" },
  mockResultPass: { color: c.green },
  mockResultFail: { color: c.amber },
  mockNote: { color: c.slate700, fontSize: 12, marginTop: 2 },
  footnote: {
    color: c.slate600,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.md,
  },
});

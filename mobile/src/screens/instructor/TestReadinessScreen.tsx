import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import {
  addMockTest,
  getStudent,
  removeMockTest,
  updateStudentTestReadiness,
} from "../../services/dataService";
import { describeMockResult, isMockPass } from "../../utils/testReadiness";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { MockTest, Student, TestResult } from "../../types";

type Nav = { goBack: () => void };

export function TestReadinessScreen({
  route,
  navigation,
}: {
  route: { params?: { studentId?: string } };
  navigation: Nav;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const studentId = route.params?.studentId || "";
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state — mirrors the schema
  const [theoryPassed, setTheoryPassed] = useState(false);
  const [theoryTestDate, setTheoryTestDate] = useState("");
  const [practicalTestDate, setPracticalTestDate] = useState("");
  const [practicalTestTime, setPracticalTestTime] = useState("");
  const [testCentre, setTestCentre] = useState("");
  const [testBookingFee, setTestBookingFee] = useState("");
  const [testBookingRef, setTestBookingRef] = useState("");
  const [testCandidateNumber, setTestCandidateNumber] = useState("");
  const [testBookingPaid, setTestBookingPaid] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [testFaultsMinor, setTestFaultsMinor] = useState("0");
  const [testFaultsSerious, setTestFaultsSerious] = useState("0");
  const [testFaultsDangerous, setTestFaultsDangerous] = useState("0");
  const [readinessScore, setReadinessScore] = useState(0);

  // Inline mock-test add form
  const [mockDate, setMockDate] = useState(new Date().toISOString().slice(0, 10));
  const [mockMinor, setMockMinor] = useState("");
  const [mockSerious, setMockSerious] = useState("0");
  const [mockDangerous, setMockDangerous] = useState("0");
  const [mockNote, setMockNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!studentId) return setLoading(false);
      try {
        const s = await getStudent(studentId);
        if (cancelled) return;
        setStudent(s);
        if (s) {
          setTheoryPassed(Boolean(s.theoryPassed));
          setTheoryTestDate(s.theoryTestDate || "");
          setPracticalTestDate(s.practicalTestDate || "");
          setPracticalTestTime(s.practicalTestTime || "");
          setTestCentre(s.testCentre || "");
          setTestBookingFee(s.testBookingFee != null ? String(s.testBookingFee) : "");
          setTestBookingRef(s.testBookingRef || "");
          setTestCandidateNumber(s.testCandidateNumber || "");
          setTestBookingPaid(Boolean(s.testBookingPaid));
          setTestResult(s.testResult || null);
          setTestFaultsMinor(String(s.testFaults?.minor ?? 0));
          setTestFaultsSerious(String(s.testFaults?.serious ?? 0));
          setTestFaultsDangerous(String(s.testFaults?.dangerous ?? 0));
          setReadinessScore(Number(s.readinessScore || 0));
        }
      } catch (err) {
        console.error("[TestReadiness] load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function save() {
    if (!studentId) return;
    setSaving(true);
    try {
      await updateStudentTestReadiness(studentId, {
        theoryPassed,
        theoryTestDate,
        practicalTestDate,
        practicalTestTime,
        testCentre,
        testBookingFee: testBookingFee ? Number(testBookingFee) : null,
        testBookingRef,
        testCandidateNumber,
        testBookingPaid,
        testResult,
        testFaults:
          testResult === "pass" || testResult === "fail"
            ? {
                minor: Number(testFaultsMinor) || 0,
                serious: Number(testFaultsSerious) || 0,
                dangerous: Number(testFaultsDangerous) || 0,
              }
            : undefined,
        readinessScore,
      });
      Alert.alert("Saved", "Test readiness details updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Try again.";
      Alert.alert("Did not save", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMock() {
    const minor = Number(mockMinor);
    if (!mockDate || Number.isNaN(minor)) {
      Alert.alert("Missing info", "Mock date and minor-fault count are required.");
      return;
    }
    try {
      const next = await addMockTest(
        studentId,
        {
          date: mockDate,
          faults: {
            minor,
            serious: Number(mockSerious) || 0,
            dangerous: Number(mockDangerous) || 0,
          },
          instructorNote: mockNote,
        },
        student?.mockTests || [],
      );
      setStudent((prev) =>
        prev ? { ...prev, mockTests: [...(prev.mockTests || []), next].sort((a, b) => (b.date || "").localeCompare(a.date || "")) } : prev,
      );
      setMockMinor("");
      setMockSerious("0");
      setMockDangerous("0");
      setMockNote("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Try again.";
      Alert.alert("Could not add mock", msg);
    }
  }

  async function handleRemoveMock(mockId: string) {
    try {
      await removeMockTest(studentId, mockId, student?.mockTests || []);
      setStudent((prev) =>
        prev ? { ...prev, mockTests: (prev.mockTests || []).filter((m) => m.id !== mockId) } : prev,
      );
    } catch (err) {
      console.error("[TestReadiness] remove mock failed", err);
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

  if (!student) {
    return (
      <Screen>
        <Text style={styles.title}>Student not found</Text>
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.kicker}>Outcomes</Text>
      <Text style={styles.title}>Test readiness — {student.name}</Text>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Theory test</Text>
        <ToggleRow label="Theory test passed" value={theoryPassed} onChange={setTheoryPassed} />
        <Field
          label={theoryPassed ? "Date passed (optional)" : "Date booked (optional)"}
          value={theoryTestDate}
          onChangeText={setTheoryTestDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Practical test booking</Text>
        <Field
          label="Date"
          value={practicalTestDate}
          onChangeText={setPracticalTestDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Time"
          value={practicalTestTime}
          onChangeText={setPracticalTestTime}
          placeholder="e.g. 09:48"
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Test centre"
          value={testCentre}
          onChangeText={setTestCentre}
          placeholder="e.g. Uxbridge"
        />
        <Field
          label="Booking fee (£)"
          value={testBookingFee}
          onChangeText={setTestBookingFee}
          placeholder="e.g. 23"
          keyboardType="number-pad"
        />
        <Field
          label="Booking reference"
          value={testBookingRef}
          onChangeText={setTestBookingRef}
          placeholder="DVSA booking ref, e.g. 12345678"
          autoCapitalize="characters"
        />
        <Field
          label="Candidate licence number"
          value={testCandidateNumber}
          onChangeText={setTestCandidateNumber}
          placeholder="e.g. SINGH906132AS9XX"
          autoCapitalize="characters"
        />
        <ToggleRow
          label="Booking fee paid by student"
          value={testBookingPaid}
          onChange={setTestBookingPaid}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Test result (after the test)</Text>
        <View style={styles.chipsRow}>
          {(["pass", "fail", null] as const).map((opt) => {
            const label = opt === null ? "Not yet" : opt === "pass" ? "Pass" : "Fail";
            const active = testResult === opt;
            return (
              <Pressable
                key={String(opt)}
                onPress={() => setTestResult(opt)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {testResult ? (
          <View style={styles.faultGrid}>
            <FaultField label="Minor" value={testFaultsMinor} onChangeText={setTestFaultsMinor} />
            <FaultField label="Serious" value={testFaultsSerious} onChangeText={setTestFaultsSerious} />
            <FaultField label="Dangerous" value={testFaultsDangerous} onChangeText={setTestFaultsDangerous} />
          </View>
        ) : null}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Your readiness call: {readinessScore}/10</Text>
        <Text style={styles.sectionHelp}>
          Your gut sense — would you put this student in for a test today? 7+ contributes to the
          "ready for test" gate.
        </Text>
        <View style={styles.scaleRow}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const active = readinessScore === n;
            return (
              <Pressable
                key={n}
                onPress={() => setReadinessScore(n)}
                style={({ pressed }) => [
                  styles.scaleCell,
                  active && styles.scaleCellActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.scaleText, active && styles.scaleTextActive]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Mock tests</Text>
        <Text style={styles.sectionHelp}>
          DVSA pass = under 16 minors AND no serious/dangerous faults.
        </Text>

        <View style={styles.mockForm}>
          <Field
            label="Date"
            value={mockDate}
            onChangeText={setMockDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
          <View style={styles.faultGrid}>
            <FaultField label="Minor" value={mockMinor} onChangeText={setMockMinor} />
            <FaultField label="Serious" value={mockSerious} onChangeText={setMockSerious} />
            <FaultField label="Dangerous" value={mockDangerous} onChangeText={setMockDangerous} />
          </View>
          <Field
            label="Note (optional)"
            value={mockNote}
            onChangeText={setMockNote}
            placeholder="e.g. Junctions still rushed"
          />
          <AppButton label="Add mock test" onPress={handleAddMock} variant="secondary" />
        </View>

        {(student.mockTests || []).length === 0 ? (
          <Text style={styles.sectionHelp}>No mock tests recorded yet.</Text>
        ) : (
          <View style={styles.mockList}>
            {(student.mockTests || []).map((m) => (
              <MockRow key={m.id} mock={m} onRemove={() => handleRemoveMock(m.id)} />
            ))}
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        <AppButton
          label="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={styles.actionBtn}
        />
        <AppButton
          label={saving ? "Saving..." : "Save"}
          onPress={save}
          disabled={saving}
          style={styles.actionBtn}
        />
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numbers-and-punctuation" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.slate500}
        style={styles.input}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCapitalize === "characters" ? false : undefined}
      />
    </View>
  );
}

function FaultField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.faultCell}>
      <Text style={styles.faultLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={c.slate500}
        style={styles.input}
        maxLength={3}
      />
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
    >
      <Ionicons
        name={value ? "checkbox" : "square-outline"}
        size={20}
        color={value ? c.emerald : c.slate500}
      />
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

function MockRow({ mock, onRemove }: { mock: MockTest; onRemove: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const pass = isMockPass(mock);
  return (
    <View style={[styles.mockRow, pass ? styles.mockRowPass : styles.mockRowFail]}>
      <View style={styles.mockBody}>
        <Text style={styles.mockDate}>{mock.date}</Text>
        <Text style={[styles.mockResult, pass ? styles.passText : styles.failText]}>
          {describeMockResult(mock)}
        </Text>
        {mock.instructorNote ? (
          <Text style={styles.mockNote}>{mock.instructorNote}</Text>
        ) : null}
      </View>
      <Pressable onPress={onRemove} hitSlop={6}>
        <Ionicons name="trash-outline" size={18} color={c.red} />
      </Pressable>
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
  sectionHelp: { color: c.slate600, fontSize: 12, lineHeight: 17 },
  fieldGroup: { gap: 4 },
  fieldLabel: { color: c.slate700, fontSize: 12, fontWeight: "700" },
  input: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: c.slate900,
  },
  chipsRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: c.emerald, borderColor: c.emerald },
  chipText: { color: c.slate900, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: c.white },
  faultGrid: { flexDirection: "row", gap: spacing.sm },
  faultCell: { flex: 1, gap: 4 },
  faultLabel: { color: c.slate700, fontSize: 11, fontWeight: "700" },
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  scaleCell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.slate100,
  },
  scaleCellActive: { backgroundColor: c.emerald },
  scaleText: { color: c.slate900, fontWeight: "600", fontSize: 12 },
  scaleTextActive: { color: c.white },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  toggleLabel: { color: c.slate900, fontSize: 14, fontWeight: "600" },
  mockForm: { gap: spacing.sm, marginTop: spacing.sm },
  mockList: { gap: spacing.sm, marginTop: spacing.sm },
  mockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  mockRowPass: { backgroundColor: c.greenSoft },
  mockRowFail: { backgroundColor: c.amberSoft },
  mockBody: { flex: 1, gap: 2 },
  mockDate: { color: c.slate900, fontSize: 13, fontWeight: "600" },
  mockResult: { fontSize: 12, fontWeight: "700" },
  passText: { color: c.green },
  failText: { color: c.amber },
  mockNote: { color: c.slate700, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1 },
});

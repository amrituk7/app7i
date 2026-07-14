import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pill } from "../../components/ui/Pill";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getStudents } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Student } from "../../types";

type TestStatus = "upcoming" | "completed" | "cancelled";

function statusOf(student: Student): TestStatus {
  if (student.practicalTestStatus === "cancelled") return "cancelled";
  if (student.practicalTestStatus === "completed" || student.testResult) return "completed";
  return "upcoming";
}

function dateLabel(value?: string) {
  if (!value) return "Date not set";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function PracticalTestsScreen({ navigation }: { navigation: any }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError("");
    try {
      const students = await getStudents(user.uid, 250);
      setStudents(students);
      setTests(
        students
          .filter((student) => Boolean(student.practicalTestDate))
          .sort((a, b) => (a.practicalTestDate || "").localeCompare(b.practicalTestDate || "")),
      );
    } catch {
      setError("We couldn't load practical tests. Pull down to retry.");
    }
  }, [user?.uid]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]));

  const groups = useMemo(() => ({
    upcoming: tests.filter((test) => statusOf(test) === "upcoming"),
    completed: tests.filter((test) => statusOf(test) === "completed"),
    cancelled: tests.filter((test) => statusOf(test) === "cancelled"),
  }), [tests]);
  const availableStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => [student.name, student.email, student.phone].some((value) => value?.toLowerCase().includes(query)));
  }, [studentQuery, students]);

  function startBooking(studentId: string) {
    setPickerOpen(false);
    setStudentQuery("");
    navigation.navigate("TestReadiness", { studentId });
  }

  if (loading) {
    return <Screen><View style={styles.loading}><ActivityIndicator color={c.emeraldDark} /></View></Screen>;
  }

  return (
    <Screen
      scroll
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={c.emeraldDark} />}
    >
      <Text style={styles.kicker}>Operations</Text>
      <Text style={styles.title}>Practical Tests</Text>
      <Text style={styles.subtitle}>Track every booked test, payment and final result from one register.</Text>

      {tests.length > 0 ? (
        <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.bookButton, pressed && styles.pressed]} accessibilityRole="button">
          <Ionicons name="add" size={20} color={c.onInverted} />
          <Text style={styles.bookButtonText}>Book practical test</Text>
        </Pressable>
      ) : null}

      {error ? <Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Card> : null}

      {tests.length === 0 ? (
        <EmptyState
          iconName="ribbon-outline"
          title="No practical tests booked"
          message="Create a test booking here when a learner is ready."
          actionLabel="Book practical test"
          onAction={() => setPickerOpen(true)}
        />
      ) : (
        (Object.entries(groups) as Array<[TestStatus, Student[]]>).map(([status, items]) =>
          items.length ? (
            <View key={status} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{status[0].toUpperCase() + status.slice(1)}</Text>
                <Text style={styles.count}>{items.length}</Text>
              </View>
              {items.map((student) => (
                <TestCard
                  key={student.id}
                  student={student}
                  status={status}
                  onEdit={() => navigation.navigate("TestReadiness", { studentId: student.id })}
                />
              ))}
            </View>
          ) : null,
        )
      )}
      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={styles.pickerSafe} edges={["top", "bottom", "left", "right"]}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setPickerOpen(false)} style={styles.pickerHeaderAction}><Text style={styles.pickerCancel}>Cancel</Text></Pressable>
            <Text style={styles.pickerTitle}>Choose student</Text>
            <View style={styles.pickerHeaderAction} />
          </View>
          <View style={styles.pickerContent}>
            <View style={styles.studentSearch}>
              <Ionicons name="search-outline" size={18} color={c.slate500} />
              <TextInput value={studentQuery} onChangeText={setStudentQuery} placeholder="Search students" placeholderTextColor={c.slate500} style={styles.studentSearchInput} autoFocus />
            </View>
            {students.length === 0 ? (
              <View style={styles.noStudents}>
                <Ionicons name="people-outline" size={28} color={c.slate500} />
                <Text style={styles.noStudentsTitle}>Add a student first</Text>
                <Text style={styles.noStudentsText}>A practical test must be connected to a learner record.</Text>
                <Pressable onPress={() => { setPickerOpen(false); navigation.navigate("AddStudent"); }} style={styles.addStudentButton}><Text style={styles.addStudentButtonText}>Add student</Text></Pressable>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {availableStudents.map((student) => (
                  <Pressable key={student.id} onPress={() => startBooking(student.id)} style={({ pressed }) => [styles.studentRow, pressed && styles.pressed]}>
                    <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{student.name.slice(0, 1).toUpperCase()}</Text></View>
                    <View style={styles.studentCopy}><Text style={styles.studentRowName}>{student.name}</Text><Text style={styles.studentRowMeta} numberOfLines={1}>{student.email || student.phone || "Learner profile"}</Text></View>
                    <Ionicons name="chevron-forward" size={18} color={c.slate500} />
                  </Pressable>
                ))}
                {availableStudents.length === 0 ? <Text style={styles.noMatches}>No students match that search.</Text> : null}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

function TestCard({ student, status, onEdit }: { student: Student; status: TestStatus; onEdit: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const payment = student.testBookingPaid ? "Paid" : "Pending";
  const directionsTarget = student.testMeetingLocation || student.testCentre;

  return (
    <Card style={styles.testCard}>
      <Pressable onPress={onEdit} style={styles.cardMain} accessibilityRole="button">
        <View style={styles.cardTop}>
          <View style={styles.personIcon}><Ionicons name="person-outline" size={18} color={c.emeraldDark} /></View>
          <View style={styles.personCopy}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.date}>{dateLabel(student.practicalTestDate)}{student.practicalTestTime ? ` at ${student.practicalTestTime}` : ""}</Text>
          </View>
          <Pill label={status} tone={status === "completed" ? "success" : status === "cancelled" ? "danger" : "warning"} />
        </View>
        <View style={styles.detailGrid}>
          <Detail icon="location-outline" label="Test centre" value={student.testCentre || "Not set"} />
          <Detail icon="car-outline" label="Vehicle" value={student.testVehicle || "Not set"} />
          <Detail icon="cash-outline" label="Payment" value={`${payment}${student.testBookingFee ? ` - £${student.testBookingFee}` : ""}`} />
          <Detail icon="navigate-outline" label="Meeting" value={student.testMeetingLocation || "Not set"} />
        </View>
        {student.practicalTestNotes ? <Text style={styles.notes} numberOfLines={3}>{student.practicalTestNotes}</Text> : null}
      </Pressable>
      <View style={styles.actions}>
        <Action icon="create-outline" label="Edit" onPress={onEdit} />
        <Action icon="call-outline" label="Contact" onPress={() => Linking.openURL(`tel:${student.phone}`).catch(() => {})} disabled={!student.phone} />
        <Action icon="navigate-outline" label="Directions" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsTarget || "")}`).catch(() => {})} disabled={!directionsTarget} />
      </View>
    </Card>
  );
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return <View style={styles.detail}><Ionicons name={icon} size={15} color={c.slate500} /><View><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue} numberOfLines={2}>{value}</Text></View></View>;
}

function Action({ icon, label, onPress, disabled }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void; disabled?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, disabled && styles.disabled, pressed && { opacity: 0.65 }]}><Ionicons name={icon} size={16} color={c.slate700} /><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  loading: { minHeight: 320, alignItems: "center", justifyContent: "center" },
  kicker: { color: c.emeraldDark, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { marginTop: 4, color: c.slate900, fontSize: 30, lineHeight: 36, fontWeight: "800" },
  subtitle: { marginTop: 6, marginBottom: spacing.xl, color: c.slate500, fontSize: 14, lineHeight: 20 },
  bookButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: 12, backgroundColor: c.slate900, marginBottom: spacing.xl },
  bookButtonText: { color: c.onInverted, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  errorCard: { marginBottom: spacing.lg, backgroundColor: c.redSoft }, errorText: { color: c.red, fontSize: 13 },
  section: { gap: spacing.md, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: c.slate900, fontSize: 18, fontWeight: "800" },
  count: { color: c.slate500, fontSize: 13, fontWeight: "700" },
  testCard: { padding: 0, overflow: "hidden" }, cardMain: { padding: spacing.lg },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  personIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.emeraldSoft, alignItems: "center", justifyContent: "center" },
  personCopy: { flex: 1, minWidth: 0 }, studentName: { color: c.slate900, fontSize: 16, fontWeight: "800" },
  date: { marginTop: 2, color: c.slate600, fontSize: 13, fontWeight: "600" },
  detailGrid: { marginTop: spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  detail: { width: "47%", flexDirection: "row", alignItems: "flex-start", gap: 8 }, detailLabel: { color: c.slate500, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  detailValue: { marginTop: 2, color: c.slate700, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  notes: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, color: c.slate600, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  action: { flex: 1, minHeight: 46, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  actionText: { color: c.slate700, fontSize: 12, fontWeight: "700" }, disabled: { opacity: 0.35 },
  pickerSafe: { flex: 1, backgroundColor: c.background },
  pickerHeader: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  pickerHeaderAction: { width: 72, minHeight: 44, justifyContent: "center" },
  pickerCancel: { color: c.slate600, fontSize: 15 },
  pickerTitle: { color: c.slate900, fontSize: 16, fontWeight: "700" },
  pickerContent: { flex: 1, padding: spacing.lg },
  studentSearch: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: c.surfaceMuted, marginBottom: spacing.md },
  studentSearchInput: { flex: 1, color: c.slate900, fontSize: 15, paddingVertical: 0 },
  studentRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  studentAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted },
  studentAvatarText: { color: c.slate900, fontSize: 14, fontWeight: "700" },
  studentCopy: { flex: 1, minWidth: 0 },
  studentRowName: { color: c.slate900, fontSize: 15, fontWeight: "700" },
  studentRowMeta: { color: c.slate500, fontSize: 12, marginTop: 3 },
  noMatches: { color: c.slate500, fontSize: 13, textAlign: "center", paddingVertical: spacing.xl },
  noStudents: { alignItems: "center", paddingVertical: 64, paddingHorizontal: spacing.xl },
  noStudentsTitle: { color: c.slate900, fontSize: 18, fontWeight: "700", marginTop: spacing.md },
  noStudentsText: { color: c.slate500, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: spacing.sm },
  addStudentButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.xl, borderRadius: 12, backgroundColor: c.slate900, marginTop: spacing.lg },
  addStudentButtonText: { color: c.onInverted, fontSize: 14, fontWeight: "700" },
});

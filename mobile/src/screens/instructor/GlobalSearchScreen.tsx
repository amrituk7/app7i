import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getInstructorLessons, getStudents } from "../../services/dataService";
import { getInstructorLearningEntries, getResourceLibrary } from "../../services/learningHubService";
import type { LearningEntry, LearningResource, Lesson, Student } from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Nav = { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
type ResultKind = "Student" | "Lesson" | "Learning" | "Resource" | "Test" | "Payment";
type SearchResult = { id: string; kind: ResultKind; title: string; subtitle: string; keywords: string; icon: React.ComponentProps<typeof Ionicons>["name"]; screen: string; params?: Record<string, unknown> };

export function GlobalSearchScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getStudents(user.uid, 300),
      getInstructorLessons(user.uid, 500),
      getInstructorLearningEntries(user.uid),
      getResourceLibrary(user.uid, true),
    ]).then(([nextStudents, nextLessons, nextEntries, nextResources]) => {
      setStudents(nextStudents); setLessons(nextLessons); setEntries(nextEntries); setResources(nextResources);
    }).catch((error) => Alert.alert("Search index did not load", friendlyError(error))).finally(() => setLoading(false));
  }, [user?.uid]);

  const allResults = useMemo(() => buildResults(students, lessons, entries, resources), [entries, lessons, resources, students]);
  const results = useMemo(() => {
    const terms = normalise(queryText).split(" ").filter(Boolean);
    if (!terms.length) return [];
    return allResults
      .map((item) => ({ item, score: scoreResult(item, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 80)
      .map(({ item }) => item);
  }, [allResults, queryText]);

  return <Screen>
    <View style={styles.header}>
      <Pressable onPress={navigation.goBack} style={styles.back}><Ionicons name="chevron-back" size={22} color={c.slate900} /></Pressable>
      <View style={styles.search}><Ionicons name="search-outline" size={18} color={c.slate500} /><TextInput value={queryText} onChangeText={setQueryText} autoFocus placeholder="Search App7i" placeholderTextColor={c.slate500} style={styles.input} autoCapitalize="none" returnKeyType="search" />{queryText ? <Pressable onPress={() => setQueryText("")}><Ionicons name="close-circle" size={18} color={c.slate500} /></Pressable> : null}</View>
    </View>

    {loading ? <View style={styles.loading}><ActivityIndicator color={c.slate900} /></View> : !queryText.trim() ? <View style={styles.start}><Text style={styles.kicker}>QUICK SEARCH</Text><View style={styles.chips}>{["Unpaid", "Practical tests", "Homework", "Roundabouts", "PDF"].map((value) => <Pressable key={value} onPress={() => setQueryText(value)} style={styles.chip}><Text style={styles.chipText}>{value}</Text></Pressable>)}</View></View> : results.length === 0 ? <EmptyState iconName="search-outline" title="No results" message="Try a student name, date, topic, payment status or resource title." /> : <View style={styles.results}>{results.map((result, index) => <View key={`${result.kind}:${result.id}`}><Pressable onPress={() => navigation.navigate(result.screen, result.params)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.icon}><Ionicons name={result.icon} size={18} color={c.slate900} /></View><View style={styles.rowCopy}><View style={styles.titleLine}><Text style={styles.rowTitle} numberOfLines={1}>{result.title}</Text><Text style={styles.kind}>{result.kind.toUpperCase()}</Text></View><Text style={styles.rowMeta} numberOfLines={2}>{result.subtitle}</Text></View><Ionicons name="chevron-forward" size={17} color={c.slate500} /></Pressable>{index < results.length - 1 ? <View style={styles.divider} /> : null}</View>)}</View>}
  </Screen>;
}

function buildResults(students: Student[], lessons: Lesson[], entries: LearningEntry[], resources: LearningResource[]): SearchResult[] {
  const studentNames = new Map(students.map((student) => [student.id, student.name]));
  const results: SearchResult[] = [];
  students.forEach((student) => {
    results.push({ id: student.id, kind: "Student", title: student.name, subtitle: [student.email, student.phone, student.transmission].filter(Boolean).join(" · "), keywords: [student.name, student.email, student.phone, student.language, student.practiceFocus, student.practiceTips].join(" "), icon: "person-outline", screen: "StudentProfile", params: { studentId: student.id } });
    if (student.practicalTestDate) results.push({ id: student.id, kind: "Test", title: `${student.name} practical test`, subtitle: [student.practicalTestDate, student.practicalTestTime, student.testCentre, student.practicalTestStatus].filter(Boolean).join(" · "), keywords: [student.name, student.testCentre, student.testMeetingLocation, student.practicalTestNotes, "practical test"].join(" "), icon: "ribbon-outline", screen: "TestReadiness", params: { studentId: student.id } });
  });
  lessons.forEach((lesson) => {
    results.push({ id: lesson.id, kind: "Lesson", title: `${lesson.studentName} lesson`, subtitle: `${formatLessonDate(lesson.date)} at ${lesson.time} · ${lesson.status}`, keywords: [lesson.studentName, lesson.date, lesson.time, lesson.pickup, lesson.notes, Object.keys(lesson.skillRatings || {}).join(" ")].join(" "), icon: "calendar-outline", screen: "LessonDetail", params: { lessonId: lesson.id } });
    results.push({ id: lesson.id, kind: "Payment", title: `${lesson.studentName} payment`, subtitle: `£${lesson.price} · ${lesson.paymentStatus}${lesson.paymentMethod ? ` · ${lesson.paymentMethod}` : ""}`, keywords: [lesson.studentName, lesson.date, lesson.paymentStatus, lesson.paymentMethod, "payment paid unpaid waived pending"].join(" "), icon: "wallet-outline", screen: "Payments", params: { lessonId: lesson.id } });
  });
  entries.forEach((entry) => results.push({ id: entry.id, kind: "Learning", title: entry.title, subtitle: `${studentNames.get(entry.studentId) || "Student"} · ${entry.kind.replace("_", " ")}`, keywords: [entry.title, entry.body, entry.homework, entry.areasToImprove, entry.instructorComments, entry.nextObjectives, entry.topicsCovered.join(" "), entry.skillsAchieved.join(" "), studentNames.get(entry.studentId)].join(" "), icon: "school-outline", screen: "StudentLearningHub", params: { studentId: entry.studentId, studentName: studentNames.get(entry.studentId) || "Learner" } }));
  resources.forEach((resource) => results.push({ id: resource.id, kind: "Resource", title: resource.title, subtitle: `${resource.category} · ${resource.folder}${resource.archived ? " · archived" : ""}`, keywords: [resource.title, resource.description, resource.category, resource.folder, resource.type, resource.fileName].join(" "), icon: "library-outline", screen: "ResourceLibrary" }));
  return results;
}

function normalise(value: string) { return value.toLowerCase().replace(/[^a-z0-9£]+/g, " ").trim(); }
function scoreResult(result: SearchResult, terms: string[]) { const title = normalise(result.title); const all = normalise(`${result.title} ${result.subtitle} ${result.keywords} ${result.kind}`); if (!terms.every((term) => all.includes(term))) return 0; return terms.reduce((score, term) => score + (title.startsWith(term) ? 8 : title.includes(term) ? 5 : 1), 0); }
function formatLessonDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function friendlyError(error: unknown) { return error instanceof Error && error.message ? error.message : "Check your connection and try again."; }

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  back: { width: 42, height: 46, alignItems: "center", justifyContent: "center" },
  search: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: c.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  input: { flex: 1, color: c.slate900, fontSize: 15, paddingVertical: 0 },
  loading: { minHeight: 360, justifyContent: "center" },
  start: { paddingTop: spacing.md },
  kicker: { color: c.slate500, fontSize: 10, fontWeight: "700", marginBottom: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { minHeight: 38, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface },
  chipText: { color: c.slate700, fontSize: 12, fontWeight: "600" },
  results: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted },
  rowCopy: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowTitle: { flex: 1, color: c.slate900, fontSize: 14, fontWeight: "600" },
  kind: { color: c.slate500, fontSize: 8, fontWeight: "800" },
  rowMeta: { color: c.slate500, fontSize: 10, lineHeight: 15, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginLeft: 50 },
  pressed: { opacity: 0.65 },
});

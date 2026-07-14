import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getStudentByUid } from "../../services/dataService";
import {
  getAssignmentOpenUrl,
  getLearningEntries,
  getStudentAssignments,
  getStudentLearningProgress,
  setAssignmentCompleted,
} from "../../services/learningHubService";
import type {
  LearningEntry,
  LearningTopic,
  ResourceAssignment,
  Student,
  StudentLearningProgress,
} from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Tab = "resources" | "notes" | "skills";
type Nav = { navigate: (screen: string, params?: Record<string, unknown>) => void };

export function StudentLearningHubScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [progress, setProgress] = useState<StudentLearningProgress | null>(null);
  const [tab, setTab] = useState<Tab>("resources");
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    const linked = await getStudentByUid(user.uid);
    setStudent(linked);
    if (!linked?.instructorId) {
      setAssignments([]); setEntries([]); setProgress(null); return;
    }
    const [nextAssignments, nextEntries, nextProgress] = await Promise.all([
      getStudentAssignments(linked.id),
      getLearningEntries(linked.id),
      getStudentLearningProgress(linked.instructorId, linked.id),
    ]);
    setAssignments(nextAssignments);
    setEntries(nextEntries);
    setProgress(nextProgress);
  }, [user?.uid]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().catch((error) => Alert.alert("Learning Hub did not load", friendlyError(error))).finally(() => setLoading(false));
  }, [load]));

  const requiredOpen = useMemo(() => assignments.filter((item) => item.required && !item.completed).length, [assignments]);

  async function openAssignment(assignment: ResourceAssignment) {
    setOpeningId(assignment.id);
    try { await Linking.openURL(await getAssignmentOpenUrl(assignment)); }
    catch (error) { Alert.alert("Resource did not open", friendlyError(error)); }
    finally { setOpeningId(null); }
  }

  async function toggleComplete(assignment: ResourceAssignment) {
    const completed = !assignment.completed;
    setAssignments((current) => current.map((item) => item.id === assignment.id ? { ...item, completed } : item));
    try { await setAssignmentCompleted(assignment.id, completed); }
    catch (error) { await load(); Alert.alert("Progress did not save", friendlyError(error)); }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>MY LEARNING</Text>
          <Text style={styles.title}>Learning Hub</Text>
          <Text style={styles.subtitle}>Notes, homework, resources and driving progress.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("StudentMore")} style={styles.moreButton} accessibilityLabel="More options">
          <Ionicons name="ellipsis-horizontal" size={21} color={c.slate900} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={c.slate900} /></View>
      ) : !student ? (
        <EmptyState iconName="link-outline" title="Waiting for your instructor" message="Sign in with the same verified email your instructor used when adding you." />
      ) : (
        <>
          <View style={styles.metrics}>
            <Metric label="Overall" value={`${progress?.overallPercent || 0}%`} />
            <Metric label="Resources" value={`${assignments.filter((item) => item.completed).length}/${assignments.length}`} />
            <Metric label="Required" value={String(requiredOpen)} />
          </View>

          {requiredOpen > 0 ? (
            <View style={styles.priority}>
              <Ionicons name="flag-outline" size={19} color={c.slate900} />
              <View style={styles.priorityCopy}><Text style={styles.priorityTitle}>You have {requiredOpen} required {requiredOpen === 1 ? "resource" : "resources"}</Text><Text style={styles.priorityText}>Open each item and mark it complete when you finish.</Text></View>
            </View>
          ) : null}

          <View style={styles.tabs}>
            {(["resources", "notes", "skills"] as Tab[]).map((item) => (
              <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
                <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
              </Pressable>
            ))}
          </View>

          {tab === "resources" ? (
            <ResourceList assignments={assignments} openingId={openingId} onOpen={openAssignment} onComplete={toggleComplete} onOfficial={() => navigation.navigate("StudentResources")} />
          ) : null}
          {tab === "notes" ? <EntryList entries={entries} /> : null}
          {tab === "skills" ? <TopicList progress={progress} onTest={() => navigation.navigate("StudentTestReadiness")} /> : null}
        </>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function ResourceList({ assignments, openingId, onOpen, onComplete, onOfficial }: {
  assignments: ResourceAssignment[];
  openingId: string | null;
  onOpen: (item: ResourceAssignment) => void;
  onComplete: (item: ResourceAssignment) => void;
  onOfficial: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  if (!assignments.length) return <EmptyState iconName="folder-open-outline" title="No learning materials yet" message="Resources shared by your instructor will appear here." />;
  return <View style={styles.stack}>
    {assignments.map((item) => <View key={item.id} style={[styles.resource, item.pinned && styles.resourcePinned]}>
      <Pressable onPress={() => onOpen(item)} style={({ pressed }) => [styles.resourceMain, pressed && styles.pressed]}>
        <View style={styles.resourceIcon}>{openingId === item.id ? <ActivityIndicator size="small" color={c.slate900} /> : <Ionicons name={resourceIcon(item.type)} size={20} color={c.slate900} />}</View>
        <View style={styles.resourceCopy}><View style={styles.titleLine}><Text style={styles.resourceTitle} numberOfLines={2}>{item.title}</Text>{item.required ? <View style={styles.required}><Text style={styles.requiredText}>REQUIRED</Text></View> : null}</View><Text style={styles.resourceMeta}>{item.category} · {item.type.replace("_", " ")}</Text>{item.description ? <Text style={styles.resourceDescription} numberOfLines={2}>{item.description}</Text> : null}</View>
        <Ionicons name="open-outline" size={18} color={c.slate500} />
      </Pressable>
      <Pressable onPress={() => onComplete(item)} style={styles.completeRow}><Ionicons name={item.completed ? "checkmark-circle" : "ellipse-outline"} size={20} color={item.completed ? c.emerald : c.slate500} /><Text style={[styles.completeText, item.completed && styles.completeTextDone]}>{item.completed ? "Completed" : "Mark as complete"}</Text></Pressable>
    </View>)}
    <Pressable onPress={onOfficial} style={styles.official}><Ionicons name="shield-checkmark-outline" size={19} color={c.slate900} /><View style={styles.officialCopy}><Text style={styles.officialTitle}>Official driving resources</Text><Text style={styles.officialMeta}>GOV.UK, Highway Code and DVSA links</Text></View><Ionicons name="chevron-forward" size={17} color={c.slate500} /></Pressable>
  </View>;
}

function EntryList({ entries }: { entries: LearningEntry[] }) {
  const styles = useThemedStyles(makeStyles);
  if (!entries.length) return <EmptyState iconName="document-text-outline" title="No notes yet" message="Lesson summaries, feedback and homework from your instructor will appear here." />;
  return <View style={styles.stack}>{entries.map((entry) => <View key={entry.id} style={styles.entry}>
    <View style={styles.entryTop}><Text style={styles.entryKind}>{entry.kind === "lesson_summary" ? "LESSON SUMMARY" : entry.kind === "homework" ? "HOMEWORK" : "INSTRUCTOR NOTE"}</Text><Text style={styles.entryDate}>{formatDate(entry.updatedAt)}</Text></View>
    <Text style={styles.entryTitle}>{entry.title}</Text>
    {entry.body ? <Text style={styles.entryBody}>{entry.body}</Text> : null}
    {entry.topicsCovered.length ? <Detail label="Topics covered" value={entry.topicsCovered.join(", ")} /> : null}
    {entry.areasToImprove ? <Detail label="Keep improving" value={entry.areasToImprove} /> : null}
    {entry.homework ? <Detail label="Homework" value={entry.homework} /> : null}
    {entry.instructorComments ? <Detail label="Instructor feedback" value={entry.instructorComments} /> : null}
    {entry.nextObjectives ? <Detail label="Next lesson" value={entry.nextObjectives} /> : null}
  </View>)}</View>;
}

function TopicList({ progress, onTest }: { progress: StudentLearningProgress | null; onTest: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  if (!progress) return <EmptyState iconName="trending-up-outline" title="Progress is being prepared" message="Your instructor will update topics as you learn." />;
  return <View style={styles.stack}>
    <View style={styles.progressHeader}><Text style={styles.progressPercent}>{progress.overallPercent}% complete</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress.overallPercent}%` }]} /></View></View>
    <View style={styles.topicList}>{progress.topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)}</View>
    <Pressable onPress={onTest} style={styles.official}><Ionicons name="ribbon-outline" size={19} color={c.slate900} /><View style={styles.officialCopy}><Text style={styles.officialTitle}>Practical test preparation</Text><Text style={styles.officialMeta}>Date, centre, checklist and readiness</Text></View><Ionicons name="chevron-forward" size={17} color={c.slate500} /></Pressable>
  </View>;
}

function TopicRow({ topic }: { topic: LearningTopic }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const icon = topic.status === "completed" ? "checkmark-circle" : topic.status === "in_progress" ? "time" : "ellipse-outline";
  return <View style={styles.topic}><Ionicons name={icon} size={20} color={topic.status === "completed" ? c.emerald : topic.status === "in_progress" ? c.amber : c.slate500} /><Text style={styles.topicLabel}>{topic.label}</Text><Text style={styles.topicStatus}>{topic.status === "completed" ? "Completed" : topic.status === "in_progress" ? "In progress" : "Not started"}</Text></View>;
}

function Detail({ label, value }: { label: string; value: string }) { const styles = useThemedStyles(makeStyles); return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }
function resourceIcon(type: string): React.ComponentProps<typeof Ionicons>["name"] { if (type === "youtube" || type === "video") return "play-circle-outline"; if (type === "audio") return "headset-outline"; if (type === "image") return "image-outline"; if (type === "link") return "link-outline"; if (type === "note") return "create-outline"; return "document-text-outline"; }
function formatDate(timestamp: number) { return timestamp ? new Date(timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; }
function friendlyError(error: unknown) { return error instanceof Error && error.message ? error.message : "Check your connection and try again."; }

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.lg },
  headerCopy: { flex: 1 },
  kicker: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  title: { color: c.slate900, fontSize: 30, lineHeight: 36, fontWeight: "700", marginTop: 2 },
  subtitle: { color: c.slate500, fontSize: 12, lineHeight: 18, marginTop: 4 },
  moreButton: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  loading: { minHeight: 380, justifyContent: "center" },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, minWidth: 0, padding: spacing.md, borderRadius: 10, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  metricValue: { color: c.slate900, fontSize: 19, fontWeight: "700" },
  metricLabel: { color: c.slate500, fontSize: 10, fontWeight: "600", marginTop: 4 },
  priority: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: 10, backgroundColor: c.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  priorityCopy: { flex: 1 },
  priorityTitle: { color: c.slate900, fontSize: 13, fontWeight: "700" },
  priorityText: { color: c.slate500, fontSize: 11, lineHeight: 16, marginTop: 3 },
  tabs: { flexDirection: "row", marginTop: spacing.lg, marginBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  tab: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: c.slate900 },
  tabText: { color: c.slate500, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: c.slate900 },
  stack: { gap: spacing.md },
  resource: { borderRadius: 10, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, overflow: "hidden" },
  resourcePinned: { borderColor: c.borderStrong },
  resourceMain: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  resourceIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: c.surfaceMuted, alignItems: "center", justifyContent: "center" },
  resourceCopy: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  resourceTitle: { flex: 1, color: c.slate900, fontSize: 15, lineHeight: 19, fontWeight: "700" },
  required: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4, backgroundColor: c.surfaceMuted },
  requiredText: { color: c.slate600, fontSize: 8, fontWeight: "800" },
  resourceMeta: { color: c.slate500, fontSize: 10, marginTop: 4, textTransform: "capitalize" },
  resourceDescription: { color: c.slate600, fontSize: 11, lineHeight: 16, marginTop: 5 },
  completeRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  completeText: { color: c.slate600, fontSize: 12, fontWeight: "600" },
  completeTextDone: { color: c.slate900 },
  pressed: { opacity: 0.65 },
  official: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface },
  officialCopy: { flex: 1 },
  officialTitle: { color: c.slate900, fontSize: 14, fontWeight: "700" },
  officialMeta: { color: c.slate500, fontSize: 10, marginTop: 3 },
  entry: { padding: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface },
  entryTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  entryKind: { color: c.slate500, fontSize: 9, fontWeight: "800" },
  entryDate: { color: c.slate500, fontSize: 10 },
  entryTitle: { color: c.slate900, fontSize: 17, fontWeight: "700", marginTop: spacing.sm },
  entryBody: { color: c.slate600, fontSize: 13, lineHeight: 19, marginTop: 6 },
  detail: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  detailLabel: { color: c.slate500, fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  detailValue: { color: c.slate700, fontSize: 12, lineHeight: 18, marginTop: 4 },
  progressHeader: { padding: spacing.md, borderRadius: 10, backgroundColor: c.surface },
  progressPercent: { color: c.slate900, fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceMuted, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: c.emerald },
  topicList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  topic: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  topicLabel: { flex: 1, color: c.slate900, fontSize: 13, fontWeight: "500" },
  topicStatus: { color: c.slate500, fontSize: 10 },
});

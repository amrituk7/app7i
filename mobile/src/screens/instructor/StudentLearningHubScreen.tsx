import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  assignResourceToStudent,
  createCustomLearningTopic,
  deleteLearningEntry,
  getAssignmentOpenUrl,
  getLearningEntries,
  getResourceLibrary,
  getStudentAssignments,
  getStudentLearningProgress,
  saveLearningEntry,
  saveStudentLearningTopics,
  unassignResource,
  type LearningEntryDraft,
} from "../../services/learningHubService";
import type {
  LearningEntry,
  LearningEntryKind,
  LearningResource,
  LearningTopic,
  ResourceAssignment,
  StudentLearningProgress,
} from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Tab = "overview" | "resources" | "notes" | "skills";
type Nav = { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
type Route = { params?: { studentId?: string; studentName?: string; lessonId?: string; openSummary?: boolean } };

export function StudentLearningHubScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const studentId = route.params?.studentId || "";
  const studentName = route.params?.studentName || "Learner";
  const [tab, setTab] = useState<Tab>("overview");
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [library, setLibrary] = useState<LearningResource[]>([]);
  const [progress, setProgress] = useState<StudentLearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [entryKind, setEntryKind] = useState<LearningEntryKind | null>(null);
  const [topicOpen, setTopicOpen] = useState(false);
  const openedInitialSummary = useRef(false);

  const load = useCallback(async () => {
    if (!user?.uid || !studentId) return;
    const [nextAssignments, nextEntries, nextLibrary, nextProgress] = await Promise.all([
      getStudentAssignments(studentId),
      getLearningEntries(studentId),
      getResourceLibrary(user.uid),
      getStudentLearningProgress(user.uid, studentId),
    ]);
    setAssignments(nextAssignments);
    setEntries(nextEntries);
    setLibrary(nextLibrary);
    setProgress(nextProgress);
  }, [studentId, user?.uid]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().catch((error) => Alert.alert("Learning Hub did not load", friendlyError(error))).finally(() => setLoading(false));
  }, [load]));

  useEffect(() => {
    if (route.params?.openSummary && !openedInitialSummary.current) {
      openedInitialSummary.current = true;
      setTab("notes");
      setEntryKind("lesson_summary");
    }
  }, [route.params?.openSummary]);

  const incompleteRequired = assignments.filter((item) => item.required && !item.completed).length;
  const completedSkills = progress?.topics.filter((topic) => topic.status === "completed").length || 0;
  const latestHomework = entries.find((entry) => entry.homework || entry.kind === "homework");

  if (!studentId) {
    return <Screen><EmptyState iconName="person-outline" title="Student not found" message="Open the Learning Hub from a student profile." /></Screen>;
  }

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack} style={styles.iconButton} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={c.slate900} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>LEARNING HUB</Text>
            <Text style={styles.title} numberOfLines={1}>{studentName}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("ResourceLibrary")} style={styles.iconButton} accessibilityLabel="Open resource library">
            <Ionicons name="library-outline" size={20} color={c.slate900} />
          </Pressable>
        </View>

        {loading || !progress ? (
          <View style={styles.loading}><ActivityIndicator color={c.slate900} /></View>
        ) : (
          <>
            <View style={styles.metrics}>
              <Metric value={`${progress.overallPercent}%`} label="Progress" />
              <Metric value={`${completedSkills}/${progress.topics.length}`} label="Skills" />
              <Metric value={String(incompleteRequired)} label="Required" />
            </View>

            <View style={styles.tabs}>
              {(["overview", "resources", "notes", "skills"] as Tab[]).map((item) => (
                <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{tabLabel(item)}</Text>
                </Pressable>
              ))}
            </View>

            {tab === "overview" ? (
              <Overview
                assignments={assignments}
                entries={entries}
                latestHomework={latestHomework}
                onResources={() => setTab("resources")}
                onSummary={() => { setTab("notes"); setEntryKind("lesson_summary"); }}
                onTest={() => navigation.navigate("TestReadiness", { studentId })}
              />
            ) : null}
            {tab === "resources" ? (
              <Resources
                assignments={assignments}
                onAssign={() => setAssignOpen(true)}
                onLibrary={() => navigation.navigate("ResourceLibrary")}
                onOpen={async (assignment) => {
                  try { await Linking.openURL(await getAssignmentOpenUrl(assignment)); }
                  catch (error) { Alert.alert("Resource did not open", friendlyError(error)); }
                }}
                onRemove={(assignment) => {
                  Alert.alert("Remove from student?", `${assignment.title} stays in your library.`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: async () => {
                      await unassignResource(assignment.id);
                      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
                    } },
                  ]);
                }}
              />
            ) : null}
            {tab === "notes" ? (
              <Notes
                entries={entries}
                onAdd={setEntryKind}
                onDelete={(entry) => {
                  Alert.alert("Delete learning entry?", "This also removes it from the student's Learning Hub.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: async () => {
                      await deleteLearningEntry(entry.id);
                      setEntries((current) => current.filter((item) => item.id !== entry.id));
                    } },
                  ]);
                }}
              />
            ) : null}
            {tab === "skills" ? (
              <Skills
                progress={progress}
                onAdd={() => setTopicOpen(true)}
                onChange={async (topic) => {
                  if (!user?.uid) return;
                  const topics = progress.topics.map((item) => item.id === topic.id ? topic : item);
                  setProgress({ ...progress, topics, overallPercent: calculateProgress(topics) });
                  try { setProgress(await saveStudentLearningTopics(user.uid, studentId, topics)); }
                  catch (error) { await load(); Alert.alert("Progress did not save", friendlyError(error)); }
                }}
              />
            ) : null}
          </>
        )}
      </Screen>

      <AssignResourceModal
        visible={assignOpen}
        resources={library}
        existingIds={new Set(assignments.map((item) => item.resourceId))}
        onClose={() => setAssignOpen(false)}
        onAssign={async (resource, options) => {
          try {
            const assigned = await assignResourceToStudent(resource, studentId, options);
            setAssignments((current) => {
              const exists = current.some((item) => item.id === assigned.id);
              return exists ? current.map((item) => item.id === assigned.id ? assigned : item) : [assigned, ...current];
            });
            setAssignOpen(false);
          } catch (error) {
            Alert.alert("Resource was not assigned", friendlyError(error));
          }
        }}
      />

      <LearningEntryEditor
        visible={entryKind !== null}
        kind={entryKind || "manual_note"}
        studentId={studentId}
        lessonId={route.params?.lessonId}
        onClose={() => setEntryKind(null)}
        onSave={async (draft) => {
          if (!user?.uid) return;
          const saved = await saveLearningEntry(user.uid, draft);
          setEntries((current) => {
            const exists = current.some((item) => item.id === saved.id);
            return exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current];
          });
          setEntryKind(null);
        }}
      />

      <AddTopicModal
        visible={topicOpen}
        onClose={() => setTopicOpen(false)}
        onAdd={async (label) => {
          if (!user?.uid || !progress) return;
          const topics = [...progress.topics, createCustomLearningTopic(label)];
          setProgress(await saveStudentLearningTopics(user.uid, studentId, topics));
          setTopicOpen(false);
        }}
      />
    </>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Overview({ assignments, entries, latestHomework, onResources, onSummary, onTest }: {
  assignments: ResourceAssignment[];
  entries: LearningEntry[];
  latestHomework?: LearningEntry;
  onResources: () => void;
  onSummary: () => void;
  onTest: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const required = assignments.filter((item) => item.required && !item.completed);
  return (
    <View style={styles.sectionStack}>
      <View style={styles.panel}>
        <SectionTitle icon="flag-outline" title="Current priorities" />
        <SummaryLine label="Required resources" value={required.length ? `${required.length} to complete` : "All complete"} onPress={onResources} />
        <SummaryLine label="Learning entries" value={entries.length ? `${entries.length} shared` : "No notes yet"} />
        <SummaryLine label="Homework" value={latestHomework?.homework || latestHomework?.body || "Nothing assigned"} />
      </View>
      <View style={styles.actionGrid}>
        <QuickAction icon="document-text-outline" label="Lesson summary" onPress={onSummary} />
        <QuickAction icon="library-outline" label="Assign resource" onPress={onResources} />
        <QuickAction icon="ribbon-outline" label="Test preparation" onPress={onTest} />
      </View>
      <View style={styles.notice}>
        <Ionicons name="people-outline" size={18} color={c.slate700} />
        <Text style={styles.noticeText}>Everything shared here appears in the learner's mobile Learning Hub.</Text>
      </View>
    </View>
  );
}

function Resources({ assignments, onAssign, onLibrary, onOpen, onRemove }: {
  assignments: ResourceAssignment[];
  onAssign: () => void;
  onLibrary: () => void;
  onOpen: (assignment: ResourceAssignment) => void;
  onRemove: (assignment: ResourceAssignment) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.sectionStack}>
      <View style={styles.inlineActions}>
        <Pressable onPress={onAssign} style={styles.primarySmall}><Ionicons name="add" size={18} color={c.onInverted} /><Text style={styles.primarySmallText}>Assign</Text></Pressable>
        <Pressable onPress={onLibrary} style={styles.secondarySmall}><Ionicons name="library-outline" size={17} color={c.slate900} /><Text style={styles.secondarySmallText}>Library</Text></Pressable>
      </View>
      {assignments.length === 0 ? (
        <EmptyState iconName="folder-open-outline" title="No resources assigned" message="Choose a file, video, link or note from your reusable library." actionLabel="Assign resource" onAction={onAssign} />
      ) : assignments.map((assignment) => (
        <View key={assignment.id} style={styles.listRow}>
          <Pressable onPress={() => onOpen(assignment)} style={styles.listRowMain}>
            <View style={styles.listIcon}><Ionicons name={assignmentIcon(assignment)} size={18} color={c.slate900} /></View>
            <View style={styles.listCopy}>
              <Text style={styles.listTitle} numberOfLines={1}>{assignment.title}</Text>
              <Text style={styles.listMeta}>{assignment.required ? "Required" : "Optional"} · {assignment.completed ? "Completed" : "Not completed"}</Text>
            </View>
            {assignment.pinned ? <Ionicons name="pin" size={14} color={c.slate500} /> : null}
            <Ionicons name="open-outline" size={17} color={c.slate500} />
          </Pressable>
          <Pressable onPress={() => onRemove(assignment)} style={styles.removeButton}><Text style={styles.removeText}>Remove</Text></Pressable>
        </View>
      ))}
    </View>
  );
}

function Notes({ entries, onAdd, onDelete }: { entries: LearningEntry[]; onAdd: (kind: LearningEntryKind) => void; onDelete: (entry: LearningEntry) => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.sectionStack}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteActions}>
        <Pressable onPress={() => onAdd("lesson_summary")} style={styles.primarySmall}><Ionicons name="document-text-outline" size={17} color={c.onInverted} /><Text style={styles.primarySmallText}>Lesson summary</Text></Pressable>
        <Pressable onPress={() => onAdd("manual_note")} style={styles.secondarySmall}><Ionicons name="create-outline" size={17} color={c.slate900} /><Text style={styles.secondarySmallText}>Note</Text></Pressable>
        <Pressable onPress={() => onAdd("homework")} style={styles.secondarySmall}><Ionicons name="checkmark-done-outline" size={17} color={c.slate900} /><Text style={styles.secondarySmallText}>Homework</Text></Pressable>
      </ScrollView>
      {entries.length === 0 ? (
        <EmptyState iconName="document-text-outline" title="No learning entries" message="Add a structured lesson summary, homework or a manual note." />
      ) : entries.map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <View style={styles.entryHeader}>
            <View style={styles.entryKind}><Text style={styles.entryKindText}>{entryKindLabel(entry.kind)}</Text></View>
            <Text style={styles.entryDate}>{formatDate(entry.updatedAt)}</Text>
            <Pressable onPress={() => onDelete(entry)} style={styles.trash}><Ionicons name="trash-outline" size={16} color={c.red} /></Pressable>
          </View>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          {entry.body ? <Text style={styles.entryBody}>{entry.body}</Text> : null}
          {entry.topicsCovered.length ? <EntryDetail label="Topics" value={entry.topicsCovered.join(", ")} /> : null}
          {entry.areasToImprove ? <EntryDetail label="Improve" value={entry.areasToImprove} /> : null}
          {entry.homework ? <EntryDetail label="Homework" value={entry.homework} /> : null}
          {entry.nextObjectives ? <EntryDetail label="Next lesson" value={entry.nextObjectives} /> : null}
        </View>
      ))}
    </View>
  );
}

function Skills({ progress, onAdd, onChange }: { progress: StudentLearningProgress; onAdd: () => void; onChange: (topic: LearningTopic) => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.sectionStack}>
      <View style={styles.skillHeader}>
        <View><Text style={styles.skillPercent}>{progress.overallPercent}%</Text><Text style={styles.skillHelp}>Tap a topic to update its status.</Text></View>
        <Pressable onPress={onAdd} style={styles.secondarySmall}><Ionicons name="add" size={17} color={c.slate900} /><Text style={styles.secondarySmallText}>Custom topic</Text></Pressable>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress.overallPercent}%` }]} /></View>
      <View style={styles.skillList}>
        {progress.topics.map((topic) => (
          <Pressable key={topic.id} onPress={() => onChange({ ...topic, status: nextStatus(topic.status), updatedAt: Date.now() })} style={({ pressed }) => [styles.skillRow, pressed && styles.pressed]}>
            <View style={[styles.statusDot, topic.status === "completed" && styles.statusComplete, topic.status === "in_progress" && styles.statusProgress]} />
            <Text style={styles.skillLabel}>{topic.label}</Text>
            <Text style={styles.statusLabel}>{statusLabel(topic.status)}</Text>
            <Ionicons name="chevron-forward" size={16} color={c.slate500} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AssignResourceModal({ visible, resources, existingIds, onClose, onAssign }: {
  visible: boolean;
  resources: LearningResource[];
  existingIds: Set<string>;
  onClose: () => void;
  onAssign: (resource: LearningResource, options: { required: boolean; pinned: boolean }) => Promise<void>;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [selected, setSelected] = useState<LearningResource | null>(null);
  const [required, setRequired] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!visible) setSelected(null); }, [visible]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.modalHeaderButton}><Text style={styles.modalCancel}>Cancel</Text></Pressable>
          <Text style={styles.modalTitle}>Assign resource</Text>
          <View style={styles.modalHeaderButton} />
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {resources.length === 0 ? <EmptyState iconName="library-outline" title="Library is empty" message="Add resources to your instructor library first." /> : resources.map((resource) => {
            const active = selected?.id === resource.id;
            const assigned = existingIds.has(resource.id);
            return (
              <Pressable key={resource.id} onPress={() => setSelected(resource)} style={[styles.resourceChoice, active && styles.resourceChoiceActive]}>
                <Ionicons name={resourceIcon(resource.type)} size={19} color={c.slate900} />
                <View style={styles.listCopy}><Text style={styles.listTitle}>{resource.title}</Text><Text style={styles.listMeta}>{resource.category} · {assigned ? "Already assigned" : resource.type.replace("_", " ")}</Text></View>
                <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? c.emerald : c.slate500} />
              </Pressable>
            );
          })}
        </ScrollView>
        {selected ? (
          <View style={styles.assignFooter}>
            <View style={styles.optionRow}>
              <Pressable onPress={() => setRequired((value) => !value)} style={styles.option}><Ionicons name={required ? "checkbox" : "square-outline"} size={21} color={required ? c.emerald : c.slate500} /><Text style={styles.optionText}>Required</Text></Pressable>
              <Pressable onPress={() => setPinned((value) => !value)} style={styles.option}><Ionicons name={pinned ? "checkbox" : "square-outline"} size={21} color={pinned ? c.emerald : c.slate500} /><Text style={styles.optionText}>Pin for student</Text></Pressable>
            </View>
            <Pressable disabled={saving} onPress={async () => { setSaving(true); await onAssign(selected, { required, pinned }).finally(() => setSaving(false)); }} style={styles.assignButton}>
              {saving ? <ActivityIndicator color={c.onInverted} /> : <Text style={styles.assignButtonText}>{existingIds.has(selected.id) ? "Update assignment" : "Assign to student"}</Text>}
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function LearningEntryEditor({ visible, kind, studentId, lessonId, onClose, onSave }: {
  visible: boolean;
  kind: LearningEntryKind;
  studentId: string;
  lessonId?: string;
  onClose: () => void;
  onSave: (draft: LearningEntryDraft) => Promise<void>;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topics, setTopics] = useState("");
  const [improve, setImprove] = useState("");
  const [homework, setHomework] = useState("");
  const [skills, setSkills] = useState("");
  const [comments, setComments] = useState("");
  const [objectives, setObjectives] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setTitle(kind === "lesson_summary" ? "Lesson summary" : kind === "homework" ? "Homework" : "Learning note");
    setBody(""); setTopics(""); setImprove(""); setHomework(""); setSkills(""); setComments(""); setObjectives(""); setConfidence(3);
  }, [kind, visible]);
  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        studentId, lessonId: kind === "lesson_summary" ? lessonId : undefined, kind, title, body,
        topicsCovered: splitList(topics), areasToImprove: improve, homework: kind === "homework" && !homework ? body : homework,
        skillsAchieved: splitList(skills), instructorComments: comments, confidenceLevel: confidence, nextObjectives: objectives,
      });
    } catch (error) { Alert.alert("Entry was not saved", friendlyError(error)); }
    finally { setSaving(false); }
  }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.modalHeaderButton}><Text style={styles.modalCancel}>Cancel</Text></Pressable>
          <Text style={styles.modalTitle}>{entryKindLabel(kind)}</Text>
          <Pressable onPress={() => void save()} style={styles.modalHeaderButton}><Text style={styles.modalSave}>{saving ? "Saving" : "Save"}</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
          <EditorField label="TITLE" value={title} onChangeText={setTitle} />
          <EditorField label={kind === "homework" ? "HOMEWORK" : "SUMMARY"} value={body} onChangeText={setBody} multiline />
          {kind === "lesson_summary" ? <>
            <EditorField label="TOPICS COVERED" value={topics} onChangeText={setTopics} placeholder="Junctions, roundabouts" />
            <EditorField label="AREAS TO IMPROVE" value={improve} onChangeText={setImprove} multiline />
            <EditorField label="HOMEWORK" value={homework} onChangeText={setHomework} multiline />
            <EditorField label="SKILLS ACHIEVED" value={skills} onChangeText={setSkills} placeholder="Moving off, mirror checks" />
            <EditorField label="INSTRUCTOR COMMENTS" value={comments} onChangeText={setComments} multiline />
            <Text style={styles.fieldLabel}>STUDENT CONFIDENCE</Text>
            <View style={styles.confidenceRow}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setConfidence(value)} style={[styles.confidence, confidence === value && styles.confidenceActive]}><Text style={[styles.confidenceText, confidence === value && styles.confidenceTextActive]}>{value}</Text></Pressable>)}</View>
            <EditorField label="OBJECTIVES FOR NEXT LESSON" value={objectives} onChangeText={setObjectives} multiline />
          </> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AddTopicModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (label: string) => Promise<void> }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) setLabel(""); }, [visible]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.dialogOverlay}><View style={styles.dialog}><Text style={styles.dialogTitle}>Custom learning topic</Text><TextInput value={label} onChangeText={setLabel} placeholder="e.g. Rural roads" placeholderTextColor={c.slate500} style={styles.dialogInput} autoFocus /><View style={styles.dialogActions}><Pressable onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></Pressable><Pressable disabled={!label.trim() || saving} onPress={async () => { setSaving(true); await onAdd(label).finally(() => setSaving(false)); }}><Text style={styles.modalSave}>{saving ? "Adding" : "Add topic"}</Text></Pressable></View></View></View></Modal>;
}

function SectionTitle({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string }) { const styles = useThemedStyles(makeStyles); const c = useColors(); return <View style={styles.sectionTitle}><Ionicons name={icon} size={18} color={c.slate900} /><Text style={styles.sectionTitleText}>{title}</Text></View>; }
function SummaryLine({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) { const styles = useThemedStyles(makeStyles); const c = useColors(); return <Pressable disabled={!onPress} onPress={onPress} style={styles.summaryLine}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>{onPress ? <Ionicons name="chevron-forward" size={15} color={c.slate500} /> : null}</Pressable>; }
function QuickAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) { const styles = useThemedStyles(makeStyles); const c = useColors(); return <Pressable onPress={onPress} style={styles.quickAction}><Ionicons name={icon} size={20} color={c.slate900} /><Text style={styles.quickActionText}>{label}</Text></Pressable>; }
function EntryDetail({ label, value }: { label: string; value: string }) { const styles = useThemedStyles(makeStyles); return <View style={styles.entryDetail}><Text style={styles.entryDetailLabel}>{label}</Text><Text style={styles.entryDetailValue}>{value}</Text></View>; }
function EditorField(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, multiline, ...rest } = props; const styles = useThemedStyles(makeStyles); const c = useColors(); return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...rest} multiline={multiline} placeholderTextColor={c.slate500} style={[styles.input, multiline && styles.inputMultiline]} textAlignVertical={multiline ? "top" : "center"} /></View>; }

function tabLabel(tab: Tab) { return tab === "overview" ? "Overview" : tab[0].toUpperCase() + tab.slice(1); }
function entryKindLabel(kind: LearningEntryKind) { return kind === "lesson_summary" ? "Lesson summary" : kind === "homework" ? "Homework" : "Manual note"; }
function splitList(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function formatDate(timestamp: number) { return timestamp ? new Date(timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; }
function nextStatus(status: LearningTopic["status"]): LearningTopic["status"] { return status === "not_started" ? "in_progress" : status === "in_progress" ? "completed" : "not_started"; }
function statusLabel(status: LearningTopic["status"]) { return status === "not_started" ? "Not started" : status === "in_progress" ? "In progress" : "Completed"; }
function calculateProgress(topics: LearningTopic[]) { if (!topics.length) return 0; return Math.round(((topics.filter((item) => item.status === "completed").length + topics.filter((item) => item.status === "in_progress").length * 0.5) / topics.length) * 100); }
function assignmentIcon(assignment: ResourceAssignment): React.ComponentProps<typeof Ionicons>["name"] { return resourceIcon(assignment.type); }
function resourceIcon(type: string): React.ComponentProps<typeof Ionicons>["name"] { if (type === "youtube" || type === "video") return "play-circle-outline"; if (type === "audio") return "headset-outline"; if (type === "image") return "image-outline"; if (type === "link") return "link-outline"; if (type === "note") return "create-outline"; return "document-text-outline"; }
function friendlyError(error: unknown) { const message = error instanceof Error ? error.message : ""; return message || "Check your connection and try again."; }

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  iconButton: { width: 42, height: 42, borderRadius: 11, backgroundColor: c.surfaceMuted, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  title: { color: c.slate900, fontSize: 26, lineHeight: 31, fontWeight: "700", marginTop: 2 },
  loading: { minHeight: 360, justifyContent: "center" },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, minWidth: 0, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, borderRadius: 10 },
  metricValue: { color: c.slate900, fontSize: 20, fontWeight: "700" },
  metricLabel: { color: c.slate500, fontSize: 10, fontWeight: "600", marginTop: 4 },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, marginTop: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: c.slate900 },
  tabText: { color: c.slate500, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: c.slate900 },
  sectionStack: { gap: spacing.md },
  panel: { borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, borderRadius: 10, backgroundColor: c.surface, paddingHorizontal: spacing.md },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  sectionTitleText: { color: c.slate900, fontSize: 15, fontWeight: "700" },
  summaryLine: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  summaryLabel: { width: 108, color: c.slate500, fontSize: 12, fontWeight: "600" },
  summaryValue: { flex: 1, color: c.slate900, fontSize: 13, lineHeight: 18, textAlign: "right" },
  actionGrid: { flexDirection: "row", gap: spacing.sm },
  quickAction: { flex: 1, minWidth: 0, minHeight: 88, justifyContent: "space-between", padding: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface },
  quickActionText: { color: c.slate900, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: 10, backgroundColor: c.surfaceMuted },
  noticeText: { flex: 1, color: c.slate600, fontSize: 12, lineHeight: 18 },
  inlineActions: { flexDirection: "row", gap: spacing.sm },
  primarySmall: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: spacing.md, borderRadius: 10, backgroundColor: c.slate900 },
  primarySmallText: { color: c.onInverted, fontSize: 13, fontWeight: "700" },
  secondarySmall: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: spacing.md, borderRadius: 10, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  secondarySmallText: { color: c.slate900, fontSize: 13, fontWeight: "600" },
  listRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, paddingVertical: spacing.sm },
  listRowMain: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  listIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: c.surfaceMuted, alignItems: "center", justifyContent: "center" },
  listCopy: { flex: 1, minWidth: 0 },
  listTitle: { color: c.slate900, fontSize: 14, fontWeight: "600" },
  listMeta: { color: c.slate500, fontSize: 11, marginTop: 4 },
  removeButton: { alignSelf: "flex-end", minHeight: 28, justifyContent: "center", paddingHorizontal: 4 },
  removeText: { color: c.red, fontSize: 11, fontWeight: "600" },
  noteActions: { gap: spacing.sm },
  entry: { padding: spacing.md, borderRadius: 10, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  entryKind: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: c.surfaceMuted },
  entryKindText: { color: c.slate600, fontSize: 9, fontWeight: "700" },
  entryDate: { flex: 1, color: c.slate500, fontSize: 10 },
  trash: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  entryTitle: { color: c.slate900, fontSize: 16, fontWeight: "700", marginTop: spacing.sm },
  entryBody: { color: c.slate600, fontSize: 13, lineHeight: 19, marginTop: 6 },
  entryDetail: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  entryDetailLabel: { width: 78, color: c.slate500, fontSize: 10, fontWeight: "700" },
  entryDetailValue: { flex: 1, color: c.slate700, fontSize: 12, lineHeight: 17 },
  skillHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  skillPercent: { color: c.slate900, fontSize: 28, fontWeight: "700" },
  skillHelp: { color: c.slate500, fontSize: 11, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceMuted, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: c.emerald },
  skillList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  skillRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  statusDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: c.slate500 },
  statusProgress: { backgroundColor: c.amber, borderColor: c.amber },
  statusComplete: { backgroundColor: c.emerald, borderColor: c.emerald },
  skillLabel: { flex: 1, color: c.slate900, fontSize: 14, fontWeight: "500" },
  statusLabel: { color: c.slate500, fontSize: 11 },
  pressed: { opacity: 0.65 },
  modalSafe: { flex: 1, backgroundColor: c.background },
  modalHeader: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  modalHeaderButton: { minWidth: 64, minHeight: 40, justifyContent: "center" },
  modalCancel: { color: c.slate600, fontSize: 15 },
  modalSave: { color: c.emerald, fontSize: 15, fontWeight: "700", textAlign: "right" },
  modalTitle: { color: c.slate900, fontSize: 16, fontWeight: "700" },
  modalContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 140 },
  resourceChoice: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface },
  resourceChoiceActive: { borderColor: c.emerald, borderWidth: 1 },
  assignFooter: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.md, paddingBottom: spacing.lg, backgroundColor: c.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  optionRow: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.md },
  option: { flexDirection: "row", alignItems: "center", gap: 7 },
  optionText: { color: c.slate900, fontSize: 13, fontWeight: "600" },
  assignButton: { minHeight: 48, borderRadius: 10, backgroundColor: c.slate900, alignItems: "center", justifyContent: "center" },
  assignButtonText: { color: c.onInverted, fontSize: 14, fontWeight: "700" },
  editorContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  field: { gap: 7 },
  fieldLabel: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  input: { minHeight: 48, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, color: c.slate900, fontSize: 14 },
  inputMultiline: { minHeight: 90, paddingTop: spacing.md },
  confidenceRow: { flexDirection: "row", gap: spacing.sm },
  confidence: { flex: 1, height: 42, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  confidenceActive: { backgroundColor: c.slate900, borderColor: c.slate900 },
  confidenceText: { color: c.slate600, fontWeight: "600" },
  confidenceTextActive: { color: c.onInverted },
  dialogOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.55)" },
  dialog: { width: "100%", maxWidth: 420, padding: spacing.lg, borderRadius: 12, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  dialogTitle: { color: c.slate900, fontSize: 17, fontWeight: "700", marginBottom: spacing.md },
  dialogInput: { minHeight: 48, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, color: c.slate900, paddingHorizontal: spacing.md },
  dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.lg, marginTop: spacing.lg },
});

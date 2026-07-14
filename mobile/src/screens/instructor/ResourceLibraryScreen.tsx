import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  createLearningResource,
  deleteLearningResource,
  getInstructorResourceOpenUrl,
  getResourceLibrary,
  updateLearningResource,
  type LearningUploadAsset,
} from "../../services/learningHubService";
import type { LearningResource, LearningResourceType } from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type EditorMode = "file" | "link" | "note";

export function ResourceLibraryScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<LearningResource | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setResources(await getResourceLibrary(user.uid, true));
  }, [user?.uid]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().catch((error) => {
      Alert.alert("Library did not load", friendlyError(error));
    }).finally(() => setLoading(false));
  }, [load]));

  const visible = useMemo(() => {
    const needle = queryText.trim().toLowerCase();
    return resources.filter((resource) => {
      if (resource.archived !== showArchived) return false;
      if (!needle) return true;
      return [resource.title, resource.description, resource.category, resource.folder]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [queryText, resources, showArchived]);

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  async function openResource(resource: LearningResource) {
    try {
      const url = await getInstructorResourceOpenUrl(resource);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Resource did not open", friendlyError(error));
    }
  }

  function removeResource(resource: LearningResource) {
    Alert.alert(
      "Delete resource?",
      "This removes it from your library and from every student it is assigned to. Archive it instead if you may need it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLearningResource(resource);
              setResources((current) => current.filter((item) => item.id !== resource.id));
            } catch (error) {
              Alert.alert("Resource was not deleted", friendlyError(error));
            }
          },
        },
      ],
    );
  }

  return (
    <>
      <Screen
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.slate900} />}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>LEARNING HUB</Text>
            <Text style={styles.title}>Resource library</Text>
            <Text style={styles.subtitle}>Upload once, then assign to any learner.</Text>
          </View>
          <Pressable onPress={openCreate} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={22} color={c.onInverted} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={c.slate500} />
          <TextInput
            value={queryText}
            onChangeText={setQueryText}
            placeholder="Search titles, folders or categories"
            placeholderTextColor={c.slate500}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.segment}>
          <Segment label="Active" active={!showArchived} onPress={() => setShowArchived(false)} />
          <Segment label="Archived" active={showArchived} onPress={() => setShowArchived(true)} />
        </View>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={c.slate900} /></View>
        ) : visible.length === 0 ? (
          <EmptyState
            iconName={showArchived ? "archive-outline" : "library-outline"}
            title={queryText ? "No matching resources" : showArchived ? "No archived resources" : "Build your teaching library"}
            message={queryText ? "Try another search." : "Add a file, educational link or teaching note, then assign it from a student's Learning Hub."}
            actionLabel={!queryText && !showArchived ? "Add first resource" : undefined}
            onAction={!queryText && !showArchived ? openCreate : undefined}
          />
        ) : (
          <View style={styles.list}>
            {visible.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                onOpen={() => void openResource(resource)}
                onEdit={() => { setEditing(resource); setEditorOpen(true); }}
                onArchive={async () => {
                  try {
                    const next = await updateLearningResource(resource, { archived: !resource.archived });
                    setResources((current) => current.map((item) => item.id === next.id ? next : item));
                  } catch (error) {
                    Alert.alert("Resource was not updated", friendlyError(error));
                  }
                }}
                onDelete={() => removeResource(resource)}
              />
            ))}
          </View>
        )}
      </Screen>

      <ResourceEditor
        visible={editorOpen}
        resource={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={(resource) => {
          setResources((current) => {
            const exists = current.some((item) => item.id === resource.id);
            return exists
              ? current.map((item) => item.id === resource.id ? resource : item)
              : [resource, ...current];
          });
          setEditorOpen(false);
        }}
      />
    </>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={[styles.segmentItem, active && styles.segmentItemActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ResourceRow({
  resource,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: {
  resource: LearningResource;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.resourceRow}>
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.resourceMain, pressed && styles.pressed]}>
        <View style={styles.resourceIcon}>
          <Ionicons name={resourceIcon(resource.type)} size={19} color={c.slate900} />
        </View>
        <View style={styles.resourceCopy}>
          <View style={styles.resourceTitleLine}>
            <Text style={styles.resourceTitle} numberOfLines={1}>{resource.title}</Text>
            {resource.pinned ? <Ionicons name="pin" size={13} color={c.slate500} /> : null}
          </View>
          <Text style={styles.resourceMeta} numberOfLines={1}>
            {resource.category} · {resource.folder}{resource.fileName ? ` · ${resource.fileName}` : ""}
          </Text>
        </View>
        <Ionicons name="open-outline" size={17} color={c.slate500} />
      </Pressable>
      <View style={styles.rowActions}>
        <RowAction icon="create-outline" label="Edit" onPress={onEdit} />
        <RowAction icon={resource.archived ? "arrow-undo-outline" : "archive-outline"} label={resource.archived ? "Restore" : "Archive"} onPress={onArchive} />
        <RowAction icon="trash-outline" label="Delete" destructive onPress={onDelete} />
      </View>
    </View>
  );
}

function RowAction({ icon, label, destructive, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; destructive?: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}>
      <Ionicons name={icon} size={15} color={destructive ? c.red : c.slate600} />
      <Text style={[styles.rowActionText, destructive && { color: c.red }]}>{label}</Text>
    </Pressable>
  );
}

function ResourceEditor({
  visible,
  resource,
  onClose,
  onSaved,
}: {
  visible: boolean;
  resource: LearningResource | null;
  onClose: () => void;
  onSaved: (resource: LearningResource) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [mode, setMode] = useState<EditorMode>("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [folder, setFolder] = useState("My library");
  const [url, setUrl] = useState("");
  const [asset, setAsset] = useState<LearningUploadAsset | null>(null);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const nextMode: EditorMode = resource?.storagePath ? "file" : resource?.url ? "link" : "note";
    setMode(nextMode);
    setTitle(resource?.title || "");
    setDescription(resource?.description || "");
    setCategory(resource?.category || "General");
    setFolder(resource?.folder || "My library");
    setUrl(resource?.url || "");
    setAsset(null);
    setPinned(resource?.pinned || false);
  }, [resource, visible]);

  async function chooseFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*", "video/*", "audio/*", "text/*", "application/msword", "application/vnd.openxmlformats-officedocument.*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const picked = result.assets[0];
    setAsset({ uri: picked.uri, name: picked.name, mimeType: picked.mimeType, size: picked.size });
    if (!title.trim()) setTitle(picked.name.replace(/\.[^.]+$/, ""));
  }

  async function save() {
    if (!user?.uid || saving) return;
    if (!title.trim()) {
      Alert.alert("Add a title", "Use a clear name students will recognise.");
      return;
    }
    if (mode === "file" && !resource?.storagePath && !asset) {
      Alert.alert("Choose a file", "Select the PDF, image, video, audio or document to upload.");
      return;
    }
    if (mode === "link" && !/^https?:\/\//i.test(url.trim())) {
      Alert.alert("Add a valid link", "Links must start with https:// or http://.");
      return;
    }
    setSaving(true);
    try {
      const type = mode === "note" ? "note" : mode === "link" ? linkType(url) : fileType(asset?.mimeType, asset?.name || resource?.fileName);
      const draft = {
        title,
        description,
        category,
        folder,
        url: mode === "link" ? url : "",
        pinned,
        type,
      };
      const saved = resource
        ? await updateLearningResource(resource, draft, asset || undefined)
        : await createLearningResource(user.uid, draft, asset || undefined);
      onSaved(saved);
    } catch (error) {
      Alert.alert("Resource was not saved", friendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.editorSafe}>
        <View style={styles.editorHeader}>
          <Pressable onPress={onClose} style={styles.editorHeaderButton}><Text style={styles.editorCancel}>Cancel</Text></Pressable>
          <Text style={styles.editorTitle}>{resource ? "Edit resource" : "New resource"}</Text>
          <Pressable onPress={() => void save()} disabled={saving} style={styles.editorHeaderButton}>
            <Text style={styles.editorSave}>{saving ? "Saving" : "Save"}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modeRow}>
            {(["file", "link", "note"] as EditorMode[]).map((item) => (
              <Pressable key={item} onPress={() => setMode(item)} style={[styles.mode, mode === item && styles.modeActive]}>
                <Ionicons name={item === "file" ? "document-outline" : item === "link" ? "link-outline" : "create-outline"} size={17} color={mode === item ? c.onInverted : c.slate600} />
                <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="TITLE" value={title} onChangeText={setTitle} placeholder="Roundabouts practice guide" />
          <Field label={mode === "note" ? "NOTE" : "DESCRIPTION"} value={description} onChangeText={setDescription} placeholder="What this resource helps with" multiline />
          {mode === "link" ? <Field label="LINK" value={url} onChangeText={setUrl} placeholder="https://..." autoCapitalize="none" keyboardType="url" /> : null}
          {mode === "file" ? (
            <Pressable onPress={() => void chooseFile()} style={styles.filePicker}>
              <Ionicons name="cloud-upload-outline" size={22} color={c.slate900} />
              <View style={styles.filePickerCopy}>
                <Text style={styles.filePickerTitle}>{asset?.name || resource?.fileName || "Choose a file"}</Text>
                <Text style={styles.filePickerMeta}>{asset ? "Ready to upload" : resource?.fileName ? "Tap to replace" : "PDF, image, video, audio or document · max 25 MB"}</Text>
              </View>
            </Pressable>
          ) : null}
          <View style={styles.twoFields}>
            <View style={styles.halfField}><Field label="CATEGORY" value={category} onChangeText={setCategory} placeholder="Road skills" /></View>
            <View style={styles.halfField}><Field label="FOLDER" value={folder} onChangeText={setFolder} placeholder="Lesson plans" /></View>
          </View>
          <Pressable onPress={() => setPinned((value) => !value)} style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Pin in library</Text>
              <Text style={styles.toggleMeta}>Keep this resource at the top.</Text>
            </View>
            <Ionicons name={pinned ? "checkbox" : "square-outline"} size={24} color={pinned ? c.emerald : c.slate500} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, multiline, ...inputProps } = props;
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={c.slate500}
        style={[styles.input, multiline && styles.inputMultiline]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function resourceIcon(type: LearningResourceType): React.ComponentProps<typeof Ionicons>["name"] {
  if (type === "youtube" || type === "video") return "play-circle-outline";
  if (type === "audio") return "headset-outline";
  if (type === "image") return "image-outline";
  if (type === "link") return "link-outline";
  if (type === "note") return "create-outline";
  if (type === "mock_test") return "help-circle-outline";
  if (type === "checklist") return "checkbox-outline";
  return "document-text-outline";
}

function linkType(url: string): LearningResourceType {
  return /(?:youtube\.com|youtu\.be)/i.test(url) ? "youtube" : "link";
}

function fileType(mimeType?: string | null, fileName?: string): LearningResourceType {
  const mime = mimeType || "";
  if (mime === "application/pdf" || /\.pdf$/i.test(fileName || "")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) return "Your session cannot access this library. Sign out and back in.";
  return message || "Check your connection and try again.";
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.lg },
  headerCopy: { flex: 1 },
  kicker: { color: c.slate500, fontSize: 11, fontWeight: "700" },
  title: { color: c.slate900, fontSize: 30, lineHeight: 36, fontWeight: "700", marginTop: 3 },
  subtitle: { color: c.slate500, fontSize: 13, lineHeight: 18, marginTop: 4 },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.slate900, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.65 },
  search: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: c.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  searchInput: { flex: 1, color: c.slate900, fontSize: 15, paddingVertical: 0 },
  segment: { flexDirection: "row", padding: 3, borderRadius: 12, backgroundColor: c.surfaceMuted, marginVertical: spacing.md },
  segmentItem: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  segmentItemActive: { backgroundColor: c.slate900 },
  segmentText: { color: c.slate500, fontSize: 13, fontWeight: "600" },
  segmentTextActive: { color: c.onInverted },
  loading: { minHeight: 260, justifyContent: "center" },
  list: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  resourceRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, paddingVertical: spacing.sm },
  resourceMain: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: spacing.md },
  resourceIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.surfaceMuted, alignItems: "center", justifyContent: "center" },
  resourceCopy: { flex: 1, minWidth: 0 },
  resourceTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  resourceTitle: { flexShrink: 1, color: c.slate900, fontSize: 15, fontWeight: "600" },
  resourceMeta: { color: c.slate500, fontSize: 12, marginTop: 4 },
  rowActions: { flexDirection: "row", gap: spacing.xs, paddingLeft: 52, paddingBottom: 4 },
  rowAction: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 30, paddingHorizontal: 8 },
  rowActionText: { color: c.slate600, fontSize: 11, fontWeight: "600" },
  editorSafe: { flex: 1, backgroundColor: c.background },
  editorHeader: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  editorHeaderButton: { minWidth: 64, minHeight: 40, justifyContent: "center" },
  editorCancel: { color: c.slate600, fontSize: 15 },
  editorSave: { color: c.emerald, fontSize: 15, fontWeight: "700", textAlign: "right" },
  editorTitle: { color: c.slate900, fontSize: 16, fontWeight: "700" },
  editorContent: { padding: spacing.lg, paddingBottom: 48, gap: spacing.md },
  modeRow: { flexDirection: "row", gap: spacing.sm },
  mode: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface },
  modeActive: { backgroundColor: c.slate900, borderColor: c.slate900 },
  modeText: { color: c.slate600, fontSize: 13, fontWeight: "600" },
  modeTextActive: { color: c.onInverted },
  field: { gap: 7 },
  fieldLabel: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  input: { minHeight: 48, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, color: c.slate900, fontSize: 15 },
  inputMultiline: { minHeight: 100, paddingTop: spacing.md },
  filePicker: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: c.borderStrong, backgroundColor: c.surface },
  filePickerCopy: { flex: 1 },
  filePickerTitle: { color: c.slate900, fontSize: 14, fontWeight: "600" },
  filePickerMeta: { color: c.slate500, fontSize: 11, lineHeight: 16, marginTop: 3 },
  twoFields: { flexDirection: "row", gap: spacing.sm },
  halfField: { flex: 1 },
  toggleRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderRadius: 10, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  toggleTitle: { color: c.slate900, fontSize: 14, fontWeight: "600" },
  toggleMeta: { color: c.slate500, fontSize: 11, marginTop: 3 },
});

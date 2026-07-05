import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getTips, addTip, updateTip, deleteTip } from "../../services/dataService";
import type { Tip, TipType } from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

// ─── YouTube helpers ──────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:.*[?&]v=|.*\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function youtubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

// ─── Type config ─────────────────────────────────────────────────────────────

const TIP_TYPES: { value: TipType; label: string; icon: string }[] = [
  { value: "video", label: "YouTube", icon: "logo-youtube" },
  { value: "pdf",   label: "PDF / Link", icon: "document-outline" },
  { value: "note",  label: "Note", icon: "create-outline" },
];

const EMPTY_DRAFT = {
  title: "",
  description: "",
  type: "video" as TipType,
  videoUrl: "",
  pdfUrl: "",
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export function TipsScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();

  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tip | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setTips(await getTips(user.uid));
    } catch {
      setError("Couldn't load tips. Pull down to retry.");
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

  const openAdd = useCallback(() => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((tip: Tip) => {
    setEditing(tip);
    setDraft({
      title: tip.title,
      description: tip.description ?? "",
      type: tip.type,
      videoUrl: tip.videoUrl ?? "",
      pdfUrl: tip.pdfUrl ?? "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
  }, [saving]);

  const save = useCallback(async () => {
    if (!user?.uid || !draft.title.trim()) {
      Alert.alert("Title required", "Add a title before saving.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: draft.title,
        description: draft.description || undefined,
        type: draft.type,
        videoUrl: draft.type === "video" ? draft.videoUrl : undefined,
        pdfUrl: draft.type === "pdf" ? draft.pdfUrl : undefined,
      };
      if (editing) {
        await updateTip(editing.id, payload);
        setTips((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...payload } : t));
      } else {
        const id = await addTip(user.uid, payload);
        const newTip: Tip = { id, instructorId: user.uid, ...payload, timestamp: Date.now() };
        setTips((prev) => [newTip, ...prev]);
      }
      setModalOpen(false);
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [user?.uid, draft, editing]);

  const confirmDelete = useCallback((tip: Tip) => {
    Alert.alert(
      "Delete tip?",
      `"${tip.title}" will be removed for all your students.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTip(tip.id);
              setTips((prev) => prev.filter((t) => t.id !== tip.id));
            } catch {
              Alert.alert("Couldn't delete", "Check your connection and try again.");
            }
          },
        },
      ],
    );
  }, []);

  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
        }
      >
        <Text style={styles.kicker}>Library</Text>
        <Text style={styles.title}>Tips & resources</Text>
        <Text style={styles.copy}>
          Add YouTube videos and PDF links for your students. They appear in the student app immediately.
        </Text>

        {error ? (
          <View style={styles.notice}>
            <Ionicons name="warning-outline" size={18} color={c.red} />
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={c.emerald} />
          </View>
        ) : tips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="library-outline" size={32} color={c.slate300} />
            <Text style={styles.emptyTitle}>No tips yet</Text>
            <Text style={styles.emptyBody}>
              Tap below to add your first YouTube video or PDF link.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {tips.map((tip, idx) => (
              <TipCard
                key={tip.id}
                tip={tip}
                showDivider={idx < tips.length - 1}
                onEdit={() => openEdit(tip)}
                onDelete={() => confirmDelete(tip)}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={c.white} />
          <Text style={styles.addButtonText}>Add tip or resource</Text>
        </Pressable>
      </Screen>

      <TipModal
        visible={modalOpen}
        editing={editing}
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        onClose={closeModal}
        onSave={save}
      />
    </>
  );
}

// ─── Tip card ─────────────────────────────────────────────────────────────────

function TipCard({
  tip,
  showDivider,
  onEdit,
  onDelete,
}: {
  tip: Tip;
  showDivider: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const thumb = tip.type === "video" && tip.videoUrl ? youtubeThumbnail(tip.videoUrl) : null;

  return (
    <View style={[styles.tipCard, showDivider && styles.tipDivider]}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: typeColor(tip.type, c).soft }]}>
          <Ionicons
            name={tip.type === "pdf" ? "document-outline" : "create-outline"}
            size={22}
            color={typeColor(tip.type, c).accent}
          />
        </View>
      )}
      <View style={styles.tipBody}>
        <View style={styles.tipTop}>
          <TypeBadge type={tip.type} />
        </View>
        <Text style={styles.tipTitle} numberOfLines={2}>{tip.title}</Text>
        {tip.description ? (
          <Text style={styles.tipDesc} numberOfLines={2}>{tip.description}</Text>
        ) : null}
        <View style={styles.tipActions}>
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.tipBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={15} color={c.emeraldDark} />
            <Text style={[styles.tipBtnText, { color: c.emeraldDark }]}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.tipBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={15} color={c.red} />
            <Text style={[styles.tipBtnText, { color: c.red }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TypeBadge({ type }: { type: TipType }) {
  const c = useColors();
  const conf = TIP_TYPES.find((t) => t.value === type) ?? TIP_TYPES[2];
  const col = typeColor(type, c);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: col.soft, alignSelf: "flex-start" }}>
      <Ionicons name={conf.icon as any} size={12} color={col.accent} />
      <Text style={{ color: col.accent, fontSize: 11, lineHeight: 14, fontWeight: "700" }}>{conf.label}</Text>
    </View>
  );
}

function typeColor(type: TipType, c: ColorPalette) {
  if (type === "video") return { soft: c.redSoft, accent: c.red };
  if (type === "pdf")   return { soft: c.blueSoft, accent: c.blue };
  return { soft: c.emeraldSoft, accent: c.emeraldDark };
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

type Draft = typeof EMPTY_DRAFT;

function TipModal({
  visible,
  editing,
  draft,
  setDraft,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: Tip | null;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: c.background }]} edges={["top", "left", "right"]}>
        <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
          <Pressable onPress={onClose} disabled={saving} style={({ pressed }) => [styles.modalHeaderBtn, pressed && { opacity: 0.6 }]} hitSlop={8}>
            <Text style={[styles.modalCancel, { color: c.slate500 }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: c.slate900 }]}>
            {editing ? "Edit tip" : "New tip"}
          </Text>
          <Pressable onPress={onSave} disabled={saving} style={({ pressed }) => [styles.modalHeaderBtn, pressed && { opacity: 0.6 }]} hitSlop={8}>
            {saving
              ? <ActivityIndicator size="small" color={c.emerald} />
              : <Text style={[styles.modalSave, { color: c.emerald }]}>Save</Text>
            }
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Type selector */}
            <Text style={[styles.sectionLabel, { color: c.slate500 }]}>TYPE</Text>
            <View style={[styles.typeRow, { backgroundColor: c.surface }]}>
              {TIP_TYPES.map((t) => {
                const active = draft.type === t.value;
                const col = typeColor(t.value, c);
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setDraft((d) => ({ ...d, type: t.value }))}
                    style={({ pressed }) => [
                      styles.typeChip,
                      active && { backgroundColor: col.soft },
                      pressed && !active && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name={t.icon as any} size={16} color={active ? col.accent : c.slate500} />
                    <Text style={[styles.typeChipText, { color: active ? col.accent : c.slate500 }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Title */}
            <Text style={[styles.sectionLabel, { color: c.slate500 }]}>DETAILS</Text>
            <View style={[styles.formCard, { backgroundColor: c.surface }]}>
              <ModalField
                label="Title"
                placeholder="e.g. Roundabouts explained"
                value={draft.title}
                onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
              />
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <ModalField
                label="Description (optional)"
                placeholder="What will students learn?"
                value={draft.description}
                onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))}
                multiline
              />
            </View>

            {/* URL */}
            {draft.type === "video" ? (
              <>
                <Text style={[styles.sectionLabel, { color: c.slate500 }]}>YOUTUBE LINK</Text>
                <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                  <ModalField
                    label="YouTube URL"
                    placeholder="https://youtube.com/watch?v=..."
                    value={draft.videoUrl}
                    onChangeText={(v) => setDraft((d) => ({ ...d, videoUrl: v }))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {draft.videoUrl && extractYouTubeId(draft.videoUrl) ? (
                    <View style={styles.thumbPreviewWrap}>
                      <Image
                        source={{ uri: youtubeThumbnail(draft.videoUrl)! }}
                        style={styles.thumbPreview}
                        resizeMode="cover"
                      />
                      <Text style={[styles.thumbHint, { color: c.slate500 }]}>Preview looks good</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : draft.type === "pdf" ? (
              <>
                <Text style={[styles.sectionLabel, { color: c.slate500 }]}>RESOURCE LINK</Text>
                <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                  <ModalField
                    label="URL"
                    placeholder="Google Drive, Dropbox, PDF link…"
                    value={draft.pdfUrl}
                    onChangeText={(v) => setDraft((d) => ({ ...d, pdfUrl: v }))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            ) : null}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function ModalField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  autoCapitalize,
  autoCorrect,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.slate300}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? (multiline ? "sentences" : "words")}
        autoCorrect={autoCorrect ?? !!multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: { flex: 1 },
  kicker: {
    color: c.emerald,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  copy: {
    ...typography.subhead,
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  notice: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: c.redSoft,
  },
  noticeText: {
    flex: 1,
    color: c.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyCard: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surface,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headline,
    color: c.slate900,
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...typography.subhead,
    color: c.slate500,
    textAlign: "center",
  },

  // ── Tip list ──
  list: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
    marginBottom: spacing.md,
  },
  tipCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  tipDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  thumb: {
    width: 80,
    height: 58,
    borderRadius: 10,
    flexShrink: 0,
    backgroundColor: c.slate100,
  },
  thumbPlaceholder: {
    width: 80,
    height: 58,
    borderRadius: 10,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBody: {
    flex: 1,
    gap: 4,
  },
  tipTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipTitle: {
    color: c.slate900,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  tipDesc: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  tipActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 4,
  },
  tipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tipBtnText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  // ── Add button ──
  addButton: {
    minHeight: 54,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: c.emeraldDark,
  },
  addButtonText: {
    color: c.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  // ── Modal ──
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderBtn: { minWidth: 60 },
  modalTitle: { ...typography.headline },
  modalCancel: { fontSize: 16, lineHeight: 22, fontWeight: "400" },
  modalSave: { fontSize: 16, lineHeight: 22, fontWeight: "700", textAlign: "right" },

  // ── Form ──
  formScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  formCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md,
  },
  typeRow: {
    borderRadius: 18,
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  typeChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  field: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  fieldLabel: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  fieldInput: {
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    paddingTop: 2,
    paddingBottom: 2,
  },
  fieldInputMulti: {
    minHeight: 72,
    textAlignVertical: "top",
    lineHeight: 21,
  },
  thumbPreviewWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  thumbPreview: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: c.slate100,
  },
  thumbHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
});

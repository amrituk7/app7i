import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getStudentByUid, getTips } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import type { Tip, TipType } from "../../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:.*[?&]v=|.*\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function youtubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function typeColor(type: TipType, c: ColorPalette) {
  if (type === "video") return { soft: c.redSoft, accent: c.red };
  if (type === "pdf")   return { soft: c.blueSoft, accent: c.blue };
  return { soft: c.emeraldSoft, accent: c.emeraldDark };
}

function openUrl(url: string) {
  Linking.openURL(url).catch(() =>
    Alert.alert("Couldn't open link", "Check your connection and try again."),
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function StudentTipsScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();

  const [tips, setTips] = useState<Tip[]>([]);
  const [linked, setLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const studentDoc = await getStudentByUid(user.uid);
      if (!studentDoc?.instructorId) {
        setLinked(false);
        setTips([]);
        return;
      }
      setLinked(true);
      setTips(await getTips(studentDoc.instructorId));
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

  const videos = tips.filter((t) => t.type === "video");
  const pdfs   = tips.filter((t) => t.type === "pdf");
  const notes  = tips.filter((t) => t.type === "note");

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <Text style={styles.kicker}>From your instructor</Text>
      <Text style={styles.title}>Tips & resources</Text>
      <Text style={styles.copy}>
        Videos, PDFs, and notes shared by your instructor to help you improve.
      </Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.emerald} />
        </View>
      ) : error ? (
        <View style={styles.notice}>
          <Ionicons name="warning-outline" size={18} color={c.red} />
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : !linked ? (
        <View style={styles.emptyCard}>
          <Ionicons name="link-outline" size={32} color={c.slate300} />
          <Text style={styles.emptyTitle}>Not linked yet</Text>
          <Text style={styles.emptyBody}>
            Your account isn't linked to an instructor yet. Ask your instructor to connect you.
          </Text>
        </View>
      ) : tips.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="library-outline" size={32} color={c.slate300} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyBody}>
            Your instructor hasn't added any tips or resources yet. Check back after your next lesson.
          </Text>
        </View>
      ) : (
        <>
          {videos.length > 0 ? (
            <>
              <SectionHeader icon="logo-youtube" label="Videos" color={c.red} />
              <View style={styles.sectionList}>
                {videos.map((tip, idx) => (
                  <VideoCard key={tip.id} tip={tip} showDivider={idx < videos.length - 1} />
                ))}
              </View>
            </>
          ) : null}

          {pdfs.length > 0 ? (
            <>
              <SectionHeader icon="document-outline" label="PDFs & links" color={c.blue} />
              <View style={styles.sectionList}>
                {pdfs.map((tip, idx) => (
                  <PdfCard key={tip.id} tip={tip} showDivider={idx < pdfs.length - 1} />
                ))}
              </View>
            </>
          ) : null}

          {notes.length > 0 ? (
            <>
              <SectionHeader icon="create-outline" label="Notes" color={c.emeraldDark} />
              <View style={styles.sectionList}>
                {notes.map((tip, idx) => (
                  <NoteCard key={tip.id} tip={tip} showDivider={idx < notes.length - 1} />
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color }: { icon: string; label: string; color: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ tip, showDivider }: { tip: Tip; showDivider: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const thumb = tip.videoUrl ? youtubeThumbnail(tip.videoUrl) : null;

  return (
    <Pressable
      onPress={() => tip.videoUrl && openUrl(tip.videoUrl)}
      style={({ pressed }) => [
        styles.videoCard,
        showDivider && styles.tipDivider,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.videoThumbWrap}>
        {thumb ? (
          <>
            <Image source={{ uri: thumb }} style={styles.videoThumb} resizeMode="cover" />
            <View style={styles.playOverlay}>
              <Ionicons name="play" size={22} color={c.white} />
            </View>
          </>
        ) : (
          <View style={[styles.videoThumb, { alignItems: "center", justifyContent: "center", backgroundColor: c.redSoft }]}>
            <Ionicons name="logo-youtube" size={28} color={c.red} />
          </View>
        )}
      </View>
      <View style={styles.videoBody}>
        <Text style={styles.tipTitle} numberOfLines={2}>{tip.title}</Text>
        {tip.description ? (
          <Text style={styles.tipDesc} numberOfLines={2}>{tip.description}</Text>
        ) : null}
        <Text style={[styles.openHint, { color: c.red }]}>Tap to watch</Text>
      </View>
    </Pressable>
  );
}

// ─── PDF / link card ──────────────────────────────────────────────────────────

function PdfCard({ tip, showDivider }: { tip: Tip; showDivider: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();

  return (
    <View style={[styles.pdfCard, showDivider && styles.tipDivider]}>
      <View style={[styles.pdfIcon, { backgroundColor: c.blueSoft }]}>
        <Ionicons name="document-outline" size={20} color={c.blue} />
      </View>
      <View style={styles.videoBody}>
        <Text style={styles.tipTitle} numberOfLines={2}>{tip.title}</Text>
        {tip.description ? (
          <Text style={styles.tipDesc} numberOfLines={2}>{tip.description}</Text>
        ) : null}
      </View>
      {tip.pdfUrl ? (
        <Pressable
          onPress={() => tip.pdfUrl && openUrl(tip.pdfUrl)}
          style={({ pressed }) => [styles.openButton, { backgroundColor: c.blueSoft }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.openButtonText, { color: c.blue }]}>Open</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────

function NoteCard({ tip, showDivider }: { tip: Tip; showDivider: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();

  return (
    <View style={[styles.noteCard, showDivider && styles.tipDivider]}>
      <View style={styles.noteTop}>
        <View style={[styles.noteIcon, { backgroundColor: c.emeraldSoft }]}>
          <Ionicons name="create-outline" size={18} color={c.emeraldDark} />
        </View>
        <Text style={styles.tipTitle}>{tip.title}</Text>
      </View>
      {tip.description ? (
        <Text style={[styles.noteBody, { color: c.slate500 }]}>{tip.description}</Text>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: ColorPalette) => StyleSheet.create({
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
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
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
  emptyCard: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surface,
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

  // ── Sections ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionList: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: c.surface,
    marginBottom: spacing.sm,
  },

  // ── Shared ──
  tipDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
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
    marginTop: 2,
  },

  // ── Video ──
  videoCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    alignItems: "flex-start",
  },
  videoThumbWrap: {
    flexShrink: 0,
    borderRadius: 10,
    overflow: "hidden",
  },
  videoThumb: {
    width: 90,
    height: 60,
    borderRadius: 10,
    backgroundColor: c.slate100,
  },
  playOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  videoBody: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  openHint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 4,
  },

  // ── PDF ──
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  pdfIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  openButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  openButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },

  // ── Note ──
  noteCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  noteTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    paddingLeft: 36 + spacing.md,
  },
});

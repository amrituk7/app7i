import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getStudentByUid, getStudentLessons } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Lesson } from "../../types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type LessonNote = {
  id: string;
  date: string;
  time: string;
  studentName: string;
  note: string;
};

export function StudentNotesScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const studentDoc = await getStudentByUid(user.uid);
      if (!studentDoc) {
        setLinked(false);
        setNotes([]);
        return;
      }
      setLinked(true);

      const lessons = await getStudentLessons(studentDoc.id, 30);
      setNotes(lessons.map(toLessonNote).filter((note): note is LessonNote => Boolean(note)).slice(0, 12));
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading notes. Pull down to retry."));
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

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Lessons</Text>
        <Text style={styles.title}>Notes</Text>
      </View>

      {error ? <NativeNotice icon="warning-outline" message={error} /> : null}

      {notes.length === 0 ? (
        linked ? (
          <View style={styles.suggestedCard}>
            <View style={styles.suggestedHeader}>
              <Ionicons name="bulb-outline" size={18} color={c.emeraldDark} />
              <Text style={styles.suggestedTitle}>Suggested by App7i</Text>
            </View>
            <Text style={styles.suggestedBody}>
              Your instructor hasn't added notes yet. Until they do, here are the
              things most learners find useful to practise after early lessons:
            </Text>
            <View style={styles.suggestedBullets}>
              <Text style={styles.suggestedBullet}>• Cockpit drill — the 5-step routine before moving off</Text>
              <Text style={styles.suggestedBullet}>• Mirror, signal, manoeuvre — say it aloud as you do it</Text>
              <Text style={styles.suggestedBullet}>• Clutch control — find the bite point on flat ground</Text>
              <Text style={styles.suggestedBullet}>• Read 5 pages of the Highway Code each evening</Text>
            </View>
          </View>
        ) : (
          <EmptyState
            iconName="link-outline"
            title="You're nearly connected"
            message={`Ask your instructor to add you with ${user?.email || "this email"}. Notes appear after linking.`}
          />
        )
      ) : (
        <View style={styles.noteList}>
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function toLessonNote(lesson: Lesson): LessonNote | null {
  const note = lesson.notes?.trim();
  if (!note) return null;
  return {
    id: lesson.id,
    date: lesson.date || "Date TBC",
    time: lesson.time || "Time TBC",
    studentName: lesson.studentName,
    note,
  };
}

function NoteRow({ note }: { note: LessonNote }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.noteRow}>
      <View style={styles.noteHeader}>
        <View style={styles.dateIcon}>
          <Ionicons name="calendar-outline" size={16} color={c.emeraldDark} />
        </View>
        <View style={styles.noteHeaderCopy}>
          <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
          <Text style={styles.noteTime}>{note.time}</Text>
        </View>
      </View>
      <Text style={styles.noteText}>{note.note}</Text>
    </View>
  );
}

function NativeNotice({ icon, message }: { icon: IoniconName; message: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={18} color={c.red} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  header: {
    marginBottom: spacing.lg,
  },
  kicker: {
    color: c.emerald,
    fontSize: 12,
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
  noteList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  noteRow: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dateIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  noteHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  noteDate: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
  },
  noteTime: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
  },
  noteText: {
    color: c.slate700,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
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
    fontWeight: "700",
  },
  suggestedCard: {
    backgroundColor: c.emeraldSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  suggestedHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  suggestedTitle: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  suggestedBody: {
    color: c.slate700,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  suggestedBullets: { gap: 6 },
  suggestedBullet: { color: c.slate700, fontSize: 13, lineHeight: 19 },
});

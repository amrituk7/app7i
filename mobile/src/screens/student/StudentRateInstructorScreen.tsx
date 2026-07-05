import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getStudentByUid, getStudentLessons } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Lesson } from "../../types";

type Nav = { navigate: (screen: string, params?: Record<string, unknown>) => void };

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isPastLesson(lesson: Lesson) {
  return lesson.date && lesson.date < todayKey();
}

export function StudentRateInstructorScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [linked, setLinked] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const studentDoc = await getStudentByUid(user.uid);
      if (!studentDoc) {
        setLinked(false);
        setLessons([]);
        return;
      }
      setLinked(true);
      setLessons(await getStudentLessons(studentDoc.id, 50));
    } catch (err) {
      console.error("[RateInstructor] load failed", err);
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

  const past = useMemo(() => lessons.filter(isPastLesson), [lessons]);

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
      <Text style={styles.kicker}>Anonymous</Text>
      <Text style={styles.title}>Rate your instructor</Text>
      <Text style={styles.copy}>
        Pick a past lesson to leave private feedback. Your instructor only ever sees a
        grouped summary after enough students have responded.
      </Text>

      <View style={styles.privacyBanner}>
        <Ionicons name="shield-checkmark-outline" size={16} color={c.emeraldDark} />
        <Text style={styles.privacyText}>
          Your name is never attached to feedback.
        </Text>
      </View>

      {!linked ? (
        <EmptyState
          iconName="link-outline"
          title="You're nearly connected"
          message={`Ask your instructor to add you with ${user?.email || "this email"}. Lessons appear here after linking.`}
        />
      ) : past.length === 0 ? (
        <EmptyState
          iconName="time-outline"
          title="No past lessons yet"
          message="Once your first lesson is done, you can leave anonymous feedback here."
        />
      ) : (
        <View style={styles.list}>
          {past.map((lesson) => (
            <Pressable
              key={lesson.id}
              onPress={() => navigation.navigate("LessonFeedback", { lessonId: lesson.id })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`Leave anonymous feedback for ${lesson.date} lesson`}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="star-outline" size={20} color={c.emeraldDark} />
              </View>
              <View style={styles.body}>
                <Text style={styles.rowTitle}>
                  {lesson.date || "Date TBC"} · {lesson.time || "Time TBC"}
                </Text>
                <Text style={styles.rowCopy}>
                  {lesson.durationMinutes} mins · {lesson.pickup || "Pickup TBC"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.slate500} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
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
  copy: {
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.emeraldSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  privacyText: {
    flex: 1,
    color: c.emeraldDark,
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  body: { flex: 1 },
  rowTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  rowCopy: { color: c.slate500, fontSize: 12, fontWeight: "600" },
});

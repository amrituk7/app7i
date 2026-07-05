import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../components/ui/AppButton";
import { useAuth } from "../../context/AuthContext";
import {
  getLesson,
  getMyLessonFeedback,
  submitLessonFeedback,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

const WANTS_MORE_OPTIONS = [
  "More practice questions",
  "Slower explanations",
  "More homework",
  "More exam practice",
  "More recap at the end",
  "More confidence building",
  "Other",
];

type Nav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

export function LessonFeedbackScreen({
  route,
  navigation,
}: {
  route: { params?: { lessonId?: string } };
  navigation: Nav;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const lessonId = route.params?.lessonId || "";
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [rating, setRating] = useState(0);
  const [positiveText, setPositiveText] = useState("");
  const [constructiveText, setConstructiveText] = useState("");
  const [wantsMore, setWantsMore] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!lessonId || !user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const [lesson, feedback] = await Promise.all([
          getLesson(lessonId),
          getMyLessonFeedback(lessonId, user.uid),
        ]);
        if (cancelled) return;
        setInstructorId(lesson?.instructorId || null);
        if (feedback) {
          setExisting(true);
          setRating(feedback.rating || 0);
          setPositiveText(feedback.positiveText || "");
          setConstructiveText(feedback.constructiveText || "");
          setWantsMore(feedback.wantsMore || []);
        }
      } catch (err) {
        console.error("[LessonFeedbackScreen] load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, user?.uid]);

  function toggleWantsMore(option: string) {
    setWantsMore((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );
  }

  async function handleSubmit() {
    if (!user?.uid) {
      Alert.alert("Sign in required", "Please sign in to leave feedback.");
      return;
    }
    if (!instructorId) {
      Alert.alert("Lesson missing", "This lesson is missing an instructor link.");
      return;
    }
    if (!rating) {
      Alert.alert("Rating required", "Please tap a star rating before submitting.");
      return;
    }
    setSaving(true);
    try {
      await submitLessonFeedback({
        lessonId,
        studentUid: user.uid,
        instructorId,
        rating,
        positiveText,
        constructiveText,
        wantsMore,
      });
      Alert.alert(
        existing ? "Feedback updated" : "Thanks!",
        existing
          ? "Your feedback has been updated."
          : "Your anonymous feedback has been submitted.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      console.error("[LessonFeedbackScreen] submit failed", err);
      Alert.alert("Could not save", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How was today's lesson?</Text>

        <View style={styles.privacyBanner}>
          <Text style={styles.privacyText}>
            Your feedback is anonymous. Your instructor will only see a grouped summary
            after enough students have responded.
          </Text>
        </View>

        <Text style={styles.label}>How was today's lesson?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = rating >= n;
            return (
              <Pressable
                key={n}
                onPress={() => setRating(n)}
                accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: rating === n }}
                hitSlop={6}
                style={({ pressed }) => [styles.star, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.starGlyph, filled && styles.starGlyphFilled]}>
                  {filled ? "★" : "☆"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>What went well today?</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={3}
          maxLength={1000}
          value={positiveText}
          onChangeText={setPositiveText}
          placeholder="Example: The explanation was clear, the lesson was helpful, I felt more confident."
          placeholderTextColor={c.slate500}
          textAlignVertical="top"
        />

        <Text style={styles.label}>What could be improved?</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={3}
          maxLength={1000}
          value={constructiveText}
          onChangeText={setConstructiveText}
          placeholder="Example: I would like more practice questions, slower explanations, clearer homework, or more exam tips."
          placeholderTextColor={c.slate500}
          textAlignVertical="top"
        />

        <Text style={styles.label}>What would you like more of in future lessons?</Text>
        <View style={styles.chipsWrap}>
          {WANTS_MORE_OPTIONS.map((option) => {
            const selected = wantsMore.includes(option);
            return (
              <Pressable
                key={option}
                onPress={() => toggleWantsMore(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <AppButton
            label="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
            disabled={saving}
            style={styles.actionBtn}
          />
          <AppButton
            label={saving ? "Saving..." : existing ? "Update" : "Submit"}
            onPress={handleSubmit}
            disabled={saving}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: c.slate900,
    marginBottom: spacing.md,
  },
  privacyBanner: {
    backgroundColor: c.emeraldSoft,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  privacyText: {
    color: c.emeraldDark,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: c.slate900,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  star: { padding: 4 },
  starGlyph: {
    fontSize: 36,
    color: c.slate300,
  },
  starGlyphFilled: { color: c.amber },
  textarea: {
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    minHeight: 90,
    fontSize: 15,
    color: c.slate900,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  chipSelected: {
    backgroundColor: c.emerald,
    borderColor: c.emerald,
  },
  chipText: { color: c.slate900, fontSize: 13, fontWeight: "500" },
  chipTextSelected: { color: c.white },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionBtn: { flex: 1 },
});

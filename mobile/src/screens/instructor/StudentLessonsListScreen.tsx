import { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "../../components/ui/EmptyState";
import { FadeInView } from "../../components/ui/FadeInView";
import { Screen } from "../../components/ui/Screen";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { getStudentLessons } from "../../services/dataService";
import { useAuth } from "../../context/AuthContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Lesson } from "../../types";
import { formatGBP } from "../../utils/currency";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Nav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

type Route = {
  params?: {
    studentId?: string;
    studentName?: string;
  };
};

function buildPaymentTones(c: ColorPalette): Record<Lesson["paymentStatus"], { bg: string; fg: string; label: string }> {
  return {
    paid: { bg: c.greenSoft, fg: c.green, label: "Paid" },
    unpaid: { bg: c.amberSoft, fg: c.amber, label: "Unpaid" },
    pending: { bg: c.slate100, fg: c.slate500, label: "Pending" },
    waived: { bg: c.slate100, fg: c.slate500, label: "Waived" },
  };
}

function formatDate(value: string) {
  if (!value) return "TBC";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return value;
  }
}

export function StudentLessonsListScreen({
  route,
  navigation,
}: {
  route: Route;
  navigation: Nav;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const studentId = route.params?.studentId;
  const studentName = route.params?.studentName || "Student";
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setError("This student no longer exists. Tap back.");
      return;
    }
    setError(null);
    try {
      setLessons(await getStudentLessons(studentId, 100, user?.uid));
    } catch (e) {
      setError(toFriendlyError(e, "We're having trouble loading lessons. Pull down to retry."));
    }
  }, [studentId, user?.uid]);

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
        <BackHeader onBack={() => navigation.goBack()} title={studentName} />
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
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
      <BackHeader
        onBack={() => navigation.goBack()}
        title={studentName}
        rightIcon="add"
        onRight={() =>
          navigation.navigate("BookLesson", { studentId })
        }
      />

      <View style={styles.titleRow}>
        <Text style={styles.kicker}>Lessons</Text>
        <Text style={styles.title}>{lessons.length} total</Text>
      </View>

      {error ? <NativeNotice icon="warning-outline" message={error} /> : null}

      {lessons.length === 0 ? (
        <EmptyState
          iconName="car-outline"
          title="No lessons yet"
          message="Tap below to book the first one."
          actionLabel="Book lesson"
          onAction={() => navigation.navigate("BookLesson", { studentId })}
        />
      ) : (
        <View style={styles.list}>
          {lessons.map((lesson, idx) => {
            const tone = buildPaymentTones(c)[lesson.paymentStatus];
            return (
              <FadeInView key={lesson.id} delay={idx * 60}>
                <Pressable
                  onPress={() => navigation.navigate("LessonDetail", { lessonId: lesson.id })}
                  style={({ pressed }) => [
                    styles.row,
                    idx !== lessons.length - 1 && styles.rowDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.timeCol}>
                    <Text style={styles.dateText}>{formatDate(lesson.date)}</Text>
                    <Text style={styles.timeText}>
                      {lesson.time || "TBC"} · {lesson.durationMinutes}m
                    </Text>
                  </View>
                  <View style={styles.info}>
                    {!!lesson.pickup && (
                      <Text style={styles.pickup} numberOfLines={1}>
                        📍 {lesson.pickup}
                      </Text>
                    )}
                    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.pillText, { color: tone.fg }]}>
                        {formatGBP(lesson.price)} · {tone.label}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.slate300} />
                </Pressable>
              </FadeInView>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function BackHeader({
  onBack,
  title,
  rightIcon,
  onRight,
}: {
  onBack: () => void;
  title: string;
  rightIcon?: IoniconName;
  onRight?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={c.slate900} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {rightIcon && onRight ? (
        <Pressable
          onPress={onRight}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name={rightIcon} size={22} color={c.slate900} />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
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

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
  },
  titleRow: {
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
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  list: {
    backgroundColor: c.surface,
    borderRadius: 18,
    overflow: "hidden",
  },
  skeletonList: {
    backgroundColor: c.surface,
    borderRadius: 18,
    overflow: "hidden",
  },
  row: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  timeCol: {
    width: 100,
  },
  dateText: {
    color: c.slate900,
    fontSize: 14,
    fontWeight: "700",
  },
  timeText: {
    color: c.slate500,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  pickup: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

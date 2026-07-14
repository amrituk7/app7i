import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { FadeInView } from "../../components/ui/FadeInView";
import { Screen } from "../../components/ui/Screen";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { getStudents } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Student } from "../../types";
import { formatGBP } from "../../utils/currency";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type MobileNavigation = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

export function StudentsScreen({ navigation }: { navigation: MobileNavigation }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.phone, s.email, s.transmission, s.practiceFocus, s.testCentre]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [students, searchQuery]);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setStudents(await getStudents(user.uid, 100));
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading students. Pull down to retry."));
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((item) => (
            <SkeletonRow key={item} />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emeraldDark} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{students.length} learners</Text>
          <Text style={styles.title}>Students</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.countBadge}>
            <Ionicons name="people-outline" size={18} color={c.emeraldDark} />
            <Text style={styles.countText}>{students.length}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate("AddStudent")}
          >
            <Ionicons name="add" size={24} color={c.onAccent} />
            <Text style={styles.addButtonText}>Add / invite</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <NativeNotice icon="warning-outline" message={error} tone="danger" />
      ) : null}

      {students.length > 0 ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={c.slate500} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, email or focus"
            placeholderTextColor={c.slate500}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={c.slate500} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {students.length === 0 ? (
        <EmptyState
          iconName="people-outline"
          title="Ready for your first student?"
          message="Add them with the email they use to sign in. Their student app links automatically."
          actionLabel="Add a student"
          onAction={() => navigation.navigate("AddStudent")}
        />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          iconName="search-outline"
          title="No matches"
          message="Try a different name, email or focus."
        />
      ) : (
        <View style={styles.list}>
          {filteredStudents.map((student, index) => (
            <FadeInView key={student.id} delay={Math.min(index * 40, 600)}>
              <StudentRow
                student={student}
                onPress={() => navigation.navigate("StudentProfile", { studentId: student.id })}
              />
            </FadeInView>
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

function StudentRow({ student, onPress }: { student: Student; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const balanceLabel = student.outstandingBalance ? "Owed" : "Paid";
  const balanceTone = student.outstandingBalance ? styles.balanceWarning : styles.balanceOk;
  const avatar = avatarColor(student.name, c);
  const progress = Math.max(0, Math.min(100, Math.round(student.progress || 0)));
  const nextDate = student.practicalTestDate || student.nextLesson;
  const nextLabel = student.practicalTestDate ? "Test" : "Next";
  const focus = student.practiceFocus || readinessSummary(student);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: `${avatar}18` }]}>
        <Text style={[styles.avatarText, { color: avatar }]}>{student.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.rowCopy}>
        <View style={styles.nameRow}>
          <Text style={styles.rowTitle} numberOfLines={1}>{student.name}</Text>
          <View style={styles.transmissionChip}>
            <Ionicons name="car-outline" size={12} color={c.slate600} />
            <Text style={styles.transmissionText}>{student.transmission}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="trending-up-outline" size={14} color={c.slate500} />
          <Text style={styles.metaText}>{progress}% progress</Text>
          {nextDate ? (
            <>
              <Text style={styles.metaDot}>/</Text>
              <Text style={styles.metaText}>{nextLabel} {formatStudentDate(nextDate)}</Text>
            </>
          ) : null}
        </View>
        <Text style={styles.focusText} numberOfLines={1}>{focus}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.balancePill, student.outstandingBalance ? styles.balancePillWarning : styles.balancePillOk]}>
          <Text style={[styles.balance, balanceTone]}>{balanceLabel}</Text>
        </View>
        {student.outstandingBalance ? <Text style={styles.balanceAmount}>{formatGBP(student.outstandingBalance)}</Text> : null}
        <View style={[styles.linkPill, student.uid ? styles.linkPillOn : styles.linkPillOff]}>
          <Ionicons
            name={student.uid ? "checkmark-circle-outline" : "mail-outline"}
            size={12}
            color={student.uid ? c.emeraldDark : c.slate500}
          />
          <Text style={[styles.linkStatus, student.uid ? styles.linked : styles.unlinked]}>
            {student.uid ? "Linked" : "Invited"}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.slate300} />
    </Pressable>
  );
}

function avatarColor(name: string, c: ColorPalette) {
  const palette = [c.emeraldDark, c.blue, c.amber, c.slate700, c.red];
  return palette[(name.charCodeAt(0) || 0) % palette.length];
}

function readinessSummary(student: Student) {
  if (typeof student.readinessScore === "number" && student.readinessScore >= 8) {
    return "Test-ready polish and independent driving";
  }
  if (student.theoryPassed) return "Theory passed, building test readiness";
  return "Building core driving skills";
}

function formatStudentDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NativeNotice({
  icon,
  message,
  tone,
}: {
  icon: IoniconName;
  message: string;
  tone: "danger";
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={[styles.notice, tone === "danger" && styles.noticeDanger]}>
      <Ionicons name={icon} size={18} color={c.red} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  title: {
    color: c.slate900,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  countBadge: {
    minWidth: 58,
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: c.emeraldSoft,
  },
  countText: {
    color: c.emeraldDark,
    fontSize: 14,
    fontWeight: "700",
  },
  addButton: {
    minWidth: 126,
    height: 44,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: c.emerald,
  },
  addButtonText: {
    color: c.onAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: c.slate900,
    fontSize: 15,
    fontWeight: "400",
    paddingVertical: 0,
  },
  list: {
    gap: spacing.sm,
  },
  skeletonList: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  row: {
    minHeight: 106,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: 18,
    backgroundColor: c.surface,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  avatarText: {
    color: c.emeraldDark,
    fontSize: 16,
    fontWeight: "700",
  },
  rowCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowTitle: {
    flexShrink: 1,
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  transmissionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: c.surfaceMuted,
  },
  transmissionText: {
    color: c.slate600,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: c.surfaceMuted,
  },
  progressFill: {
    height: 5,
    borderRadius: 999,
    backgroundColor: c.emeraldLight,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "600",
  },
  metaDot: {
    color: c.slate300,
    fontSize: 12,
    fontWeight: "700",
  },
  focusText: {
    color: c.slate700,
    fontSize: 12,
    fontWeight: "600",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
    minWidth: 76,
  },
  balance: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  balancePill: {
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  balancePillOk: {
    backgroundColor: c.emeraldSoft,
  },
  balancePillWarning: {
    backgroundColor: c.amberSoft,
  },
  balanceAmount: {
    color: c.amber,
    fontSize: 12,
    fontWeight: "600",
  },
  balanceOk: {
    color: c.emeraldDark,
  },
  balanceWarning: {
    color: c.amber,
  },
  linkStatus: {
    fontSize: 10,
    fontWeight: "700",
  },
  linkPill: {
    minHeight: 24,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
  },
  linkPillOn: {
    backgroundColor: c.emeraldSoft,
  },
  linkPillOff: {
    backgroundColor: c.surfaceMuted,
  },
  linked: {
    color: c.emeraldDark,
  },
  unlinked: {
    color: c.slate500,
  },
  notice: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  noticeDanger: {
    backgroundColor: c.redSoft,
  },
  noticeText: {
    flex: 1,
    color: c.red,
    fontSize: 13,
    fontWeight: "700",
  },
});

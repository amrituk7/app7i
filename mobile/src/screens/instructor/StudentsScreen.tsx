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
import { colors, type ColorPalette } from "../../theme/colors";
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
      [s.name, s.phone, s.email, s.transmission]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
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
            <Ionicons name="add" size={24} color={c.white} />
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
            placeholder="Search by name, phone or email"
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
          message="Try a different name, phone or email."
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
  const avatar = avatarColor(student.name);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: `${avatar}18` }]}>
        <Text style={[styles.avatarText, { color: avatar }]}>{student.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{student.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={14} color={c.slate500} />
          <Text style={styles.metaText}>{student.phone || "No phone"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="car-outline" size={14} color={c.slate500} />
          <Text style={styles.metaText}>{student.transmission}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.balancePill, student.outstandingBalance ? styles.balancePillWarning : styles.balancePillOk]}>
          <Text style={[styles.balance, balanceTone]}>{balanceLabel}</Text>
        </View>
        {student.outstandingBalance ? <Text style={styles.balanceAmount}>{formatGBP(student.outstandingBalance)}</Text> : null}
        <Text style={[styles.linkStatus, student.uid ? styles.linked : styles.unlinked]}>
          {student.uid ? "Linked" : "Invite sent"}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={c.slate300} />
      </View>
    </Pressable>
  );
}

function avatarColor(name: string) {
  const palette = [colors.emeraldDark, colors.blue, colors.red, colors.amber, colors.emerald];
  return palette[(name.charCodeAt(0) || 0) % palette.length];
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
    color: c.emerald,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: c.slate900,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
    letterSpacing: -0.6,
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
    color: c.white,
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
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  skeletonList: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  row: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
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
    color: c.emerald,
    fontSize: 16,
    fontWeight: "700",
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
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
    textTransform: "capitalize",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  balance: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  balancePill: {
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  balancePillOk: {
    backgroundColor: c.greenSoft,
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
    color: c.green,
  },
  balanceWarning: {
    color: c.amber,
  },
  linkStatus: {
    fontSize: 11,
    fontWeight: "700",
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

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getStudents } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Student } from "../../types";

const AVATAR_COLORS = [
  colors.emeraldDark,
  colors.blue,
  colors.red,
  colors.amber,
  colors.emerald,
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `https://wa.me/44${digits.slice(1)}`;
  if (digits.startsWith("44")) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}`;
}

export function MessagesScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const list = await getStudents(user.uid);
      setStudents(list);
    } catch {
      setError("Couldn't load students. Pull down to retry.");
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

  const filtered = search.trim()
    ? students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search),
      )
    : students;

  const withPhone = filtered.filter((s) => s.phone?.trim());
  const withoutPhone = filtered.filter((s) => !s.phone?.trim());

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <Text style={styles.kicker}>Quick contact</Text>
      <Text style={styles.title}>WhatsApp students</Text>
      <Text style={styles.copy}>
        Tap a student to open WhatsApp. Conversations stay in WhatsApp — nothing is stored in the app.
      </Text>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={c.slate500} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search students"
          placeholderTextColor={c.slate300}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

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
      ) : students.length === 0 ? (
        <EmptyState
          iconName="people-outline"
          title="No students yet"
          message="Add a student and their phone number will appear here for quick WhatsApp access."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          iconName="search-outline"
          title="No match"
          message={`No students match "${search}".`}
        />
      ) : (
        <>
          {/* Students with phone numbers */}
          {withPhone.length > 0 ? (
            <View style={styles.list}>
              {withPhone.map((student, idx) => {
                const url = toWhatsAppUrl(student.phone);
                const isLast = idx === withPhone.length - 1 && withoutPhone.length === 0;
                return (
                  <StudentRow
                    key={student.id}
                    student={student}
                    url={url}
                    showDivider={!isLast}
                  />
                );
              })}
            </View>
          ) : null}

          {/* Students without phone — shown as a soft hint */}
          {withoutPhone.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>NO NUMBER SAVED</Text>
              <View style={styles.list}>
                {withoutPhone.map((student, idx) => (
                  <View
                    key={student.id}
                    style={[
                      styles.row,
                      idx < withoutPhone.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: avatarColor(student.name) }]}>
                      <Text style={styles.avatarText}>{initials(student.name)}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{student.name}</Text>
                      <Text style={styles.noPhone}>Add their number in the student profile</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function StudentRow({
  student,
  url,
  showDivider,
}: {
  student: Student;
  url: string;
  showDivider: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();

  const open = useCallback(() => {
    Linking.openURL(url).catch(() => {
      // WhatsApp not installed — fall back to wa.me in browser (already the URL)
    });
  }, [url]);

  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(student.name) }]}>
        <Text style={styles.avatarText}>{initials(student.name)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.phone}>{student.phone}</Text>
      </View>
      <Pressable
        onPress={open}
        style={({ pressed }) => [styles.waButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Message ${student.name} on WhatsApp`}
        hitSlop={6}
      >
        <Ionicons name="logo-whatsapp" size={20} color={c.white} />
        <Text style={styles.waLabel}>Chat</Text>
      </Pressable>
    </View>
  );
}

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

  // ── Search ──
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: c.slate900,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400",
    paddingVertical: 0,
  },

  // ── Notice ──
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

  sectionLabel: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  // ── Student list ──
  list: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 68,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: c.slate900,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  phone: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  noPhone: {
    color: c.slate300,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    fontStyle: "italic",
  },

  // ── WhatsApp button ──
  waButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  waLabel: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

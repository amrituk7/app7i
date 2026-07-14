import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { FadeInView } from "../../components/ui/FadeInView";
import { Screen } from "../../components/ui/Screen";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { SwipeableRow } from "../../components/ui/SwipeableRow";
import { useAuth } from "../../context/AuthContext";
import {
  deleteNotification,
  deleteNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../services/notificationsService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { describeFirestoreError } from "../../utils/firestoreError";
import { hapticTap } from "../../utils/haptics";
import { urlToNavigationTarget } from "../../navigation/notificationRouting";

type Nav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};
type IoniconName = ComponentProps<typeof Ionicons>["name"];

function typeIcon(type: string): IoniconName {
  if (type.startsWith("lesson_reminder")) return "alarm-outline";
  switch (type) {
    case "lesson_booked":
      return "calendar-outline";
    case "lesson_updated":
      return "create-outline";
    case "lesson_cancelled":
      return "close-circle-outline";
    case "message_received":
      return "chatbubble-ellipses-outline";
    case "lesson_payment_review":
    case "daily_payment_review":
    case "student_payment_reminder":
      return "cash-outline";
    case "lesson_feedback_prompt":
      return "star-outline";
    case "instructor_morning_summary":
      return "sunny-outline";
    case "instructor_day_complete":
      return "moon-outline";
    case "instructor_feedback_summary":
      return "sparkles-outline";
    default:
      return "notifications-outline";
  }
}

function relativeTime(timestamp: number): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationsScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setItems(await getNotifications(user.uid, 100));
    } catch (err) {
      setError(describeFirestoreError(err, { action: "getNotifications" }));
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

  const unreadCount = items.filter((n) => !n.read).length;

  async function onItemPress(item: AppNotification) {
    hapticTap();
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      try {
        await markNotificationRead(item.id);
      } catch {
        // Non-fatal; it'll show unread again on next load.
      }
    }
    const target = item.url ? urlToNavigationTarget(item.url) : null;
    if (target) {
      navigation.navigate(target.screen, target.params);
    }
  }

  async function onMarkAllRead() {
    if (!user?.uid || unreadCount === 0) return;
    hapticTap();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead(user.uid);
    } catch {
      // Non-fatal.
    }
  }

  async function onDelete(item: AppNotification) {
    hapticTap();
    // Optimistic — drop the row immediately; restore via reload on failure.
    setItems((prev) => prev.filter((n) => n.id !== item.id));
    try {
      await deleteNotification(item.id);
    } catch {
      await load();
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function onDeleteSelected() {
    if (selected.size === 0) return;
    hapticTap();
    const ids = Array.from(selected);
    setItems((prev) => prev.filter((n) => !selected.has(n.id)));
    exitSelectMode();
    try {
      await deleteNotifications(ids);
    } catch {
      await load();
    }
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={c.slate900} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      {selectMode ? (
        <View style={styles.subHeaderRow}>
          <Text style={styles.subHeaderText}>
            {selected.size > 0 ? `${selected.size} selected` : "Tap notifications to select"}
          </Text>
          <View style={styles.subHeaderActions}>
            <Pressable
              onPress={() => setSelected(new Set(items.map((n) => n.id)))}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.markAllText}>All</Text>
            </Pressable>
            <Pressable
              onPress={onDeleteSelected}
              disabled={selected.size === 0}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={[styles.deleteText, selected.size === 0 && styles.actionDisabled]}>
                Delete{selected.size > 0 ? ` (${selected.size})` : ""}
              </Text>
            </Pressable>
            <Pressable onPress={exitSelectMode} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.subHeaderRow}>
          <Text style={styles.subHeaderText}>
            {unreadCount > 0
              ? `${unreadCount} unread · swipe left to delete`
              : items.length > 0
                ? "All caught up · swipe left to delete"
                : "You're all caught up"}
          </Text>
          <View style={styles.subHeaderActions}>
            {items.length > 0 ? (
              <Pressable
                onPress={() => setSelectMode(true)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.markAllText}>Select</Text>
              </Pressable>
            ) : null}
            {unreadCount > 0 ? (
              <Pressable onPress={onMarkAllRead} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : items.length === 0 && !error ? (
        <EmptyState
          iconName="notifications-off-outline"
          title="Nothing yet"
          message="Lesson updates, reminders, messages and payment prompts will appear here."
        />
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <FadeInView key={item.id} delay={Math.min(index, 10) * 40}>
              <SwipeableRow radius={16} disabled={selectMode} onAction={() => onDelete(item)}>
                <Pressable
                  onPress={() => (selectMode ? toggleSelected(item.id) : onItemPress(item))}
                  onLongPress={() => {
                    if (!selectMode) {
                      hapticTap();
                      setSelectMode(true);
                      setSelected(new Set([item.id]));
                    }
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    !item.read && styles.rowUnread,
                    selectMode && selected.has(item.id) && styles.rowSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {selectMode ? (
                    <View style={styles.rowIcon}>
                      <Ionicons
                        name={selected.has(item.id) ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={selected.has(item.id) ? c.emerald : c.slate500}
                      />
                    </View>
                  ) : (
                    <View style={[styles.rowIcon, !item.read && styles.rowIconUnread]}>
                      <Ionicons
                        name={typeIcon(item.type)}
                        size={18}
                        color={item.read ? c.slate500 : c.emerald}
                      />
                    </View>
                  )}
                  <View style={styles.rowBody}>
                    <View style={styles.rowTitleLine}>
                      <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.rowTime}>{relativeTime(item.timestamp)}</Text>
                    </View>
                    <Text style={styles.rowMessage} numberOfLines={3}>
                      {item.message}
                    </Text>
                  </View>
                  {!selectMode && !item.read ? <View style={styles.unreadDot} /> : null}
                </Pressable>
              </SwipeableRow>
            </FadeInView>
          ))}
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
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
      color: c.slate900,
      fontSize: 16,
      fontWeight: "700",
    },
    subHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      marginBottom: spacing.md,
    },
    subHeaderText: {
      color: c.slate500,
      fontSize: 13,
      fontWeight: "500",
    },
    markAllText: {
      color: c.emerald,
      fontSize: 13,
      fontWeight: "700",
    },
    subHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    deleteText: {
      color: c.red,
      fontSize: 13,
      fontWeight: "700",
    },
    cancelText: {
      color: c.slate500,
      fontSize: 13,
      fontWeight: "700",
    },
    actionDisabled: {
      opacity: 0.4,
    },
    rowSelected: {
      borderWidth: 1,
      borderColor: c.emerald,
    },
    errorCard: {
      backgroundColor: c.redSoft,
      marginBottom: spacing.md,
    },
    errorText: {
      color: c.red,
      fontSize: 13,
      fontWeight: "600",
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    rowUnread: {
      backgroundColor: c.emeraldSoft,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
    },
    rowIconUnread: {
      backgroundColor: c.surface,
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowTitleLine: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rowTitle: {
      flex: 1,
      color: c.slate700,
      fontSize: 14,
      fontWeight: "600",
    },
    rowTitleUnread: {
      color: c.slate900,
      fontWeight: "700",
    },
    rowTime: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "500",
    },
    rowMessage: {
      color: c.slate600,
      fontSize: 13,
      lineHeight: 18,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.emerald,
      marginTop: 6,
    },
    skeletonList: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: c.surface,
    },
    pressed: {
      opacity: 0.8,
    },
  });

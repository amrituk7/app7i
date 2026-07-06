import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getUnreadNotificationCount } from "../../services/notificationsService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

// Header bell with unread badge. Self-refreshes whenever the host screen
// regains focus, so returning from the inbox clears the badge naturally.
export function NotificationBell({ onPress }: { onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user?.uid) return undefined;
      getUnreadNotificationCount(user.uid)
        .then((count) => {
          if (!cancelled) setUnread(count);
        })
        .catch(() => {
          // Badge is best-effort — never surface an error for it.
        });
      return () => {
        cancelled = true;
      };
    }, [user?.uid]),
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityLabel={
        unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
      }
    >
      <Ionicons name="notifications-outline" size={20} color={c.slate900} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.red,
    },
    badgeText: {
      color: c.white,
      fontSize: 9,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.95 }],
    },
  });

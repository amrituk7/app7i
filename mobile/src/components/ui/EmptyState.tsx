import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function EmptyState({
  title,
  message,
  description,
  iconName = "file-tray-outline",
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  description?: string;
  iconName?: IoniconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const body = message || description || "";
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={28} color={c.emeraldDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.message}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={15} color={c.emeraldDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      alignItems: "center",
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      marginBottom: spacing.sm,
    },
    title: {
      color: c.slate900,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: 0,
    },
    message: {
      color: c.slate500,
      fontSize: 15,
      lineHeight: 21,
      textAlign: "center",
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    actionText: {
      color: c.slate900,
      fontSize: 15,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.75,
    },
  });

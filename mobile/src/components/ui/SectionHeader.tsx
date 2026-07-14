import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useThemedStyles } from "../../theme/useThemedStyles";

export function SectionHeader({ title, action, actionLabel, onAction }: { title: string; action?: string; actionLabel?: string; onAction?: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onAction && actionLabel ? (
        <Pressable onPress={onAction} accessibilityRole="button"><Text style={styles.action}>{actionLabel}</Text></Pressable>
      ) : action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 0,
      paddingTop: spacing.xl,
      paddingBottom: spacing.sm,
    },
    title: {
      color: c.slate900,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0,
    },
    action: {
      color: c.slate700,
      fontSize: 15,
      fontWeight: "700",
    },
  });

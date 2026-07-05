import { StyleSheet, Text, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useThemedStyles } from "../../theme/useThemedStyles";

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    title: {
      color: c.slate500,
      fontSize: 13,
      fontWeight: "400",
      letterSpacing: 0.6,
    },
    action: {
      color: c.emerald,
      fontSize: 15,
      fontWeight: "400",
    },
  });

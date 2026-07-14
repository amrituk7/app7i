import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Card } from "./Card";
import { AnimatedNumber } from "./AnimatedNumber";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useThemedStyles } from "../../theme/useThemedStyles";

export function MetricCard({
  label,
  value,
  helper,
  prefix,
  suffix,
  compact = false,
  style,
}: {
  label: string;
  value: string | number;
  helper?: string;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Card style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={styles.accent} />
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {typeof value === "number" ? (
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} style={[styles.value, compact && styles.valueCompact]} />
      ) : (
        <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      )}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </Card>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 120,
      minHeight: 96,
      gap: 5,
      borderRadius: 18,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      overflow: "hidden",
    },
    cardCompact: {
      minWidth: 0,
      minHeight: 90,
      paddingVertical: spacing.md,
      paddingHorizontal: 10,
    },
    accent: {
      width: 28,
      height: 4,
      borderRadius: 999,
      backgroundColor: c.emeraldLight,
      marginBottom: spacing.xs,
    },
    label: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0,
    },
    value: {
      color: c.slate900,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: 0,
      lineHeight: 30,
    },
    valueCompact: {
      fontSize: 22,
      lineHeight: 26,
    },
    helper: {
      color: c.slate500,
      fontSize: 12,
      lineHeight: 16,
    },
  });

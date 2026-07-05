import { Platform, StyleSheet, Text, View } from "react-native";
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
}: {
  label: string;
  value: string | number;
  helper?: string;
  prefix?: string;
  suffix?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Card style={styles.card}>
      <View style={styles.accent} />
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {typeof value === "number" ? (
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} style={styles.value} />
      ) : (
        <Text style={styles.value}>{value}</Text>
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
      minHeight: 88,
      gap: 3,
      borderRadius: 14,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      paddingLeft: spacing.md + 8,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    accent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: c.emerald,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    label: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.6,
    },
    value: {
      color: c.slate900,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: -0.5,
      lineHeight: 30,
    },
    helper: {
      color: c.slate500,
      fontSize: 12,
      lineHeight: 16,
    },
  });

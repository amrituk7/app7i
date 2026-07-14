import { StyleSheet, Text, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type PillTone = "success" | "warning" | "danger" | "neutral" | "info";

function buildToneMap(c: ColorPalette) {
  return {
    success: { backgroundColor: c.emeraldSoft, color: c.emeraldDark },
    warning: { backgroundColor: c.amberSoft, color: c.amber },
    danger: { backgroundColor: c.redSoft, color: c.red },
    neutral: { backgroundColor: c.slate100, color: c.slate700 },
    info: { backgroundColor: c.blueSoft, color: c.blue },
  };
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: PillTone }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const toneStyle = buildToneMap(c)[tone];
  return (
    <View style={[styles.pill, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: toneStyle.color }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (_c: ColorPalette) =>
  StyleSheet.create({
    pill: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0,
    },
  });

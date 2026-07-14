import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type ListRowProps = {
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
  showChevron?: boolean;
};

export function ListRow({ title, subtitle, right, onPress, showChevron }: ListRowProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const pressable = !!onPress;
  const chevron = showChevron ?? pressable;
  return (
    <Pressable onPress={onPress} disabled={!pressable} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={styles.right}>{right}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={c.slate300} /> : null}
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    row: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    pressed: {
      backgroundColor: c.surfaceMuted,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: c.slate900,
      fontSize: 17,
      fontWeight: "600",
    },
    subtitle: {
      color: c.slate500,
      fontSize: 13,
      lineHeight: 18,
    },
    right: {
      color: c.slate500,
      fontSize: 17,
      fontWeight: "600",
    },
  });

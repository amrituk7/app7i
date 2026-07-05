import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type AppTextInputProps = TextInputProps & {
  label: string;
};

export function AppTextInput({ label, style, ...props }: AppTextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={c.slate300}
        autoCapitalize="none"
        {...props}
        style={[styles.input, style]}
      />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      gap: 6,
    },
    label: {
      color: c.slate700,
      fontSize: 15,
      fontWeight: "400",
    },
    input: {
      height: 50,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      color: c.slate900,
      fontSize: 17,
    },
  });

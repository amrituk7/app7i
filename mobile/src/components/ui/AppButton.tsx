import { Pressable, StyleSheet, type StyleProp, Text, type ViewStyle } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { useThemedStyles } from "../../theme/useThemedStyles";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, onPress, variant = "primary", disabled, style }: AppButtonProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, variant !== "primary" && styles.darkLabel, variant === "danger" && styles.dangerLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    base: {
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    primary: {
      backgroundColor: c.slate900,
    },
    secondary: {
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: c.border,
    },
    danger: {
      backgroundColor: c.redSoft,
    },
    pressed: {
      opacity: 0.75,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      color: c.onInverted,
      fontWeight: "700",
      fontSize: 17,
      letterSpacing: 0,
    },
    darkLabel: {
      color: c.slate900,
    },
    dangerLabel: {
      color: c.red,
    },
  });

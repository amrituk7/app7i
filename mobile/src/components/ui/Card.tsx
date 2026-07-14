import { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, View, type ViewStyle } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useThemedStyles } from "../../theme/useThemedStyles";

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: 16,
      padding: spacing.lg,
    },
  });

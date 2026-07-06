import { PropsWithChildren, ReactElement } from "react";
import { ScrollView, StyleSheet, View, type RefreshControlProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useThemedStyles } from "../../theme/useThemedStyles";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
}>;

export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshControl,
}: ScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const content = (
    <View style={[styles.content, padded && styles.padded]}>{children}</View>
  );

  return (
    // Bottom edge is intentionally excluded: the bottom tab bar already sizes
    // itself with insets.bottom (useTabBarStyle), so padding it here too left
    // an empty strip between the content and the top of the tab bar.
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
    },
    padded: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
  });

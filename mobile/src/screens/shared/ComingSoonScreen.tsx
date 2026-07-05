import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type RouteLike = { params?: { featureName?: string }; name?: string };
type NavLike = { goBack: () => void; canGoBack: () => boolean; navigate: (s: string) => void };

type Props = {
  route?: RouteLike;
  navigation?: NavLike;
  featureName?: string;
};

export function ComingSoonScreen({ route, navigation, featureName }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const title = featureName || route?.params?.featureName || route?.name || "This feature";

  useEffect(() => {
    console.log("[Screen] mounted", "ComingSoon", { featureName: title });
  }, [title]);

  function handleBack() {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.("Dashboard");
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={36} color={c.emerald} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.copy}>This feature is being prepared. Please check back soon.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>Go back</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
    marginBottom: spacing.sm,
  },
  title: {
    color: c.slate900,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  copy: {
    color: c.slate500,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 18,
    backgroundColor: c.emerald,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonLabel: {
    color: c.white,
    fontWeight: "600",
    fontSize: 15,
  },
});

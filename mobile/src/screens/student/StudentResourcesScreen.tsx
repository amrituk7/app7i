import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type DvlaResource = {
  title: string;
  description: string;
  url: string;
  icon: IoniconName;
};

const DVLA_RESOURCES: DvlaResource[] = [
  {
    title: "Book your driving test",
    description: "Schedule your practical driving test with DVSA.",
    url: "https://www.gov.uk/book-driving-test",
    icon: "calendar-outline",
  },
  {
    title: "Cancel or change test",
    description: "Need to reschedule? Change your test date here.",
    url: "https://www.gov.uk/change-driving-test",
    icon: "refresh-outline",
  },
  {
    title: "Highway Code",
    description: "Learn the rules of the road — essential reading.",
    url: "https://www.gov.uk/guidance/the-highway-code",
    icon: "book-outline",
  },
  {
    title: "Theory test practice",
    description: "Practice questions and hazard perception.",
    url: "https://www.gov.uk/theory-test/revision-and-practice",
    icon: "checkmark-done-outline",
  },
  {
    title: "Apply for provisional licence",
    description: "Get your provisional driving licence.",
    url: "https://www.gov.uk/apply-first-provisional-driving-licence",
    icon: "card-outline",
  },
  {
    title: "Check driving licence",
    description: "View your licence information and points.",
    url: "https://www.gov.uk/view-driving-licence",
    icon: "search-outline",
  },
];

export function StudentResourcesScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  function open(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <Screen>
      <Text style={styles.kicker}>Helpful links</Text>
      <Text style={styles.title}>DVLA resources</Text>
      <Text style={styles.copy}>
        Quick links to the official UK Government driving services.
      </Text>

      <View style={styles.list}>
        {DVLA_RESOURCES.map((resource) => (
          <Pressable
            key={resource.url}
            onPress={() => open(resource.url)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            accessibilityRole="link"
            accessibilityLabel={`${resource.title} — opens in browser`}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={resource.icon} size={20} color={c.emeraldDark} />
            </View>
            <View style={styles.body}>
              <Text style={styles.rowTitle}>{resource.title}</Text>
              <Text style={styles.rowCopy}>{resource.description}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={c.slate500} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  kicker: {
    color: c.emerald,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  copy: {
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  body: { flex: 1 },
  rowTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  rowCopy: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
});

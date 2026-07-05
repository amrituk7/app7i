import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { deleteCurrentAccount } from "../../services/accountService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors, useTheme } from "../../theme/ThemeContext";
import type { ThemeMode } from "../../theme/themePersistence";
import { useThemedStyles } from "../../theme/useThemedStyles";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Nav = { navigate: (screen: string, params?: Record<string, unknown>) => void };

type LibraryTile = {
  key: string;
  title: string;
  copy: string;
  icon: IoniconName;
  screen: string;
};

const TILES: LibraryTile[] = [
  {
    key: "tips",
    title: "Tips from instructor",
    copy: "Videos, PDFs, and notes shared by your instructor.",
    icon: "library-outline",
    screen: "StudentTips",
  },
  {
    key: "notes",
    title: "Lesson notes",
    copy: "Recap of what your instructor said after each drive.",
    icon: "document-text-outline",
    screen: "StudentNotes",
  },
  {
    key: "test",
    title: "My test",
    copy: "Theory, practical date, mock results, readiness.",
    icon: "ribbon-outline",
    screen: "StudentTestReadiness",
  },
  {
    key: "rate",
    title: "Rate your instructor",
    copy: "Send anonymous feedback your instructor never sees individually.",
    icon: "star-outline",
    screen: "StudentRateInstructor",
  },
  {
    key: "resources",
    title: "DVLA resources",
    copy: "Book or change your test, Highway Code, theory practice.",
    icon: "globe-outline",
    screen: "StudentResources",
  },
  {
    key: "important",
    title: "Important notes",
    copy: "Quick refreshers on safety, controls and positioning.",
    icon: "warning-outline",
    screen: "StudentImportantNotes",
  },
];

const APPEARANCE_OPTIONS: { value: ThemeMode; label: string; icon: IoniconName }[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

export function StudentLibraryScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { mode, setMode } = useTheme();
  const { logout } = useAuth();

  function confirmDelete() {
    Alert.alert(
      "Delete account?",
      "This permanently removes your App7i account, profile and lesson feedback. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: runDelete },
      ],
    );
  }

  async function runDelete() {
    try {
      await deleteCurrentAccount();
      Alert.alert("Account deleted", "Your account has been removed.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete did not go through.";
      if (/recent.*login|requires-recent-login/i.test(msg)) {
        Alert.alert(
          "Please sign in again",
          "For your security, sign in again then retry deleting the account.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: logout },
          ],
        );
      } else {
        Alert.alert("Delete did not go through", "Check your connection and tap again.");
      }
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>Library</Text>
      <Text style={styles.title}>Reference & feedback</Text>
      <Text style={styles.copy}>
        Notes from your instructor, anonymous feedback, and links to help you pass.
      </Text>

      <View style={styles.grid}>
        {TILES.map((tile) => (
          <Pressable
            key={tile.key}
            onPress={() => navigation.navigate(tile.screen)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={tile.title}
          >
            <View style={styles.tileIcon}>
              <Ionicons name={tile.icon} size={24} color={c.emeraldDark} />
            </View>
            <Text style={styles.tileTitle}>{tile.title}</Text>
            <Text style={styles.tileCopy}>{tile.copy}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>LEGAL</Text>
      <View style={styles.appearanceCard}>
        <Pressable
          onPress={() => navigation.navigate("PrivacyPolicy")}
          style={({ pressed }) => [
            styles.appearanceRow,
            styles.appearanceDivider,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={styles.appearanceIconWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={c.emeraldDark} />
          </View>
          <Text style={styles.appearanceLabel}>Privacy policy</Text>
          <Ionicons name="chevron-forward" size={16} color={c.slate300} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("Terms")}
          style={({ pressed }) => [styles.appearanceRow, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.appearanceIconWrap}>
            <Ionicons name="document-text-outline" size={18} color={c.emeraldDark} />
          </View>
          <Text style={styles.appearanceLabel}>Terms of service</Text>
          <Ionicons name="chevron-forward" size={16} color={c.slate300} />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>APPEARANCE</Text>
      <View style={styles.appearanceCard}>
        {APPEARANCE_OPTIONS.map((opt, idx) => {
          const selected = mode === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={({ pressed }) => [
                styles.appearanceRow,
                idx < APPEARANCE_OPTIONS.length - 1 && styles.appearanceDivider,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.appearanceIconWrap}>
                <Ionicons name={opt.icon} size={18} color={c.emeraldDark} />
              </View>
              <Text style={styles.appearanceLabel}>{opt.label}</Text>
              {selected ? (
                <Ionicons name="checkmark" size={20} color={c.emerald} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.appearanceCard}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.appearanceRow,
            styles.appearanceDivider,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <View style={styles.appearanceIconWrap}>
            <Ionicons name="log-out-outline" size={18} color={c.emeraldDark} />
          </View>
          <Text style={styles.appearanceLabel}>Log out</Text>
          <Ionicons name="chevron-forward" size={16} color={c.slate300} />
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.appearanceRow, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          <View style={[styles.appearanceIconWrap, { backgroundColor: c.redSoft }]}>
            <Ionicons name="trash-outline" size={18} color={c.red} />
          </View>
          <Text style={[styles.appearanceLabel, { color: c.red }]}>Delete account</Text>
          <Ionicons name="chevron-forward" size={16} color={c.slate300} />
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  kicker: {
    color: c.emerald,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  copy: {
    ...typography.subhead,
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: spacing.lg,
    minHeight: 160,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
    marginBottom: spacing.md,
  },
  tileTitle: {
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  tileCopy: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  sectionLabel: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  appearanceCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  appearanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 52,
  },
  appearanceDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  appearanceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  appearanceLabel: {
    flex: 1,
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
});

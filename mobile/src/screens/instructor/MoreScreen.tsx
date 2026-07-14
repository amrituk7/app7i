import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { INSTRUCTOR_MODULES, useNavigationPreferences } from "../../navigation/NavigationPreferencesContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type RootNav = { navigate: (screen: string, params?: Record<string, unknown>) => void };
type Nav = { getParent: () => RootNav | undefined };

export function MoreScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { selectedTabs } = useNavigationPreferences();
  const open = (screen: string, params?: Record<string, unknown>) => navigation.getParent()?.navigate(screen, params);
  return <Screen>
    <View style={styles.header}><Text style={styles.kicker}>APP7I</Text><Text style={styles.title}>More</Text></View>
    <Pressable onPress={() => open("GlobalSearch")} style={({ pressed }) => [styles.search, pressed && styles.pressed]}><Ionicons name="search-outline" size={20} color={c.slate900} /><View style={styles.searchCopy}><Text style={styles.searchTitle}>Search App7i</Text><Text style={styles.searchMeta}>Students, lessons, notes, payments and resources</Text></View><Ionicons name="chevron-forward" size={18} color={c.slate500} /></Pressable>

    <Text style={styles.sectionLabel}>WORKSPACE</Text>
    <View style={styles.group}>{INSTRUCTOR_MODULES.map((module) => <Pressable key={module.key} onPress={() => open(module.stackRoute)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.icon}><Ionicons name={module.icon as React.ComponentProps<typeof Ionicons>["name"]} size={19} color={c.slate900} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{module.label}</Text><Text style={styles.rowMeta}>{selectedTabs.includes(module.key) ? "Shown in tab bar" : module.description}</Text></View><Ionicons name="chevron-forward" size={17} color={c.slate500} /></Pressable>)}</View>

    <Text style={styles.sectionLabel}>ACCOUNT & APP</Text>
    <View style={styles.group}>
      <MenuRow icon="options-outline" title="Choose navigation tabs" onPress={() => open("NavigationTabs")} />
      <MenuRow icon="person-circle-outline" title="Profile" onPress={() => open("MyProfile")} />
      <MenuRow icon="settings-outline" title="Settings" onPress={() => open("Settings")} />
      <MenuRow icon="notifications-outline" title="Notifications" onPress={() => open("Notifications")} />
      <MenuRow icon="chatbubble-outline" title="Messages" onPress={() => open("InstructorMessages")} />
    </View>
  </Screen>;
}

function MenuRow({ icon, title, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; onPress: () => void }) { const styles = useThemedStyles(makeStyles); const c = useColors(); return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.icon}><Ionicons name={icon} size={19} color={c.slate900} /></View><Text style={styles.rowTitle}>{title}</Text><Ionicons name="chevron-forward" size={17} color={c.slate500} /></Pressable>; }

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { marginBottom: spacing.lg },
  kicker: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  title: { color: c.slate900, fontSize: 30, lineHeight: 36, fontWeight: "700", marginTop: 2 },
  search: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: 10, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, marginBottom: spacing.xl },
  searchCopy: { flex: 1 },
  searchTitle: { color: c.slate900, fontSize: 14, fontWeight: "700" },
  searchMeta: { color: c.slate500, fontSize: 10, marginTop: 3 },
  sectionLabel: { color: c.slate500, fontSize: 10, fontWeight: "700", marginBottom: spacing.sm, marginTop: spacing.sm },
  group: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, marginBottom: spacing.xl },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  icon: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { flex: 1, color: c.slate900, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  rowMeta: { color: c.slate500, fontSize: 11, lineHeight: 16 },
  pressed: { opacity: 0.65 },
});

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import {
  INSTRUCTOR_MODULES,
  getInstructorModule,
  useNavigationPreferences,
  type InstructorModuleKey,
} from "../../navigation/NavigationPreferencesContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Nav = { goBack: () => void };

export function NavigationTabsScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { selectedTabs, saveSelectedTabs } = useNavigationPreferences();
  const [draft, setDraft] = useState<InstructorModuleKey[]>(selectedTabs);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(selectedTabs), [selectedTabs]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  }

  async function save() {
    if (draft.length !== 3) {
      Alert.alert("Choose three tabs", "Home and More are already included.");
      return;
    }
    setSaving(true);
    try {
      await saveSelectedTabs(draft);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Tabs did not save", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.iconButton}><Ionicons name="chevron-back" size={22} color={c.slate900} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.kicker}>NAVIGATION</Text><Text style={styles.title}>Choose 3 tabs</Text></View>
        <Pressable onPress={() => void save()} disabled={saving || draft.length !== 3} style={styles.saveButton}><Text style={[styles.saveText, draft.length !== 3 && styles.disabledText]}>{saving ? "Saving" : "Save"}</Text></Pressable>
      </View>

      <View style={styles.explainer}>
        <Ionicons name="information-circle-outline" size={19} color={c.slate600} />
        <Text style={styles.explainerText}>Only 3 tabs appear in the bottom bar. Every other feature remains available from More.</Text>
      </View>

      <Text style={styles.sectionLabel}>SELECTED · TAB ORDER</Text>
      <View style={styles.group}>
        {draft.map((key, index) => {
          const module = getInstructorModule(key);
          return <View key={key} style={styles.row}>
            <View style={styles.order}><Text style={styles.orderText}>{index + 1}</Text></View>
            <Ionicons name={module.icon as React.ComponentProps<typeof Ionicons>["name"]} size={19} color={c.slate900} />
            <View style={styles.rowCopy}><Text style={styles.rowTitle}>{module.shortLabel}</Text><Text style={styles.rowMeta}>{module.description}</Text></View>
            <Pressable disabled={index === 0} onPress={() => move(index, -1)} style={styles.rowIcon}><Ionicons name="chevron-up" size={18} color={index === 0 ? c.slate300 : c.slate700} /></Pressable>
            <Pressable disabled={index === draft.length - 1} onPress={() => move(index, 1)} style={styles.rowIcon}><Ionicons name="chevron-down" size={18} color={index === draft.length - 1 ? c.slate300 : c.slate700} /></Pressable>
            <Pressable onPress={() => setDraft((current) => current.filter((item) => item !== key))} style={styles.rowIcon}><Ionicons name="remove-circle-outline" size={19} color={c.red} /></Pressable>
          </View>;
        })}
      </View>

      <Text style={styles.sectionLabel}>AVAILABLE</Text>
      {draft.length >= 3 ? <Text style={styles.availableHint}>Remove one selected tab to add another.</Text> : null}
      <View style={styles.group}>
        {INSTRUCTOR_MODULES.filter((module) => !draft.includes(module.key)).map((module) => (
          <Pressable key={module.key} disabled={draft.length >= 3} onPress={() => setDraft((current) => [...current, module.key])} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.order}><Ionicons name={module.icon as React.ComponentProps<typeof Ionicons>["name"]} size={18} color={c.slate900} /></View>
            <View style={styles.rowCopy}><Text style={styles.rowTitle}>{module.shortLabel}</Text><Text style={styles.rowMeta}>{module.description}</Text></View>
            <Ionicons name={draft.length >= 3 ? "swap-horizontal-outline" : "add-circle-outline"} size={20} color={draft.length >= 3 ? c.slate500 : c.slate900} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  iconButton: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  headerCopy: { flex: 1 },
  kicker: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  title: { color: c.slate900, fontSize: 25, lineHeight: 30, fontWeight: "700", marginTop: 2 },
  saveButton: { minWidth: 52, minHeight: 42, alignItems: "flex-end", justifyContent: "center" },
  saveText: { color: c.emerald, fontSize: 14, fontWeight: "700" },
  disabledText: { color: c.slate300 },
  explainer: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: 12, backgroundColor: c.surfaceMuted, marginBottom: spacing.lg },
  explainerText: { flex: 1, color: c.slate600, fontSize: 12, lineHeight: 18 },
  sectionLabel: { color: c.slate500, fontSize: 10, fontWeight: "700", marginBottom: spacing.sm, marginTop: spacing.sm },
  availableHint: { color: c.slate500, fontSize: 11, lineHeight: 16, marginTop: -4, marginBottom: spacing.sm },
  group: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, marginBottom: spacing.lg },
  row: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  order: { width: 30, height: 30, borderRadius: 8, backgroundColor: c.surfaceMuted, alignItems: "center", justifyContent: "center" },
  orderText: { color: c.slate700, fontSize: 12, fontWeight: "700" },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: c.slate900, fontSize: 14, fontWeight: "600" },
  rowMeta: { color: c.slate500, fontSize: 10, marginTop: 3 },
  rowIcon: { width: 30, height: 38, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.65 },
});

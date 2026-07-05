import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  PRESET_LEAD_MINUTES,
  type ReminderPrefs,
  defaultReminderPrefs,
  describeLeadMinutes,
  getReminderPrefs,
  saveReminderPrefs,
} from "../../services/reminderPrefs";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Props = { navigation: { goBack: () => void } };

export function RemindersSettingsScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ReminderPrefs>(defaultReminderPrefs());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getReminderPrefs(user.uid)
      .then((value) => {
        if (!cancelled) setPrefs(value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const summary = useMemo(() => {
    if (!prefs.enabled) return "Off";
    const labels = prefs.leadMinutes.map(describeLeadMinutes);
    return labels.length > 0 ? labels.join(" + ") : "No lead times selected";
  }, [prefs.enabled, prefs.leadMinutes]);

  function toggleLead(value: number) {
    setPrefs((prev) => {
      const isOn = prev.leadMinutes.includes(value);
      const next = isOn
        ? prev.leadMinutes.filter((entry) => entry !== value)
        : [...prev.leadMinutes, value];
      next.sort((a, b) => b - a);
      return { ...prev, leadMinutes: next };
    });
  }

  async function handleSave() {
    if (!user?.uid) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveReminderPrefs(user.uid, prefs);
      setPrefs(saved);
      setSavedAt(Date.now());
    } catch (err) {
      console.error("[RemindersSettings] save failed", err);
      const msg = err instanceof Error ? err.message : "Could not save preferences";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backRow}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color={c.slate900} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>
        <Text style={styles.kicker}>Notifications</Text>
        <Text style={styles.title}>Lesson reminders</Text>
        <Text style={styles.copy}>
          Send automated reminders to you and your student before each lesson.
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.rowSplit}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Reminders</Text>
            <Text style={styles.rowSubtitle}>{prefs.enabled ? `Sending: ${summary}` : "Off"}</Text>
          </View>
          <Switch
            value={prefs.enabled}
            onValueChange={(value) => setPrefs({ ...prefs, enabled: value })}
            trackColor={{ true: c.emerald, false: c.slate300 }}
            thumbColor={c.white}
          />
        </View>
      </Card>

      <Card style={[styles.card, !prefs.enabled && styles.cardDisabled]}>
        <Text style={styles.sectionTitle}>Send a reminder</Text>
        <View style={styles.chipRow}>
          {PRESET_LEAD_MINUTES.map((preset) => {
            const active = prefs.leadMinutes.includes(preset.value);
            return (
              <Pressable
                key={preset.value}
                disabled={!prefs.enabled}
                onPress={() => toggleLead(preset.value)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? "✓ " : ""}
                  {preset.label} before
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={[styles.card, !prefs.enabled && styles.cardDisabled]}>
        <Text style={styles.sectionTitle}>Channels</Text>

        <ChannelRow
          title="Email"
          subtitle="Always-on fallback. Sent to you and to the student's email on file."
          value={prefs.emailEnabled}
          disabled={!prefs.enabled}
          onChange={(value) => setPrefs({ ...prefs, emailEnabled: value })}
        />
        <ChannelRow
          title="In-app notifications"
          subtitle="Shows in the App7i notification centre."
          value={prefs.inAppEnabled}
          disabled={!prefs.enabled}
          onChange={(value) => setPrefs({ ...prefs, inAppEnabled: value })}
        />
        <ChannelRow
          title="Push notifications"
          subtitle="Available once mobile push is fully wired up."
          value={prefs.pushEnabled}
          disabled={!prefs.enabled}
          onChange={(value) => setPrefs({ ...prefs, pushEnabled: value })}
        />
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <AppButton label={saving ? "Saving..." : "Save reminder settings"} onPress={handleSave} disabled={saving} />
        {savedAt && !saving && !error ? (
          <Text style={styles.savedHint}>Saved.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

function ChannelRow({
  title,
  subtitle,
  value,
  disabled,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.channelRow}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: c.emerald, false: c.slate300 }}
        thumbColor={c.white}
      />
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  backText: {
    color: c.slate900,
    fontWeight: "700",
    fontSize: 14,
  },
  kicker: {
    color: c.emerald,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  copy: {
    color: c.slate500,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  sectionTitle: {
    color: c.slate900,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  rowSplit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.slate300,
  },
  chipActive: {
    backgroundColor: c.emeraldSoft,
    borderColor: c.emerald,
  },
  chipText: {
    color: c.slate700,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: c.emeraldDark,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  errorCard: {
    backgroundColor: c.redSoft,
    marginBottom: spacing.md,
  },
  errorText: {
    color: c.red,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.sm,
    alignItems: "stretch",
  },
  savedHint: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});

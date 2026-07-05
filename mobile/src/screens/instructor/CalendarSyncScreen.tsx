import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { ensureCalendarToken } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

export function CalendarSyncScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await ensureCalendarToken(false);
        if (!cancelled && result.ok && result.url) setUrl(result.url);
      } catch (err) {
        console.error("[CalendarSync] load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy() {
    if (!url) return;
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert("Copied", "Calendar URL copied to clipboard.");
    } catch {
      Alert.alert("Couldn't copy", "Long-press the URL to copy manually.");
    }
  }

  async function handleShare() {
    if (!url) return;
    try {
      await Share.share({
        message: `My App7i lesson calendar: ${url}`,
      });
    } catch {}
  }

  async function handleRotate() {
    Alert.alert(
      "Generate a new URL?",
      "Any calendar app already subscribed to the old URL will stop updating.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rotate",
          style: "destructive",
          onPress: async () => {
            setRotating(true);
            try {
              const result = await ensureCalendarToken(true);
              if (result.ok && result.url) {
                setUrl(result.url);
                Alert.alert("Done", "A new URL has been generated.");
              }
            } catch {
              Alert.alert("Error", "Could not rotate the URL. Try again.");
            } finally {
              setRotating(false);
            }
          },
        },
      ],
    );
  }

  function open(href: string) {
    Linking.openURL(href).catch(() => {});
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

  const masked = revealed ? url : url.replace(/=.+$/, "=••••••••");

  return (
    <Screen>
      <Text style={styles.kicker}>Calendar sync</Text>
      <Text style={styles.title}>Subscribe in any calendar</Text>
      <Text style={styles.copy}>
        Paste this URL into Google Calendar, Apple Calendar or Outlook so your App7i
        lessons appear alongside your other events. Updates pull automatically
        (Google ~6-12h, Apple ~24h).
      </Text>

      <Card style={styles.urlCard}>
        <Text style={styles.urlText} numberOfLines={2}>
          {masked}
        </Text>

        <View style={styles.btnRow}>
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.btnGhostText}>{revealed ? "Hide" : "Reveal"}</Text>
          </Pressable>
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="copy-outline" size={16} color={c.white} />
            <Text style={styles.btnPrimaryText}>Copy URL</Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.btnGhostText}>Share</Text>
          </Pressable>
        </View>
      </Card>

      <InstructionCard
        title="Google Calendar"
        steps={[
          "Open Google Calendar on a desktop browser.",
          'Left sidebar → "Other calendars" → "+" → "From URL".',
          "Paste the URL above and click Add calendar.",
          "Lessons appear within ~12 hours.",
        ]}
      />

      <InstructionCard
        title="Apple Calendar (iPhone)"
        steps={[
          "Settings → Calendar → Accounts → Add Account → Other.",
          'Tap "Add Subscribed Calendar".',
          "Paste the URL into Server, tap Next, then Save.",
          "Lessons appear within ~24 hours.",
        ]}
      />

      <InstructionCard
        title="Outlook"
        steps={[
          "Outlook → Calendar → Add calendar → Subscribe from web.",
          "Paste the URL above and give it a name.",
        ]}
      />

      <Pressable
        onPress={handleRotate}
        disabled={rotating}
        style={({ pressed }) => [styles.rotateRow, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="refresh" size={16} color={c.red} />
        <Text style={styles.rotateText}>
          {rotating ? "Rotating URL..." : "Rotate URL (revoke the old one)"}
        </Text>
      </Pressable>

      <Text style={styles.footnote}>
        Anyone with this URL can read your schedule (including student names). Treat it
        like a password — rotate it if you ever lose control of it.
      </Text>
    </Screen>
  );
}

function InstructionCard({ title, steps }: { title: string; steps: string[] }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Card style={styles.instructionCard}>
      <Text style={styles.instructionTitle}>{title}</Text>
      {steps.map((step, idx) => (
        <View key={idx} style={styles.instructionRow}>
          <Text style={styles.instructionNum}>{idx + 1}.</Text>
          <Text style={styles.instructionText}>{step}</Text>
        </View>
      ))}
    </Card>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
  kicker: {
    color: c.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 31,
    marginTop: spacing.xs,
  },
  copy: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  urlCard: { gap: spacing.md, marginBottom: spacing.lg },
  urlText: {
    fontFamily: "Courier",
    fontSize: 12,
    color: c.slate700,
    backgroundColor: c.slate100,
    padding: spacing.md,
    borderRadius: 10,
  },
  btnRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
  },
  btnPrimary: { backgroundColor: c.emerald },
  btnPrimaryText: { color: c.white, fontWeight: "700", fontSize: 13 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: c.border },
  btnGhostText: { color: c.slate900, fontWeight: "600", fontSize: 13 },
  instructionCard: { marginBottom: spacing.md, gap: spacing.xs },
  instructionTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  instructionRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  instructionNum: { color: c.emerald, fontWeight: "700", fontSize: 13, minWidth: 18 },
  instructionText: { flex: 1, color: c.slate700, fontSize: 13, lineHeight: 19 },
  rotateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  rotateText: { color: c.red, fontSize: 13, fontWeight: "700" },
  footnote: {
    color: c.slate500,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.sm,
  },
});

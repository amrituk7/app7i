import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Stage =
  | "idle"          // initial; nothing to show
  | "checking"      // checkForUpdateAsync in flight
  | "downloading"   // fetchUpdateAsync in flight
  | "ready"         // update fetched; awaiting user restart
  | "restarting"    // user tapped Restart; reloadAsync in flight
  | "failed";       // check or fetch failed

export function AppUpdateGate() {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>("idle");
  const [dismissed, setDismissed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAndFetch() {
      // expo-updates is disabled in dev (Updates.isEnabled is false in Expo Go
      // / dev clients). Skip silently so we don't spam dev logs.
      if (!Updates.isEnabled || __DEV__) return;

      try {
        setStage("checking");
        const check = await Updates.checkForUpdateAsync();
        if (cancelled) return;

        if (!check.isAvailable) {
          setStage("idle");
          return;
        }

        setStage("downloading");
        const fetched = await Updates.fetchUpdateAsync();
        if (cancelled) return;

        if (fetched.isNew) {
          setStage("ready");
        } else {
          // Update was the same one we already have applied — nothing to do.
          setStage("idle");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Update check failed";
        if (__DEV__) console.warn("[AppUpdateGate] update check failed", error);
        if (!cancelled) {
          setErrorMessage(message);
          setStage("failed");
        }
      }
    }

    void checkAndFetch();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRestart() {
    setStage("restarting");
    try {
      await Updates.reloadAsync();
    } catch (error) {
      if (__DEV__) console.warn("[AppUpdateGate] reload failed", error);
      setStage("ready");
    }
  }

  // No banner for idle. We DO show transient "checking" / "downloading"
  // feedback so users know something is happening — but only briefly and
  // only at the top, never blocking interaction.
  if (stage === "idle" || dismissed) return null;
  if (stage === "failed") return null; // fail silently per spec

  const top = insets.top + spacing.sm;

  if (stage === "checking" || stage === "downloading") {
    return (
      <View style={[styles.statusBanner, { top }]} pointerEvents="none">
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.statusText} numberOfLines={1}>
            {stage === "checking" ? "Checking for updates..." : "Downloading update..."}
          </Text>
        </View>
      </View>
    );
  }

  // stage === "ready" or "restarting"
  return (
    <View style={[styles.banner, { top }]} pointerEvents="box-none">
      <View style={styles.card} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-download-outline" size={20} color={colors.white} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>New version ready</Text>
          <Text style={styles.body}>
            Tap Later to keep using the app — it'll apply automatically next time you open it.
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleRestart}
            disabled={stage === "restarting"}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              stage === "restarting" && styles.disabled,
            ]}
          >
            <Text style={styles.primaryLabel}>
              {stage === "restarting" ? "Restarting..." : "Restart now"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDismissed(true)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLabel}>Later</Text>
          </Pressable>
        </View>
      </View>
      {errorMessage ? (
        <Text style={styles.errorHint} numberOfLines={2}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  statusBanner: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    alignItems: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.emeraldDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: colors.emerald,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.emeraldDark,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.92,
  },
  actions: {
    gap: spacing.xs,
    alignItems: "stretch",
  },
  primaryButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryLabel: {
    color: colors.emeraldDark,
    fontWeight: "600",
    fontSize: 12,
  },
  secondaryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignItems: "center",
  },
  secondaryLabel: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 11,
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.7,
  },
  errorHint: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

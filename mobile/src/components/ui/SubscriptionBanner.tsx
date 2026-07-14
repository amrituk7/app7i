import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { AppUser } from "../../types";

type Props = {
  user: AppUser | null;
  onPress?: () => void;
};

type State = {
  tone: "info" | "warning" | "danger";
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
};

function deriveState(user: AppUser | null): State | null {
  if (!user || user.role !== "instructor") return null;
  const status = user.subscriptionStatus || "none";
  const now = Date.now();

  if (status === "active") return null; // No banner for happy paying users.

  if (status === "trialing" && user.trialEnd && user.trialEnd > now) {
    const days = Math.max(0, Math.ceil((user.trialEnd - now) / 86400000));
    return {
      tone: days <= 2 ? "warning" : "info",
      icon: "sparkles",
      title: days === 0 ? "Trial ends today" : days === 1 ? "1 day left" : `${days} days left`,
      subtitle: "Upgrade to keep your students, lessons and earnings synced.",
    };
  }

  if (status === "trialing") {
    return {
      tone: "warning",
      icon: "time-outline",
      title: "Trial expired",
      subtitle: "Tap to upgrade and resume sync.",
    };
  }

  if (status === "past_due") {
    return {
      tone: "danger",
      icon: "alert-circle",
      title: "Payment failed",
      subtitle: "Tap to update your card before access pauses.",
    };
  }

  if (status === "canceled") {
    return {
      tone: "warning",
      icon: "close-circle-outline",
      title: "Subscription cancelled",
      subtitle: "Reactivate any time to keep using App7i.",
    };
  }

  // status === "none" — never subscribed; show free trial CTA
  return {
    tone: "info",
    icon: "rocket",
    title: "Start your 5-day free trial",
    subtitle: "Unlock unlimited students, lessons and messages.",
  };
}

export function SubscriptionBanner({ user, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const state = deriveState(user);
  if (!state) return null;

  const colorMap = {
    info: { bg: c.emeraldSoft, fg: c.emeraldDark, accent: c.emerald },
    warning: { bg: c.amberSoft, fg: c.amber, accent: c.amber },
    danger: { bg: c.redSoft, fg: c.red, accent: c.red },
  } as const;
  const tone = colorMap[state.tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        { backgroundColor: tone.bg },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.accent }]}>
        <Ionicons name={state.icon} size={18} color={c.white} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: tone.fg }]}>{state.title}</Text>
        <Text style={styles.subtitle}>{state.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tone.fg} />
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    color: c.slate700,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

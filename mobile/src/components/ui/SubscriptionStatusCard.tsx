import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { AppUser } from "../../types";
import { Card } from "./Card";

// Play-policy note: this card must stay read-only. No price, no purchase
// button, no tappable link to an external checkout — the Android app does
// not sell subscriptions and must not steer users to buy elsewhere.

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Derived = {
  tone: "ok" | "info" | "warning" | "danger";
  icon: IoniconName;
  label: string;
  detail: string;
};

function deriveSubscription(user: AppUser | null): Derived | null {
  if (!user || user.role !== "instructor") return null;
  const status = user.subscriptionStatus || "none";
  const now = Date.now();

  if (status === "active") {
    return {
      tone: "ok",
      icon: "checkmark-circle",
      label: "Active",
      detail: "Your App7i subscription is active.",
    };
  }
  if (status === "trialing" && user.trialEnd && user.trialEnd > now) {
    const days = Math.max(0, Math.ceil((user.trialEnd - now) / 86400000));
    return {
      tone: days <= 2 ? "warning" : "info",
      icon: "sparkles",
      label: "Free trial",
      detail:
        days === 0
          ? "Your trial ends today."
          : `Your trial ends in ${days} ${days === 1 ? "day" : "days"}.`,
    };
  }
  if (status === "trialing") {
    return {
      tone: "warning",
      icon: "time-outline",
      label: "Trial ended",
      detail: "Your free trial has finished.",
    };
  }
  if (status === "past_due") {
    return {
      tone: "danger",
      icon: "alert-circle",
      label: "Payment issue",
      detail: "Your last payment didn't go through.",
    };
  }
  if (status === "canceled") {
    return {
      tone: "warning",
      icon: "close-circle-outline",
      label: "Cancelled",
      detail: "Your subscription is cancelled.",
    };
  }
  // Never subscribed — early access period, everything is free.
  return {
    tone: "ok",
    icon: "gift-outline",
    label: "Early access",
    detail: "You have full access free of charge during early access.",
  };
}

export function SubscriptionStatusCard({ user }: { user: AppUser | null }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const state = deriveSubscription(user);
  if (!state) return null;

  const toneMap = {
    ok: { bg: c.emeraldSoft, fg: c.emeraldDark, accent: c.emerald },
    info: { bg: c.emeraldSoft, fg: c.emeraldDark, accent: c.emerald },
    warning: { bg: c.amberSoft, fg: c.amber, accent: c.amber },
    danger: { bg: c.redSoft, fg: c.red, accent: c.red },
  } as const;
  const tone = toneMap[state.tone];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Ionicons name={state.icon} size={13} color={tone.accent} />
          <Text style={[styles.badgeText, { color: tone.fg }]}>{state.label}</Text>
        </View>
      </View>
      <Text style={styles.detail}>{state.detail}</Text>
      <Text style={styles.footnote}>
        Subscriptions are managed on the secure App7i web portal. This app does not
        sell subscriptions or take payments.
      </Text>
    </Card>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    sectionTitle: {
      color: c.slate900,
      fontSize: 15,
      fontWeight: "700",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    detail: {
      color: c.slate700,
      fontSize: 13,
      lineHeight: 18,
    },
    footnote: {
      color: c.slate500,
      fontSize: 11,
      lineHeight: 15,
    },
  });

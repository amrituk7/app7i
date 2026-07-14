import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../components/ui/AppButton";
import { useAuth } from "../context/AuthContext";
import { BILLING_WEB_URL, paywallReason } from "../config/billing";
import type { ColorPalette } from "../theme/colors";
import { useColors } from "../theme/ThemeContext";
import { useThemedStyles } from "../theme/useThemedStyles";

const SUPPORT_EMAIL = "support@app7i.com";

const HEADLINE: Record<ReturnType<typeof paywallReason>, { title: string; body: string }> = {
  expired_trial: {
    title: "Your free trial has ended",
    body: "Subscribe to keep booking lessons, tracking earnings, and managing your students.",
  },
  past_due: {
    title: "There's a payment issue",
    body: "Your last payment didn't go through. Update your billing to restore full access.",
  },
  cancelled: {
    title: "Your subscription is cancelled",
    body: "Your data is safe. Restart your subscription any time to unlock the app again.",
  },
  unpaid: {
    title: "Subscribe to keep teaching",
    body: "Your App7i instructor plan isn't active. Subscribe to unlock lessons, earnings, calendar, students, and progress.",
  },
};

const LOCKED_FEATURES = [
  { icon: "calendar-outline", label: "Booking lessons" },
  { icon: "cash-outline", label: "Earnings & payment records" },
  { icon: "grid-outline", label: "Calendar" },
  { icon: "people-outline", label: "Students" },
  { icon: "trending-up-outline", label: "Progress tracking" },
] as const;

export function PaywallScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user, logout, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const reason = paywallReason(user);
  const copy = HEADLINE[reason];

  function openBilling() {
    Linking.openURL(BILLING_WEB_URL).catch(() =>
      Alert.alert("Couldn't open the page", `Visit ${BILLING_WEB_URL} in your browser to subscribe.`),
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch {
      // no-op — if still unpaid the paywall simply stays
    } finally {
      setRefreshing(false);
    }
  }

  function emailSupport() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="lock-closed" size={26} color={c.emerald} />
        </View>

        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>What's locked</Text>
          {LOCKED_FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Ionicons name={f.icon} size={18} color={c.slate500} />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <AppButton label="Manage subscription on the web" onPress={openBilling} />
          <Pressable
            onPress={handleRefresh}
            disabled={refreshing}
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
          >
            {refreshing ? (
              <ActivityIndicator color={c.slate600} />
            ) : (
              <Text style={styles.refreshText}>I've already subscribed — refresh</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.note}>
          Subscriptions are billed securely on the App7i website. This app doesn't take payments.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={emailSupport} hitSlop={8}>
          <Text style={styles.footerLink}>Contact support</Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => logout()} hitSlop={8}>
          <Text style={styles.footerLink}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      gap: 12,
    },
    badge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.emeraldSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    title: {
      color: c.slate900,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    body: {
      color: c.slate600,
      fontSize: 15,
      lineHeight: 22,
    },
    card: {
      marginTop: 10,
      padding: 18,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: 12,
    },
    cardLabel: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    featureText: {
      color: c.slate700,
      fontSize: 15,
      fontWeight: "500",
    },
    actions: {
      marginTop: 18,
      gap: 6,
    },
    refreshBtn: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    refreshText: {
      color: c.slate600,
      fontSize: 15,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.6,
    },
    note: {
      marginTop: 4,
      color: c.slate500,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
    },
    footerLink: {
      color: c.emeraldDark,
      fontSize: 14,
      fontWeight: "600",
    },
    footerDot: {
      color: c.slate500,
    },
  });

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { hapticConfirm, hapticSuccess, hapticTap } from "../../utils/haptics";
import { describeFirestoreError } from "../../utils/firestoreError";
import {
  getVerificationEmailDebugInfo,
  sendVerificationEmailFallback,
} from "../../services/authService";

const RESEND_COOLDOWN_SECONDS = 60;
const SHOW_VERIFY_DEBUG = typeof __DEV__ !== "undefined" && __DEV__;

export function VerifyEmailScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user, refreshUser, resendVerificationEmail, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [debugInfo, setDebugInfo] = useState(() => getVerificationEmailDebugInfo());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verificationEmailWasSent = Boolean(debugInfo.lastVerificationEmailSentAt);

  const refreshDebugInfo = useCallback(() => {
    setDebugInfo(getVerificationEmailDebugInfo());
  }, []);

  // Tick the cooldown timer.
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [resendCooldown]);

  const checkVerified = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const verified = await refreshUser();
      refreshDebugInfo();
      if (verified) {
        hapticSuccess();
      } else {
        Alert.alert(
          "Not verified yet",
          "Open the verification email and tap the link, then come back and try again.",
        );
      }
    } catch (e) {
      refreshDebugInfo();
      Alert.alert(
        "Couldn't check",
        describeFirestoreError(e, { action: "refreshUser" }),
      );
    } finally {
      setChecking(false);
    }
  }, [checking, refreshUser]);

  // Auto-check when the app foregrounds (user finished tapping link in browser).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refreshUser()
          .then(refreshDebugInfo)
          .catch(refreshDebugInfo);
      }
    });
    return () => sub.remove();
  }, [refreshDebugInfo, refreshUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      refreshDebugInfo();
      setRefreshing(false);
    }
  }, [refreshDebugInfo, refreshUser]);

  async function resend() {
    if (resending || resendCooldown > 0) return;
    hapticTap();
    setResending(true);
    try {
      await resendVerificationEmail();
      refreshDebugInfo();
      try {
        await sendVerificationEmailFallback();
        refreshDebugInfo();
        hapticConfirm();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        const latest = getVerificationEmailDebugInfo();
        Alert.alert(
          "Backup email sent",
          `Sent through ${latest.lastFallbackVerificationProvider || "the backup sender"}. Check your inbox and spam folder.`,
        );
      } catch (fallbackError) {
        refreshDebugInfo();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        const latest = getVerificationEmailDebugInfo();
        Alert.alert(
          "Firebase accepted this",
          `Firebase accepted the resend request, but inbox delivery is still failing. Backup sender: ${
            latest.lastFallbackVerificationErrorMessage || describeFirestoreError(fallbackError, { action: "sendVerificationEmailFallback" })
          }`,
        );
      }
    } catch (e) {
      refreshDebugInfo();
      const latest = getVerificationEmailDebugInfo();
      Alert.alert(
        "Email not sent",
        `${latest.lastVerificationErrorCode || "unknown-error"}: ${
          latest.lastVerificationErrorMessage || describeFirestoreError(e, { action: "resendVerificationEmail" })
        }`,
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={32} color={c.white} />
          </View>
          <Text style={styles.title}>
            {verificationEmailWasSent ? "Check your inbox" : "Verify your email"}
          </Text>
          <Text style={styles.subtitle}>
            {verificationEmailWasSent ? "We sent a verification link to" : "Send a verification link to"}{"\n"}
            <Text style={styles.email}>{user?.email || "your email"}</Text>
          </Text>
          <Text style={styles.helper}>
            {verificationEmailWasSent
              ? "Firebase sends a secure link, not a code. Tap the link, then come back and tap \"I've verified\"."
              : "Firebase sends a secure link, not a code. Tap Resend email; we'll only show email sent after Firebase accepts the request."}
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton
            label={checking ? "Checking…" : "I've verified"}
            onPress={checkVerified}
            disabled={checking}
          />
          <AppButton
            label={
              resending
                ? "Sending…"
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend email"
            }
            variant="secondary"
            onPress={resend}
            disabled={resending || resendCooldown > 0}
          />

          <Pressable
            onPress={() => {
              hapticTap();
              logout();
            }}
            hitSlop={8}
            style={styles.signOutWrap}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.tipRow}>
          <Ionicons name="information-circle-outline" size={16} color={c.slate500} />
          <Text style={styles.tipText}>
            Verification can sit in spam. Check there if it doesn't arrive in 2 minutes.
          </Text>
        </View>

        {SHOW_VERIFY_DEBUG ? (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Verification debug</Text>
            <DebugLine label="currentUser.email" value={debugInfo.currentUserEmail} />
            <DebugLine label="currentUser.emailVerified" value={String(debugInfo.currentUserEmailVerified)} />
            <DebugLine label="auth.app.options.projectId" value={debugInfo.projectId} />
            <DebugLine label="auth.app.options.appId" value={debugInfo.appId} />
            <DebugLine label="lastVerificationEmailSentAt" value={debugInfo.lastVerificationEmailSentAt} />
            <DebugLine label="lastVerificationErrorCode" value={debugInfo.lastVerificationErrorCode} />
            <DebugLine label="lastVerificationErrorMessage" value={debugInfo.lastVerificationErrorMessage} />
            <DebugLine label="lastFallbackVerificationEmailSentAt" value={debugInfo.lastFallbackVerificationEmailSentAt} />
            <DebugLine label="lastFallbackVerificationProvider" value={debugInfo.lastFallbackVerificationProvider} />
            <DebugLine label="lastFallbackVerificationErrorCode" value={debugInfo.lastFallbackVerificationErrorCode} />
            <DebugLine label="lastFallbackVerificationErrorMessage" value={debugInfo.lastFallbackVerificationErrorMessage} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function DebugLine({ label, value }: { label: string; value: string | null }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.debugLine}>
      <Text style={styles.debugLabel}>{label}</Text>
      <Text style={styles.debugValue}>{value || "null"}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.xl,
  },
  brand: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: c.emerald,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    color: c.slate900,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subtitle: {
    color: c.slate700,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    color: c.emeraldDark,
    fontWeight: "700",
  },
  helper: {
    color: c.slate500,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  signOutWrap: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "700",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: "auto",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  tipText: {
    flex: 1,
    color: c.slate500,
    fontSize: 12,
    lineHeight: 17,
  },
  debugCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.slate300,
    backgroundColor: c.slate100,
    gap: 8,
  },
  debugTitle: {
    color: c.slate900,
    fontSize: 13,
    fontWeight: "700",
  },
  debugLine: {
    gap: 2,
  },
  debugLabel: {
    color: c.slate700,
    fontSize: 11,
    fontWeight: "600",
  },
  debugValue: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 15,
  },
});

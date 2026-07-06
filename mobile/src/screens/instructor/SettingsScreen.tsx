import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { InviteSheet } from "../../components/ui/InviteSheet";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { deleteCurrentAccount } from "../../services/accountService";
import { getStudents, getTodayLessons, getUnpaidInvoices } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors, useTheme } from "../../theme/ThemeContext";
import type { ThemeMode } from "../../theme/themePersistence";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { formatGBP } from "../../utils/currency";

const SUPPORT_EMAIL = "support@app7i.com";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type SettingsSummary = {
  studentsCount: number;
  todayLessonsCount: number;
  unpaidInvoicesCount: number;
  unpaidTotal: number;
};

const emptySummary: SettingsSummary = {
  studentsCount: 0,
  todayLessonsCount: 0,
  unpaidInvoicesCount: 0,
  unpaidTotal: 0,
};

export function SettingsScreen({ navigation }: { navigation: any }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { logout, user } = useAuth();
  const [summary, setSummary] = useState<SettingsSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setSummary(emptySummary);
      return;
    }

    setError(null);
    try {
      const [students, todayLessons, unpaidInvoices] = await Promise.all([
        getStudents(user.uid, 100),
        getTodayLessons(user.uid),
        getUnpaidInvoices(user.uid, 50),
      ]);

      setSummary({
        studentsCount: students.length,
        todayLessonsCount: todayLessons.length,
        unpaidInvoicesCount: unpaidInvoices.length,
        unpaidTotal: unpaidInvoices.reduce((total, invoice) => total + invoice.amount, 0),
      });
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble refreshing settings. Pull down to retry."));
    }
  }, [user?.uid]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function emailSupport() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=App7i%20support`).catch(() =>
      Alert.alert("Email", `Reach us at ${SUPPORT_EMAIL}`),
    );
  }

  function confirmDelete() {
    Alert.alert(
      "Delete your account?",
      "This permanently removes your App7i account, profile and signing data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: runDelete,
        },
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
        Alert.alert("Delete did not go through", toFriendlyError(e, "Check your connection and tap again."));
      }
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
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Account</Text>
        <Text style={styles.title}>Settings</Text>
      </View>

      {!user ? (
        <EmptyState
          iconName="person-circle-outline"
          title="Session needs a refresh"
          message="Pull down to reload your account, or sign out and back in if it keeps happening."
          actionLabel="Try refresh"
          onAction={onRefresh}
        />
      ) : (
        <>
          {error ? <NativeNotice icon="warning-outline" message={error} /> : null}

          <View style={styles.summaryRail}>
            <SummaryTile icon="people-outline" label="Students" value={String(summary.studentsCount)} />
            <SummaryTile icon="car-outline" label="Today" value={String(summary.todayLessonsCount)} />
            <SummaryTile
              icon="receipt-outline"
              label="Unpaid"
              value={String(summary.unpaidInvoicesCount)}
            />
            <SummaryTile icon="wallet-outline" label="Due" value={formatGBP(summary.unpaidTotal)} />
          </View>

          <SettingsSection title="Account">
            <SettingsRow
              icon="mail-outline"
              title="Signed in as"
              subtitle={user.email || "Unknown email"}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              title="Role"
              subtitle={user.role === "instructor" ? "Instructor" : "Student"}
            />
            <SettingsRow
              icon="checkmark-done-outline"
              title="Onboarding"
              subtitle={user.onboardingComplete ? "Complete" : "Needs setup"}
            />
            <SettingsRow
              icon="person-circle-outline"
              title="My Profile"
              subtitle="Edit your public instructor listing"
              onPress={() => navigation.navigate("MyProfile")}
            />
            <SettingsRow
              icon="qr-code-outline"
              title="Invite a student"
              subtitle="Share your registration link"
              onPress={() => setInviteOpen(true)}
            />
            <SettingsRow
              icon="calendar-outline"
              title="Calendar sync"
              subtitle="Subscribe Google or Apple Calendar to your lessons"
              onPress={() => navigation.navigate("CalendarSync")}
            />
            <SettingsRow
              icon="alarm-outline"
              title="Lesson reminders"
              subtitle="Email and in-app reminders before each lesson"
              onPress={() => navigation.navigate("RemindersSettings")}
            />
          </SettingsSection>

          <AppearanceSection />

          <SettingsSection title="Billing">
            <SettingsRow
              icon="card-outline"
              title="Subscription billing"
              subtitle="Instructor subscriptions are managed on the secure App7i web portal. This Android app does not sell subscriptions in-app."
            />
          </SettingsSection>

          <SettingsSection title="Support">
            <SettingsRow
              icon="chatbubble-ellipses-outline"
              title="Contact support"
              subtitle={SUPPORT_EMAIL}
              onPress={emailSupport}
            />
          </SettingsSection>

          <SettingsSection title="Legal">
            <SettingsRow
              icon="lock-closed-outline"
              title="Privacy policy"
              subtitle="How App7i handles your data"
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <SettingsRow
              icon="document-text-outline"
              title="Terms of service"
              subtitle="Rules for using App7i"
              onPress={() => navigation.navigate("Terms")}
            />
          </SettingsSection>

          <SettingsSection title="Session">
            <SettingsRow
              icon="log-out-outline"
              title="Log out"
              subtitle="End this device session"
              tone="danger"
              onPress={logout}
            />
          </SettingsSection>

          <SettingsSection title="Danger zone">
            <Text style={styles.dangerCopy}>
              Deleting your account permanently removes your App7i account, profile and signing data.
            </Text>
            <SettingsRow
              icon="trash-outline"
              title="Delete account"
              subtitle="This cannot be undone"
              tone="danger"
              onPress={confirmDelete}
            />
          </SettingsSection>

          <Text style={styles.footer}>App7i v1.0.0</Text>
          <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
        </>
      )}
    </Screen>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: IoniconName;
  label: string;
  value: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.summaryTile}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={16} color={c.emeraldDark} />
      </View>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  tone = "default",
  onPress,
}: {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  tone?: "default" | "danger";
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const isDanger = tone === "danger";

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, isDanger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={isDanger ? c.red : c.emeraldDark} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, isDanger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={c.slate300} />
      ) : null}
    </Pressable>
  );
}

function AppearanceSection() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { mode, setMode } = useTheme();
  const options: { value: ThemeMode; label: string; icon: IoniconName; subtitle: string }[] = [
    { value: "system", label: "Match system", icon: "phone-portrait-outline", subtitle: "Follow your phone's appearance setting" },
    { value: "light", label: "Light", icon: "sunny-outline", subtitle: "Always use the light theme" },
    { value: "dark", label: "Dark", icon: "moon-outline", subtitle: "Always use the dark theme" },
  ];

  return (
    <SettingsSection title="Appearance">
      {options.map((opt) => {
        const selected = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={opt.icon} size={18} color={c.emeraldDark} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{opt.label}</Text>
              <Text style={styles.rowSubtitle}>{opt.subtitle}</Text>
            </View>
            {selected ? (
              <Ionicons name="checkmark" size={20} color={c.emerald} />
            ) : (
              <View style={{ width: 20 }} />
            )}
          </Pressable>
        );
      })}
    </SettingsSection>
  );
}

function NativeNotice({ icon, message }: { icon: IoniconName; message: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={18} color={c.red} />
      <Text style={styles.noticeText}>{message}</Text>
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
    marginBottom: spacing.lg,
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
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  summaryRail: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  summaryTile: {
    flex: 1,
    minHeight: 96,
    borderRadius: 22,
    padding: spacing.md,
    backgroundColor: c.surface,
    gap: 5,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  summaryValue: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  summaryLabel: {
    color: c.slate500,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
    textTransform: "uppercase",
  },
  sectionList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  rowIconDanger: {
    backgroundColor: c.redSoft,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
  },
  rowTitleDanger: {
    color: c.red,
  },
  rowSubtitle: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  dangerCopy: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: c.surface,
  },
  notice: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: c.redSoft,
  },
  noticeText: {
    flex: 1,
    color: c.red,
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

// In-app Privacy Policy. Required by Google Play and Apple App Store for any
// app that collects personal data. Mirrors the live policy at app7i.com/privacy
// so users can read it offline / without leaving the app.

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Nav = { goBack: () => void };

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Who we are",
    body:
      "App7i is a business tool for self-employed driving instructors and their students. The app is operated by Amritpal Singh (sole trader, United Kingdom). You can contact us at support@app7i.com.",
  },
  {
    heading: "What we collect",
    body:
      "Account details: email, optional display name, role (instructor or student).\n\nBusiness records: students you add, lessons you book, messages you send, payment status, expenses, mileage and test results. These are entered by you and stored under your account.\n\nDevice details: a push notification token, device hash for sign-in security alerts, basic crash diagnostics via Sentry.",
  },
  {
    heading: "How we use it",
    body:
      "To run the app's core features for you — list lessons, send messages, calculate earnings.\n\nTo email you security alerts when a new device signs in.\n\nTo send push notifications you've opted into (lesson reminders, message alerts, monthly statement reminders).\n\nWe do NOT sell your data, use it for advertising, or share it with third parties beyond the service providers below.",
  },
  {
    heading: "Where it's stored",
    body:
      "All data is stored in Google Firebase (Firestore, Authentication, Cloud Functions, Cloud Messaging) hosted in EU regions. Email delivery uses SendGrid / Postmark / Mailgun. Crash reports go to Sentry. These providers act as processors on our behalf.",
  },
  {
    heading: "Your rights (UK GDPR)",
    body:
      "You have the right to access, correct, export, restrict or erase your data at any time. To delete your account, open Settings → Delete account. To request an export or for any other privacy question, email support@app7i.com — we respond within 30 days.\n\nYou also have the right to lodge a complaint with the UK Information Commissioner's Office at ico.org.uk.",
  },
  {
    heading: "How long we keep it",
    body:
      "Active accounts: as long as you keep using App7i.\n\nDeleted accounts: removed within 30 days of deletion request.\n\nBackups: rolling 90-day Firebase backups which then expire automatically.",
  },
  {
    heading: "Children",
    body:
      "App7i is intended for users 17 and older (the minimum age to start learning to drive in the UK). We do not knowingly collect data from anyone under 13.",
  },
  {
    heading: "Changes",
    body:
      "If we change this policy materially, the next time you open the app you'll see a banner asking you to re-read it. The current version date appears at the bottom of this screen.",
  },
];

export function PrivacyPolicyScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={c.emerald} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>LEGAL</Text>
          <Text style={styles.title}>Privacy policy</Text>
        </View>
      </View>

      <Text style={styles.intro}>
        How App7i handles your personal data. This is a plain-English summary —
        it has the same legal weight as the full policy at app7i.com/privacy.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}

      <Text style={styles.footer}>
        Version 1.0 · Last updated 2026-06-15 · Questions? support@app7i.com
      </Text>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    kicker: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
    },
    title: {
      color: c.slate900,
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
      marginTop: 2,
    },
    intro: {
      color: c.slate600,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    section: {
      marginBottom: spacing.lg,
    },
    heading: {
      color: c.slate900,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 6,
    },
    body: {
      color: c.slate700,
      fontSize: 14,
      lineHeight: 21,
    },
    footer: {
      color: c.slate500,
      fontSize: 11,
      lineHeight: 16,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      textAlign: "center",
    },
    pressed: { opacity: 0.5 },
  });

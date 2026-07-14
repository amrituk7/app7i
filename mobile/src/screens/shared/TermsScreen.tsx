// In-app Terms of Service. Mirrors app7i.com/terms so users can read offline.

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
      "App7i (the \"Service\") is operated by Amritpal Singh, sole trader, United Kingdom. Contact: support@app7i.com.",
  },
  {
    heading: "What App7i is — and isn't",
    body:
      "App7i is a business tool that helps self-employed driving instructors organise students, lessons, payments and records. App7i does NOT:\n\n• provide driving instruction, training or qualifications;\n• employ or insure the instructors using it;\n• act as a bank, payment processor or financial advisor;\n• give legal, tax or accounting advice.\n\nInstructors using App7i operate their own independent businesses. App7i is software they use; it is not their employer or representative.",
  },
  {
    heading: "Your account",
    body:
      "You must be 17 or older to register. You're responsible for keeping your login secure. Don't share your account. If you suspect unauthorised access, change your password and email support@app7i.com.",
  },
  {
    heading: "What you can do",
    body:
      "You may use App7i to run your own driving-instructor business or, as a student, to organise lessons with a linked instructor. You agree not to:\n\n• use App7i to harass, abuse, defraud or threaten anyone;\n• upload illegal, defamatory or infringing content;\n• attempt to reverse-engineer, scrape or attack the service;\n• impersonate another instructor or student.",
  },
  {
    heading: "Your content + records",
    body:
      "You own the records you create in App7i (students, lessons, notes, expenses, mileage). You grant App7i a limited licence to store, process and display that data so the app can function for you. We will not sell or share it (see the Privacy Policy).",
  },
  {
    heading: "Statements, records and tax",
    body:
      "PDF statements and reports App7i generates are summaries built from data you entered. They are not audited accounts, proof of payment, or documents issued by a financial institution. You remain solely responsible for HMRC self-assessment, VAT (where applicable) and any other tax filings. App7i is not your accountant.",
  },
  {
    heading: "Liability",
    body:
      "App7i is provided \"as is\". To the maximum extent permitted by UK law, App7i is not liable for:\n\n• any business loss, lost revenue, lost data, or tax penalty arising from use of the app;\n• disputes between an instructor and a student;\n• outages, sync delays, or downtime in third-party services (Firebase, push notifications, SMS).\n\nNothing in these terms excludes liability that cannot lawfully be excluded — including for death, personal injury or fraud.",
  },
  {
    heading: "Subscription + payment",
    body:
      "Some instructor features may require a paid subscription. Subscriptions are purchased and managed on the App7i website (app7i.com) — this app does not sell subscriptions or take payments. If you cancel on the website, your access continues until the end of the paid period. UK consumers have 14-day rights of withdrawal where applicable.",
  },
  {
    heading: "Ending your account",
    body:
      "You can delete your account at any time via Settings → Delete account. We can suspend or terminate accounts that breach these terms or are used unlawfully. On termination we delete your data per the Privacy Policy.",
  },
  {
    heading: "Changes + governing law",
    body:
      "If we change these terms materially, the next time you open the app you'll see a banner asking you to re-read them. These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the English courts, subject to UK consumer law rights.",
  },
];

export function TermsScreen({ navigation }: { navigation: Nav }) {
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
          <Text style={styles.title}>Terms of service</Text>
        </View>
      </View>

      <Text style={styles.intro}>
        The rules for using App7i. By using the app you agree to these terms.
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
    section: { marginBottom: spacing.lg },
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

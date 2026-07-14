import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/ui/AppButton";
import { Screen } from "../components/ui/Screen";
import { BILLING_WEB_URL, INSTRUCTOR_PLAN, type PlanInterval } from "../config/billing";
import type { ColorPalette } from "../theme/colors";
import { useColors } from "../theme/ThemeContext";
import { useThemedStyles } from "../theme/useThemedStyles";
import { spacing } from "../theme/spacing";
import { hapticTap } from "../utils/haptics";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type Nav = { goBack: () => void };

// The real, differentiated things an App7i instructor gets — the stuff a rival
// spreadsheet or generic booking app can't do. Benefit-first, grounded in the app.
const FEATURES: Array<{ icon: IoniconName; title: string; sub: string }> = [
  {
    icon: "cash-outline",
    title: "HMRC-ready earnings",
    sub: "Mileage at 45p/25p, expenses and a tax-year PDF — worked out for you.",
  },
  {
    icon: "receipt-outline",
    title: "Lesson payment tracking",
    sub: "Record paid, unpaid or waived lessons and send a friendly reminder.",
  },
  {
    icon: "calendar-outline",
    title: "Calendar that syncs to your phone",
    sub: "Every lesson in one place, with clash-checks against your own diary.",
  },
  {
    icon: "trending-up-outline",
    title: "DVSA progress tracking",
    sub: "14 skill categories with per-lesson notes, tracked for every learner.",
  },
  {
    icon: "ribbon-outline",
    title: "Test-readiness checklist",
    sub: "A 6-point gate that tells you when a learner is genuinely ready.",
  },
  {
    icon: "chatbubble-ellipses-outline",
    title: "Anonymous student feedback",
    sub: "Honest ratings, summarised into what's working and what to improve.",
  },
  {
    icon: "notifications-outline",
    title: "Reminders sent for you",
    sub: "Pre-lesson, payment and “how did it go?” nudges go out automatically.",
  },
];

export function InstructorPlusScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [plan, setPlan] = useState<PlanInterval>("yearly");

  const selected = plan === "yearly" ? INSTRUCTOR_PLAN.yearly : INSTRUCTOR_PLAN.monthly;

  function openCheckout() {
    hapticTap();
    const url = `${BILLING_WEB_URL}?plan=${plan}`;
    Linking.openURL(url).catch(() =>
      Alert.alert(
        "Couldn't open checkout",
        `Visit ${BILLING_WEB_URL} in your browser to start your subscription.`,
      ),
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Ionicons name="close" size={22} color={c.slate900} />
        </Pressable>
      </View>

      {/* Brand hero */}
      <View style={styles.hero}>
        <View style={styles.planBadge}>
          <Ionicons name="sparkles" size={13} color={c.white} />
          <Text style={styles.planBadgeText}>{INSTRUCTOR_PLAN.name.toUpperCase()}</Text>
        </View>
        <Text style={styles.heroTitle}>Run your whole driving school from your pocket.</Text>
        <Text style={styles.heroSubtitle}>
          Bookings, money, student progress and test prep — the tools built for UK instructors,
          in one place.
        </Text>
      </View>

      {/* Feature list */}
      <View style={styles.featureCard}>
        <Text style={styles.featureLabel}>WHAT'S INCLUDED</Text>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={19} color={c.emerald} />
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.featureMore}>
          Plus your own booking link &amp; QR, car MOT/insurance alerts, and optional student messaging.
        </Text>
      </View>

      {/* Plan selector */}
      <View style={styles.planRow}>
        <PlanOption
          label="Monthly"
          price={INSTRUCTOR_PLAN.monthly.price}
          caption={INSTRUCTOR_PLAN.monthly.note}
          active={plan === "monthly"}
          onPress={() => {
            hapticTap();
            setPlan("monthly");
          }}
        />
        <PlanOption
          label="Yearly"
          price={INSTRUCTOR_PLAN.yearly.price}
          caption={`${INSTRUCTOR_PLAN.yearly.perMonth}/mo · billed yearly`}
          badge={`SAVE ${INSTRUCTOR_PLAN.yearly.savePercent}%`}
          active={plan === "yearly"}
          onPress={() => {
            hapticTap();
            setPlan("yearly");
          }}
        />
      </View>

      {/* Trial + CTA */}
      <View style={styles.trialRow}>
        <Ionicons name="gift-outline" size={15} color={c.emerald} />
        <Text style={styles.trialText}>
          Free for {INSTRUCTOR_PLAN.trialDays} days, then {selected.price} {selected.period}
        </Text>
      </View>

      <AppButton
        label={`Start ${INSTRUCTOR_PLAN.trialDays}-day free trial`}
        onPress={openCheckout}
        style={styles.cta}
      />

      <Pressable onPress={openCheckout} hitSlop={6} style={styles.manageLink}>
        <Text style={styles.manageLinkText}>Already a member? Manage billing</Text>
      </Pressable>

      <Text style={styles.finePrint}>
        After your {INSTRUCTOR_PLAN.trialDays}-day free trial you'll be charged automatically for the
        plan you chose, unless you cancel before the trial ends. Full refund available within{" "}
        {INSTRUCTOR_PLAN.refundDays} days. Secure checkout on the App7i website — this app doesn't take
        payments; manage or cancel any time on the web portal.
      </Text>
    </Screen>
  );
}

function PlanOption({
  label,
  price,
  caption,
  badge,
  active,
  onPress,
}: {
  label: string;
  price: string;
  caption: string;
  badge?: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planOption,
        active && styles.planOptionActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} plan, ${price}`}
    >
      <View style={styles.planTopRow}>
        <Text style={[styles.planLabel, active && styles.planLabelActive]}>{label}</Text>
        <View style={[styles.radio, active && styles.radioActive]}>
          {active ? <Ionicons name="checkmark" size={12} color={c.white} /> : null}
        </View>
      </View>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planCaption}>{caption}</Text>
      {badge ? (
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
    },
    // Brand hero
    hero: {
      borderRadius: 24,
      padding: spacing.lg,
      backgroundColor: c.emerald,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    planBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.20)",
    },
    planBadgeText: {
      color: c.white,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    heroTitle: {
      color: c.white,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: c.white,
      opacity: 0.92,
      fontSize: 14,
      lineHeight: 20,
    },
    // Feature list
    featureCard: {
      borderRadius: 24,
      padding: spacing.lg,
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    featureLabel: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(70,76,163,0.12)",
    },
    featureCopy: {
      flex: 1,
      gap: 2,
    },
    featureTitle: {
      color: c.slate900,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
    },
    featureSub: {
      color: c.slate500,
      fontSize: 13,
      lineHeight: 18,
    },
    featureMore: {
      color: c.slate500,
      fontSize: 13,
      lineHeight: 18,
      fontStyle: "italic",
    },
    // Plan selector
    planRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    planOption: {
      flex: 1,
      borderRadius: 18,
      padding: spacing.md,
      backgroundColor: c.surfaceRaised,
      borderWidth: 1.5,
      borderColor: c.border,
      gap: 4,
    },
    planOptionActive: {
      borderColor: c.emerald,
      backgroundColor: "rgba(70,76,163,0.08)",
    },
    planTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    planLabel: {
      color: c.slate600,
      fontSize: 13,
      fontWeight: "700",
    },
    planLabelActive: {
      color: c.slate900,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.slate300,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: c.emerald,
      backgroundColor: c.emerald,
    },
    planPrice: {
      color: c.slate900,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginTop: 2,
    },
    planCaption: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "500",
    },
    saveBadge: {
      alignSelf: "flex-start",
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: c.emerald,
    },
    saveBadgeText: {
      color: c.white,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    // Trial + CTA
    trialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: spacing.sm,
    },
    trialText: {
      color: c.slate600,
      fontSize: 13,
      fontWeight: "600",
    },
    cta: {
      width: "100%",
    },
    manageLink: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    manageLinkText: {
      color: c.emeraldDark,
      fontSize: 14,
      fontWeight: "600",
    },
    finePrint: {
      color: c.slate500,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
      paddingHorizontal: spacing.sm,
    },
    pressed: {
      opacity: 0.7,
    },
  });

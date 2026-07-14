import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { hapticTap } from "../../utils/haptics";
import { formatGBP } from "../../utils/currency";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  getInstructorProfile,
  getStudentByUid,
  type InstructorPublicProfile,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function StudentInstructorScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<InstructorPublicProfile | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const studentDoc = await getStudentByUid(user.uid);
      const instructorUid = studentDoc?.instructorId;
      if (instructorUid) {
        setIsLinked(true);
        setProfile(await getInstructorProfile(instructorUid));
      } else {
        setIsLinked(false);
        setProfile(null);
      }
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading your instructor. Pull down to retry."));
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

  const contact = useMemo(() => getContactTarget(profile), [profile]);

  const openContact = useCallback(() => {
    if (!contact) return;
    Linking.openURL(contact.url).catch(() =>
      Alert.alert("Contact did not open", "Check the saved details or try another contact method."),
    );
  }, [contact]);

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
        <Text style={styles.kicker}>Instructor</Text>
        <Text style={styles.title}>Your instructor</Text>
      </View>

      {error ? <NativeNotice icon="warning-outline" message={error} /> : null}

      {!isLinked ? (
        <EmptyState
          iconName="person-circle-outline"
          title="Not linked to an instructor"
          message="Your account isn't linked to an instructor yet. Sign out, then create a new account using your instructor's App7i username (they can share it with you, or scan their invite QR)."
          actionLabel="Sign out"
          onAction={logout}
        />
      ) : !profile ? (
        <EmptyState
          iconName="person-circle-outline"
          title="Profile coming soon"
          message="You're connected to your instructor. Their profile details will appear here once they've finished setting up their App7i account."
        />
      ) : (
        <>
          <View style={styles.profilePanel}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(profile.name)}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.subtle}>App7i driving instructor</Text>
              {profile.adiApproved ? (
                <View style={styles.adiBadge}>
                  <Ionicons name="shield-checkmark" size={13} color={c.white} />
                  <Text style={styles.adiBadgeText}>DVSA Approved (ADI)</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.infoList}>
            {profile.yearsQualified > 0 ? (
              <InfoRow
                icon="ribbon-outline"
                title="Experience"
                value={`${profile.yearsQualified} ${profile.yearsQualified === 1 ? "year" : "years"} qualified`}
              />
            ) : null}
            <InfoRow icon="map-outline" title="Teaching areas" value={profile.areas} />
            <InfoRow icon="car-outline" title="Transmission" value={profile.transmission} />
            <InfoRow
              icon={contact?.kind === "phone" ? "call-outline" : "mail-outline"}
              title="Contact"
              value={contact?.label || "Contact details to confirm"}
            />
          </View>

          {profile.weekdayRate > 0 || profile.sundayRate > 0 || profile.testDayFee > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Rates</Text>
              <View style={styles.infoList}>
                {profile.weekdayRate > 0 ? (
                  <InfoRow
                    icon="cash-outline"
                    title="Weekday lesson"
                    value={`${formatGBP(profile.weekdayRate)} / hr`}
                  />
                ) : null}
                {profile.sundayRate > 0 ? (
                  <InfoRow
                    icon="cash-outline"
                    title="Sunday lesson"
                    value={`${formatGBP(profile.sundayRate)} / hr`}
                  />
                ) : null}
                {profile.testDayFee > 0 ? (
                  <InfoRow
                    icon="car-sport-outline"
                    title="Test-day fee"
                    value={formatGBP(profile.testDayFee)}
                  />
                ) : null}
              </View>
            </>
          ) : null}

          <View style={styles.contactRow}>
            <Pressable
              disabled={!contact}
              onPress={openContact}
              style={({ pressed }) => [
                styles.contactButton,
                !contact && styles.disabled,
                pressed && contact && styles.pressed,
              ]}
            >
              <Ionicons
                name={contact?.kind === "phone" ? "call-outline" : "mail-outline"}
                size={18}
                color={contact ? c.white : c.slate500}
              />
              <Text style={[styles.contactButtonText, !contact && styles.disabledText]}>
                {contact?.kind === "phone" ? "Call" : contact ? "Email" : "Call"}
              </Text>
            </Pressable>

            {profile?.phone ? (
              <Pressable
                onPress={() => {
                  hapticTap();
                  Linking.openURL(toWhatsAppUrl(profile.phone)).catch(() => {});
                }}
                style={({ pressed }) => [styles.waButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Message instructor on WhatsApp"
              >
                <Ionicons name="logo-whatsapp" size={18} color={c.white} />
                <Text style={styles.waButtonText}>WhatsApp</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}

      <View style={styles.logoutWrap}>
        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={c.red} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function InfoRow({
  icon,
  title,
  value,
}: {
  icon: IoniconName;
  title: string;
  value: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={c.emeraldDark} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
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

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function getContactTarget(profile: InstructorPublicProfile | null) {
  if (!profile) return null;
  if (profile.phone) {
    return {
      kind: "phone" as const,
      label: profile.phone,
      url: `tel:${profile.phone.replace(/\s+/g, "")}`,
    };
  }
  if (profile.email) {
    return {
      kind: "email" as const,
      label: profile.email,
      url: `mailto:${profile.email}`,
    };
  }
  return null;
}

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `https://wa.me/44${digits.slice(1)}`;
  if (digits.startsWith("44")) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
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
    lineHeight: 16,
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
  profilePanel: {
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: c.emerald,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  avatarText: {
    color: c.emeraldDark,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.title2,
    color: c.white,
  },
  subtle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  adiBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  adiBadgeText: {
    color: c.white,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  sectionLabel: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  infoList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  infoRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  infoCopy: {
    flex: 1,
    gap: 3,
  },
  infoTitle: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  contactRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  contactButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: c.emerald,
  },
  contactButtonText: {
    color: c.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  waButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#25D366",
  },
  waButtonText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  disabled: {
    backgroundColor: c.slate100,
  },
  disabledText: {
    color: c.slate500,
  },
  logoutWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: spacing.xxl,
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: c.redSoft,
  },
  logoutText: {
    color: c.red,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
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
    lineHeight: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

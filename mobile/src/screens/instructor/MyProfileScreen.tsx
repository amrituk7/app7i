import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextInput } from "../../components/ui/AppTextInput";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { Skeleton } from "../../components/ui/Skeleton";
import { SubscriptionStatusCard } from "../../components/ui/SubscriptionStatusCard";
import { useAuth } from "../../context/AuthContext";
import {
  checkUsernameAvailable,
  getMyInstructorProfile,
  saveInstructorProfile,
  type InstructorProfileTransmission,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { hapticSuccess } from "../../utils/haptics";
import { describeFirestoreError } from "../../utils/firestoreError";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type Availability = "idle" | "checking" | "available" | "taken" | "error";

const transmissionOptions: Array<{
  value: InstructorProfileTransmission;
  label: string;
}> = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "both", label: "Both" },
];

export function MyProfileScreen({ navigation }: { navigation: any }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [transmissions, setTransmissions] = useState<InstructorProfileTransmission>("both");
  const [rating, setRating] = useState("5");
  const [hourlyRate, setHourlyRate] = useState("38");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability>("idle");
  const [error, setError] = useState<string | null>(null);

  const usernameValid = username.length >= 3;
  const canSave = useMemo(
    () =>
      usernameValid &&
      availability === "available" &&
      name.trim().length > 0 &&
      location.trim().length > 0 &&
      !saving,
    [availability, location, name, saving, usernameValid],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const profile = await getMyInstructorProfile();
      if (profile) {
        setUsername(cleanUsername(profile.username));
        setName(profile.name);
        setLocation(profile.location);
        setTransmissions(profile.transmissions);
        setRating(String(profile.rating || 5));
        setHourlyRate(String(profile.hourlyRate || 0));
      } else {
        setName(user?.displayName || "");
        setUsername(cleanUsername(user?.email?.split("@")[0] || ""));
      }
    } catch (err) {
      setError(describeFirestoreError(err, { action: "getMyInstructorProfile", mayBeUnverified: !user?.emailVerified }));
    }
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!usernameValid) {
      setAvailability("idle");
      return;
    }

    setAvailability("checking");
    const timer = setTimeout(() => {
      checkUsernameAvailable(username)
        .then((available) => setAvailability(available ? "available" : "taken"))
        .catch(() => setAvailability("error"));
    }, 400);

    return () => clearTimeout(timer);
  }, [username, usernameValid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await saveInstructorProfile({
        username,
        name,
        location,
        transmissions,
        rating,
        hourlyRate,
      });
      hapticSuccess();
      Alert.alert("Profile saved", "Your public instructor profile is up to date.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /username-taken/i.test(message)
          ? "That username is taken. Try another."
          : describeFirestoreError(err, { action: "saveInstructorProfile", mayBeUnverified: !user?.emailVerified }),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} title="My Profile" />
        <ProfileSkeleton />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <BackHeader onBack={() => navigation.goBack()} title="My Profile" />

      <View style={styles.hero}>
        <Text style={styles.kicker}>Public profile</Text>
        <Text style={styles.title}>Help students find the right instructor.</Text>
        <Text style={styles.copy}>
          This profile powers your public invite and student registration flow.
        </Text>
      </View>

      {error ? <Notice icon="warning-outline" message={error} /> : null}

      <SubscriptionStatusCard user={user} />

      <Card style={styles.formCard}>
        <View>
          <AppTextInput
            label="Username"
            value={username}
            onChangeText={(value) => setUsername(cleanUsername(value))}
            placeholder="app7i_instructor"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <View style={styles.availabilityRow}>
            {availability === "checking" ? <ActivityIndicator size="small" color={c.emerald} /> : null}
            <Text
              style={[
                styles.helper,
                availability === "available" && styles.helperSuccess,
                availability === "taken" && styles.helperError,
              ]}
            >
              {availabilityLabel(availability, usernameValid)}
            </Text>
          </View>
        </View>

        <AppTextInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Smith Driving School"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
        <AppTextInput
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Southall, UB1"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Transmissions</Text>
          <View style={styles.chipRow}>
            {transmissionOptions.map((option) => {
              const active = transmissions === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setTransmissions(option.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const active = Number(rating) === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setRating(String(value))}
                  style={({ pressed }) => [
                    styles.ratingChip,
                    active && styles.ratingChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={active ? "star" : "star-outline"}
                    size={17}
                    color={active ? c.amber : c.slate500}
                  />
                  <Text style={[styles.ratingText, active && styles.ratingTextActive]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <AppTextInput
          label="Hourly rate (£/hr)"
          value={hourlyRate}
          onChangeText={(value) => setHourlyRate(value.replace(/[^0-9.]/g, ""))}
          placeholder="38"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <AppButton label={saving ? "Saving..." : "Save changes"} onPress={onSave} disabled={!canSave} />
      </Card>
    </Screen>
  );
}

function cleanUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function availabilityLabel(status: Availability, valid: boolean) {
  if (!valid) return "Use at least 3 letters, numbers or underscores.";
  if (status === "checking") return "Checking username...";
  if (status === "available") return "Username is available.";
  if (status === "taken") return "That username is taken. Try another.";
  if (status === "error") return "Could not check username. You can retry by editing it.";
  return "Use lowercase letters, numbers or underscores.";
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={22} color={c.slate900} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButton} />
    </View>
  );
}

function Notice({ icon, message }: { icon: IoniconName; message: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={18} color={c.red} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

function ProfileSkeleton() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View>
      <Skeleton height={98} borderRadius={24} style={styles.skeletonBlock} />
      <Skeleton height={420} borderRadius={24} />
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  headerTitle: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  hero: {
    gap: spacing.sm,
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
    lineHeight: 35,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  copy: {
    color: c.slate500,
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    gap: spacing.lg,
  },
  availabilityRow: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  helper: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
  },
  helperSuccess: {
    color: c.green,
  },
  helperError: {
    color: c.red,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    color: c.slate700,
    fontSize: 13,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.slate300,
  },
  chipActive: {
    backgroundColor: c.emeraldSoft,
    borderColor: c.emerald,
  },
  chipText: {
    color: c.slate700,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: c.emeraldDark,
  },
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  ratingChip: {
    minHeight: 42,
    minWidth: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.slate300,
  },
  ratingChipActive: {
    backgroundColor: c.amberSoft,
    borderColor: c.amber,
  },
  ratingText: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "700",
  },
  ratingTextActive: {
    color: c.amber,
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
  skeletonBlock: {
    marginBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

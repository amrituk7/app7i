import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextInput } from "../../components/ui/AppTextInput";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  checkUsernameAvailable,
  saveInstructorProfile,
  type InstructorProfileTransmission,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { hapticSuccess } from "../../utils/haptics";

type Availability = "idle" | "checking" | "available" | "taken" | "error";

const transmissionOptions: Array<{
  value: InstructorProfileTransmission;
  label: string;
}> = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "both", label: "Both" },
];

export function InstructorOnboardingScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { completeInstructorOnboarding, user } = useAuth();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [hourlyRate, setHourlyRate] = useState("38");
  const [transmission, setTransmission] = useState<InstructorProfileTransmission>("manual");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameValid = username.length >= 3;
  const canFinish = useMemo(
    () =>
      usernameValid &&
      availability === "available" &&
      name.trim().length > 0 &&
      postcode.trim().length > 0 &&
      !saving,
    [availability, name, postcode, saving, usernameValid],
  );

  useEffect(() => {
    if (!username && user?.email) {
      setUsername(cleanUsername(user.email.split("@")[0]));
    }
  }, [user?.email, username]);

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

  async function finishSetup() {
    if (!canFinish) return;
    setSaving(true);
    setError(null);
    try {
      await saveInstructorProfile({
        username,
        name,
        location: postcode,
        transmissions: transmission,
        rating: 5,
        hourlyRate,
      });
      hapticSuccess();
      completeInstructorOnboarding(name || "Instructor");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /username-taken/i.test(message)
          ? "That username is taken. Try another."
          : "Setup did not save. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>Instructor setup</Text>
        <Text style={styles.title}>Set up your driving school workspace.</Text>
        <Text style={styles.copy}>This creates the mobile profile used for bookings, student portal access and invoices.</Text>
      </View>

      <Card style={styles.card}>
        <View>
          <AppTextInput
            label="Public username"
            value={username}
            onChangeText={(value) => setUsername(cleanUsername(value))}
            placeholder="smithdriving"
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
          label="Driving school or instructor name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Smith Driving School"
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="organizationName"
          returnKeyType="next"
        />
        <AppTextInput
          label="Main teaching postcode"
          value={postcode}
          onChangeText={setPostcode}
          placeholder="e.g. UB1"
          autoCapitalize="characters"
          autoCorrect={false}
          textContentType="postalCode"
          returnKeyType="next"
        />
        <AppTextInput
          label="Hourly lesson rate"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          keyboardType="number-pad"
          returnKeyType="next"
        />
        <AppTextInput
          label="Default transmission"
          value={transmission}
          editable={false}
        />
        <View style={styles.chipRow}>
          {transmissionOptions.map((option) => {
            const active = transmission === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setTransmission(option.value)}
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AppButton label={saving ? "Saving..." : "Finish setup"} onPress={finishSetup} disabled={!canFinish} />
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
  if (status === "error") return "Could not check username. Edit it to retry.";
  return "Use lowercase letters, numbers or underscores.";
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
  },
  copy: {
    color: c.slate500,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: spacing.md,
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
  errorText: {
    color: c.red,
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

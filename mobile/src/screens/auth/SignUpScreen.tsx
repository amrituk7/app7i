import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextInput } from "../../components/ui/AppTextInput";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  searchInstructorByUid,
  searchInstructorByUsername,
  type InstructorDirectoryEntry,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { UserRole } from "../../types";
import { hapticConfirm, hapticTap } from "../../utils/haptics";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type Step = "role" | "find-instructor" | "form";

export function SignUpScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const initialRole = (route?.params?.role || "instructor") as UserRole;
  const initialInstructorUid = route?.params?.instructorUid as string | undefined;

  const { signup, registerStudent, loading } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [step, setStep] = useState<Step>(
    initialInstructorUid ? "find-instructor" : "role",
  );
  const [usernameQuery, setUsernameQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [instructor, setInstructor] = useState<InstructorDirectoryEntry | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transmission, setTransmission] = useState<"manual" | "automatic">("manual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auto-resolve invite UID from deep-link / QR scan.
  useEffect(() => {
    if (!initialInstructorUid) return;
    setSearching(true);
    setRole("student");
    searchInstructorByUid(initialInstructorUid)
      .then((found) => {
        if (found) {
          setInstructor(found);
          setStep("form");
        }
      })
      .catch(() => undefined)
      .finally(() => setSearching(false));
  }, [initialInstructorUid]);

  function continueAsRole() {
    hapticTap();
    if (role === "instructor") {
      // Instructors keep the simple email+password flow.
      setStep("form");
    } else {
      setStep("find-instructor");
    }
  }

  async function findInstructor() {
    const clean = usernameQuery.trim().toLowerCase();
    if (!clean) {
      Alert.alert("Username required", "Type your instructor's App7i username.");
      return;
    }
    hapticTap();
    setSearching(true);
    setInstructor(null);
    try {
      const found = await searchInstructorByUsername(clean);
      if (!found) {
        Alert.alert(
          "Instructor not found",
          "Double-check the username with your instructor — it's case-insensitive.",
        );
        return;
      }
      hapticConfirm();
      setInstructor(found);
    } catch {
      Alert.alert("Search failed", "Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    if (role === "student") {
      if (!instructor) {
        Alert.alert("Pick an instructor first", "Tap back and search by username.");
        return;
      }
      if (!name.trim()) {
        Alert.alert("Missing details", "Enter your name.");
        return;
      }
      if (!email.trim() || !password.trim()) {
        Alert.alert("Missing details", "Enter your email and password.");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Weak password", "Use at least 6 characters.");
        return;
      }
      try {
        await registerStudent({
          email,
          password,
          name,
          phone,
          transmission,
          instructorId: instructor.uid,
        });
      } catch (error) {
        Alert.alert(
          "Account not created",
          error instanceof Error ? error.message : "Check your details and try again.",
        );
      }
      return;
    }

    // Instructor
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Enter an email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }
    try {
      await signup(email, password, role);
    } catch (error) {
      Alert.alert(
        "Account not created",
        error instanceof Error ? error.message : "Check your details and try again.",
      );
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>A7</Text>
            </View>
            <Text style={styles.title}>
              {step === "role"
                ? "Create account"
                : step === "find-instructor"
                  ? "Find your instructor"
                  : role === "student"
                    ? "Almost there"
                    : "Create account"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "role"
                ? "Pick your role to get started"
                : step === "find-instructor"
                  ? "Search by your instructor's App7i username."
                  : role === "student"
                    ? `Joining ${instructor?.name || "your instructor"}`
                    : "Sign up as an instructor"}
            </Text>
          </View>

          {step === "role" && (
            <>
              <View style={styles.roleRow}>
                <RoleCard
                  icon="briefcase"
                  label="Instructor"
                  description="Manage students and lessons"
                  active={role === "instructor"}
                  onPress={() => setRole("instructor")}
                />
                <RoleCard
                  icon="school"
                  label="Learner"
                  description="Track your driving lessons"
                  active={role === "student"}
                  onPress={() => setRole("student")}
                />
              </View>
              <AppButton label="Continue" onPress={continueAsRole} />
            </>
          )}

          {step === "find-instructor" && (
            <View style={styles.form}>
              <AppTextInput
                label="Instructor username"
                value={usernameQuery}
                onChangeText={(v) =>
                  setUsernameQuery(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="e.g. ravi_driving"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={findInstructor}
              />
              <AppButton
                label={searching ? "Searching…" : "Find instructor"}
                onPress={findInstructor}
                disabled={searching || !usernameQuery.trim()}
              />

              {searching && !instructor && (
                <View style={styles.center}>
                  <ActivityIndicator color={c.emerald} />
                </View>
              )}

              {instructor && (
                <View style={styles.instructorCard}>
                  <View style={styles.instructorAvatar}>
                    <Ionicons name="person" size={22} color={c.white} />
                  </View>
                  <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{instructor.name}</Text>
                    <Text style={styles.instructorMeta}>@{instructor.username}</Text>
                    {!!instructor.location && (
                      <Text style={styles.instructorMeta}>📍 {instructor.location}</Text>
                    )}
                  </View>
                </View>
              )}

              {instructor && (
                <AppButton
                  label={`Continue with ${instructor.name.split(" ")[0]}`}
                  onPress={() => {
                    hapticTap();
                    setStep("form");
                  }}
                />
              )}

              <Pressable
                onPress={() => {
                  hapticTap();
                  setStep("role");
                  setInstructor(null);
                }}
                hitSlop={8}
                style={styles.backLinkWrap}
              >
                <Text style={styles.backLink}>← Pick a different role</Text>
              </Pressable>
            </View>
          )}

          {step === "form" && (
            <View style={styles.form}>
              {role === "student" && (
                <>
                  <AppTextInput
                    label="Your name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Sarah Johnson"
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                  />
                  <AppTextInput
                    label="Phone number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="07700 900000"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    returnKeyType="next"
                  />
                  <View style={styles.transmissionRow}>
                    <Text style={styles.transmissionLabel}>Transmission</Text>
                    <View style={styles.transmissionChips}>
                      <TransmissionChip
                        label="Manual"
                        active={transmission === "manual"}
                        onPress={() => setTransmission("manual")}
                      />
                      <TransmissionChip
                        label="Automatic"
                        active={transmission === "automatic"}
                        onPress={() => setTransmission("automatic")}
                      />
                    </View>
                  </View>
                </>
              )}

              <AppTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <AppTextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <AppButton
                label={loading ? "Creating…" : "Create account"}
                disabled={loading}
                onPress={submit}
              />

              <Pressable
                onPress={() => {
                  hapticTap();
                  setStep(role === "student" ? "find-instructor" : "role");
                }}
                hitSlop={8}
                style={styles.backLinkWrap}
              >
                <Text style={styles.backLink}>← Back</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={styles.signinWrap}
            hitSlop={8}
          >
            <Text style={styles.signinText}>
              Already have an account? <Text style={styles.signinLink}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RoleCard({
  icon,
  label,
  description,
  active,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCard,
        active && styles.roleCardActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
        <Ionicons name={icon} size={22} color={active ? c.white : c.emerald} />
      </View>
      <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{label}</Text>
      <Text style={[styles.roleDesc, active && styles.roleDescActive]}>{description}</Text>
    </Pressable>
  );
}

function TransmissionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.transmissionChip,
        active && styles.transmissionChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.transmissionChipText,
          active && styles.transmissionChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xl, flexGrow: 1 },
  brand: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: c.emerald,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  logoText: {
    color: c.white,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  title: {
    color: c.slate900,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subtitle: {
    color: c.slate500,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: c.slate100,
    gap: 6,
  },
  roleCardActive: {
    backgroundColor: c.emeraldDark,
    borderColor: c.emeraldDark,
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: c.emeraldSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  roleIconWrapActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  roleLabel: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "700",
  },
  roleLabelActive: {
    color: c.white,
  },
  roleDesc: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
  },
  roleDescActive: {
    color: "rgba(255,255,255,0.85)",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  form: {
    gap: spacing.md,
  },
  center: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  instructorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: c.emeraldSoft,
    borderWidth: 1.5,
    borderColor: c.emerald,
  },
  instructorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emerald,
  },
  instructorInfo: {
    flex: 1,
    gap: 2,
  },
  instructorName: {
    color: c.emeraldDark,
    fontSize: 16,
    fontWeight: "700",
  },
  instructorMeta: {
    color: c.slate700,
    fontSize: 12,
    fontWeight: "700",
  },
  transmissionRow: {
    gap: spacing.sm,
  },
  transmissionLabel: {
    color: c.slate700,
    fontSize: 13,
    fontWeight: "700",
  },
  transmissionChips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  transmissionChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.slate100,
  },
  transmissionChipActive: {
    backgroundColor: c.emerald,
    borderColor: c.emerald,
  },
  transmissionChipText: {
    color: c.slate900,
    fontSize: 14,
    fontWeight: "600",
  },
  transmissionChipTextActive: {
    color: c.white,
  },
  backLinkWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backLink: {
    color: c.emerald,
    fontSize: 13,
    fontWeight: "700",
  },
  signinWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: "auto",
  },
  signinText: {
    color: c.slate500,
    fontSize: 14,
  },
  signinLink: {
    color: c.emerald,
    fontWeight: "600",
  },
});

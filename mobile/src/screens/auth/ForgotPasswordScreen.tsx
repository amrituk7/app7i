import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextInput } from "../../components/ui/AppTextInput";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

export function ForgotPasswordScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter the email linked to your App7i account.");
      return;
    }
    setSending(true);
    try {
      await forgotPassword(email);
      Alert.alert("Check your email", "If an account exists, a reset link has been sent.");
    } catch (error) {
      Alert.alert("Reset failed", error instanceof Error ? error.message : "Try again later.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.copy}>Enter the email linked to your App7i account.</Text>
        <Card style={styles.card}>
          <AppTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <AppButton
            label={sending ? "Sending…" : "Send reset link"}
            disabled={sending}
            onPress={submit}
          />
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: { flex: 1 },
  title: {
    color: c.slate900,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  copy: {
    color: c.slate500,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  card: {
    gap: spacing.md,
  },
});

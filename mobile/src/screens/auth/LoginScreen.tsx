import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import type { AuthSessionResult } from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextInput } from "../../components/ui/AppTextInput";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
};

function maskClientId(clientId: string) {
  if (!clientId) return "missing";
  const [projectNumber] = clientId.split("-");
  return `${projectNumber || "unknown"}-...${clientId.slice(-18)}`;
}

function activeGoogleClientId() {
  return Platform.select({
    ios: GOOGLE_CLIENT_IDS.ios,
    android: GOOGLE_CLIENT_IDS.android,
    default: GOOGLE_CLIENT_IDS.web,
  }) || "";
}

type GoogleRequestDebugSource = {
  clientId?: string;
  redirectUri?: string;
  responseType?: string;
  url?: string | null;
};

function googleRequestDebug(request: GoogleRequestDebugSource | null) {
  return {
    platform: Platform.OS,
    activeClientId: maskClientId(activeGoogleClientId()),
    iosClientConfigured: Boolean(GOOGLE_CLIENT_IDS.ios),
    androidClientConfigured: Boolean(GOOGLE_CLIENT_IDS.android),
    webClientConfigured: Boolean(GOOGLE_CLIENT_IDS.web),
    requestClientId: maskClientId(request?.clientId || ""),
    redirectUri: request?.redirectUri || "request-not-loaded",
    responseType: request?.responseType || "request-not-loaded",
    authUrlReady: Boolean(request?.url),
  };
}

function googleErrorMessage(result: AuthSessionResult | null) {
  if (!result || result.type !== "error") return "";
  const params = result.params || {};
  return [
    params.error,
    params.error_description,
    params.error_uri,
  ].filter(Boolean).join(" | ");
}

function logGoogleAuth(stage: string, request: GoogleRequestDebugSource | null, extra?: Record<string, unknown>) {
  console.warn("[LoginScreen] Google auth diagnostic", {
    stage,
    ...googleRequestDebug(request),
    ...extra,
  });
}

// True only when the client ID for the *current platform* is actually present
// in the JS bundle. If a client ID is missing the Google hook throws on render
// (e.g. "Client Id property `androidClientId` must be defined to use Google
// auth on this platform"), so we must not call the hook at all in that case.
function isGoogleClientConfigured(): boolean {
  const id = activeGoogleClientId();
  return Boolean(id && id.trim());
}

export function LoginScreen({ navigation }: { navigation: any }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const {
    login,
    signInWithApple,
    signInWithGoogleIdToken,
    loading,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleConfigured = isGoogleClientConfigured();

  async function submit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert(
        "Sign in failed",
        error instanceof Error ? error.message : "Check your details and try again.",
      );
    }
  }

  async function handleApple() {
    try {
      await signInWithApple();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Apple sign-in failed.";
      if (!/cancel/i.test(msg)) Alert.alert("Apple sign-in", msg);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>A7</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your App7i account</Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
          />
          <AppTextInput
            label="Password"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />

          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotWrap}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <AppButton
            label={loading ? "Signing in…" : "Sign in"}
            disabled={loading}
            onPress={submit}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {googleConfigured ? (
            <GoogleSignInButton onIdToken={signInWithGoogleIdToken} />
          ) : null}

          {Platform.OS === "ios" && (
            <Pressable
              onPress={handleApple}
              style={({ pressed }) => [styles.social, pressed && styles.pressed]}
            >
              <Ionicons name="logo-apple" size={20} color={c.slate900} />
              <Text style={styles.socialText}>Continue with Apple</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={styles.signupWrap}
          hitSlop={8}
        >
          <Text style={styles.signupText}>
            New to App7i? <Text style={styles.signupLink}>Create account</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/**
 * Google sign-in button. Only render this when a client ID is actually
 * configured for the current platform — `useIdTokenAuthRequest` throws a
 * synchronous "Client Id property `androidClientId` must be defined to use
 * Google auth on this platform" if the relevant client ID is missing or
 * empty (which can happen when the EAS env var is set to "Sensitive"
 * visibility — sensitive vars don't inline into the JS bundle).
 *
 * Hosting the hook in a dedicated component keeps the rules of hooks intact
 * (the hook is unconditionally called within this component) while letting
 * the parent skip rendering us entirely.
 */
function GoogleSignInButton({
  onIdToken,
}: {
  onIdToken: (idToken: string) => Promise<unknown>;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (request) {
      logGoogleAuth("request-loaded", request);
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === "error") {
      const message = googleErrorMessage(response);
      logGoogleAuth("oauth-error-response", request, {
        errorMessage: message,
        params: response.params,
      });
      Alert.alert(
        "Google sign-in blocked",
        message || "Google rejected this OAuth request before Firebase received it. Check the Google OAuth client and redirect setup.",
      );
      return;
    }

    if (response?.type === "success") {
      const idToken = response.params?.id_token;
      if (idToken) {
        onIdToken(idToken).catch((error) => {
          logGoogleAuth("firebase-credential-failed", request, {
            errorMessage: error instanceof Error ? error.message : String(error),
          });
          Alert.alert(
            "Google sign-in failed",
            error instanceof Error ? error.message : "Try again.",
          );
        });
      } else {
        logGoogleAuth("missing-id-token", request, {
          params: response.params,
        });
        Alert.alert(
          "Google sign-in failed",
          "Google did not return an ID token. Check the OAuth client ID and redirect URI setup.",
        );
      }
    }
  }, [request, response, onIdToken]);

  async function handleGoogle() {
    if (!request) {
      logGoogleAuth("request-not-loaded", request);
      Alert.alert(
        "Google sign-in",
        "Loading Google sign-in. Try again in a moment.",
      );
      return;
    }
    try {
      logGoogleAuth("prompt-start", request);
      const result = await promptAsync();
      logGoogleAuth("prompt-finished", request, {
        resultType: result.type,
        errorMessage: googleErrorMessage(result),
        params: result.type === "error" ? result.params : undefined,
      });
    } catch (error) {
      logGoogleAuth("prompt-threw", request, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      Alert.alert(
        "Google sign-in failed",
        error instanceof Error ? error.message : "Try again.",
      );
    }
  }

  return (
    <Pressable
      disabled={!request}
      onPress={handleGoogle}
      style={({ pressed }) => [styles.social, pressed && styles.pressed]}
    >
      <Ionicons name="logo-google" size={20} color={c.slate900} />
      <Text style={styles.socialText}>Continue with Google</Text>
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: { flex: 1 },
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
  },
  subtitle: {
    color: c.slate500,
    fontSize: 15,
  },
  form: {
    gap: spacing.md,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    marginTop: -spacing.sm,
  },
  forgotText: {
    color: c.emerald,
    fontSize: 13,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.slate100,
  },
  dividerText: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  social: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: 14,
  },
  socialText: {
    color: c.slate900,
    fontSize: 17,
    fontWeight: "400",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  signupWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: "auto",
  },
  signupText: {
    color: c.slate500,
    fontSize: 14,
  },
  signupLink: {
    color: c.emerald,
    fontWeight: "600",
  },
});

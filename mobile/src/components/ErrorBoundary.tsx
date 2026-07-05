import { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { captureAppException } from "../services/sentry";

type Props = {
  children: ReactNode;
  screenName?: string;
  onReset?: () => void;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const screen = this.props.screenName || "Unknown";
    console.error("[Crash]", screen, error, info?.componentStack);
    captureAppException(error, { screenName: screen, componentStack: info?.componentStack });
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error?.message || "Something went wrong on this screen.";

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.red} />
        </View>
        <Text style={styles.title}>Something went wrong.</Text>
        <Text style={styles.copy}>
          The rest of the app is still working. You can return to the home screen and try again.
        </Text>
        <Text style={styles.detail} numberOfLines={3}>
          {message}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={this.reset}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>Return to Home</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.redSoft,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.slate900,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  copy: {
    color: colors.slate500,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  detail: {
    color: colors.slate700,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonLabel: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
});

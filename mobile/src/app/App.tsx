import { useEffect, useState, type PropsWithChildren } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Platform, UIManager, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { AppNavigator } from "../navigation/AppNavigator";
import { AppUpdateGate } from "../components/AppUpdateGate";
import { initSentry, wrapWithSentry } from "../services/sentry";
import {
  markBootInProgress,
  recoverIfPreviousBootFailed,
  scheduleStableBootMarker,
} from "../services/bootRecovery";
import { rngh } from "../utils/rngh";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import { SPLASH_BG } from "../theme/colors";

// react-native-gesture-handler requires its root view at the absolute top of
// the tree. We fall back to a plain View on APKs that don't have the native
// module yet (drag-to-reschedule then falls back to the action-sheet path).
function GestureRoot({ children }: PropsWithChildren) {
  if (!rngh.isAvailable || !rngh.GestureHandlerRootView) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  const Root = rngh.GestureHandlerRootView as React.ComponentType<PropsWithChildren<{ style?: object }>>;
  return <Root style={{ flex: 1 }}>{children}</Root>;
}

initSentry();

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function App() {
  // Boot recovery runs synchronously in an effect so the very first frame
  // can render — if the previous boot of this OTA crashed we trigger a
  // reloadAsync() which restarts the app from the embedded bundle.
  const [bootChecked, setBootChecked] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let settled = false;

    // Hard 4s timeout — never let bootRecovery (AsyncStorage hang, slow OTA
    // checkForUpdateAsync) block the app from rendering. If we time out, the
    // app proceeds with normal startup; bootRecovery's own state is fully
    // defensive and any in-flight work will complete in the background.
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn("[App] bootRecovery timed out after 4000ms — proceeding");
      setBootChecked(true);
    }, 4000);

    // After ~800ms of waiting, show a spinner so the user gets visual feedback
    // instead of staring at a pure blank screen.
    const spinnerId = setTimeout(() => {
      if (!settled) setShowSpinner(true);
    }, 800);

    (async () => {
      const willReload = await recoverIfPreviousBootFailed();
      if (willReload) return; // App is about to reload; render nothing further.
      await markBootInProgress();
      if (settled) return;
      settled = true;
      setBootChecked(true);
      cleanup = scheduleStableBootMarker();
    })().catch(() => {
      // bootRecovery is fully defensive but be doubly safe — never block
      // app render if AsyncStorage or expo-updates throw.
      if (settled) return;
      settled = true;
      setBootChecked(true);
    });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(spinnerId);
      if (cleanup) cleanup();
    };
  }, []);

  // Render a blank view (matches splash background) until we know whether
  // we're recovering. Typically <100ms; if it takes longer we surface a
  // spinner so the user knows the app is alive.
  if (!bootChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BG, alignItems: "center", justifyContent: "center" }}>
        {showSpinner ? <ActivityIndicator color="#ffffff" /> : null}
      </View>
    );
  }

  return (
    <GestureRoot>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AdaptiveStatusBar />
            <AppNavigator />
            <AppUpdateGate />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureRoot>
  );
}

function AdaptiveStatusBar() {
  const { effective } = useTheme();
  return <StatusBar style={effective === "dark" ? "light" : "dark"} />;
}

export default wrapWithSentry(App);

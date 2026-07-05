import { useEffect, useRef } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

function extractInstructorUid(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/[?&]instructor=([^&]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function WelcomeScreen({ navigation }: { navigation: any }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const handledUrl = useRef<string | null>(null);

  useEffect(() => {
    function handle(url: string | null) {
      if (!url || handledUrl.current === url) return;
      const uid = extractInstructorUid(url);
      if (uid) {
        handledUrl.current = url;
        navigation.navigate("SignUp", { role: "student", instructorUid: uid });
      }
    }
    Linking.getInitialURL().then(handle).catch(() => undefined);
    const sub = Linking.addEventListener("url", (event) => handle(event.url));
    return () => sub.remove();
  }, [navigation]);

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>A7</Text>
        </View>
        <Text style={styles.kicker}>The CRM for UK driving instructors</Text>
        <Text style={styles.title}>Manage students, lessons and earnings in one place.</Text>
        <Text style={styles.copy}>
          DVSA-aligned progress tracking, anonymous student feedback, calendar sync — built for UK ADIs and their learners.
        </Text>
      </View>

      <Card style={styles.card}>
        <AppButton label="Sign in" onPress={() => navigation.navigate("Login")} />
        <AppButton label="Create instructor account" variant="secondary" onPress={() => navigation.navigate("SignUp", { role: "instructor" })} />
        <AppButton label="Create student account" variant="ghost" onPress={() => navigation.navigate("SignUp", { role: "student" })} />
      </Card>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emerald,
  },
  logoText: {
    color: c.white,
    fontSize: 24,
    fontWeight: "700",
  },
  kicker: {
    color: c.emerald,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: c.slate900,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "700",
  },
  copy: {
    color: c.slate500,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: spacing.md,
    margin: spacing.lg,
  },
});

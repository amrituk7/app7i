import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  getLatestFeedbackSummary,
  type InstructorFeedbackSummary,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

function formatGenerated(ms: number) {
  if (!ms) return "";
  const date = new Date(Number(ms));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FeedbackSummaryScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<InstructorFeedbackSummary | null>(null);

  async function load() {
    if (!user?.uid) return;
    try {
      const data = await getLatestFeedbackSummary(user.uid);
      setSummary(data);
    } catch (err) {
      console.error("[FeedbackSummary] load failed", err);
    }
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [user?.uid]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  if (!summary) {
    return (
      <Screen
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
        }
      >
        <Text style={styles.kicker}>Anonymous · grouped</Text>
        <Text style={styles.title}>Student feedback</Text>
        <EmptyState
          iconName="chatbubble-ellipses-outline"
          title="No summary yet"
          message="Your first feedback summary will appear here once at least 10 students have submitted anonymous feedback. The 10-response threshold protects student anonymity."
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <Text style={styles.kicker}>Anonymous · grouped</Text>
      <Text style={styles.title}>Student feedback summary</Text>
      <Text style={styles.meta}>
        Based on {summary.basedOnCount} responses · average rating {summary.averageRating}/5
        {summary.generatedAt ? ` · generated ${formatGenerated(summary.generatedAt)}` : ""}
      </Text>

      <Card style={[styles.section, styles.sectionLiked]}>
        <Text style={styles.sectionTitle}>Students liked</Text>
        <Text style={styles.sectionBody}>{summary.liked}</Text>
      </Card>

      <Card style={[styles.section, styles.sectionMore]}>
        <Text style={styles.sectionTitle}>Students would like more of</Text>
        <Text style={styles.sectionBody}>{summary.wantMore}</Text>
      </Card>

      <Card style={[styles.section, styles.sectionSuggestion]}>
        <Text style={styles.sectionTitle}>Suggested improvement</Text>
        <Text style={styles.sectionBody}>{summary.suggestion}</Text>
      </Card>

      <Text style={styles.footnote}>
        Individual responses are never shown. Summaries regenerate after every 10 new responses.
      </Text>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
  kicker: {
    color: c.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 31,
    marginTop: spacing.xs,
  },
  meta: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: c.emerald,
    backgroundColor: c.emeraldSoft,
    gap: spacing.xs,
  },
  sectionLiked: {
    borderLeftColor: c.emerald,
    backgroundColor: c.emeraldSoft,
  },
  sectionMore: {
    borderLeftColor: c.amber,
    backgroundColor: c.amberSoft,
  },
  sectionSuggestion: {
    borderLeftColor: c.blue,
    backgroundColor: c.blueSoft,
  },
  sectionTitle: {
    color: c.slate900,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionBody: {
    color: c.slate700,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  footnote: {
    color: c.slate500,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.md,
  },
});

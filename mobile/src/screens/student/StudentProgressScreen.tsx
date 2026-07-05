import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { getSkillResource } from "../../data/skillResources";
import { FadeInView } from "../../components/ui/FadeInView";
import { Screen } from "../../components/ui/Screen";
import { Skeleton } from "../../components/ui/Skeleton";
import { RoadToLicenseCard } from "../../components/student/RoadToLicenseCard";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentByUid,
  getStudentSkillsAggregate,
  type StudentSkillAggregate,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function StudentProgressScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [skills, setSkills] = useState<StudentSkillAggregate[]>([]);
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const studentDoc = await getStudentByUid(user.uid);
      if (!studentDoc) {
        setLinked(false);
        setSkills([]);
        return;
      }
      setLinked(true);
      const aggregate = await getStudentSkillsAggregate(studentDoc.id, 50);
      setSkills(aggregate.slice(0, 8));
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading your progress. Pull down to retry."));
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

  const averageProgress = useMemo(() => {
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum, skill) => sum + skill.percent, 0);
    return Math.round(total / skills.length);
  }, [skills]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.skillList}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.skillRow}>
              <View style={styles.skillTop}>
                <Skeleton width="58%" height={16} borderRadius={999} />
                <Skeleton width={44} height={16} borderRadius={999} />
              </View>
              <Skeleton height={9} borderRadius={999} />
            </View>
          ))}
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
        <View>
          <Text style={styles.kicker}>Skills</Text>
          <Text style={styles.title}>Progress</Text>
        </View>
        {skills.length > 0 ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.score}>{averageProgress}%</Text>
            <Text style={styles.scoreLabel}>avg</Text>
          </View>
        ) : null}
      </View>

      {error ? <NativeNotice icon="warning-outline" message={error} /> : null}

      {linked && skills.length > 0 ? (
        <RoadToLicenseCard aggregate={skills} />
      ) : null}

      {skills.length === 0 ? (
        linked ? (
          <EmptyState
            iconName="trending-up-outline"
            title="Your progress starts here"
            description="After a few lessons, your instructor's ratings appear as bars."
          />
        ) : (
          <EmptyState
            iconName="link-outline"
            title="You're nearly connected"
            description={`Ask your instructor to add you with ${user?.email || "this email"}. Progress appears after linking.`}
          />
        )
      ) : (
        <View style={styles.skillList}>
          {skills.map((skill, index) => (
            <FadeInView key={skill.key} delay={index * 80}>
              <SkillRow skill={skill} delay={index * 80} />
            </FadeInView>
          ))}
        </View>
      )}
    </Screen>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function SkillRow({ skill, delay }: { skill: StudentSkillAggregate; delay: number }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    width.setValue(0);
    const animation = Animated.timing(width, {
      toValue: skill.percent,
      duration: 800,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [delay, skill.percent, width]);

  const animatedWidth = width.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  // Surface a learning resource only for genuinely weak skills (< 50%) — at
  // higher ratings the student doesn't need extra reading and the link
  // becomes noise.
  const resource = skill.percent < 50 ? getSkillResource(skill.key) : null;

  return (
    <View style={styles.skillRow}>
      <View style={styles.skillTop}>
        <View style={styles.skillNameWrap}>
          <Text style={styles.skillName}>{skill.label}</Text>
          <Text style={styles.skillMeta}>
            {skill.lessonsRated} {skill.lessonsRated === 1 ? "lesson" : "lessons"} rated
          </Text>
        </View>
        <Text style={styles.skillPercent}>{skill.percent}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: animatedWidth }]} />
      </View>
      {resource ? (
        <Pressable
          onPress={() => Linking.openURL(resource.url).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`Open ${resource.title}`}
          style={({ pressed }) => [styles.resourceRow, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="play-circle-outline" size={16} color={c.emerald} />
          <Text style={styles.resourceTitle} numberOfLines={1}>
            {resource.title}
          </Text>
          {resource.durationLabel ? (
            <Text style={styles.resourceMeta}>{resource.durationLabel}</Text>
          ) : null}
          <Ionicons name="open-outline" size={14} color={c.slate500} />
        </Pressable>
      ) : null}
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

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
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
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  scoreBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  score: {
    color: c.emeraldDark,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  scoreLabel: {
    color: c.slate500,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  skillList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  skillRow: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  skillTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  skillNameWrap: {
    flex: 1,
    gap: 3,
  },
  skillName: {
    color: c.slate900,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  skillMeta: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  skillPercent: {
    color: c.emeraldDark,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: c.slate100,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: c.emerald,
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
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.emeraldSoft,
  },
  resourceTitle: {
    flex: 1,
    color: c.emeraldDark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  resourceMeta: {
    color: c.emeraldDark,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "600",
    opacity: 0.7,
  },
});

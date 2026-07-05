import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import {
  SKILL_CATEGORY_ORDER,
  categoryForSkill,
  type SkillCategory,
  type StudentSkillAggregate,
} from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

// Static catalog of every DVSA skill App7i tracks. Mirrors src/utils/instructorInsights.js
// SKILL_DEFINITIONS so per-category totals are stable even when a student has
// never been rated on a skill yet.
const SYLLABUS: Array<{ key: string; label: string }> = [
  { key: "cockpitChecks", label: "Cockpit checks" },
  { key: "movingOff", label: "Moving off and stopping" },
  { key: "mirrors", label: "Mirrors and signals" },
  { key: "useOfSpeed", label: "Use of speed" },
  { key: "junctions", label: "Junctions and emerging" },
  { key: "roundabouts", label: "Roundabouts" },
  { key: "pedestrianCrossings", label: "Pedestrian crossings" },
  { key: "positioning", label: "Position and lane discipline" },
  { key: "awareness", label: "Awareness and planning" },
  { key: "dualCarriageways", label: "Dual carriageways" },
  { key: "independentDriving", label: "Independent driving" },
  { key: "parallelParking", label: "Parallel parking" },
  { key: "forwardParking", label: "Forward bay parking" },
  { key: "reverseParking", label: "Reverse bay parking" },
];

const TOTAL_SKILLS = SYLLABUS.length;
const TEST_READY_THRESHOLD = 10;

type Props = {
  aggregate: StudentSkillAggregate[];
  onSeeDetails?: () => void;
};

type CategoryStat = {
  name: SkillCategory;
  total: number;
  competent: number;
  rated: number;
};

function buildCategoryStats(aggregate: StudentSkillAggregate[]): CategoryStat[] {
  const totalsByCategory = new Map<SkillCategory, number>();
  for (const skill of SYLLABUS) {
    const cat = categoryForSkill(skill.key);
    totalsByCategory.set(cat, (totalsByCategory.get(cat) || 0) + 1);
  }

  const aggregateByCategory = new Map<SkillCategory, { competent: number; rated: number }>();
  for (const entry of aggregate) {
    const cat = categoryForSkill(entry.key);
    const cur = aggregateByCategory.get(cat) || { competent: 0, rated: 0 };
    aggregateByCategory.set(cat, {
      competent: cur.competent + (entry.averageRating >= 4 ? 1 : 0),
      rated: cur.rated + 1,
    });
  }

  return SKILL_CATEGORY_ORDER
    .filter((cat) => (totalsByCategory.get(cat) || 0) > 0)
    .map((cat) => ({
      name: cat,
      total: totalsByCategory.get(cat) || 0,
      competent: aggregateByCategory.get(cat)?.competent || 0,
      rated: aggregateByCategory.get(cat)?.rated || 0,
    }));
}

export function RoadToLicenseCard({ aggregate, onSeeDetails }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const stats = useMemo(() => buildCategoryStats(aggregate), [aggregate]);
  const totalCompetent = stats.reduce((sum, s) => sum + s.competent, 0);
  const percent = Math.round((totalCompetent / TOTAL_SKILLS) * 100);
  const isReady = totalCompetent >= TEST_READY_THRESHOLD;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Road to license</Text>
        <View style={styles.xp}>
          <Text style={styles.xpValue}>{percent}%</Text>
        </View>
      </View>

      <Text style={styles.title}>
        {isReady
          ? "🏁 Test ready — book your test"
          : totalCompetent === 0
            ? "Your journey starts here"
            : `${totalCompetent} of ${TOTAL_SKILLS} skills competent`}
      </Text>

      <Text style={styles.subtitle}>
        {isReady
          ? "Your instructor has rated you Competent on enough core DVSA skills."
          : `${TEST_READY_THRESHOLD - totalCompetent} more to unlock the Test ready milestone.`}
      </Text>

      <View style={styles.stages}>
        {stats.map((stat) => {
          const ratio = stat.total > 0 ? stat.competent / stat.total : 0;
          const complete = ratio >= 1;
          return (
            <View key={stat.name} style={styles.stageRow}>
              <Text style={styles.stageLabel} numberOfLines={1}>
                {stat.name}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
              </View>
              <Text style={styles.count}>
                {stat.competent}/{stat.total}
              </Text>
              <Ionicons
                name={complete ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={complete ? c.green : c.slate300}
              />
            </View>
          );
        })}
      </View>

      {onSeeDetails ? (
        <Pressable
          onPress={onSeeDetails}
          style={({ pressed }) => [styles.detailsLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.detailsText}>See skill detail</Text>
          <Ionicons name="chevron-forward" size={14} color={c.emerald} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: {
    color: c.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  xp: {
    backgroundColor: c.emeraldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  xpValue: { color: c.emeraldDark, fontWeight: "700", fontSize: 13 },
  title: { color: c.slate900, fontSize: 18, fontWeight: "700" },
  subtitle: { color: c.slate700, fontSize: 13, fontWeight: "600" },
  stages: { gap: spacing.sm, marginTop: spacing.sm },
  stageRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stageLabel: { flex: 1, color: c.slate700, fontSize: 13, fontWeight: "600" },
  track: {
    width: 80,
    height: 6,
    borderRadius: 999,
    backgroundColor: c.slate100,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: c.emerald },
  count: { color: c.slate700, fontSize: 11, fontWeight: "700", minWidth: 28 },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  detailsText: { color: c.emerald, fontSize: 13, fontWeight: "700" },
});

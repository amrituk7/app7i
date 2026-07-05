import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import type { ColorPalette } from "../theme/colors";
import { useThemedStyles } from "../theme/useThemedStyles";
import { spacing } from "../theme/spacing";
import type { ReadinessResult } from "../utils/testReadiness";

type Props = {
  readiness: ReadinessResult;
  onEdit?: () => void;
  /** When false the gates are read-only — used on the student-facing Home. */
  showEditAction?: boolean;
};

export function TestReadinessCard({ readiness, onEdit, showEditAction = true }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { gates, doneCount, totalCount, isReady } = readiness;

  return (
    <Card style={[styles.card, isReady && styles.cardReady]}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Test readiness</Text>
        <View style={[styles.badge, isReady && styles.badgeReady]}>
          <Text style={[styles.badgeText, isReady && styles.badgeTextReady]}>
            {isReady ? "🏁 Test ready" : `${doneCount} of ${totalCount}`}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        {isReady
          ? "Every box is ticked — book the test"
          : doneCount === 0
            ? "Six things to tick off before test day"
            : `${totalCount - doneCount} thing${totalCount - doneCount === 1 ? "" : "s"} left`}
      </Text>

      <View style={styles.gateList}>
        {gates.map((gate) => (
          <View key={gate.key} style={styles.gateRow}>
            <Ionicons
              name={gate.done ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={gate.done ? styles.iconDone.color : styles.iconPending.color}
            />
            <View style={styles.gateBody}>
              <Text style={[styles.gateLabel, gate.done && styles.gateLabelDone]}>
                {gate.label}
              </Text>
              {gate.detail ? <Text style={styles.gateDetail}>{gate.detail}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {showEditAction && onEdit ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="create-outline" size={14} color={styles.editBtnText.color} />
          <Text style={styles.editBtnText}>Update test details</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: c.emerald,
  },
  cardReady: {
    borderLeftColor: c.green,
    backgroundColor: c.greenSoft,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    color: c.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  badge: {
    backgroundColor: c.emeraldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeReady: { backgroundColor: c.green },
  badgeText: { color: c.emeraldDark, fontWeight: "700", fontSize: 12 },
  badgeTextReady: { color: c.white },
  title: { color: c.slate900, fontSize: 16, fontWeight: "700" },
  gateList: { gap: 8, marginTop: spacing.xs },
  gateRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  gateBody: { flex: 1, gap: 2 },
  gateLabel: { color: c.slate900, fontSize: 13, fontWeight: "700" },
  gateLabelDone: { color: c.slate700 },
  gateDetail: { color: c.slate600, fontSize: 12, fontWeight: "600" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: c.emeraldSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  editBtnText: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "700",
  },
  // Colour tokens for icon tints — accessed via styles.iconX.color
  iconDone: { color: c.green },
  iconPending: { color: c.slate500 },
});

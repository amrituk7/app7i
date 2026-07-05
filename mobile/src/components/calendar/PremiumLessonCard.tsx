import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson } from "../../types";
import type { ConflictKind } from "../../utils/scheduleConflicts";
import { rngh } from "../../utils/rngh";

// Pixel-per-15-min derived from DayTimeGrid HOUR_HEIGHT (64px) — must stay in sync.
const SLOT_PX = 16;

type Props = {
  lesson: Lesson;
  conflicts?: ConflictKind[];
  onPress?: () => void;
  /** Called when long-press fires WITHOUT a drag (the action-sheet path). */
  onLongPress?: () => void;
  /** Called when the user drags the card and releases — `deltaMinutes` is the
   *  snapped offset from the original start time. Negative = earlier. */
  onDrop?: (deltaMinutes: number) => void;
  /** Fires during drag with the current snapped delta. Used by the grid to
   *  render a ghost target line + time label. */
  onDragMove?: (deltaMinutes: number) => void;
  /** Fires when drag starts (after long-press activation). */
  onDragStart?: () => void;
  /** Fires when drag ends (any reason — release, cancel, terminate). */
  onDragEnd?: () => void;
  /** Pixel height for absolute positioning inside DayTimeGrid. */
  height: number;
  /** Pixel offset from the top of the grid. */
  top: number;
};

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function formatTimeRange(start: string, durationMinutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const startTotal = (h || 0) * 60 + (m || 0);
  const endTotal = startTotal + durationMinutes;
  const fmt = (mins: number) => {
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    return `${hh}:${String(mm).padStart(2, "0")}`;
  };
  return `${fmt(startTotal)} – ${fmt(endTotal)}`;
}

function paymentTone(status: Lesson["paymentStatus"], c: ColorPalette): { bg: string; fg: string; label: string } {
  if (status === "paid") return { bg: c.greenSoft, fg: c.green, label: "Paid" };
  if (status === "not_paid" || status === "unpaid")
    return { bg: c.amberSoft, fg: c.amber, label: "Unpaid" };
  return { bg: c.slate100, fg: c.slate500, label: "Pending" };
}

function buildConflictLabel(c: ColorPalette): Record<ConflictKind, { icon: string; tint: string }> {
  return {
    overlap: { icon: "⚠ Overlap", tint: c.red },
    double_booking: { icon: "⚠ Double-booked", tint: c.red },
    tight_travel: { icon: "⚠ Tight travel", tint: c.amber },
    gap: { icon: "", tint: "" },
  };
}

export function PremiumLessonCard({
  lesson,
  conflicts,
  onPress,
  onLongPress,
  onDrop,
  onDragMove,
  onDragStart,
  onDragEnd,
  height,
  top,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const palette = useColors();
  const tone = paymentTone(lesson.paymentStatus, palette);
  const cancelled = lesson.status === "cancelled";
  const compact = height < 70;

  const topConflict = (conflicts || []).find((k) => k !== "gap");
  const hasConflict = Boolean(topConflict);
  const conflictMeta = topConflict ? buildConflictLabel(palette)[topConflict] : null;

  // Drag state — only used when RNGH is available + onDrop is provided
  const translateY = useRef(new Animated.Value(0)).current;
  const liftScale = useRef(new Animated.Value(1)).current;

  // Visual lift on long-press start (no drag yet)
  function lift() {
    Animated.parallel([
      Animated.spring(liftScale, { toValue: 1.04, useNativeDriver: true, friction: 8 }),
    ]).start();
  }

  function settle() {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.spring(liftScale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();
  }

  // Build the gesture if RNGH is loaded and drag is requested. Otherwise we
  // skip the wrapper and render the same content as a plain Pressable.
  const canDrag = rngh.isAvailable && typeof onDrop === "function";

  // Snap to nearest 15-min slot
  function snapDeltaMinutes(translatePx: number): number {
    const slots = Math.round(translatePx / SLOT_PX);
    return slots * 15;
  }

  const cardContent = (
    <Animated.View
      style={[
        styles.cardInner,
        canDrag && { transform: [{ translateY }, { scale: liftScale }] },
      ]}
    >
      {/* Status accent bar on the left edge */}
      <View
        style={[
          styles.accent,
          {
            backgroundColor: cancelled
              ? palette.slate300
              : hasConflict
                ? conflictMeta?.tint || palette.red
                : palette.emerald,
          },
        ]}
      />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(lesson.studentName)}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.studentName} numberOfLines={1}>
              {lesson.studentName}
            </Text>
            <Text style={styles.timeText} numberOfLines={1}>
              {formatTimeRange(lesson.time, lesson.durationMinutes)}
            </Text>
          </View>
          <View style={[styles.paymentPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.paymentText, { color: tone.fg }]}>{tone.label}</Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.metaRow}>
            {lesson.pickup ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={11} color={palette.slate600} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {lesson.pickup}
                </Text>
              </View>
            ) : null}
            {lesson.recurringGroupId && lesson.recurringIndex && lesson.recurringWeeks ? (
              <View style={styles.metaChip}>
                <Ionicons name="repeat" size={11} color={palette.slate600} />
                <Text style={styles.metaText}>
                  {lesson.recurringIndex}/{lesson.recurringWeeks}
                </Text>
              </View>
            ) : null}
            {lesson.notes ? (
              <View style={styles.metaChip}>
                <Ionicons name="document-text-outline" size={11} color={palette.slate600} />
                <Text style={styles.metaText}>Notes</Text>
              </View>
            ) : null}
          </View>
        )}

        {hasConflict && conflictMeta ? (
          <View style={styles.conflictBanner}>
            <Text style={[styles.conflictText, { color: conflictMeta.tint }]} numberOfLines={1}>
              {conflictMeta.icon}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );

  const baseStyle = [
    styles.cardOuter,
    {
      top,
      height,
      backgroundColor: cancelled ? palette.surfaceMuted : palette.surface,
      opacity: cancelled ? 0.6 : 1,
    },
    hasConflict && styles.cardConflict,
  ];

  // RNGH path: composed long-press + pan with snap-on-release.
  // The gesture object is typed loosely (any) because the shim that lazy-loads
  // it loses type info — the runtime is what matters here.
  if (canDrag) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Gesture = rngh.Gesture as any;
    const Detector = rngh.GestureDetector as React.ComponentType<{
      gesture: unknown;
      children: React.ReactNode;
    }>;

    const panGesture = Gesture.Pan()
      .activateAfterLongPress(350)
      .onStart(() => {
        lift();
        if (onDragStart) onDragStart();
      })
      .onUpdate((e: { translationY: number }) => {
        translateY.setValue(e.translationY);
        if (onDragMove) {
          const delta = snapDeltaMinutes(e.translationY);
          onDragMove(delta);
        }
      })
      .onEnd((e: { translationY: number }) => {
        const delta = snapDeltaMinutes(e.translationY);
        if (onDragEnd) onDragEnd();
        if (Math.abs(delta) < 15) {
          // Treated as "long-press without drag" — fall back to the action sheet.
          settle();
          if (onLongPress) onLongPress();
        } else {
          // Snap the card to its new slot visually then commit.
          Animated.spring(translateY, {
            toValue: (delta / 15) * SLOT_PX,
            useNativeDriver: true,
            friction: 8,
          }).start();
          if (onDrop) onDrop(delta);
          setTimeout(() => settle(), 50);
        }
      });

    return (
      <Detector gesture={panGesture}>
        <Pressable
          onPress={onPress}
          accessibilityLabel={`${lesson.studentName} ${lesson.time}, long-press to reschedule`}
          style={({ pressed }) => [...baseStyle, pressed && styles.pressed]}
        >
          {cardContent}
        </Pressable>
      </Detector>
    );
  }

  // Fallback path (no RNGH): use plain Pressable with onLongPress → action sheet
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [...baseStyle, pressed && styles.pressed]}
    >
      {cardContent}
    </Pressable>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  cardOuter: {
    position: "absolute",
    left: 64,
    right: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flex: 1,
    flexDirection: "row",
  },
  cardConflict: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.amber,
  },
  pressed: {
    opacity: 0.7,
  },
  accent: {
    width: 3,
  },
  body: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    justifyContent: "center",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  avatarText: { color: c.emeraldDark, fontWeight: "600", fontSize: 11 },
  headerCopy: { flex: 1, gap: 1 },
  studentName: { color: c.slate900, fontSize: 14, fontWeight: "600", letterSpacing: -0.2 },
  timeText: { color: c.slate500, fontSize: 12, fontWeight: "500" },
  paymentPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  paymentText: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: c.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: "60%",
  },
  metaText: { color: c.slate600, fontSize: 11, fontWeight: "500" },
  conflictBanner: { marginTop: 2 },
  conflictText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.2 },
});

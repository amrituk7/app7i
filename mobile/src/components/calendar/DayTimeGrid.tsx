import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson } from "../../types";
import {
  conflictsByLesson,
  detectConflicts,
  enrichLessons,
} from "../../utils/scheduleConflicts";
import { PremiumLessonCard } from "./PremiumLessonCard";

const HOUR_HEIGHT = 64;
const FIRST_HOUR = 6;   // 06:00 — earliest visible
const LAST_HOUR = 22;   // 22:00 — latest visible
const TOTAL_HOURS = LAST_HOUR - FIRST_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

type Props = {
  /** YYYY-MM-DD — the day this grid is rendering. */
  date: string;
  lessons: Lesson[];
  onLessonPress?: (lessonId: string) => void;
  onLessonLongPress?: (lessonId: string) => void;
  /** Called when the user drags a lesson card to a new time slot. `deltaMinutes`
   *  is the snapped offset from the original start time. */
  onLessonDrop?: (lessonId: string, deltaMinutes: number) => void;
  /** Called when the user swipes left ("next") or right ("prev"). */
  onSwipeDay?: (direction: "next" | "prev") => void;
};

const SCREEN_W = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_W * 0.18; // need to drag 18% of width to commit
const SWIPE_VELOCITY = 0.4;              // px/ms — alternative trigger

function isToday(date: string): boolean {
  const today = new Date();
  return date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function currentTimeToTopPx(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const fromGridStart = minutes - FIRST_HOUR * 60;
  return (fromGridStart / 60) * HOUR_HEIGHT;
}

function lessonToPx(startMinutes: number, durationMinutes: number) {
  const top = ((startMinutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(36, (durationMinutes / 60) * HOUR_HEIGHT - 4);
  return { top, height };
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

export function DayTimeGrid({
  date,
  lessons,
  onLessonPress,
  onLessonLongPress,
  onLessonDrop,
  onSwipeDay,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView | null>(null);
  const [nowPx, setNowPx] = useState(currentTimeToTopPx());
  const translateX = useRef(new Animated.Value(0)).current;
  // Drag preview state — set by PremiumLessonCard callbacks
  const [dragPreview, setDragPreview] = useState<{
    lessonId: string;
    targetMinutes: number;
  } | null>(null);

  // PanResponder: only claim the gesture when horizontal motion clearly
  // dominates vertical (so the inner ScrollView still wins for normal scrolls).
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) => {
          return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
        },
        onPanResponderMove: (_evt, gesture) => {
          translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_evt, gesture) => {
          const committed =
            Math.abs(gesture.dx) > SWIPE_THRESHOLD || Math.abs(gesture.vx) > SWIPE_VELOCITY;
          if (committed && onSwipeDay) {
            const direction: "next" | "prev" = gesture.dx < 0 ? "next" : "prev";
            // Animate off-screen in that direction, then snap back to center
            // (re-render with new date will replace content).
            Animated.timing(translateX, {
              toValue: gesture.dx < 0 ? -SCREEN_W : SCREEN_W,
              duration: 140,
              useNativeDriver: true,
            }).start(() => {
              translateX.setValue(0);
              onSwipeDay(direction);
            });
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onSwipeDay, translateX],
  );

  // Pre-process once per lessons change. Used by both the cards and conflicts.
  const enriched = useMemo(() => enrichLessons(lessons), [lessons]);
  const conflicts = useMemo(() => detectConflicts(enriched), [enriched]);
  const conflictMap = useMemo(() => conflictsByLesson(conflicts), [conflicts]);

  const showCurrentTime = isToday(date);

  // Auto-scroll to current time on mount, or to the first lesson if not today
  useEffect(() => {
    const target = showCurrentTime
      ? Math.max(0, nowPx - 120)
      : enriched[0]
        ? Math.max(0, ((enriched[0].startMinutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT - 80)
        : 0;
    const handle = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: target, animated: true });
    }, 100);
    return () => clearTimeout(handle);
    // We want this to run when day changes or lesson list changes:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, enriched.length]);

  // Tick the current-time line every minute (cheap — single setState)
  useEffect(() => {
    if (!showCurrentTime) return;
    const handle = setInterval(() => setNowPx(currentTimeToTopPx()), 60_000);
    return () => clearInterval(handle);
  }, [showCurrentTime]);

  return (
    <Animated.View
      style={[styles.swipeWrap, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.grid, { height: GRID_HEIGHT }]}>
        {/* Hour rows + labels + half-hour subtle markers */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => {
          const hour = FIRST_HOUR + i;
          return (
            <View key={hour}>
              <View style={[styles.hourRow, { top: i * HOUR_HEIGHT }]}>
                <Text style={styles.hourLabel}>{formatHourLabel(hour)}</Text>
                <View style={styles.hourLine} />
              </View>
              <View style={[styles.halfHourLine, { top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }]} />
            </View>
          );
        })}

        {/* Lesson cards */}
        {enriched.map((lesson) => {
          const { top, height } = lessonToPx(lesson.startMinutes, lesson.durationMinutes);
          if (top < 0 || top > GRID_HEIGHT) return null;
          return (
            <PremiumLessonCard
              key={lesson.id}
              lesson={lesson}
              conflicts={conflictMap[lesson.id]}
              top={top}
              height={height}
              onPress={() => onLessonPress?.(lesson.id)}
              onLongPress={() => onLessonLongPress?.(lesson.id)}
              onDrop={
                onLessonDrop
                  ? (deltaMinutes) => onLessonDrop(lesson.id, deltaMinutes)
                  : undefined
              }
              onDragStart={() => setDragPreview({
                lessonId: lesson.id,
                targetMinutes: lesson.startMinutes,
              })}
              onDragMove={(deltaMinutes) =>
                setDragPreview({
                  lessonId: lesson.id,
                  targetMinutes: lesson.startMinutes + deltaMinutes,
                })
              }
              onDragEnd={() => setDragPreview(null)}
            />
          );
        })}

        {/* Current-time floating indicator */}
        {showCurrentTime && nowPx >= 0 && nowPx <= GRID_HEIGHT && (
          <View style={[styles.nowLine, { top: nowPx }]} pointerEvents="none">
            <View style={styles.nowDot} />
            <View style={styles.nowBar} />
          </View>
        )}

        {/* Drag preview: ghost line + time label at the snap target */}
        {dragPreview ? (() => {
          const previewTop = ((dragPreview.targetMinutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT;
          if (previewTop < 0 || previewTop > GRID_HEIGHT) return null;
          const hh = Math.floor(dragPreview.targetMinutes / 60) % 24;
          const mm = dragPreview.targetMinutes % 60;
          const timeLabel = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
          return (
            <View style={[styles.ghostLine, { top: previewTop }]} pointerEvents="none">
              <View style={styles.ghostLabel}>
                <Text style={styles.ghostLabelText}>{timeLabel}</Text>
              </View>
              <View style={styles.ghostBar} />
            </View>
          );
        })() : null}
      </View>

      {/* Gap conflict banners (rendered at end since they don't attach to a card) */}
      {conflicts.filter((c) => c.kind === "gap").length > 0 && (
        <View style={styles.gapList}>
          {conflicts
            .filter((c) => c.kind === "gap")
            .map((c) => (
              <View key={c.lessonIds.join(":")} style={styles.gapPill}>
                <Text style={styles.gapText}>⏱ {c.message}</Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
    </Animated.View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  swipeWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  grid: {
    position: "relative",
    paddingHorizontal: 0,
  },
  hourRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hourLabel: {
    width: 56,
    paddingTop: 0,
    paddingLeft: 12,
    color: c.slate500,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginTop: 8,
    marginRight: 12,
  },
  halfHourLine: {
    position: "absolute",
    left: 64,
    right: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    opacity: 0.4,
  },
  nowLine: {
    position: "absolute",
    left: 56,
    right: 0,
    height: 2,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 50,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.red,
    marginLeft: -5,
    shadowColor: c.red,
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  nowBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: c.red,
    marginRight: 12,
  },
  ghostLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },
  ghostLabel: {
    backgroundColor: c.emerald,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  ghostLabelText: {
    color: c.onAccent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ghostBar: {
    flex: 1,
    height: 2,
    backgroundColor: c.emerald,
    marginLeft: 4,
    marginRight: 12,
    borderRadius: 1,
    opacity: 0.85,
  },
  gapList: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  gapPill: {
    backgroundColor: c.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  gapText: {
    color: c.amber,
    fontSize: 12,
    fontWeight: "700",
  },
});

// 7-day overview. Each column is a day; lessons render as compact tappable
// blocks positioned by start time. Tap a day header → drill into Day View.
// Tap a lesson block → open LessonDetail.

import { useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson } from "../../types";
import { enrichLessons } from "../../utils/scheduleConflicts";

const HOUR_HEIGHT = 44;     // smaller than Day View — fits 7 cols
const FIRST_HOUR = 6;
const LAST_HOUR = 22;
const TOTAL_HOURS = LAST_HOUR - FIRST_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
const GUTTER_W = 38;        // hour-label column

type Props = {
  weekStartDate: string; // Monday YYYY-MM-DD
  lessonsByDate: Record<string, Lesson[]>;
  onDayPress: (date: string) => void;
  onLessonPress?: (lessonId: string) => void;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12";
  if (hour <= 12) return `${hour}`;
  return `${hour - 12}`;
}

function paymentDot(status: Lesson["paymentStatus"], c: ColorPalette): string {
  if (status === "paid") return c.green;
  if (status === "not_paid" || status === "unpaid") return c.amber;
  return c.slate300;
}

export function WeekTimeGrid({
  weekStartDate,
  lessonsByDate,
  onDayPress,
  onLessonPress,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = shiftDays(weekStartDate, i);
      const d = new Date(`${date}T00:00:00`);
      return {
        date,
        weekday: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3).toUpperCase(),
        day: d.getDate(),
        isToday: date === todayIso(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
  }, [weekStartDate]);

  const verticalScrollRef = useRef<ScrollView | null>(null);

  return (
    <View style={styles.wrap}>
      {/* Sticky day-header row */}
      <View style={styles.dayHeaderRow}>
        <View style={{ width: GUTTER_W }} />
        {days.map((d) => {
          const count = (lessonsByDate[d.date] || []).filter((l) => l.status !== "cancelled").length;
          return (
            <Pressable
              key={d.date}
              onPress={() => onDayPress(d.date)}
              style={({ pressed }) => [
                styles.dayHeaderCell,
                d.isToday && styles.dayHeaderToday,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.dayHeaderWeekday, d.isWeekend && styles.dayHeaderWeekend]}>
                {d.weekday}
              </Text>
              <Text style={[styles.dayHeaderNumber, d.isToday && styles.dayHeaderNumberToday]}>
                {d.day}
              </Text>
              {count > 0 ? <View style={styles.countDot} /> : null}
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={verticalScrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, { height: GRID_HEIGHT }]}>
          {/* Hour rows + labels */}
          {Array.from({ length: TOTAL_HOURS }, (_, i) => {
            const hour = FIRST_HOUR + i;
            return (
              <View key={hour} style={[styles.hourRow, { top: i * HOUR_HEIGHT }]}>
                <Text style={styles.hourLabel}>{formatHourLabel(hour)}</Text>
                <View style={styles.hourLine} />
              </View>
            );
          })}

          {/* Per-day lesson columns */}
          {days.map((d, dayIdx) => {
            const lessons = enrichLessons(lessonsByDate[d.date] || []);
            return (
              <View
                key={d.date}
                pointerEvents="box-none"
                style={[
                  styles.dayColumn,
                  {
                    left: GUTTER_W + dayIdx * ((100 / 7) as unknown as number),
                  },
                ]}
              />
            );
          })}

          {/* Lesson blocks — positioned by absolute pixel + percentage cols */}
          {days.map((d, dayIdx) => {
            const lessons = enrichLessons(lessonsByDate[d.date] || []);
            return lessons.map((lesson) => {
              const topPx = ((lesson.startMinutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT;
              const heightPx = Math.max(20, (lesson.durationMinutes / 60) * HOUR_HEIGHT - 2);
              if (topPx < 0 || topPx > GRID_HEIGHT) return null;
              const cancelled = lesson.status === "cancelled";
              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => onLessonPress?.(lesson.id)}
                  style={({ pressed }) => [
                    styles.lessonBlock,
                    {
                      top: topPx,
                      height: heightPx,
                      // Position inside the day column (percentage-based)
                      left: `${(GUTTER_W / 4) + dayIdx * (100 / 7)}%` as unknown as number,
                      width: `${100 / 7 - 1.5}%` as unknown as number,
                      backgroundColor: cancelled ? c.slate100 : c.surface,
                      opacity: cancelled ? 0.5 : 1,
                      borderLeftColor: paymentDot(lesson.paymentStatus, c),
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={styles.lessonTime} numberOfLines={1}>
                    {lesson.time}
                  </Text>
                  <Text style={styles.lessonName} numberOfLines={1}>
                    {lesson.studentName}
                  </Text>
                </Pressable>
              );
            });
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.background },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: c.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  dayHeaderCell: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    gap: 3,
  },
  dayHeaderToday: { backgroundColor: c.emeraldSoft },
  dayHeaderWeekday: { color: c.slate500, fontSize: 11, fontWeight: "500", letterSpacing: 0.4 },
  dayHeaderWeekend: { color: c.slate300 },
  dayHeaderNumber: { color: c.slate900, fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  dayHeaderNumberToday: { color: c.emerald, fontWeight: "700" },
  countDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.emerald, marginTop: 2 },

  scrollContent: { paddingBottom: 60 },
  grid: { position: "relative", paddingHorizontal: 0 },

  hourRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hourLabel: {
    width: GUTTER_W,
    paddingLeft: 8,
    color: c.slate500,
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginTop: 6,
    marginRight: 8,
  },

  dayColumn: {
    position: "absolute",
    top: 0,
    width: "14.28%",
    height: GRID_HEIGHT,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: c.border,
  },

  lessonBlock: {
    position: "absolute",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
    borderLeftWidth: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  lessonTime: { color: c.slate500, fontSize: 11, fontWeight: "500" },
  lessonName: { color: c.slate900, fontSize: 11, fontWeight: "600" },
});

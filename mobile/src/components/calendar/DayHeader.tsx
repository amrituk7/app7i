import { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = {
  selectedDate: string;
  onSelect: (date: string) => void;
  /** Days either side of "today" to render in the strip. Default 21 = 3 weeks each direction. */
  daysWindow?: number;
  /** Optional earnings overlay shown beneath the title. */
  dayEarnings?: number;
  weekEarnings?: number;
  /** When true, render a Day/Week toggle on the right of the title row. */
  view?: "day" | "week";
  onChangeView?: (next: "day" | "week") => void;
};

const DAY_PILL_WIDTH = 52;
const DAY_PILL_GAP = 8;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type DayItem = {
  value: string;
  weekday: string;
  day: number;
  isToday: boolean;
  isWeekend: boolean;
  isFirstOfMonth: boolean;
};

function londonTodayIso(): string {
  // sv-SE locale produces YYYY-MM-DD, ensuring "today" is London date not device local
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London" }).format(new Date());
}

function buildDays(window: number): DayItem[] {
  const out: DayItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = londonTodayIso();
  for (let i = -window; i <= window; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      value: toIso(d),
      weekday: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3).toUpperCase(),
      day: d.getDate(),
      isToday: toIso(d) === todayIso,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isFirstOfMonth: d.getDate() === 1,
    });
  }
  return out;
}

function relativeLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

function monthYearLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function dayMonthLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toIso(d);
}

function formatGbp(n: number | undefined): string {
  if (!n || Number.isNaN(n)) return "£0";
  if (n >= 1000) return `£${(n / 1000).toFixed(1)}k`;
  return `£${Math.round(n)}`;
}

export function DayHeader({
  selectedDate,
  onSelect,
  daysWindow = 21,
  dayEarnings,
  weekEarnings,
  view,
  onChangeView,
}: Props) {
  const days = useMemo(() => buildDays(daysWindow), [daysWindow]);
  const stripRef = useRef<ScrollView | null>(null);
  const styles = useThemedStyles(makeStyles);
  const c = useColors();

  // Auto-centre the selected day pill whenever it changes.
  useEffect(() => {
    const index = days.findIndex((d) => d.value === selectedDate);
    if (index < 0) return;
    const offset = index * (DAY_PILL_WIDTH + DAY_PILL_GAP);
    // Small delay so layout settles before scrolling.
    const handle = setTimeout(() => {
      stripRef.current?.scrollTo({
        x: Math.max(0, offset - 120),
        animated: true,
      });
    }, 50);
    return () => clearTimeout(handle);
  }, [selectedDate, days]);

  return (
    <View style={styles.wrap}>
      {/* Month + relative day kicker — Apple Calendar / Reminders style */}
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.kicker}>{monthYearLabel(selectedDate)}</Text>
          <Text style={styles.title}>{relativeLabel(selectedDate)}</Text>
          <Text style={styles.subtitle}>{dayMonthLabel(selectedDate)}</Text>
        </View>
        <Pressable
          accessibilityLabel="Jump to today"
          onPress={() => onSelect(toIso(new Date()))}
          style={({ pressed }) => [styles.todayBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="locate-outline" size={16} color={c.emerald} />
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
      </View>

      {/* Earnings + view toggle row */}
      {(dayEarnings !== undefined || weekEarnings !== undefined || (view && onChangeView)) ? (
        <View style={styles.metaRow}>
          <View style={styles.earningsRow}>
            {dayEarnings !== undefined ? (
              <Text style={styles.earningsText}>
                <Text style={styles.earningsValue}>{formatGbp(dayEarnings)}</Text>
                <Text style={styles.earningsLabel}> day</Text>
              </Text>
            ) : null}
            {dayEarnings !== undefined && weekEarnings !== undefined ? (
              <View style={styles.dotSep} />
            ) : null}
            {weekEarnings !== undefined ? (
              <Text style={styles.earningsText}>
                <Text style={styles.earningsValue}>{formatGbp(weekEarnings)}</Text>
                <Text style={styles.earningsLabel}> week</Text>
              </Text>
            ) : null}
          </View>
          {view && onChangeView ? (
            <View style={styles.segmented}>
              <Pressable
                onPress={() => onChangeView("day")}
                style={[styles.segmentedBtn, view === "day" && styles.segmentedBtnActive]}
              >
                <Text style={[styles.segmentedText, view === "day" && styles.segmentedTextActive]}>
                  Day
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onChangeView("week")}
                style={[styles.segmentedBtn, view === "week" && styles.segmentedBtnActive]}
              >
                <Text style={[styles.segmentedText, view === "week" && styles.segmentedTextActive]}>
                  Week
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Horizontal day strip with prev/next chevrons */}
      <View style={styles.stripRow}>
        <Pressable
          accessibilityLabel="Previous day"
          onPress={() => onSelect(shiftDays(selectedDate, -1))}
          style={({ pressed }) => [styles.chevronBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={18} color={c.slate700} />
        </Pressable>

        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
        >
          {days.map((d) => {
            const selected = d.value === selectedDate;
            return (
              <Pressable
                key={d.value}
                onPress={() => onSelect(d.value)}
                style={({ pressed }) => [
                  styles.dayPill,
                  selected && styles.dayPillSelected,
                  d.isToday && !selected && styles.dayPillToday,
                  pressed && !selected && styles.pressed,
                ]}
                accessibilityLabel={`${d.weekday} ${d.day}${d.isToday ? " (today)" : ""}`}
              >
                <Text
                  style={[
                    styles.dayWeekday,
                    selected && styles.dayWeekdaySelected,
                    d.isWeekend && !selected && styles.dayWeekend,
                    d.isToday && !selected && styles.dayWeekdayToday,
                  ]}
                >
                  {d.weekday}
                </Text>
                <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>
                  {d.day}
                </Text>
                {d.isFirstOfMonth && !selected ? (
                  <Text style={styles.monthAbbr}>
                    {new Date(`${d.value}T00:00:00`)
                      .toLocaleDateString("en-GB", { month: "short" })
                      .toUpperCase()}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          accessibilityLabel="Next day"
          onPress={() => onSelect(shiftDays(selectedDate, 1))}
          style={({ pressed }) => [styles.chevronBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={18} color={c.slate700} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  wrap: {
    backgroundColor: c.surface,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  titleCopy: { flex: 1 },
  kicker: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  title: {
    color: c.slate900,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  subtitle: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.emeraldSoft,
  },
  todayBtnText: {
    color: c.emerald,
    fontSize: 14,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  earningsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  earningsText: {
    fontSize: 13,
  },
  earningsValue: {
    color: c.slate900,
    fontWeight: "600",
  },
  earningsLabel: {
    color: c.slate500,
    fontWeight: "400",
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: c.slate300,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: c.surfaceMuted,
    borderRadius: 9,
    padding: 2,
  },
  segmentedBtn: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedBtnActive: {
    backgroundColor: c.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedText: {
    color: c.slate600,
    fontSize: 13,
    fontWeight: "500",
  },
  segmentedTextActive: {
    color: c.slate900,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.55,
  },
  stripRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  chevronBtn: {
    width: 32,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  stripContent: {
    paddingHorizontal: 4,
    gap: DAY_PILL_GAP,
  },
  dayPill: {
    width: DAY_PILL_WIDTH,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: c.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 56,
  },
  dayPillSelected: {
    backgroundColor: c.emerald,
  },
  dayPillToday: {
    backgroundColor: c.emeraldSoft,
  },
  dayWeekday: {
    color: c.slate500,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
  dayWeekdaySelected: { color: c.onAccent },
  dayWeekdayToday: { color: c.emerald },
  dayWeekend: { color: c.slate300 },
  dayNumber: {
    color: c.slate900,
    fontSize: 19,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  dayNumberSelected: { color: c.onAccent, fontWeight: "700" },
  monthAbbr: {
    position: "absolute",
    top: -8,
    color: c.emerald,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});

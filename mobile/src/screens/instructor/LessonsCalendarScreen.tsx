import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { getLessonsInRange, updateLesson } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Lesson } from "../../types";
import { DayHeader } from "../../components/calendar/DayHeader";
import { DayTimeGrid } from "../../components/calendar/DayTimeGrid";
import { WeekTimeGrid } from "../../components/calendar/WeekTimeGrid";

function startOfWeekIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const dow = d.getDay();
  // Monday-based week (UK convention)
  const mondayOffset = (dow + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function endOfWeekIso(iso: string): string {
  const d = new Date(`${startOfWeekIso(iso)}T00:00:00`);
  d.setDate(d.getDate() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Nav = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayIso(): string {
  // Use London time so "today" is always correct for UK-based instructors
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London" }).format(new Date());
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const RANGE_DAYS = 21; // load 3 weeks each side of today in one shot — keeps reads minimal

export function LessonsCalendarScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [lessonsByDate, setLessonsByDate] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"day" | "week">("day");

  // Range is anchored on today. Without rollover handling, a screen left open
  // past midnight keeps the previous day's anchor and the new day's lessons
  // never appear. Recompute every 60s and update if the date has changed.
  const [rangeStart, setRangeStart] = useState<string>(() => shiftDays(todayIso(), -RANGE_DAYS));
  const [rangeEnd, setRangeEnd] = useState<string>(() => shiftDays(todayIso(), RANGE_DAYS));

  useEffect(() => {
    const interval = setInterval(() => {
      const nextStart = shiftDays(todayIso(), -RANGE_DAYS);
      const nextEnd = shiftDays(todayIso(), RANGE_DAYS);
      setRangeStart((prev) => (prev === nextStart ? prev : nextStart));
      setRangeEnd((prev) => (prev === nextEnd ? prev : nextEnd));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const all = await getLessonsInRange(user.uid, rangeStart, rangeEnd);
      const grouped: Record<string, Lesson[]> = {};
      all.forEach((l) => {
        (grouped[l.date] ||= []).push(l);
      });
      setLessonsByDate(grouped);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "We're having trouble loading your calendar.";
      setError(/permission|denied/i.test(msg) ? "Sign out and back in to refresh access." : msg);
    }
  }, [user?.uid, rangeStart, rangeEnd]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const dayLessons = lessonsByDate[selectedDate] || [];

  // Drag-drop commit (real touch drag from RNGH). Applies the snapped delta,
  // shows a confirm Alert (warns about conflicts), writes to Firestore.
  // Optimistic — UI moves first.
  function handleLessonDrop(lessonId: string, deltaMinutes: number) {
    const lesson = dayLessons.find((l) => l.id === lessonId);
    if (!lesson || deltaMinutes === 0) return;

    const [h, m] = lesson.time.split(":").map(Number);
    const startTotal = (h || 0) * 60 + (m || 0) + deltaMinutes;
    const clamped = Math.max(6 * 60, Math.min(22 * 60, startTotal));
    const newTime = `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;

    // Conflict check: would the new slot overlap or double-book another lesson?
    const newStart = clamped;
    const newEnd = newStart + (lesson.durationMinutes || 60);
    const clash = dayLessons.find((other) => {
      if (other.id === lesson.id) return false;
      if (other.status === "cancelled") return false;
      const [oh, om] = other.time.split(":").map(Number);
      const oStart = (oh || 0) * 60 + (om || 0);
      const oEnd = oStart + (other.durationMinutes || 60);
      return newStart < oEnd && oStart < newEnd;
    });

    const title = clash
      ? `⚠ Clashes with ${clash.studentName}`
      : `Move ${lesson.studentName}?`;
    const body = clash
      ? `${lesson.time} → ${newTime}\n\nThis new slot overlaps ${clash.studentName} at ${clash.time}. Move anyway?`
      : `${lesson.time} → ${newTime}`;
    const confirmLabel = clash ? "Move anyway" : "Move";

    Alert.alert(
      title,
      body,
      [
        { text: "Keep where it was", style: "cancel" },
        {
          text: confirmLabel,
          style: clash ? "destructive" : "default",
          onPress: async () => {
            // Optimistic local update
            setLessonsByDate((prev) => {
              const existing = prev[selectedDate] || [];
              const next = existing.map((l) =>
                l.id === lesson.id ? { ...l, time: newTime } : l,
              );
              return { ...prev, [selectedDate]: next };
            });
            try {
              await updateLesson(lesson.id, {
                date: lesson.date,
                time: newTime,
                durationHours: lesson.durationMinutes / 60,
                pickup: lesson.pickup,
                price: lesson.price,
                notes: lesson.notes,
              });
            } catch (e) {
              setLessonsByDate((prev) => {
                const existing = prev[selectedDate] || [];
                const next = existing.map((l) => (l.id === lesson.id ? lesson : l));
                return { ...prev, [selectedDate]: next };
              });
              Alert.alert(
                "Couldn't move lesson",
                e instanceof Error ? e.message : "Try again.",
              );
            }
          },
        },
      ],
    );
  }

  // Long-press a lesson card → quick action sheet. Shifts the start time OR
  // resizes the duration. Updates Firestore optimistically.
  function handleQuickReschedule(lesson: Lesson) {
    function shiftMinutes(deltaMin: number) {
      const [h, m] = lesson.time.split(":").map(Number);
      const startTotal = (h || 0) * 60 + (m || 0) + deltaMin;
      // Clamp to 06:00 - 22:00 (the visible grid)
      const clamped = Math.max(6 * 60, Math.min(22 * 60, startTotal));
      const newTime = `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
      return newTime;
    }

    async function commitTime(newTime: string) {
      setLessonsByDate((prev) => {
        const existing = prev[selectedDate] || [];
        const next = existing.map((l) => (l.id === lesson.id ? { ...l, time: newTime } : l));
        return { ...prev, [selectedDate]: next };
      });
      try {
        await updateLesson(lesson.id, {
          date: lesson.date,
          time: newTime,
          durationHours: lesson.durationMinutes / 60,
          pickup: lesson.pickup,
          price: lesson.price,
          notes: lesson.notes,
        });
      } catch (e) {
        setLessonsByDate((prev) => {
          const existing = prev[selectedDate] || [];
          const next = existing.map((l) => (l.id === lesson.id ? lesson : l));
          return { ...prev, [selectedDate]: next };
        });
        Alert.alert("Couldn't reschedule", e instanceof Error ? e.message : "Try again.");
      }
    }

    async function commitDuration(deltaMinutes: number) {
      const newDurationMin = Math.max(15, lesson.durationMinutes + deltaMinutes);
      const newDurationHours = newDurationMin / 60;
      setLessonsByDate((prev) => {
        const existing = prev[selectedDate] || [];
        const next = existing.map((l) =>
          l.id === lesson.id ? { ...l, durationMinutes: newDurationMin } : l,
        );
        return { ...prev, [selectedDate]: next };
      });
      try {
        await updateLesson(lesson.id, {
          date: lesson.date,
          time: lesson.time,
          durationHours: newDurationHours,
          pickup: lesson.pickup,
          price: lesson.price,
          notes: lesson.notes,
        });
      } catch (e) {
        setLessonsByDate((prev) => {
          const existing = prev[selectedDate] || [];
          const next = existing.map((l) => (l.id === lesson.id ? lesson : l));
          return { ...prev, [selectedDate]: next };
        });
        Alert.alert("Couldn't resize", e instanceof Error ? e.message : "Try again.");
      }
    }

    Alert.alert(
      `${lesson.studentName} · ${lesson.time}`,
      `${lesson.durationMinutes} min lesson. Shift the start time, change the length, or open it to edit fully.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Earlier 30 min", onPress: () => commitTime(shiftMinutes(-30)) },
        { text: "Earlier 15 min", onPress: () => commitTime(shiftMinutes(-15)) },
        { text: "Later 15 min", onPress: () => commitTime(shiftMinutes(15)) },
        { text: "Later 30 min", onPress: () => commitTime(shiftMinutes(30)) },
        { text: "Longer 30 min", onPress: () => commitDuration(30) },
        { text: "Shorter 30 min", onPress: () => commitDuration(-30) },
        {
          text: "Open lesson…",
          onPress: () => navigation.navigate("LessonDetail", { lessonId: lesson.id }),
        },
      ],
    );
  }

  // Earnings overlay — sum of `price` for lessons that aren't cancelled.
  // "Today" = the selected date; "This week" = Mon-Sun containing it.
  const dayEarnings = useMemo(
    () =>
      dayLessons
        .filter((l) => l.status !== "cancelled")
        .reduce((sum, l) => sum + (l.price || 0), 0),
    [dayLessons],
  );

  const weekEarnings = useMemo(() => {
    const weekStart = startOfWeekIso(selectedDate);
    const weekEnd = endOfWeekIso(selectedDate);
    let total = 0;
    for (const [date, lessons] of Object.entries(lessonsByDate)) {
      if (date < weekStart || date > weekEnd) continue;
      for (const l of lessons) {
        if (l.status !== "cancelled") total += l.price || 0;
      }
    }
    return total;
  }, [lessonsByDate, selectedDate]);

  return (
    <SafeAreaView style={styles.safe}>
      <DayHeader
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        dayEarnings={dayEarnings}
        weekEarnings={weekEarnings}
        view={view}
        onChangeView={setView}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={c.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      ) : view === "week" ? (
        <WeekTimeGrid
          weekStartDate={startOfWeekIso(selectedDate)}
          lessonsByDate={lessonsByDate}
          onDayPress={(date) => {
            setSelectedDate(date);
            setView("day");
          }}
          onLessonPress={(lessonId) => navigation.navigate("LessonDetail", { lessonId })}
        />
      ) : dayLessons.length === 0 ? (
        <EmptyState
          iconName="calendar-outline"
          title="Nothing scheduled"
          message="Tap the date strip above to scan other days, or book a lesson from the Students tab."
          actionLabel="Book a lesson"
          onAction={() => navigation.navigate("BookLesson")}
        />
      ) : (
        <DayTimeGrid
          date={selectedDate}
          lessons={dayLessons}
          onLessonPress={(lessonId) => navigation.navigate("LessonDetail", { lessonId })}
          onLessonLongPress={(lessonId) => {
            const lesson = dayLessons.find((l) => l.id === lessonId);
            if (!lesson) return;
            handleQuickReschedule(lesson);
          }}
          onLessonDrop={handleLessonDrop}
          onSwipeDay={(direction) =>
            setSelectedDate((d) => {
              const dt = new Date(`${d}T00:00:00`);
              dt.setDate(dt.getDate() + (direction === "next" ? 1 : -1));
              return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
            })
          }
        />
      )}

      {refreshing ? <ActivityIndicator style={styles.refreshSpinner} color={c.emerald} /> : null}

      <View style={styles.summaryBar} pointerEvents="none">
        <Text style={styles.summaryText}>
          {dayLessons.length} lesson{dayLessons.length === 1 ? "" : "s"}
          {dayLessons.length > 0
            ? ` · ${dayLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / 60}h booked`
            : ""}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.background,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.redSoft,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  errorText: { flex: 1, color: c.red, fontSize: 13, fontWeight: "500" },
  refreshSpinner: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
  },
  summaryBar: {
    position: "absolute",
    bottom: spacing.md,
    alignSelf: "center",
    backgroundColor: c.slate900,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    opacity: 0.92,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  summaryText: { color: c.onInverted, fontSize: 12, fontWeight: "600", letterSpacing: 0.1 },
});

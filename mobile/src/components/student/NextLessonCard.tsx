import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Lesson } from "../../types";

type Props = {
  nextLesson: Lesson | null;
  instructorName?: string;
  weakestSkillLabel?: string | null;
  unpaidCount: number;
};

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysUntil(date: string): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(`${todayKey()}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function fullDateLabel(date: string): string {
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return date;
  return target.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m = "00"] = time.split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m.padStart(2, "0")}${suffix}`;
}

/**
 * Build an inline ICS data URI so the user can add the lesson to their phone
 * calendar without us touching expo-calendar.
 */
function buildLessonIcsUri(lesson: Lesson): string {
  const [y, m, d] = (lesson.date || "").split("-");
  const [hh = "09", mm = "00"] = (lesson.time || "09:00").split(":");
  if (!y || !m || !d) return "";
  const startStamp = `${y}${m}${d}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00`;
  const startMs = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
  const endMs = startMs + Math.max(15, lesson.durationMinutes || 60) * 60 * 1000;
  const end = new Date(endMs);
  const endStamp = `${end.getUTCFullYear()}${String(end.getUTCMonth() + 1).padStart(2, "0")}${String(end.getUTCDate()).padStart(2, "0")}T${String(end.getUTCHours()).padStart(2, "0")}${String(end.getUTCMinutes()).padStart(2, "0")}00`;
  const summary = `Driving lesson — App7i`;
  const location = (lesson.pickup || "").replace(/[\r\n]+/g, " ");
  const description = `Pickup: ${lesson.pickup || "TBC"}\\nDuration: ${lesson.durationMinutes || 60} mins`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//App7i//Lesson//EN",
    "BEGIN:VEVENT",
    `UID:${lesson.id}@app7i`,
    `DTSTAMP:${startStamp}Z`,
    `DTSTART:${startStamp}`,
    `DTEND:${endStamp}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

// ─── Countdown badge ──────────────────────────────────────────────────────────

function CountdownBadge({ date }: { date: string }) {
  const diff = daysUntil(date);
  const c = useColors();
  if (diff === null || diff < 0) return null;

  if (diff === 0) {
    return (
      <View style={{ backgroundColor: c.amberSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" }}>
        <Text style={{ color: c.amber, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 }}>TODAY</Text>
      </View>
    );
  }
  if (diff === 1) {
    return (
      <View style={{ backgroundColor: c.emeraldSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" }}>
        <Text style={{ color: c.emeraldDark, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 }}>TOMORROW</Text>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: c.emeraldSoft, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center", alignSelf: "flex-start", minWidth: 56 }}>
      <Text style={{ color: c.emeraldDark, fontSize: 28, fontWeight: "800", lineHeight: 32 }}>{diff}</Text>
      <Text style={{ color: c.emeraldDark, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.7 }}>days</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NextLessonCard({
  nextLesson,
  instructorName,
  weakestSkillLabel,
  unpaidCount,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const checklist = useMemo(() => {
    const items: Array<{ key: string; text: string; done: boolean }> = [
      { key: "licence", text: "Provisional licence on you", done: false },
      { key: "glasses", text: "Glasses if you need them to drive", done: false },
    ];
    items.push({
      key: "pay",
      text:
        unpaidCount > 0
          ? `${unpaidCount} unpaid lesson${unpaidCount === 1 ? "" : "s"} — bring payment`
          : "Payment up to date",
      done: unpaidCount === 0,
    });
    if (weakestSkillLabel) {
      items.push({
        key: "focus",
        text: `Skim notes on ${weakestSkillLabel.toLowerCase()}`,
        done: false,
      });
    }
    return items;
  }, [unpaidCount, weakestSkillLabel]);

  // ── Empty state ──
  if (!nextLesson) {
    return (
      <Card style={styles.card}>
        <Text style={styles.kicker}>Next lesson</Text>
        <Text style={styles.emptyTitle}>Nothing booked yet</Text>
        <Text style={styles.subtitle}>
          {instructorName || "Your instructor"} will book your next lesson — you'll get a notification when it's confirmed.
        </Text>
      </Card>
    );
  }

  const teacher = instructorName || "your instructor";
  const focusLine = weakestSkillLabel
    ? `Likely focus: ${weakestSkillLabel.toLowerCase()} (lowest-rated so far)`
    : `Bring questions about anything you've struggled with`;

  function openMaps() {
    const q = encodeURIComponent(nextLesson?.pickup || "");
    if (!q) return;
    Linking.openURL(`geo:0,0?q=${q}`).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => {}),
    );
  }

  function addToCalendar() {
    const uri = buildLessonIcsUri(nextLesson!);
    if (!uri) return;
    Linking.openURL(uri).catch(() => {});
  }

  return (
    <Card style={styles.card}>
      {/* Header: kicker + countdown */}
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Next lesson</Text>
        <CountdownBadge date={nextLesson.date} />
      </View>

      {/* Date (large) + time (larger, accent) */}
      <Text style={styles.title}>{fullDateLabel(nextLesson.date)}</Text>
      <Text style={styles.timeText}>{nextLesson.time ? formatTime(nextLesson.time) : "Time TBC"}</Text>

      {/* Meta: duration + pickup */}
      <Text style={styles.subtitle}>
        {nextLesson.durationMinutes} mins with {teacher}
        {nextLesson.pickup ? ` · ${nextLesson.pickup}` : ""}
      </Text>

      {/* Focus tip */}
      <View style={styles.separator} />
      <View style={styles.focusRow}>
        <Ionicons name="bulb-outline" size={14} color={c.amber} />
        <Text style={styles.focusLine}>{focusLine}</Text>
      </View>

      {/* Pre-lesson checklist */}
      <View style={styles.separator} />
      <View style={styles.checklist}>
        {checklist.map((item) => (
          <View key={item.key} style={styles.checkRow}>
            <Ionicons
              name={item.done ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={item.done ? c.green : c.slate300}
            />
            <Text style={[styles.checkText, item.done && styles.checkTextDone]}>
              {item.text}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.separator} />
      <View style={styles.actions}>
        <Pressable
          onPress={addToCalendar}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="calendar-outline" size={14} color={c.emeraldDark} />
          <Text style={styles.actionText}>Add to calendar</Text>
        </Pressable>
        {nextLesson.pickup ? (
          <Pressable
            onPress={openMaps}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="navigate-outline" size={14} color={c.emeraldDark} />
            <Text style={styles.actionText}>Get directions</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  title: {
    color: c.slate900,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  emptyTitle: {
    color: c.slate900,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginTop: spacing.xs,
  },
  timeText: {
    color: c.emeraldDark,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.slate100,
    marginVertical: 2,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  focusLine: {
    flex: 1,
    color: c.slate700,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  checklist: {
    gap: 10,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkText: {
    color: c.slate900,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  checkTextDone: {
    color: c.slate500,
    textDecorationLine: "line-through",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: c.emeraldSoft,
  },
  actionText: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "700",
  },
});

// Phone-calendar conflict detection.
// Reads the device calendar (with permission) to warn the instructor before
// they book a lesson that clashes with an existing event. All reads stay on
// the device — nothing leaves the phone.
//
// expo-calendar is loaded lazily so OTA updates to APKs that don't yet have
// the native module baked in fail gracefully (no conflict reported, app keeps
// working). Once the fresh AAB lands, this becomes a real check.

import { Platform } from "react-native";

type CalendarModule = typeof import("expo-calendar");
let _calendarModule: CalendarModule | null | undefined;

async function loadCalendarModule(): Promise<CalendarModule | null> {
  if (_calendarModule !== undefined) return _calendarModule;
  try {
    _calendarModule = await import("expo-calendar");
    return _calendarModule;
  } catch (err) {
    console.warn("[calendarConflict] expo-calendar not available — skipping check", err);
    _calendarModule = null;
    return null;
  }
}

export type CalendarConflict = {
  title: string;
  startISO: string;
  endISO: string;
  calendarTitle: string;
};

/**
 * Ask for calendar permission. Returns true if granted.
 * Safe to call repeatedly — system shows the prompt once, then returns the
 * stored answer.
 */
export async function ensureCalendarPermission(): Promise<boolean> {
  const Calendar = await loadCalendarModule();
  if (!Calendar) return false;
  try {
    const status = await Calendar.requestCalendarPermissionsAsync();
    return status.status === "granted";
  } catch (err) {
    console.warn("[calendarConflict] permission failed", err);
    return false;
  }
}

/**
 * Build a Date from an App7i lesson's `date` (YYYY-MM-DD), `time` (HH:MM),
 * and `durationMinutes`. Returns { start, end } in the device's local zone.
 */
export function lessonWindow(
  date: string,
  time: string,
  durationMinutes: number,
): { start: Date; end: Date } | null {
  if (!date || !time) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  const end = new Date(start.getTime() + Math.max(15, durationMinutes || 60) * 60 * 1000);
  return { start, end };
}

/**
 * Find phone-calendar events that overlap the given lesson window.
 * Returns [] if the user denied permission, no calendars exist, or there
 * are no conflicts. Skips all-day events and events on the platform's
 * "Birthdays" / read-only calendars where false positives are common.
 */
export async function findConflictsForLesson(
  date: string,
  time: string,
  durationMinutes: number,
  excludeEventTitle?: string,
): Promise<CalendarConflict[]> {
  const window = lessonWindow(date, time, durationMinutes);
  if (!window) return [];

  const Calendar = await loadCalendarModule();
  if (!Calendar) return [];

  const granted = await ensureCalendarPermission();
  if (!granted) return [];

  let calendars: Awaited<ReturnType<typeof Calendar.getCalendarsAsync>> = [];
  try {
    calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  } catch (err) {
    console.warn("[calendarConflict] getCalendars failed", err);
    return [];
  }

  // Skip system calendars where overlap is meaningless (Birthdays etc).
  const usableCalendars = calendars.filter((cal) => {
    const lower = (cal.title || "").toLowerCase();
    if (lower.includes("birthday")) return false;
    if (Platform.OS === "ios" && cal.source?.name === "Other") return false;
    return true;
  });
  const ids = usableCalendars.map((cal) => cal.id);
  if (ids.length === 0) return [];

  let events: Awaited<ReturnType<typeof Calendar.getEventsAsync>> = [];
  try {
    events = await Calendar.getEventsAsync(ids, window.start, window.end);
  } catch (err) {
    console.warn("[calendarConflict] getEvents failed", err);
    return [];
  }

  const conflicts: CalendarConflict[] = [];
  for (const ev of events) {
    if (ev.allDay) continue;
    const title = ev.title || "(busy)";
    if (excludeEventTitle && title === excludeEventTitle) continue;

    const startISO = ev.startDate ? new Date(ev.startDate).toISOString() : "";
    const endISO = ev.endDate ? new Date(ev.endDate).toISOString() : "";
    const calendar = usableCalendars.find((c) => c.id === ev.calendarId);
    conflicts.push({
      title,
      startISO,
      endISO,
      calendarTitle: calendar?.title || "Calendar",
    });
  }
  return conflicts;
}

/**
 * Format a conflict list for an Alert message body.
 */
export function describeConflicts(conflicts: CalendarConflict[]): string {
  if (conflicts.length === 0) return "";
  const lines = conflicts.slice(0, 3).map((c) => {
    const start = c.startISO ? new Date(c.startISO) : null;
    const timeLabel = start
      ? start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
      : "";
    return `• ${c.title}${timeLabel ? ` at ${timeLabel}` : ""} (${c.calendarTitle})`;
  });
  if (conflicts.length > 3) {
    lines.push(`+ ${conflicts.length - 3} more`);
  }
  return lines.join("\n");
}

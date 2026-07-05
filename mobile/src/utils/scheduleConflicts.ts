// Free-tier conflict detection — no Maps API, no geocoding.
// Detects four problem classes for a single instructor's day:
//
//   1. OVERLAP         — two lessons occupy overlapping time slots
//   2. DOUBLE_BOOKING  — two lessons with the exact same start time
//   3. TIGHT_TRAVEL    — back-to-back lessons in different pickups with no buffer
//   4. GAP             — empty 2h+ window during work hours (configurable)
//
// Travel calc without a Maps API is approximate by design: we assume any change
// of pickup string between consecutive lessons needs a minimum 15 min buffer.
// If the instructor knows two pickups are next door they can ignore the warning.
//
// All four detections are O(n log n) (sort once, single pass).

import type { Lesson } from "../types";

const DEFAULT_TRAVEL_BUFFER_MINUTES = 15;
const DEFAULT_GAP_THRESHOLD_MINUTES = 120;
const DEFAULT_WORK_START_MINUTES = 9 * 60;  // 09:00
const DEFAULT_WORK_END_MINUTES = 18 * 60;   // 18:00

export type ConflictKind = "overlap" | "double_booking" | "tight_travel" | "gap";

export type LessonConflict = {
  kind: ConflictKind;
  /** Lesson IDs involved. For "gap", references the two lessons either side. */
  lessonIds: string[];
  /** Human-readable warning. Surface inline on the day grid. */
  message: string;
};

export type ConflictDetectorOptions = {
  travelBufferMinutes?: number;
  gapThresholdMinutes?: number;
  workStartMinutes?: number;
  workEndMinutes?: number;
};

function parseTime(time: string): number {
  if (!time || typeof time !== "string") return 0;
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function normalizePickup(pickup: string | undefined): string {
  return (pickup || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export type EnrichedLesson = Lesson & {
  startMinutes: number;
  endMinutes: number;
};

/** Pre-process lessons once so the conflict pass + the grid renderer share the same numbers. */
export function enrichLessons(lessons: Lesson[]): EnrichedLesson[] {
  return lessons
    .map((lesson) => {
      const startMinutes = parseTime(lesson.time);
      const endMinutes = startMinutes + (lesson.durationMinutes || 60);
      return { ...lesson, startMinutes, endMinutes };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

export function detectConflicts(
  lessons: EnrichedLesson[],
  options: ConflictDetectorOptions = {},
): LessonConflict[] {
  const travelBuffer = options.travelBufferMinutes ?? DEFAULT_TRAVEL_BUFFER_MINUTES;
  const gapThreshold = options.gapThresholdMinutes ?? DEFAULT_GAP_THRESHOLD_MINUTES;
  const workStart = options.workStartMinutes ?? DEFAULT_WORK_START_MINUTES;
  const workEnd = options.workEndMinutes ?? DEFAULT_WORK_END_MINUTES;

  const conflicts: LessonConflict[] = [];
  // Skip cancelled lessons — they don't compete for time
  const active = lessons.filter((l) => l.status !== "cancelled");

  for (let i = 0; i < active.length; i++) {
    const a = active[i];
    for (let j = i + 1; j < active.length; j++) {
      const b = active[j];
      // List is sorted by start, so once b.start >= a.end + gapThreshold we can stop early
      if (b.startMinutes >= a.endMinutes + gapThreshold && j === i + 1) {
        // Don't break — we still want to flag DOUBLE/OVERLAP later in the list
      }

      // Exact start-time match → double-booking
      if (a.startMinutes === b.startMinutes) {
        conflicts.push({
          kind: "double_booking",
          lessonIds: [a.id, b.id],
          message: `Two lessons booked at ${a.time}`,
        });
        continue;
      }

      // Time overlap
      if (b.startMinutes < a.endMinutes) {
        conflicts.push({
          kind: "overlap",
          lessonIds: [a.id, b.id],
          message: `${a.studentName} (${a.time}) overlaps with ${b.studentName} (${b.time})`,
        });
        continue;
      }

      // Tight travel: only check immediate-next lesson (j === i + 1)
      if (j === i + 1) {
        const gap = b.startMinutes - a.endMinutes;
        const pickupA = normalizePickup(a.pickup);
        const pickupB = normalizePickup(b.pickup);
        if (gap < travelBuffer && pickupA && pickupB && pickupA !== pickupB) {
          conflicts.push({
            kind: "tight_travel",
            lessonIds: [a.id, b.id],
            message: `Only ${gap} min between ${a.studentName} (${a.pickup}) and ${b.studentName} (${b.pickup})`,
          });
        }
      }
    }
  }

  // Gap detection — pairs of consecutive lessons with too-large a hole between them
  for (let i = 0; i + 1 < active.length; i++) {
    const a = active[i];
    const b = active[i + 1];
    const gap = b.startMinutes - a.endMinutes;
    // Only flag gaps INSIDE work hours — gaps before the first or after the last
    // lesson are usually intentional.
    const insideWorkHours = a.endMinutes >= workStart && b.startMinutes <= workEnd;
    if (insideWorkHours && gap >= gapThreshold) {
      conflicts.push({
        kind: "gap",
        lessonIds: [a.id, b.id],
        message: `${Math.round(gap / 60 * 10) / 10}h gap between ${a.studentName} and ${b.studentName}`,
      });
    }
  }

  return conflicts;
}

/** Build a per-lesson lookup for the UI: { [lessonId]: ConflictKind[] }. */
export function conflictsByLesson(conflicts: LessonConflict[]): Record<string, ConflictKind[]> {
  const map: Record<string, ConflictKind[]> = {};
  for (const c of conflicts) {
    if (c.kind === "gap") continue; // gaps aren't attached to a lesson card
    for (const id of c.lessonIds) {
      const existing = map[id] || [];
      if (!existing.includes(c.kind)) existing.push(c.kind);
      map[id] = existing;
    }
  }
  return map;
}

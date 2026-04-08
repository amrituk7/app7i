/**
 * scheduler.js — Pure JS smart scheduling engine.
 * Zero API cost. No external dependencies.
 */

// ── Time helpers ──────────────────────────────────────────────────────────

export function timeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minsToTime(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ── Default availability pattern ──────────────────────────────────────────

export const DEFAULT_AVAILABILITY = {
  Mon: { start: "08:00", end: "18:00", enabled: true  },
  Tue: { start: "08:00", end: "18:00", enabled: true  },
  Wed: { start: "08:00", end: "18:00", enabled: true  },
  Thu: { start: "08:00", end: "18:00", enabled: true  },
  Fri: { start: "08:00", end: "18:00", enabled: true  },
  Sat: { start: "09:00", end: "17:00", enabled: true  },
  Sun: { start: "10:00", end: "16:00", enabled: false },
  bufferMins:          10,
  advanceBookingDays:  28,
  minNoticeHours:      24,
};

export const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDayKey(date) {
  return DAY_KEYS[date.getDay()];
}

// ── Conflict detection ────────────────────────────────────────────────────

/**
 * Returns true if the proposed slot overlaps any existing busy slot.
 * busySlots: [{ time: "HH:MM", duration: number (hours) }]
 */
export function hasConflict(proposedTime, proposedDurationHrs, busySlots, bufferMins = 10) {
  const pStart = timeToMins(proposedTime);
  const pEnd   = pStart + proposedDurationHrs * 60 + bufferMins;

  for (const slot of busySlots) {
    if (!slot.time) continue;
    const eStart = timeToMins(slot.time) - bufferMins;
    const eEnd   = timeToMins(slot.time) + (Number(slot.duration) || 1) * 60;
    if (pStart < eEnd && pEnd > eStart) return true;
  }
  return false;
}

// ── Slot computation ──────────────────────────────────────────────────────

/**
 * Compute available time slots for a specific date.
 *
 * @param {object}  availability   Working pattern (from Firestore or DEFAULT_AVAILABILITY)
 * @param {Array}   busySlots      [{ time, duration }] — already-booked slots for this date
 * @param {Date}    date           The date to compute slots for
 * @param {number}  durationHrs    Lesson duration the student wants (1, 1.5, 2)
 * @returns {Array} [{ time: "HH:MM" }]
 */
export function computeAvailableSlots(availability, busySlots, date, durationHrs) {
  const avail      = availability || DEFAULT_AVAILABILITY;
  const dayKey     = getDayKey(date);
  const dayConfig  = avail[dayKey];

  if (!dayConfig || !dayConfig.enabled) return [];

  const bufferMins      = avail.bufferMins      ?? DEFAULT_AVAILABILITY.bufferMins;
  const minNoticeHours  = avail.minNoticeHours  ?? DEFAULT_AVAILABILITY.minNoticeHours;
  const startMins       = timeToMins(dayConfig.start);
  const endMins         = timeToMins(dayConfig.end);
  const slotDurationMins = durationHrs * 60;

  // Earliest bookable moment (now + minNotice)
  const minBookAt = new Date(Date.now() + minNoticeHours * 3_600_000);

  const slots = [];
  // Generate slots every 30 minutes within working hours
  for (let mins = startMins; mins + slotDurationMins <= endMins; mins += 30) {
    const slotTime = minsToTime(mins);

    // Reject past or too-soon slots
    const slotDt = new Date(date);
    slotDt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    if (slotDt < minBookAt) continue;

    // Reject conflicting slots
    if (!hasConflict(slotTime, durationHrs, busySlots, bufferMins)) {
      slots.push({ time: slotTime });
    }
  }
  return slots;
}

// ── Bookable dates ────────────────────────────────────────────────────────

/**
 * Returns all bookable Date objects in the next `daysAhead` days,
 * based on the availability working pattern.
 */
export function getBookableDates(availability, daysAhead = 28) {
  const avail = availability || DEFAULT_AVAILABILITY;
  const days  = avail.advanceBookingDays ?? daysAhead;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 1; i <= days; i++) {
    const d   = new Date(today);
    d.setDate(today.getDate() + i);
    const key = getDayKey(d);
    if (avail[key]?.enabled) dates.push(d);
  }
  return dates;
}

// ── Dynamic price calculation ─────────────────────────────────────────────

/**
 * Calculate the lesson price based on instructor profile + lesson details.
 * Zero API cost — pure rule-based logic.
 */
export function calcLessonPrice(profile, lessonDate, transmission, lessonType, durationHrs) {
  if (!profile) return 0;

  // Test-day flat fee
  if (lessonType === "test-day" && profile.testDayFee) {
    return Number(profile.testDayFee);
  }

  const d         = lessonDate ? new Date(lessonDate) : new Date();
  const isSunday  = d.getDay() === 0;

  let ratePerHour = 0;

  if (transmission === "auto") {
    if (isSunday && profile.autoSundayRate)   ratePerHour = Number(profile.autoSundayRate);
    else if (profile.autoWeekdayRate)          ratePerHour = Number(profile.autoWeekdayRate);
  } else {
    // Manual (default)
    if (profile.manualRate)                    ratePerHour = Number(profile.manualRate);
    else if (profile.manualWeekdayRate)        ratePerHour = Number(profile.manualWeekdayRate);
  }

  // Fallback to generic hourly rate
  if (!ratePerHour && profile.hourlyRate) ratePerHour = Number(profile.hourlyRate);

  return +(ratePerHour * durationHrs).toFixed(2);
}

// ── Waitlist matching ─────────────────────────────────────────────────────

/**
 * Find the best waitlist candidate for an empty slot (FIFO within preference match).
 * Returns the first matching entry or null.
 */
export function findWaitlistMatch(emptySlot, waitlist = []) {
  const slotDay  = getDayKey(new Date(emptySlot.date));
  const slotMins = timeToMins(emptySlot.time);

  return (
    waitlist
      .filter(w => !w.preferredDays?.length || w.preferredDays.includes(slotDay))
      .filter(w => {
        if (!w.preferredHours) return true;
        const from = timeToMins(w.preferredHours.from || "00:00");
        const to   = timeToMins(w.preferredHours.to   || "23:59");
        return slotMins >= from && slotMins <= to;
      })
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
    [0] || null
  );
}

// ── Haversine distance (zero-cost route awareness) ────────────────────────

/**
 * Straight-line distance in km between two GPS coordinates.
 * No API needed — pure math.
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

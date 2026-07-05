// Local notification reminder for monthly earnings statements. Schedules a
// silent local notification at the start of the next calendar month telling
// the instructor to download last month's statement before it scrolls out of
// the in-app view (older than 3 months are tucked into the archive list).
//
// Native module `expo-notifications` is lazy-loaded the same way pushService
// does it — an OTA that references this file is safe even on older APKs.

import AsyncStorage from "@react-native-async-storage/async-storage";

type NotificationsModule = typeof import("expo-notifications");

let _notifications: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (_notifications !== undefined) return _notifications;
  try {
    _notifications = await import("expo-notifications");
    return _notifications;
  } catch {
    _notifications = null;
    return null;
  }
}

const SCHEDULED_KEY = "app7i.statementReminder.lastScheduled";

function firstOfNextMonth(now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);
  return d;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Schedule a one-shot notification at 9am on the first of next month.
 * Idempotent — if a reminder is already scheduled for the same target month,
 * does nothing. Safe to call on every Earnings screen mount.
 */
export async function ensureStatementReminderScheduled(): Promise<void> {
  const target = firstOfNextMonth();
  const targetKey = monthKey(target);

  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (stored === targetKey) return; // already scheduled for this target month
  } catch {
    // ignore — proceed to schedule
  }

  const Notifications = await loadNotifications();
  if (!Notifications) return;

  // Permissions check — if not granted, request silently. We don't block here
  // because permission denial is fine; the in-app banner still works.
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (
      settings.status !== "granted"
      && settings.status !== "denied"
    ) {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // ignore
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your monthly earnings statement is ready",
        body: "Download last month's statement to keep a permanent copy before it's archived.",
        data: { url: "app7i://earnings" },
      },
      // expo-notifications SDK 55: pass `Date` for one-shot scheduling.
      trigger: target as unknown as null,
    });
    await AsyncStorage.setItem(SCHEDULED_KEY, targetKey);
  } catch {
    // ignore — scheduling failures shouldn't break the screen
  }
}

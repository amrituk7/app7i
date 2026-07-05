// Read/write the per-user lesson reminder preferences subcollection.
// Path: users/{uid}/settings/reminders
//
// Mirror of src/services/reminderPrefs.js — same shape, same defaults so the
// web and mobile clients agree. The scheduled Cloud Function reads via the
// admin SDK and bypasses these client APIs entirely.

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";

export const DEFAULT_LEAD_MINUTES: number[] = [1440, 120];

export type LeadPreset = { label: string; value: number };

export const PRESET_LEAD_MINUTES: LeadPreset[] = [
  { label: "1 day", value: 1440 },
  { label: "12 hours", value: 720 },
  { label: "4 hours", value: 240 },
  { label: "2 hours", value: 120 },
  { label: "1 hour", value: 60 },
  { label: "30 minutes", value: 30 },
];

export type ReminderPrefs = {
  enabled: boolean;
  leadMinutes: number[];
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
};

export function defaultReminderPrefs(): ReminderPrefs {
  return {
    enabled: true,
    leadMinutes: [...DEFAULT_LEAD_MINUTES],
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
  };
}

function reminderPrefsRef(uid: string) {
  if (!firestore) throw new Error("Firestore is not configured");
  return doc(firestore, "users", uid, "settings", "reminders");
}

function sanitiseLeadMinutes(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_LEAD_MINUTES];
  const cleaned = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0 && entry <= 7 * 24 * 60);
  const unique = Array.from(new Set(cleaned));
  unique.sort((a, b) => b - a);
  return unique.length > 0 ? unique : [...DEFAULT_LEAD_MINUTES];
}

export async function getReminderPrefs(uid: string | null | undefined): Promise<ReminderPrefs> {
  if (!uid || !firestore) return defaultReminderPrefs();
  try {
    const snap = await getDoc(reminderPrefsRef(uid));
    if (!snap.exists()) return defaultReminderPrefs();
    const data = (snap.data() as Partial<ReminderPrefs>) || {};
    return {
      enabled: data.enabled !== false,
      leadMinutes: sanitiseLeadMinutes(data.leadMinutes),
      emailEnabled: data.emailEnabled !== false,
      pushEnabled: data.pushEnabled === true,
      inAppEnabled: data.inAppEnabled !== false,
    };
  } catch (error) {
    console.warn("[reminderPrefs] read failed (using defaults)", (error as Error)?.message);
    return defaultReminderPrefs();
  }
}

export async function saveReminderPrefs(
  uid: string,
  partial: Partial<ReminderPrefs>,
): Promise<ReminderPrefs> {
  if (!uid) throw new Error("saveReminderPrefs: uid is required");
  if (!firestore) throw new Error("Firestore is not configured");

  const merged: ReminderPrefs = { ...defaultReminderPrefs(), ...partial } as ReminderPrefs;
  if (Array.isArray(partial.leadMinutes)) {
    merged.leadMinutes = sanitiseLeadMinutes(partial.leadMinutes);
  }

  await setDoc(
    reminderPrefsRef(uid),
    {
      enabled: merged.enabled !== false,
      leadMinutes: merged.leadMinutes,
      emailEnabled: merged.emailEnabled !== false,
      pushEnabled: merged.pushEnabled === true,
      inAppEnabled: merged.inAppEnabled !== false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return merged;
}

export function describeLeadMinutes(leadMinutes: number): string {
  if (!Number.isFinite(leadMinutes)) return "soon";
  if (leadMinutes >= 1440 && leadMinutes % 1440 === 0) {
    const days = leadMinutes / 1440;
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (leadMinutes >= 60 && leadMinutes % 60 === 0) {
    const hours = leadMinutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${leadMinutes} min`;
}

// Notification centre + per-type notification preferences.
//
// The backend (functions/index.js createNotificationIfNeeded) writes every
// in-app notification to `notifications` with a recipientUid. This service
// reads the current user's feed, tracks read state, and manages the
// users/{uid}.notificationPrefs mute switches the backend honours.

import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "./firebase";

function db() {
  if (!firestore) throw new Error("Firestore not configured.");
  return firestore;
}

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: number;
  lessonId?: string;
};

// Keys mirror NOTIFICATION_PREF_KEYS in functions/index.js — a `false` here
// makes the backend skip both the centre entry and the push for that type.
export type NotificationPrefs = {
  messages: boolean;
  lessonActivity: boolean;
  paymentPrompts: boolean;
  dailySummary: boolean;
  feedbackPrompts: boolean;
  feedbackSummaries: boolean;
};

export function defaultNotificationPrefs(): NotificationPrefs {
  return {
    messages: true,
    lessonActivity: true,
    paymentPrompts: true,
    dailySummary: true,
    feedbackPrompts: true,
    feedbackSummaries: true,
  };
}

function asNotification(id: string, data: DocumentData): AppNotification {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    message: typeof data.message === "string" ? data.message : "",
    type: typeof data.type === "string" ? data.type : "general",
    read: data.read === true,
    timestamp: typeof data.timestamp === "number" ? data.timestamp : 0,
    lessonId: typeof data.lessonId === "string" ? data.lessonId : undefined,
  };
}

export async function getNotifications(
  uid: string,
  max = 100,
): Promise<AppNotification[]> {
  const snap = await getDocs(
    query(
      collection(db(), "notifications"),
      where("recipientUid", "==", uid),
      orderBy("timestamp", "desc"),
      fsLimit(max),
    ),
  );
  return snap.docs.map((d) => asNotification(d.id, d.data()));
}

export async function getUnreadNotificationCount(uid: string): Promise<number> {
  const snap = await getCountFromServer(
    query(
      collection(db(), "notifications"),
      where("recipientUid", "==", uid),
      where("read", "==", false),
    ),
  );
  return snap.data().count;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db(), "notifications", notificationId), { read: true });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(db(), "notifications", notificationId));
}

export async function markAllNotificationsRead(uid: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db(), "notifications"),
      where("recipientUid", "==", uid),
      where("read", "==", false),
      fsLimit(400),
    ),
  );
  if (snap.empty) return 0;
  const batch = writeBatch(db());
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
  return snap.size;
}

export async function getNotificationPrefs(uid: string): Promise<NotificationPrefs> {
  const snap = await getDoc(doc(db(), "users", uid));
  const raw = snap.exists() ? (snap.data().notificationPrefs as Partial<NotificationPrefs> | undefined) : undefined;
  return { ...defaultNotificationPrefs(), ...(raw || {}) };
}

export async function saveNotificationPrefs(
  uid: string,
  prefs: NotificationPrefs,
): Promise<void> {
  await updateDoc(doc(db(), "users", uid), { notificationPrefs: prefs });
}

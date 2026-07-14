// Mobile push notification registration.
// Registers an FCM device token (NOT an Expo push token) so the existing
// firebase-admin/messaging dispatch on the backend works unchanged.
//
// expo-notifications and expo-device are loaded LAZILY. An OTA update that
// touches this file otherwise crashes on startup for any APK installed before
// these native modules were added — the import throws synchronously during
// AuthContext mount, the app never finishes booting, and the user sees a
// frozen splash screen ("all green") until they reinstall.

import { Platform } from "react-native";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";

type NotificationsModule = typeof import("expo-notifications");
type DeviceModule = typeof import("expo-device");

let _notifications: NotificationsModule | null | undefined;
let _device: DeviceModule | null | undefined;
let _handlerInstalled = false;
let _channelsInstalled = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (_notifications !== undefined) return _notifications;
  try {
    _notifications = await import("expo-notifications");
    return _notifications;
  } catch (err) {
    console.warn("[push] expo-notifications not available — push disabled until next AAB", err);
    _notifications = null;
    return null;
  }
}

async function loadDevice(): Promise<DeviceModule | null> {
  if (_device !== undefined) return _device;
  try {
    _device = await import("expo-device");
    return _device;
  } catch (err) {
    console.warn("[push] expo-device not available", err);
    _device = null;
    return null;
  }
}

async function ensureForegroundHandler(): Promise<void> {
  if (_handlerInstalled) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  _handlerInstalled = true;
}

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  if (_channelsInstalled) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const channels = [
    { id: "app7i-default", name: "General", importance: Notifications.AndroidImportance.DEFAULT },
    { id: "app7i-messages", name: "Messages", importance: Notifications.AndroidImportance.HIGH },
  ];
  for (const channel of channels) {
    try {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0B0B0C",
      });
    } catch (err) {
      console.warn("[push] channel setup failed", channel.id, err);
    }
  }
  _channelsInstalled = true;
}

async function ensurePermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status === "granted") return true;
  if (!settings.canAskAgain) return false;
  const ask = await Notifications.requestPermissionsAsync();
  return ask.status === "granted";
}

/**
 * Get the FCM device token. We deliberately use getDevicePushTokenAsync
 * (not getExpoPushTokenAsync) because the backend dispatches via
 * firebase-admin/messaging which expects raw FCM tokens.
 */
async function getFcmToken(): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  try {
    const result = await Notifications.getDevicePushTokenAsync();
    if (typeof result?.data === "string") return result.data;
    return null;
  } catch (err) {
    console.error("[push] getDevicePushTokenAsync failed", err);
    return null;
  }
}

/**
 * Register the current user's device for push. Safe to call repeatedly —
 * arrayUnion dedupes the token in Firestore.
 *
 * Call AFTER the user is signed in and email-verified (Firestore rules
 * require email_verified for the users/{uid} update).
 */
export async function registerForPushNotifications(): Promise<{
  ok: boolean;
  token?: string;
  reason?: string;
}> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return { ok: false, reason: "module-missing" };

    const Device = await loadDevice();
    if (Device && !Device.isDevice) {
      return { ok: false, reason: "emulator" };
    }
    if (!firebaseAuth?.currentUser?.uid) {
      return { ok: false, reason: "no-user" };
    }
    if (!firestore) {
      return { ok: false, reason: "no-firestore" };
    }

    await ensureForegroundHandler();
    await ensureAndroidChannels();

    const granted = await ensurePermission();
    if (!granted) {
      console.log("[push] permission not granted");
      return { ok: false, reason: "permission-denied" };
    }

    const token = await getFcmToken();
    if (!token) {
      return { ok: false, reason: "no-token" };
    }

    const uid = firebaseAuth.currentUser.uid;
    await setDoc(
      doc(firestore, "users", uid),
      {
        fcmTokens: arrayUnion(token),
        [`fcmTokensMeta.${token}`]: {
          platform: Platform.OS,
          updatedAt: serverTimestamp(),
        },
      },
      { merge: true },
    );

    console.log("[push] registered FCM token", token.slice(0, 12), "...");
    return { ok: true, token };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[push] registerForPushNotifications failed", message);
    return { ok: false, reason: message.slice(0, 200) };
  }
}

/**
 * Subscribe to notification taps (cold-open + warm tap). Returns an unsubscribe.
 * The handler receives the `data.url` from the FCM payload so the caller can
 * deep-link to the right screen.
 */
export function subscribeToNotificationTaps(
  handler: (url: string, data: Record<string, unknown>) => void,
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  (async () => {
    const Notifications = await loadNotifications();
    if (!Notifications || cancelled) return;

    // Cold-open: app launched by tapping a notification
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const data = (response.notification.request.content.data || {}) as Record<string, unknown>;
        const url = typeof data.url === "string" ? data.url : "";
        if (url) handler(url, data);
      }
    } catch {}

    // Warm tap: user taps while the app is running
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data || {}) as Record<string, unknown>;
      const url = typeof data.url === "string" ? data.url : "";
      if (url) handler(url, data);
    });
    unsub = () => sub.remove();
  })();

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

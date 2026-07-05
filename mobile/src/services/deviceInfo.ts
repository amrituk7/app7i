// Sign-in device payload for the recordSignIn Cloud Function.
// Uses only packages already installed in mobile/package.json:
//   - react-native (Platform)
//   - @react-native-async-storage/async-storage (stable deviceId)
//   - expo-crypto (UUID generation)
//   - expo-application is NOT installed — appVersion comes from app.json via Constants

import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "app7i.deviceId";

export type SignInDevicePayload = {
  deviceId: string;
  platform: string;
  model: string;
  appVersion: string;
  userAgent: string;
};

async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // Best-effort fallback — still produces a stable-per-process id
    return `anon-${Date.now().toString(36)}`;
  }
}

function getModelLabel(): string {
  try {
    const consts = Platform.constants as { Model?: string; Brand?: string } | undefined;
    if (Platform.OS === "android") {
      const brand = consts?.Brand || "";
      const model = consts?.Model || "";
      const combined = [brand, model].filter(Boolean).join(" ").trim();
      return combined ? combined.slice(0, 60) : "Android device";
    }
    if (Platform.OS === "ios") return "iOS device";
  } catch {}
  return "mobile device";
}

function getAppVersion(): string {
  try {
    // expo-constants is present as a transitive dep (used by expo-updates etc).
    // We tolerate it being missing or returning nothing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants");
    const c = Constants?.default || Constants;
    return (
      c?.expoConfig?.version
      || c?.manifest?.version
      || c?.manifest2?.extra?.expoClient?.version
      || "unknown"
    );
  } catch {
    return "unknown";
  }
}

export async function getSignInDevicePayload(): Promise<SignInDevicePayload> {
  const deviceId = await getOrCreateDeviceId();
  return {
    deviceId,
    platform: Platform.OS,
    model: getModelLabel(),
    appVersion: getAppVersion(),
    userAgent: `App7i-mobile/${Platform.OS} v${Platform.Version}`,
  };
}

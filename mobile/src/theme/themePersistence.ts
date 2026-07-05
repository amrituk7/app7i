import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

const KEY = "app7i.theme.mode";

function isMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export async function loadStoredMode(): Promise<ThemeMode> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return isMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export async function saveStoredMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, mode);
  } catch {
    // Persistence is best-effort — silent failure keeps the in-memory state correct.
  }
}

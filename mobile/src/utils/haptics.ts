/**
 * Wrappers around expo-haptics that fail silently if the native module isn't
 * available in the running APK. This means we can ship haptic-using code via
 * OTA without crashing on older APKs that didn't bundle expo-haptics.
 */

type HapticsModule = typeof import("expo-haptics");
let cachedHaptics: HapticsModule | null | undefined = undefined;

function getHaptics(): HapticsModule | null {
  if (cachedHaptics !== undefined) return cachedHaptics;
  try {
    cachedHaptics = require("expo-haptics") as HapticsModule;
    return cachedHaptics;
  } catch {
    cachedHaptics = null;
    return null;
  }
}

/** Light tap — for any tappable button (default). */
export function hapticTap() {
  const h = getHaptics();
  if (!h) return;
  try {
    h.impactAsync(h.ImpactFeedbackStyle.Light);
  } catch {}
}

/** Medium tap — for confirming actions (mark paid, save). */
export function hapticConfirm() {
  const h = getHaptics();
  if (!h) return;
  try {
    h.impactAsync(h.ImpactFeedbackStyle.Medium);
  } catch {}
}

/** Success notification — for completed flows (booking, payment received). */
export function hapticSuccess() {
  const h = getHaptics();
  if (!h) return;
  try {
    h.notificationAsync(h.NotificationFeedbackType.Success);
  } catch {}
}

/** Warning notification — for confirmations / destructive precursors. */
export function hapticWarning() {
  const h = getHaptics();
  if (!h) return;
  try {
    h.notificationAsync(h.NotificationFeedbackType.Warning);
  } catch {}
}

/** Error notification — for failed actions. */
export function hapticError() {
  const h = getHaptics();
  if (!h) return;
  try {
    h.notificationAsync(h.NotificationFeedbackType.Error);
  } catch {}
}

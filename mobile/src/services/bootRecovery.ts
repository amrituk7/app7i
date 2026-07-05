// Boot heartbeat + auto-rollback for bad OTA updates.
//
// Mechanism:
//
//   1. On every cold start we check AsyncStorage for the previous "boot in
//      progress" flag. If it was set and matches the CURRENT updateId, the
//      previous boot of this exact OTA never finished — almost certainly
//      because the JS bundle threw on first render. Treat that update as
//      bad: ask the update server for the latest update (which will be the
//      rollback we publish via `eas update:republish`) and reload into it.
//
//   2. We then mark the current update as "in progress".
//
//   3. After ~5 seconds of stable rendering we mark the boot as successful,
//      clearing the in-progress flag. If we never get there, step 1 of the
//      next launch will detect that and recover.
//
// All operations are wrapped in try/catch — boot recovery itself MUST NOT
// be the thing that breaks the app. Failures here are logged and otherwise
// silent.
//
// The Expo SDK 55 API does NOT expose a way to clear the local OTA cache
// from JS, so the recovery path depends on a fixed/rollback update being
// available from the server. The flow assumes: when an OTA is found to be
// bad, the developer immediately publishes a rollback (or a fix) on the
// same branch — the recovery code then auto-fetches that and applies it
// without user action.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";

const BOOT_IN_PROGRESS_KEY = "app7i.bootRecovery.inProgress";
const BOOT_RECOVERED_KEY = "app7i.bootRecovery.lastRecoveredId";
const BOOT_STABLE_DELAY_MS = 5000;

function activeUpdateId(): string {
  // Updates.updateId is null when running the embedded bundle; we use a
  // sentinel so the in-progress flag is non-empty in that case too.
  return Updates.updateId || "embedded";
}

/**
 * Run as early as possible at app launch. Returns true if the previous boot
 * of this exact OTA failed and we are about to roll back. The caller should
 * NOT proceed with normal startup work after a true return — the app is
 * about to reload.
 */
export async function recoverIfPreviousBootFailed(): Promise<boolean> {
  // Never roll back the embedded bundle — there's nowhere safer to go.
  if (Updates.isEmbeddedLaunch || !Updates.isEnabled) return false;

  try {
    const inProgress = await AsyncStorage.getItem(BOOT_IN_PROGRESS_KEY);
    const currentId = activeUpdateId();
    if (!inProgress || inProgress !== currentId) return false;

    // Don't loop on rollback — if we already recovered from this id once,
    // bail out so we don't keep wiping the cache forever.
    const lastRecovered = await AsyncStorage.getItem(BOOT_RECOVERED_KEY);
    if (lastRecovered === currentId) {
      console.warn("[bootRecovery] already recovered from", currentId, "— giving up");
      await AsyncStorage.removeItem(BOOT_IN_PROGRESS_KEY);
      return false;
    }

    console.error(
      "[bootRecovery] previous boot of OTA",
      currentId,
      "did not finish; rolling back to embedded bundle",
    );

    await AsyncStorage.setItem(BOOT_RECOVERED_KEY, currentId);
    await AsyncStorage.removeItem(BOOT_IN_PROGRESS_KEY);

    // Ask the server for the latest update on our branch. If we (the dev)
    // have published a rollback or a fix in response to the crash, this
    // returns it and we apply it via reloadAsync().
    let recovered = false;
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        await Updates.fetchUpdateAsync();
        recovered = true;
      }
    } catch (err) {
      console.warn("[bootRecovery] auto-fetch failed", err);
    }

    if (recovered) {
      try {
        await Updates.reloadAsync();
        return true;
      } catch (err) {
        console.warn("[bootRecovery] reloadAsync failed", err);
      }
    } else {
      console.warn(
        "[bootRecovery] no rollback available from server — app will keep running on the same OTA. Publish a fix on the same branch.",
      );
    }
    return false;
  } catch (err) {
    console.warn("[bootRecovery] recover check failed", err);
    return false;
  }
}

/** Mark this boot as "in progress" — paired with markBootSuccessful below. */
export async function markBootInProgress(): Promise<void> {
  if (Updates.isEmbeddedLaunch || !Updates.isEnabled) return;
  try {
    await AsyncStorage.setItem(BOOT_IN_PROGRESS_KEY, activeUpdateId());
  } catch (err) {
    console.warn("[bootRecovery] markBootInProgress failed", err);
  }
}

/** Clear the in-progress flag once the app has rendered without crashing. */
export async function markBootSuccessful(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BOOT_IN_PROGRESS_KEY);
    // Keep BOOT_RECOVERED_KEY so we don't loop on the same bad update if it
    // somehow reappears — it's only cleared when a NEWER good update boots
    // successfully (handled in scheduleStableBootMarker below).
    const lastRecovered = await AsyncStorage.getItem(BOOT_RECOVERED_KEY);
    if (lastRecovered && lastRecovered !== activeUpdateId()) {
      await AsyncStorage.removeItem(BOOT_RECOVERED_KEY);
    }
  } catch (err) {
    console.warn("[bootRecovery] markBootSuccessful failed", err);
  }
}

/**
 * Convenience: schedules markBootSuccessful after BOOT_STABLE_DELAY_MS. Returns
 * a cleanup function suitable for a useEffect return.
 */
export function scheduleStableBootMarker(): () => void {
  const timer = setTimeout(() => {
    void markBootSuccessful();
  }, BOOT_STABLE_DELAY_MS);
  return () => clearTimeout(timer);
}

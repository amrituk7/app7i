// Mobile callable wrapper for the recordSignIn Cloud Function.
// MUST never block login or navigation. MUST swallow all errors.

import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions } from "./firebase";
import type { SignInDevicePayload } from "./deviceInfo";

export type RecordSignInResult = {
  ok: boolean;
  newDevice?: boolean;
  emailSent?: boolean;
  provider?: string;
};

/**
 * Fire-and-forget call to the recordSignIn Cloud Function.
 * - Catches all errors
 * - Logs errors
 * - Never blocks login or navigation
 * - Returns null on failure
 */
export async function recordSignIn(
  input: SignInDevicePayload,
): Promise<RecordSignInResult | null> {
  try {
    if (!functions) {
      console.error("[SecurityEmail] functions not configured, skipping recordSignIn");
      return null;
    }
    console.log("[SecurityEmail] recordSignIn:start", {
      platform: input.platform,
      deviceId: input.deviceId.slice(0, 8),
      appVersion: input.appVersion,
    });
    const callable = httpsCallable(functions, "recordSignIn");
    const result: HttpsCallableResult = await callable(input);
    const data = (result?.data || null) as RecordSignInResult | null;
    console.log("[SecurityEmail] recordSignIn:result", data);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[SecurityEmail] recordSignIn:failure", message.slice(0, 300));
    return null;
  }
}

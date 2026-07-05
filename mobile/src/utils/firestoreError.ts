/**
 * Translates a Firebase / Firestore error into human copy.
 *
 * Inspects `error.code` (the canonical Firebase error code) FIRST. Only falls
 * back to message-substring matching when the error isn't a structured
 * FirebaseError — which keeps the mapping resilient to firebase-js-sdk message
 * changes between versions.
 */

type ErrorWithCode = { code?: string; message?: string };

export type FirestoreErrorContext = {
  /** What the user was doing — used for telemetry, not shown. */
  action?: string;
  /** Whether the user might be unverified (gates the verify-email hint). */
  mayBeUnverified?: boolean;
};

export function describeFirestoreError(
  error: unknown,
  ctx: FirestoreErrorContext = {},
): string {
  const code = readCode(error);
  const msg = readMessage(error);

  // Telemetry — always log so we have signal in the logcat / device console.
  console.error("[Firestore]", ctx.action || "unknown", code || "no-code", msg);

  if (code === "permission-denied") {
    return ctx.mayBeUnverified
      ? "Verify your email first — tap the link in your inbox, then come back."
      : "You don't have access to this. Sign out and back in to refresh your session.";
  }
  if (code === "unauthenticated") {
    return "Your session expired. Please sign in again.";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "We can't reach the server. Check your connection and try again.";
  }
  if (code === "not-found") {
    return "That record is no longer available.";
  }
  if (code === "already-exists") {
    return "That already exists.";
  }
  if (code === "resource-exhausted") {
    return "Too many tries. Wait a moment and try again.";
  }
  if (code === "failed-precondition") {
    return "Some preconditions weren't met. Refresh and try again.";
  }
  if (code === "cancelled" || code === "aborted") {
    return "That action was cancelled. Try again.";
  }

  // Fallback — substring match for non-FirebaseError exceptions only.
  if (/network|offline|fetch failed/i.test(msg)) {
    return "You're offline. Check your connection and try again.";
  }

  return "Something didn't go through. Pull to refresh and try again.";
}

function readCode(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = (e as ErrorWithCode).code;
    if (typeof code !== "string") return undefined;
    // Firebase prefixes Firestore errors with "firestore/" sometimes — strip it.
    return code.replace(/^firestore\//, "").replace(/^auth\//, "");
  }
  return undefined;
}

function readMessage(e: unknown): string {
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as ErrorWithCode).message || "");
  }
  return "";
}

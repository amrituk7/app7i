import {
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  OAuthProvider,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { firebaseAuth, firebaseFunctions, firestore, isFirebaseConfigured } from "./firebase";
import { recordSignIn } from "./securityEmail";
import { getSignInDevicePayload } from "./deviceInfo";
import { AppUser, UserRole } from "../types";

// Fire-and-forget security-email trigger.
// MUST NOT block login. MUST NOT throw. MUST NOT show user-facing errors.
async function triggerSecurityEmail(): Promise<void> {
  try {
    const payload = await getSignInDevicePayload();
    recordSignIn(payload).catch((err) => {
      console.error("[SecurityEmail] non-blocking mobile failure", err);
    });
  } catch (error) {
    console.error("[SecurityEmail] non-blocking mobile failure", error);
  }
}

type VerificationEmailContext = "signup" | "resend" | "student-self-onboard" | "fallback-resend";

type VerificationEmailDebugInfo = {
  currentUserEmail: string | null;
  currentUserEmailVerified: boolean | null;
  currentUserUid: string | null;
  currentUserProviderData: Array<Record<string, string | null>>;
  projectId: string | null;
  appId: string | null;
  authDomain: string | null;
  lastVerificationEmailAttemptAt: string | null;
  lastVerificationEmailSentAt: string | null;
  lastVerificationEmailContext: VerificationEmailContext | null;
  lastVerificationErrorCode: string | null;
  lastVerificationErrorMessage: string | null;
  lastVerificationErrorAt: string | null;
  lastFallbackVerificationEmailAttemptAt: string | null;
  lastFallbackVerificationEmailSentAt: string | null;
  lastFallbackVerificationProvider: string | null;
  lastFallbackVerificationErrorCode: string | null;
  lastFallbackVerificationErrorMessage: string | null;
  lastFallbackVerificationErrorAt: string | null;
};

type VerificationEmailState = Pick<
  VerificationEmailDebugInfo,
  | "lastVerificationEmailAttemptAt"
  | "lastVerificationEmailSentAt"
  | "lastVerificationEmailContext"
  | "lastVerificationErrorCode"
  | "lastVerificationErrorMessage"
  | "lastVerificationErrorAt"
  | "lastFallbackVerificationEmailAttemptAt"
  | "lastFallbackVerificationEmailSentAt"
  | "lastFallbackVerificationProvider"
  | "lastFallbackVerificationErrorCode"
  | "lastFallbackVerificationErrorMessage"
  | "lastFallbackVerificationErrorAt"
>;

let verificationEmailState: VerificationEmailState = {
  lastVerificationEmailAttemptAt: null,
  lastVerificationEmailSentAt: null,
  lastVerificationEmailContext: null,
  lastVerificationErrorCode: null,
  lastVerificationErrorMessage: null,
  lastVerificationErrorAt: null,
  lastFallbackVerificationEmailAttemptAt: null,
  lastFallbackVerificationEmailSentAt: null,
  lastFallbackVerificationProvider: null,
  lastFallbackVerificationErrorCode: null,
  lastFallbackVerificationErrorMessage: null,
  lastFallbackVerificationErrorAt: null,
};

function requireAuth() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("Connection issue. Please restart the app or try again.");
  }
  return firebaseAuth;
}

function requireFirestore() {
  if (!firestore) {
    throw new Error("Firestore isn't configured.");
  }
  return firestore;
}

function providerDebug(user: FirebaseUser | null) {
  return (user?.providerData || []).map((provider) => ({
    providerId: provider.providerId,
    uid: provider.uid,
    email: provider.email,
    displayName: provider.displayName,
    phoneNumber: provider.phoneNumber,
  }));
}

function firebaseOptionsFor() {
  return firebaseAuth?.app.options || {};
}

function errorCode(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function verificationLogPayload(context: VerificationEmailContext, user: FirebaseUser | null) {
  const options = firebaseOptionsFor();
  return {
    context,
    uid: user?.uid || null,
    email: user?.email || null,
    emailVerified: user?.emailVerified ?? null,
    providerData: providerDebug(user),
    projectId: options.projectId || null,
    appId: options.appId || null,
    authDomain: options.authDomain || null,
    actionCodeSettings: "none",
  };
}

async function sendVerificationEmailWithDiagnostics(
  user: FirebaseUser,
  context: VerificationEmailContext,
): Promise<void> {
  const attemptAt = new Date().toISOString();
  verificationEmailState = {
    ...verificationEmailState,
    lastVerificationEmailAttemptAt: attemptAt,
    lastVerificationEmailSentAt: null,
    lastVerificationEmailContext: context,
  };

  console.info("[authService] sendEmailVerification:start", {
    ...verificationLogPayload(context, user),
    attemptAt,
  });

  try {
    // v12 diagnostic patch: intentionally no ActionCodeSettings here.
    await sendEmailVerification(user);
    const sentAt = new Date().toISOString();
    verificationEmailState = {
      ...verificationEmailState,
      lastVerificationEmailAttemptAt: attemptAt,
      lastVerificationEmailSentAt: sentAt,
      lastVerificationEmailContext: context,
      lastVerificationErrorCode: null,
      lastVerificationErrorMessage: null,
      lastVerificationErrorAt: null,
    };
    console.info("[authService] sendEmailVerification:success", {
      ...verificationLogPayload(context, user),
      attemptAt,
      sentAt,
    });
  } catch (error) {
    const failedAt = new Date().toISOString();
    verificationEmailState = {
      ...verificationEmailState,
      lastVerificationEmailContext: context,
      lastVerificationEmailSentAt: null,
      lastVerificationErrorCode: errorCode(error),
      lastVerificationErrorMessage: errorMessage(error),
      lastVerificationErrorAt: failedAt,
    };
    console.error("[authService] sendEmailVerification:failure", {
      ...verificationLogPayload(context, user),
      attemptAt,
      failedAt,
      errorCode: errorCode(error),
      errorMessage: errorMessage(error),
    });
    throw error;
  }
}

export function getVerificationEmailDebugInfo(): VerificationEmailDebugInfo {
  const currentUser = firebaseAuth?.currentUser || null;
  const options = firebaseOptionsFor();
  return {
    currentUserEmail: currentUser?.email || null,
    currentUserEmailVerified: currentUser?.emailVerified ?? null,
    currentUserUid: currentUser?.uid || null,
    currentUserProviderData: providerDebug(currentUser),
    projectId: options.projectId || null,
    appId: options.appId || null,
    authDomain: options.authDomain || null,
    ...verificationEmailState,
  };
}

/**
 * Refresh the cached Firebase Auth state AND force-issue a new ID token so
 * Firestore rules see the latest custom claims (including `email_verified`).
 *
 * `currentUser.reload()` updates the in-memory user object but does NOT
 * invalidate the cached ID token. Without `getIdToken(true)`, every Firestore
 * write continues to be rejected with `permission-denied` even after the user
 * clicks the verification link.
 */
export async function refreshAuthAndToken(): Promise<FirebaseUser | null> {
  if (!firebaseAuth?.currentUser) return null;
  await reload(firebaseAuth.currentUser);
  await firebaseAuth.currentUser.getIdToken(true);
  return firebaseAuth.currentUser;
}

export async function sendVerificationEmail(): Promise<void> {
  if (!firebaseAuth?.currentUser) {
    const error = new Error("No current Firebase user is available for email verification.");
    const failedAt = new Date().toISOString();
    verificationEmailState = {
      ...verificationEmailState,
      lastVerificationEmailAttemptAt: failedAt,
      lastVerificationEmailSentAt: null,
      lastVerificationEmailContext: "resend",
      lastVerificationErrorCode: null,
      lastVerificationErrorMessage: error.message,
      lastVerificationErrorAt: failedAt,
    };
    console.error("[authService] sendEmailVerification:failure", {
      ...verificationLogPayload("resend", null),
      failedAt,
      errorCode: null,
      errorMessage: error.message,
    });
    throw error;
  }
  await sendVerificationEmailWithDiagnostics(firebaseAuth.currentUser, "resend");
}

export async function sendVerificationEmailFallback(): Promise<void> {
  const currentUser = firebaseAuth?.currentUser || null;
  const attemptAt = new Date().toISOString();
  verificationEmailState = {
    ...verificationEmailState,
    lastFallbackVerificationEmailAttemptAt: attemptAt,
    lastFallbackVerificationEmailSentAt: null,
    lastFallbackVerificationProvider: null,
    lastFallbackVerificationErrorCode: null,
    lastFallbackVerificationErrorMessage: null,
    lastFallbackVerificationErrorAt: null,
  };

  console.info("[authService] sendVerificationEmailFallback:start", {
    ...verificationLogPayload("fallback-resend", currentUser),
    attemptAt,
  });

  if (!firebaseFunctions) {
    const error = new Error("Firebase Functions isn't configured.");
    verificationEmailState = {
      ...verificationEmailState,
      lastFallbackVerificationErrorCode: null,
      lastFallbackVerificationErrorMessage: error.message,
      lastFallbackVerificationErrorAt: new Date().toISOString(),
    };
    throw error;
  }

  try {
    const callable = httpsCallable(firebaseFunctions, "sendVerificationEmailFallback");
    const response = await callable();
    const data = response.data as {
      provider?: string;
      sentAt?: string;
      statusCode?: number;
      alreadyVerified?: boolean;
    };
    const sentAt = data.sentAt || new Date().toISOString();
    verificationEmailState = {
      ...verificationEmailState,
      lastFallbackVerificationEmailSentAt: sentAt,
      lastFallbackVerificationProvider: data.provider || "unknown",
      lastFallbackVerificationErrorCode: null,
      lastFallbackVerificationErrorMessage: null,
      lastFallbackVerificationErrorAt: null,
    };
    console.info("[authService] sendVerificationEmailFallback:success", {
      ...verificationLogPayload("fallback-resend", currentUser),
      sentAt,
      provider: data.provider || null,
      statusCode: data.statusCode || null,
      alreadyVerified: data.alreadyVerified === true,
    });
  } catch (error) {
    const failedAt = new Date().toISOString();
    verificationEmailState = {
      ...verificationEmailState,
      lastFallbackVerificationEmailSentAt: null,
      lastFallbackVerificationProvider: null,
      lastFallbackVerificationErrorCode: errorCode(error),
      lastFallbackVerificationErrorMessage: errorMessage(error),
      lastFallbackVerificationErrorAt: failedAt,
    };
    console.error("[authService] sendVerificationEmailFallback:failure", {
      ...verificationLogPayload("fallback-resend", currentUser),
      failedAt,
      errorCode: errorCode(error),
      errorMessage: errorMessage(error),
    });
    throw error;
  }
}

/** Read role + onboarding flags from Firestore users/{uid}; create if missing. */
export async function loadOrCreateUserDoc(
  user: FirebaseUser,
  defaultRole: UserRole,
): Promise<AppUser> {
  const db = requireFirestore();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as {
      role?: UserRole;
      onboardingComplete?: boolean;
      subscriptionStatus?: AppUser["subscriptionStatus"];
      trialEnd?: number | { toMillis?: () => number };
      displayName?: string;
      username?: string;
    };
    const trialEndMs =
      typeof data.trialEnd === "number"
        ? data.trialEnd
        : typeof data.trialEnd?.toMillis === "function"
          ? data.trialEnd.toMillis()
          : undefined;
    // Profile name from the users doc wins — it's what the user maintains in
    // My Profile (saveInstructorProfile mirrors it here). Auth displayName is
    // only set by Google/Apple providers and goes stale after profile edits.
    const docName = typeof data.displayName === "string" && data.displayName.trim()
      ? data.displayName.trim()
      : typeof data.username === "string" && data.username.trim()
        ? data.username.trim()
        : undefined;
    return {
      uid: user.uid,
      email: user.email || "",
      emailVerified: user.emailVerified,
      displayName: docName || user.displayName || undefined,
      role: data.role || defaultRole,
      onboardingComplete:
        data.onboardingComplete ?? (data.role === "student"),
      subscriptionStatus: data.subscriptionStatus,
      trialEnd: trialEndMs,
    };
  }

  await setDoc(ref, {
    uid: user.uid,
    email: (user.email || "").toLowerCase(),
    role: defaultRole,
    onboardingComplete: defaultRole === "student",
    createdAt: serverTimestamp(),
  });

  return {
    uid: user.uid,
    email: user.email || "",
    emailVerified: user.emailVerified,
    displayName: user.displayName || undefined,
    role: defaultRole,
    onboardingComplete: defaultRole === "student",
  };
}

export async function loginWithEmail(
  email: string,
  password: string,
  fallbackRole: UserRole,
): Promise<AppUser> {
  const auth = requireAuth();
  const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  // Fire-and-forget — must not block login or navigation
  triggerSecurityEmail();
  return loadOrCreateUserDoc(result.user, fallbackRole);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
): Promise<AppUser> {
  const auth = requireAuth();
  const result = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  // Kick off the verification email immediately. Failure here is non-fatal —
  // the VerifyEmailScreen has a "Resend" button.
  try {
    await sendVerificationEmailWithDiagnostics(result.user, "signup");
  } catch {
    console.warn("[authService] signup continuing after verification email failure", getVerificationEmailDebugInfo());
  }
  // Fire-and-forget — must not block login or navigation
  triggerSecurityEmail();
  return loadOrCreateUserDoc(result.user, role);
}

/**
 * Student signup that creates the linked `students` doc via the existing
 * Cloud Function `registerStudentSelfOnboard`. After the function returns
 * we sign the user in locally so they land in their dashboard.
 */
export async function registerStudentSelfOnboard(input: {
  email: string;
  password: string;
  name: string;
  phone: string;
  transmission: "manual" | "automatic";
  instructorId: string;
}): Promise<AppUser> {
  if (!firebaseFunctions) {
    throw new Error("Connection issue. Please restart the app or try again.");
  }
  const auth = requireAuth();
  const callable = httpsCallable(firebaseFunctions, "registerStudentSelfOnboard");

  const email = input.email.trim().toLowerCase();
  await callable({
    email,
    password: input.password,
    name: input.name.trim(),
    phone: input.phone.trim(),
    transmission: input.transmission,
    instructorId: input.instructorId,
  });

  const result = await signInWithEmailAndPassword(auth, email, input.password);
  if (!result.user.emailVerified) {
    try {
      await sendVerificationEmailWithDiagnostics(result.user, "student-self-onboard");
    } catch {
      console.warn("[authService] student self-onboard continuing after verification email failure", getVerificationEmailDebugInfo());
    }
  }
  // Fire-and-forget — must not block login or navigation
  triggerSecurityEmail();
  return loadOrCreateUserDoc(result.user, "student");
}

export async function resetPassword(email: string) {
  const auth = requireAuth();
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function logoutFirebaseUser() {
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
}

/**
 * Sign in with Apple — required by App Store guideline 4.8 if any third-party login is offered.
 * Uses raw nonce hash flow to satisfy Firebase's nonce verification.
 */
export async function signInWithApple(role: UserRole): Promise<AppUser> {
  const auth = requireAuth();

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error("Apple Sign In is only available on iOS 13+ devices.");
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error("Apple didn't return an identity token. Try again.");
  }

  const provider = new OAuthProvider("apple.com");
  const firebaseCredential = provider.credential({
    idToken: credential.identityToken,
    rawNonce,
  });

  const result = await signInWithCredential(auth, firebaseCredential);

  // Apple only returns the full name on the very first sign-in — persist it.
  if (credential.fullName?.givenName && !result.user.displayName) {
    const display = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(" ");
    if (display) {
      try {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(result.user, { displayName: display });
      } catch {}
    }
  }

  // Fire-and-forget — must not block login or navigation
  triggerSecurityEmail();
  return loadOrCreateUserDoc(result.user, role);
}

/**
 * Exchange a Google ID token (obtained via expo-auth-session in the screen)
 * for a Firebase credential.
 */
export async function signInWithGoogleIdToken(
  idToken: string,
  role: UserRole,
): Promise<AppUser> {
  const auth = requireAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  // Fire-and-forget — must not block login or navigation
  triggerSecurityEmail();
  return loadOrCreateUserDoc(result.user, role);
}

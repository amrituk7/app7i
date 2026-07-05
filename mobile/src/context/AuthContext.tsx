import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "../services/firebase";
import { AppUser, UserRole } from "../types";
import {
  loadOrCreateUserDoc,
  loginWithEmail,
  logoutFirebaseUser,
  refreshAuthAndToken,
  registerStudentSelfOnboard as registerStudentSelfOnboardService,
  resetPassword,
  sendVerificationEmail,
  signInWithApple as signInWithAppleService,
  signInWithGoogleIdToken,
  signUpWithEmail,
} from "../services/authService";
import { registerForPushNotifications } from "../services/pushService";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  hydrating: boolean;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  registerStudent: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    transmission: "manual" | "automatic";
    instructorId: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  completeInstructorOnboarding: (displayName: string) => void;
  /** Reload Firebase Auth state + force-refresh ID token so Firestore rules
   *  see the latest `email_verified` claim. Returns true if the user is now
   *  verified. Called from VerifyEmailScreen after the user clicks the link. */
  refreshUser: () => Promise<boolean>;
  /** Resend the verification email to the current user. */
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>("instructor");

  // Rehydrate the signed-in user from AsyncStorage on cold start.
  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setHydrating(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      try {
        if (fbUser) {
          const appUser = await loadOrCreateUserDoc(fbUser, selectedRole);
          setUser(appUser);
          // Register for push notifications once the user is verified.
          // Fire-and-forget; failure must not block hydration.
          if (appUser.emailVerified) {
            // Delay by 3 s so the user sees the app before the OS permission dialog
            setTimeout(() => {
              registerForPushNotifications().catch((err) => {
                console.warn("[push] non-fatal registration error", err);
              });
            }, 3000);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setHydrating(false);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    hydrating,
    selectedRole,
    setSelectedRole,
    async login(email, password) {
      setLoading(true);
      try {
        setUser(await loginWithEmail(email, password, selectedRole));
      } finally {
        setLoading(false);
      }
    },
    async signup(email, password, role) {
      setLoading(true);
      try {
        setSelectedRole(role);
        setUser(await signUpWithEmail(email, password, role));
      } finally {
        setLoading(false);
      }
    },
    async registerStudent(input) {
      setLoading(true);
      try {
        setSelectedRole("student");
        setUser(await registerStudentSelfOnboardService(input));
      } finally {
        setLoading(false);
      }
    },
    async forgotPassword(email) {
      await resetPassword(email);
    },
    async signInWithApple() {
      setLoading(true);
      try {
        setUser(await signInWithAppleService(selectedRole));
      } finally {
        setLoading(false);
      }
    },
    async signInWithGoogleIdToken(idToken) {
      setLoading(true);
      try {
        setUser(await signInWithGoogleIdToken(idToken, selectedRole));
      } finally {
        setLoading(false);
      }
    },
    completeInstructorOnboarding(displayName) {
      setUser((current) => current ? { ...current, displayName, onboardingComplete: true } : current);
    },
    async refreshUser() {
      const fresh = await refreshAuthAndToken();
      if (!fresh) return false;
      const appUser = await loadOrCreateUserDoc(fresh, selectedRole);
      setUser(appUser);
      if (appUser.emailVerified) {
        setTimeout(() => {
          registerForPushNotifications().catch((err) => {
            console.warn("[push] non-fatal registration error", err);
          });
        }, 3000);
      }
      return appUser.emailVerified;
    },
    async resendVerificationEmail() {
      await sendVerificationEmail();
    },
    async logout() {
      await logoutFirebaseUser();
      setUser(null);
    },
  }), [hydrating, loading, selectedRole, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthChange,
  subscribeUserProfile,
  getUserProfile,
  logoutUser,
  getInstructorProfile,
  requestNotificationPermission,
  saveFcmToken,
  onForegroundMessage
} from "../firebase";
import { DEMO_MODE, getDemoUser, getDemoUserProfile } from "../demo/demoStore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [instructorName, setInstructorName] = useState("Instructor");

  useEffect(() => {
    if (DEMO_MODE) {
      const demoUser = getDemoUser();
      const demoProfile = getDemoUserProfile();
      setUser(demoUser);
      setUserProfile(demoProfile);
      setInstructorName("Alex Morgan");
      setLoading(false);
      return () => {};
    }

    // Safety net: if Firebase hangs for 5 seconds, stop waiting
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setProfileReady(true);
    }, 5000);

    let unsubscribeProfile = () => {};
    let unsubscribeAuth = () => {};

    try {
      unsubscribeAuth = onAuthChange(async (firebaseUser) => {
        clearTimeout(loadingTimeout);
        setUser(firebaseUser);

        // Clean up any previous profile listener
        unsubscribeProfile();
        unsubscribeProfile = () => {};

        if (firebaseUser) {
          // Real-time listener — updates automatically when Firestore doc changes
          unsubscribeProfile = subscribeUserProfile(firebaseUser.uid, (profile) => {
            setUserProfile(profile);
            setProfileReady(true);
            setLoading(false);
            // Load instructor name in background — don't block page render
            if (profile?.role === "instructor") {
              getInstructorProfile(firebaseUser.uid).then((iProfile) => {
                if (iProfile?.name) setInstructorName(iProfile.name);
              }).catch(() => {});
            }
          });
        } else {
          setUserProfile(null);
          setProfileReady(false);
          setInstructorName("Instructor");
          setLoading(false);
        }
      });
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => { clearTimeout(loadingTimeout); unsubscribeAuth(); unsubscribeProfile(); };
  }, []);

  // Listen for foreground push notifications
  useEffect(() => {
    if (DEMO_MODE) return () => {};
    let unsub = () => {};
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || "New notification";
      if (Notification.permission === "granted") {
        new Notification(title, { body: payload.notification?.body || "" });
      }
    }).then((fn) => { unsub = fn; });
    return () => unsub();
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const enableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) await saveFcmToken(token);
      return !!token;
    } catch {
      return false;
    }
  };

  const isInstructor = userProfile?.role === "instructor";
  const isStudent = userProfile?.role === "student";
  const subscriptionStatus = userProfile?.subscriptionStatus || null;
  const trialEnd = userProfile?.trialEnd || 0;
  const trialExpired = subscriptionStatus === "trialing" && trialEnd > 0 && Date.now() > trialEnd;
  const hasActiveSubscription =
    subscriptionStatus === "active" ||
    (subscriptionStatus === "trialing" && !trialExpired);
  const billingStatus = userProfile?.isDeveloper === true
    ? "active"
    : subscriptionStatus === "trialing"
      ? (trialExpired ? "trial_expired" : "trialing")
      : subscriptionStatus || "unpaid";
  const isBillingActive = billingStatus === "active" || billingStatus === "trialing";
  // Keep broader app access stable for now; billing pages should use billingStatus / hasActiveSubscription.
  const isPremium = userProfile?.isDeveloper === true || isInstructor || isStudent || hasActiveSubscription;

  const value = {
    user,
    userProfile,
    loading,
    profileReady,
    logout,
    isInstructor,
    isStudent,
    subscriptionStatus,
    hasActiveSubscription,
    billingStatus,
    isBillingActive,
    isPremium,
    trialExpired,
    trialEnd,
    isAuthenticated: !!user,
    instructorName,
    setInstructorName,
    enableNotifications
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

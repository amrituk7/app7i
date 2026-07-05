import { type FirebaseOptions, initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error — getReactNativePersistence is exported from firebase/auth in RN env
  getReactNativePersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig as FirebaseOptions)
  : null;

let _auth: Auth | null = null;
if (firebaseApp) {
  try {
    _auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(firebaseApp);
  }
}

export const firebaseAuth: Auth | null = _auth;
export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseFunctions: Functions | null = firebaseApp
  ? getFunctions(firebaseApp, "us-central1")
  : null;
// Alias used by the security-email module (and any future caller that prefers
// the canonical name `functions` matching Firebase SDK examples).
export const functions: Functions | null = firebaseFunctions;

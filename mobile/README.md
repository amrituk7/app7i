# App7i Mobile

Mobile-first App7i for UK driving instructors and learners. Expo + React Native + Firebase. Separate from the web app so it can ship to App Store / Play Store on its own cadence.

## Stack

- Expo SDK 55, React 19.2, React Native 0.83
- React Navigation 7 (native-stack + bottom-tabs)
- Firebase 12 (Auth + Firestore) — project `roadmaster-23cbc` (shared with the web app)
- Auth persistence via AsyncStorage
- Apple Sign In via `expo-apple-authentication` + Firebase OAuthProvider
- Google Sign In via `expo-auth-session/providers/google` + Firebase GoogleAuthProvider
- EAS Build for signed iOS / Android artifacts

## What works today

- Email signup / login / password reset (real Firebase)
- Apple Sign In (real, iOS only — needs Apple Services ID configured in Firebase Auth)
- Google Sign In (real — needs OAuth client IDs in `.env.local`)
- Auth state persists across cold launches
- User role read from `users/{uid}` Firestore doc (instructor or student)
- Instructor dashboard reads real Firestore: today's lessons, students count, unpaid totals, paid today
- Pull-to-refresh on dashboard
- Empty states + loading + error UI
- Same Firestore rules as web app (locked to `instructorId == auth.uid`)

## Setup

```bash
# from repo root
npm --prefix mobile install
cp mobile/.env.example mobile/.env.local
# fill values, then:
npm run mobile:start
```

Required env (`mobile/.env.local`):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=roadmaster-23cbc.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=roadmaster-23cbc
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=roadmaster-23cbc.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Google Sign In — fill these to enable the button
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

## Ship checklist

### One-time, before first build

1. **Apple Developer**
   - Enable "Sign In with Apple" capability for App ID `com.app7i.app`
   - Create a Services ID, configure return URL = your Firebase Auth domain `https://roadmaster-23cbc.firebaseapp.com/__/auth/handler`
   - In Firebase Console → Authentication → Sign-in method → enable Apple, paste the Services ID
2. **Google Cloud Console**
   - Create OAuth client IDs: iOS (bundle `com.app7i.app`), Android (package `com.app7i.app` + SHA-1 from EAS), Web
   - In Firebase Console → Authentication → Sign-in method → enable Google, paste the Web client ID
   - Drop the values into `.env.local` (variables above)
3. **App Store Connect**
   - Create App with bundle `com.app7i.app`
   - Note the App ID, paste into `eas.json` → `submit.production.ios.ascAppId`
4. **Google Play Console**
   - Create internal-testing track for `com.app7i.app`
5. **EAS**
   - `npx eas init` from `mobile/` to provision a project
   - Replace `extra.eas.projectId` in `app.json` with the returned ID
6. **Assets**
   - Drop into `mobile/assets/`: `icon.png` (1024×1024), `splash.png` (1284×2778), `adaptive-icon.png` (1024×1024 transparent foreground)

### Build + ship

```bash
# from mobile/
npx eas build --profile preview --platform all      # internal builds
npx eas build --profile production --platform all   # store-bound builds
npx eas submit --profile production --platform ios
npx eas submit --profile production --platform android
```

## Structure

```text
mobile/
  App.tsx                  # entry
  app.json                 # Expo config (bundle id, splash, icon, scheme, plugins)
  eas.json                 # build/submit profiles
  src/
    app/App.tsx            # provider tree
    navigation/
      AppNavigator.tsx     # auth/instructor/student switcher
      AuthNavigator.tsx
    context/AuthContext.tsx  # onAuthStateChanged + role hydration
    services/
      firebase.ts          # initializeAuth + AsyncStorage persistence
      authService.ts       # email + Apple + Google + Firestore role
      dataService.ts       # Firestore repositories (lessons, students, invoices)
    screens/
      auth/                # Welcome, Login, SignUp, ForgotPassword
      onboarding/
      instructor/          # Dashboard, Today, Calendar, Students, Profile, Progress, Earnings, Invoices, Settings
      student/             # Dashboard, Lessons, Progress, Notes, Invoices, Instructor
    components/ui/         # Screen, Card, AppButton, AppTextInput, ListRow, MetricCard, SectionHeader, Pill, EmptyState
    theme/                 # colors, spacing, typography
    types/index.ts
```

## Backend

Reuses the existing `roadmaster-23cbc` project:

- `users/{uid}` — `{ uid, email, role: "instructor" | "student", onboardingComplete, createdAt }`
- `students`, `lessons`, `messages`, `notifications`, `settings`, `instructorDirectory`, `waitingList`, `tips` — same schema as web
- Firestore rules already enforce `instructorId == auth.uid` and email verification
- Stripe webhook drives `subscriptionStatus` / `trialEnd` server-side

## Known gaps before public store launch

1. Push notifications — wire `expo-notifications` to existing FCM topics
2. In-app purchases — App Store + Play Store IAP for the subscription (current Stripe checkout is web-only)
3. Account deletion screen (Apple guideline 5.1.1.v requires it)
4. Privacy policy page link in Settings
5. Real splash + icon assets (1024×1024 master)

# App7i — Google Play submission

Step-by-step path from "code complete" to "app live in internal testing" to "live in production".
Estimated end-to-end: 2-3 hours of admin work, then a 1-3 day Google review.

## Launch readiness — status as of 2026-05-06

| Item | Status | Notes |
|---|---|---|
| EAS project + keystore | ✅ done | Project `da081787-4289-4c52-8574-eb37f5a0acc9`, keystore on EAS |
| `google-services.json` | ✅ done | Wired in `app.json` for FCM push |
| Push notifications (expo-notifications) | ✅ done | Build `b7573105-c201-4092-ba96-da152e4b68cd` in progress |
| App icon | ⚠️ upgraded but low-res | Real App7i logo copied from `public/logo512.png` (512×512). Upgrade to 1024×1024 master before production rollout |
| Adaptive icon | ⚠️ upgraded but not adaptive | Same 512 PNG used for foreground. For best Android shape rendering, supply a transparent foreground PNG with the brand mark only |
| Splash screen | ⚠️ upgraded | App7i logo centered on `#1a2f23` background via `resizeMode: contain`. Larger 1284×2778 master recommended |
| Notification icon | ❌ not yet | Falls back to app icon. For best look on the status bar, supply a small monochrome PNG and add `"icon": "./assets/notification-icon.png"` under the `expo-notifications` plugin in `app.json` |
| Feature graphic (1024×500) | ❌ not yet | Required by Play Console — needs to be designed in Figma/Canva |
| Phone screenshots (2-8) | ❌ not yet | Capture via `adb shell screencap` once the new APK is installed |
| Account deletion page | ✅ live | `https://app7i.com/account-deletion` |
| Privacy + Terms | ✅ live | `https://app7i.com/privacy`, `https://app7i.com/terms` |
| Sign-in security email | ✅ done | `recordSignIn` Cloud Function deployed |
| Anonymous lesson feedback | ✅ done | Phase 2 + Phase 3 summary deployed |
| Stripe paywall | ❌ disabled | Re-enable before production rollout for revenue |

**Next user-blocking steps:**
1. Wait for the in-progress EAS build to finish (~20-30 min)
2. Sideload the APK on your phone, verify push notifications fire
3. Design the feature graphic + capture screenshots
4. Create the Play Console listing (Step 3 below)
5. Promote internal-testing build → production

## What's already in place

- Bundle ID `com.app7i.app` (matches the existing Android shell)
- Email + Google Sign In (Apple Sign In is iOS-only at runtime — no Android impact)
- Auth persistence via AsyncStorage
- Real Firestore data (no mocks)
- Account deletion in Settings (mandatory under Google Play Data Deletion policy)
- Privacy + Terms links to `app7i.com/privacy` and `app7i.com/terms`
- `eas.json` with production profile that builds `app-bundle` (AAB)
- `app.json` with adaptive icon background, deep links for `app7i.com`, target SDK 35

## Step 1 — One-time admin (Google + Firebase)

### 1a. Google Cloud Console — OAuth client IDs

Needed for Google Sign In on Android.

1. Open https://console.cloud.google.com → select project `roadmaster-23cbc`
2. APIs & Services → Credentials → **Create credentials → OAuth client ID**
3. Create three clients:
   - **Web** — name "App7i Web". Copy the client ID into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Firebase needs this one for Google sign-in to work even on mobile.
   - **Android** — package `com.app7i.app`. SHA-1 will come from EAS in step 2 — leave this for now and add the SHA-1 once you have it.
   - **iOS** — bundle `com.app7i.app`. Copy into `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (used later for App Store).
4. Firebase Console → Authentication → Sign-in method → enable **Google**, paste the **Web** client ID into the Web client field.

### 1b. Firebase Console — verify Auth providers

1. Authentication → Sign-in method
2. Make sure **Email/Password** and **Google** are enabled
3. Apple can stay off until iOS submission

## Step 2 — EAS project + first build

```bash
cd mobile
npm install
npx eas login                 # uses your Expo account
npx eas init                  # creates the EAS project, prints the project ID
```

Replace `REPLACE_WITH_EAS_PROJECT_ID` in `app.json` (under `extra.eas.projectId`) with what `eas init` returned.

Then:

```bash
npx eas build:configure         # creates a keystore — confirm "yes" when prompted
npx eas credentials             # menu: Android → production → Keystore
                                # → "Show keystore SHA1" — copy the SHA-1
```

Paste that SHA-1 into the Android OAuth client you created in 1a.

Now produce the AAB:

```bash
npx eas build --profile preview --platform android
```

Preview gives you an APK suitable for sideloading on your own device first. When happy:

```bash
npx eas build --profile production --platform android
```

This produces a signed `.aab` file. Download from the EAS build page.

## Step 3 — Play Console listing

### 3a. Create the app

https://play.google.com/console → **Create app**

| Field | Value |
|---|---|
| App name | App7i |
| Default language | English (UK) |
| App or game | App |
| Free or paid | Free (in-app subscription added later) |
| Declarations | Tick all four required boxes |

### 3b. Set up listing — Main store listing

| Field | Value |
|---|---|
| App name | App7i |
| Short description (80 chars) | Lesson management for UK driving instructors and learners |
| Full description (4000 chars) | See template below |
| App icon (512×512 PNG) | Upload `mobile/assets/icon.png` resized to 512 |
| Feature graphic (1024×500 PNG) | Required — see assets section |
| Screenshots (2-8 phone) | Take from your dev build via `adb shell screencap` |
| Tablet screenshots | Optional — skip if `supportsTablet: false` (it is) |
| App category | Productivity (or Business) |
| Tags | driving, lessons, instructor, scheduling |
| Contact email | support@app7i.com |
| Website | https://app7i.com |
| Privacy policy URL | https://app7i.com/privacy |

#### Full description template

```
App7i is the lesson management app built for UK driving instructors.

Run your driving school from your phone. Book lessons, track student progress,
record payments, send invoices, and chat with learners — all in one place.

For instructors:
• Today's lessons at a glance
• Calendar and bookings
• Student profiles with progress tracking
• Earnings, invoices and payment status
• In-app messaging with each student
• Push reminders for upcoming lessons

For learners:
• See your upcoming lessons
• Track your progress towards test-ready
• Read lesson notes from your instructor
• Pay invoices and view receipts
• Message your instructor

Built in the UK, designed for UK ADIs.

Subscription: A 7-day free trial, then £19/month for the full instructor
experience. Cancel any time. Learners always use the app for free, invited
by their instructor.

Support: support@app7i.com
Privacy: https://app7i.com/privacy
Terms: https://app7i.com/terms
```

### 3c. App content (the form gauntlet)

These are mandatory and reject the app if missing.

1. **Privacy policy** — paste `https://app7i.com/privacy`
2. **App access** — "All functionality is available without restrictions" if no test login needed, OR provide Ravi's test instructor credentials so reviewers can log in
3. **Ads** — "No, my app does not contain ads" (assuming true)
4. **Content rating** — fill the questionnaire honestly (no violence/gambling/etc → PEGI 3 / Everyone)
5. **Target audience** — Age 18+ (driving instructors); confirm not directed to children
6. **News app** — No
7. **COVID-19** — No
8. **Data safety** — declare what's collected:
   - Personal info: name, email, phone — collected, not shared, used for account management
   - Financial info: payment history — collected, not shared, used for app functionality
   - Messages: in-app — collected, not shared, used for app functionality
   - Encrypted in transit: Yes
   - Users can request data deletion: Yes (in-app via Settings → Delete my account)
9. **Government apps** — No
10. **Financial features** — Yes (handles payment records); not a financial product per se
11. **Health** — No

### 3d. Account deletion declaration

Settings → Account → enter:

- **Web URL where users can request deletion** — `https://app7i.com/account-deletion`
- **In-app path** — Settings → Delete my account

Both are required. The web URL must work (it already exists at app7i.com/account-deletion).

## Step 4 — Internal testing track

Faster than production review and lets your phone install the build directly.

1. Play Console → Testing → **Internal testing** → Create new release
2. Upload the `.aab` from EAS
3. Release name: `1.0.0 (1)`
4. Release notes:
   ```
   Initial release.
   ```
5. **Save → Review → Roll out to internal testing**
6. Tester list: add your Gmail and Ravi's email under "Internal testers → Manage testers"
7. Copy the **opt-in URL** Play Console gives you, open on your phone, tap "Become a tester", then install via Play Store

You'll see the app on your phone within ~10 minutes of rolling out.

## Step 5 — Production release

When the internal build feels right:

1. Testing → Internal testing → **Promote release → Production**
2. Or: Production → Create new release → upload the same AAB
3. **Roll out percentage**: start at 20% to limit blast radius if something breaks
4. Submit for review

Google review takes 1-3 days first time, often <24h after that.

## Asset specs (drop into `mobile/assets/`)

| File | Size | Notes |
|---|---|---|
| `icon.png` | 1024×1024 PNG | Master — Expo derives all sizes from this |
| `adaptive-icon.png` | 1024×1024 PNG, transparent foreground | Foreground only; background is `#1a2f23` from `app.json` |
| `splash.png` | 1284×2778 PNG | Centered logo on `#1a2f23` background |
| Play feature graphic | 1024×500 PNG | Created in Figma — uploaded directly in Play Console, not in app |
| Play screenshots | 1080×1920 (9:16) | Captured from dev build via `adb shell screencap` |

## Troubleshooting

| Symptom | Fix |
|---|---|
| EAS build fails with "Apple capability missing" | Only iOS. For Android-only build, run `--platform android` |
| Google Sign In opens then closes silently | SHA-1 doesn't match the Android OAuth client. Re-fetch from `eas credentials` and update Cloud Console |
| Play Console rejects with "Account deletion missing" | Step 3d above |
| Play Console rejects with "Data safety incomplete" | Step 3c.8 — every collected field must be declared |
| App opens to blank screen | Firebase env vars not embedded — verify `.env.local` exists and `EXPO_PUBLIC_*` are populated, then rebuild |
| Build size > 150MB | Check that `react-native-vector-icons` etc. aren't bundled twice |

## After Play Store goes live

1. Add the Play Store URL to the web app's `ANDROID_PLAY_STORE_URL` in `src/utils/androidCompanion.js` so the existing PWA invite QR points to the store, not the debug APK
2. Switch over the install banner copy to "Get it on Google Play"
3. Start the iOS submission (uses the same EAS pipeline, separate `--platform ios` build)

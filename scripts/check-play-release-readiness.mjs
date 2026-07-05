import fs from "node:fs";
import path from "node:path";

// Play release readiness check for the EAS (Expo) pipeline — the one that
// actually ships. The legacy Capacitor wrapper at /android is NOT the release
// artifact; its locally built AAB must never be uploaded to Play (different
// signing key — the first upload locks app signing forever).

const root = process.cwd();
const mobile = path.join(root, "mobile");

const requiredEnvKeys = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID"
];

const checks = [
  {
    label: "mobile/.env.local — Expo Firebase config",
    path: path.join(mobile, ".env.local"),
    required: true,
    validate(content) {
      const missing = requiredEnvKeys.filter((key) => !new RegExp(`^${key}=.+`, "m").test(content));
      return missing.length ? `missing keys: ${missing.join(", ")}` : null;
    }
  },
  {
    label: "mobile/google-services.json — FCM config for EAS build",
    path: path.join(mobile, "google-services.json"),
    required: true
  },
  {
    label: "mobile/eas.json — production profile builds an app-bundle",
    path: path.join(mobile, "eas.json"),
    required: true,
    validate(content) {
      const parsed = JSON.parse(content);
      const prod = parsed?.build?.production;
      if (!prod) return "no production build profile";
      if (prod.android?.buildType !== "app-bundle") return "production profile must build an app-bundle";
      if (prod.env?.SENTRY_DISABLE_AUTO_UPLOAD !== "true") {
        return "SENTRY_DISABLE_AUTO_UPLOAD must stay 'true' (missing org/project config broke build 31a883cd)";
      }
      return null;
    }
  },
  {
    label: "docs/google-play-reviewer-notes.md — demo credentials",
    path: path.join(root, "docs", "google-play-reviewer-notes.md"),
    required: true,
    validate(content) {
      return content.includes("REPLACE_WITH_")
        ? "replace reviewer demo credentials (instructor, student) before submission"
        : null;
    }
  }
];

let failed = false;
console.log("Google Play launch readiness check (EAS pipeline)\n");

for (const check of checks) {
  if (!fs.existsSync(check.path)) {
    if (check.required) {
      failed = true;
      console.log(`[missing]      ${check.label}`);
    }
    continue;
  }

  const content = fs.readFileSync(check.path, "utf8");
  let issue = null;
  try {
    issue = check.validate ? check.validate(content) : null;
  } catch (err) {
    issue = `unreadable: ${err.message}`;
  }
  if (issue) {
    failed = true;
    console.log(`[needs action] ${check.label} -> ${issue}`);
  } else {
    console.log(`[ok]           ${check.label}`);
  }
}

// The legacy Capacitor AAB is a trap, not an asset.
const legacyAab = path.join(root, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
if (fs.existsSync(legacyAab)) {
  console.log(`[warning]      legacy Capacitor AAB exists at android/app/build — DO NOT upload it to Play.`);
  console.log(`               Release artifact = the EAS build from expo.dev (signing keys differ).`);
}

console.log("\nBuild + submit:");
console.log("  cd mobile; npx eas-cli build --profile production --platform android --non-interactive --no-wait");
console.log("  Download the .aab from https://expo.dev (project app7i-mobile) and upload to Play internal testing.");

console.log("\nManual checks still required:");
console.log("  - real device push notification test (foreground / background / terminated)");
console.log("  - real device account deletion test (instructor Settings + student Library)");
console.log("  - Play Store listing: 512x512 icon, 2+ phone screenshots, feature graphic (1024x500), descriptions");
console.log("  - Data Safety form, content rating questionnaire, privacy policy URL (https://app7i.com/privacy)");
console.log("  - App access section in Play Console: reviewer demo credentials from docs/google-play-reviewer-notes.md");
console.log("  - Billing note visible to reviewer (no in-app purchases on Android; subscriptions web-only)");

if (failed) {
  process.exitCode = 1;
}

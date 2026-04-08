# App7i

App7i is a Vite + React application for driving instructors and students. The current codebase includes a marketing landing page, instructor workflows, and student-facing screens.

## Stack

- React 19
- Vite 8
- React Router
- Firebase client SDK
- Tailwind CSS
- Capacitor for Android packaging

## Scripts

- `npm start` or `npm run dev`: run the local Vite dev server
- `npm run build`: create a production build
- `npm run preview`: preview the built app locally
- `npm test`: run tests

## Public Repository Safety

This repository is prepared to stay safe for public GitHub use.

- Do not commit real API keys, tokens, `.env` files, keystores, or local service config.
- Keep all environment-specific values in ignored local files.
- Use placeholders only in committed code and documentation.

### Expected Local Environment Variables

Create a local env file such as `.env.local` and define placeholders like:

```bash
VITE_FIREBASE_API_KEY=your_local_value
VITE_FIREBASE_AUTH_DOMAIN=your_local_value
VITE_FIREBASE_PROJECT_ID=your_local_value
VITE_FIREBASE_STORAGE_BUCKET=your_local_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_local_value
VITE_FIREBASE_APP_ID=your_local_value
VITE_FIREBASE_MEASUREMENT_ID=your_local_value
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_FIREBASE_VAPID_KEY=your_local_value
VITE_CREATE_CHECKOUT_SESSION_URL=your_local_value
VITE_CREATE_PORTAL_SESSION_URL=your_local_value
VITE_VALIDATE_REFERRAL_CODE_URL=your_local_value
```

For Android builds, keep `android/app/google-services.json` local and out of git.

## Structure

- [`src/components`](c:/Users/amrit/driving-app/src/components): reusable UI and landing-page sections
- [`src/pages`](c:/Users/amrit/driving-app/src/pages): route-level screens
- [`src/context`](c:/Users/amrit/driving-app/src/context): shared app state providers
- [`src/demo`](c:/Users/amrit/driving-app/src/demo): demo-mode data and helpers
- [`functions`](c:/Users/amrit/driving-app/functions): backend-related workspace code that should remain placeholder-safe in public docs
- [`android`](c:/Users/amrit/driving-app/android): Capacitor Android project

## Design Direction

The public landing experience uses:

- warm cream backgrounds
- deep green / earthy neutrals
- simple rounded cards
- clear instructor-focused messaging

Future safe improvements can focus on:

- unifying landing-page spacing and section rhythm
- aligning route/page naming conventions
- extracting shared design tokens
- documenting component patterns for contributors

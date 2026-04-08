# UI Guidelines

This repository should stay safe for public GitHub use and consistent in visual quality.

## Design Tokens

Use the shared App7i tokens in [`src/index.css`](c:/Users/amrit/driving-app/src/index.css) before adding new one-off colors.

- Base background: `--app7i-cream`
- Card background: `--app7i-paper`
- Soft section background: `--app7i-soft`
- Border: `--app7i-line`
- Primary text / brand: `--app7i-forest`
- Supporting text: `--app7i-body`
- Accent support colors: moss, gold, slate, espresso

For landing-page sections, prefer the shared helper classes:

- `.lp-eyebrow`
- `.lp-title`
- `.lp-copy`
- `.lp-surface`
- `.lp-surface-soft`
- `.lp-button-primary`
- `.lp-button-secondary`
- `.lp-brand-gradient`

## Component Structure

Use this split consistently:

- [`src/components`](c:/Users/amrit/driving-app/src/components): reusable sections, navigation, cards, and shared UI
- [`src/pages`](c:/Users/amrit/driving-app/src/pages): route-level screens only
- [`src/context`](c:/Users/amrit/driving-app/src/context): app-level providers
- [`src/utils`](c:/Users/amrit/driving-app/src/utils): pure helpers with no UI

Keep landing-page sections separate rather than building one large file.

## Naming Conventions

- Use `PascalCase.jsx` for React components.
- Keep one default export per component file when the component owns the file.
- Match route screen names to file names, for example `Support.jsx`, `Pricing.jsx`, `StudentDashboard.jsx`.
- Prefer explicit names like `InstructorProfile.jsx` over generic names like `Profile.jsx`.

## Styling Rules

- Prefer shared tokens or shared utility classes over inline hex values.
- Keep section spacing in the `py-20` to `py-28` range for marketing pages unless there is a strong reason not to.
- Reuse rounded shapes consistently:
  - cards: `rounded-2xl`
  - major panels: `rounded-[2rem]` or `rounded-3xl`
  - pill buttons: `rounded-full`
- Use gradients sparingly for hero and CTA sections only.

## Public Repo Safety

- Never commit real keys, tokens, service config, or `.env` files.
- Use placeholder env names only in code and docs.
- If a UI needs a backend URL or API key, read it from ignored local env files.

## Current Cleanup Direction

When touching the landing page next, prefer:

- removing remaining ad hoc color literals where practical
- keeping the earthy App7i palette instead of reintroducing indigo defaults
- preserving concise, instructor-focused copy
- maintaining mobile-first spacing and readable card layouts

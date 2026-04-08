# App7i - Driving Instructor App

## Project
- Created by **Amritpal Singh** — the app developer and owner
- Ravi is the first instructor user, not the app owner — he creates his own account like any other instructor would
- Firebase project: `roadmaster-23cbc`
- Live: https://roadmaster-23cbc.web.app
- Path: `C:\Users\amrit\driving-app`

## Stack
- React 19, React Router 7, Firebase 12 (Auth + Firestore + Hosting)
- framer-motion for animations
- No other external packages

## Architecture
- `src/App.js` — routing, AuthProvider, role-based guards (InstructorRoute / StudentRoute)
- `src/firebase.js` — all Firestore/Auth functions
- `src/context/AuthContext.js` — provides `user`, `userProfile`, `isInstructor`, `isStudent`, `logout`
- `src/context/ToastContext.js` — `useToast()` → `showToast(msg, type)`
- `src/utils/instructorInsights.js` — lesson review helpers, SKILL_DEFINITIONS, DEFAULT_LESSON_REVIEW
- `src/utils/studentPortal.js` — date/countdown helpers for student pages

## Two Portals
**Instructor (Ravi):** Sidebar → Dashboard, Students, Lessons, Book Lesson, Messages, Car Details, Important Notes, Tips, Resources, Notifications, Profile

**Student:** StudentSidebar → Student Dashboard (/student-dashboard), My Lessons (/my-lessons), Messages (/my-messages), Tips (read-only), Resources

## Firebase Collections
- `users` — `{ uid, email, role: "instructor"|"student", createdAt }`
- `students` — `{ name, phone, email, transmission, perfectDriver, parkingPractice, profilePicture }`
- `lessons` — `{ studentId, studentName, date, time, duration, instructor, notes, review, timestamp }`
- `messages` — `{ sender, receiver, text, read, timestamp }` (sender = "instructor" or studentId)
- `notifications` — `{ title, message, read, timestamp }`
- `tips` — `{ title, content, type, videoUrl, timestamp }`
- `settings` — docs: `ravi-car`, `ravi-profile`

## Key Rules
- Never change Firebase config or auth setup
- Deploy: `firebase deploy --only hosting` (Storage not enabled, skip it)
- Register page creates **student** accounts only (role hardcoded to "student" in Register.jsx line 25)
- Instructor accounts (e.g. Ravi) must be created directly via the Firebase console — set role: "instructor" in the `users` collection
- Student portal matches by email: student Auth email must match `email` field in `students` collection

## Collaboration Note
- Claude should handle coding and changes; report results clearly to the boss (Amrit).

## Implementation Plan (Ravi Demo)
Priority order:
1) Instructor profile: add fields for weekday manual rate, Sunday auto rate, test-day fee, rating, location/areas, and "helps with test booking".
2) Student-facing instructor card/page: show Ravi's profile to students (requires rules change or safe proxy via a public profile doc).
3) Lesson pricing model: store per-lesson `lessonType` (normal/test-day), `transmission`, and `rateApplied`; update invoices/earnings to use these.
4) Test booking workflow: store test centre, date/time, booking ref, candidate number, and paid status (minimal UI in StudentProfile/TestDetails).
5) Performance: reduce dashboard queries (use pagination/summaries), remove orphan-claiming on every load, delay push-permission prompt.
6) Fixes: invoice ADI field mismatch, store student phone/email on lessons, demo env should use `import.meta.env.VITE_DEMO_MODE`.

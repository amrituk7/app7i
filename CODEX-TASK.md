# CODEX TASK: Build Student Portal

## Project Context
- React + Firebase driving instructor app for "Ravi" (RoadMaster)
- Firebase project: roadmaster-23cbc
- Live at: https://roadmaster-23cbc.web.app
- Currently only has instructor view — students need their own view
- Auth system already supports roles: `instructor` and `student` (stored in Firestore `users` collection)
- All data (lessons, messages, tips) already exists in Firestore

## What You Need to Build

### 1. Update App.js Routing — Role-Based Views
File: `src/App.js`

Currently all protected routes show the instructor view. Change it so:
- If `userProfile.role === "instructor"` → show current Sidebar + instructor routes (keep as-is)
- If `userProfile.role === "student"` → show StudentSidebar + student routes (new)

The `useAuth()` hook from `src/context/AuthContext.js` already provides `isInstructor`, `isStudent`, `userProfile`.

Important: When a student logs in, they need to be matched to their student record in the `students` collection. The matching should be by email (the student's auth email matches a field in their student record). Add an `email` field when creating students in `src/pages/AddStudent.js`.

### 2. Create Student Sidebar
File: `src/components/StudentSidebar.js` (new)

Simplified sidebar for students with these links:
- My Dashboard → `/student-dashboard`
- My Lessons → `/my-lessons`
- Messages → `/my-messages`
- Ravi's Tips → `/tips` (reuse existing, but read-only)
- DVLA Resources → `/resources` (reuse existing)
- Logout button (same as instructor sidebar)

Style it similarly to `src/components/Sidebar.js` using `src/components/Sidebar.css`.

### 3. Build Student Dashboard
File: `src/pages/StudentDashboard.js` (already exists, currently empty)
CSS: `src/pages/StudentDashboard.css` (already exists)

Show:
- **Welcome header** with student's name
- **Next Lesson card** — show their next upcoming lesson (date, time, countdown like "in 3 days")
- **Recent Messages** — last 3 messages from Ravi with a "View All" link
- **Quick Stats** — total lessons taken, upcoming lessons count

Data fetching:
- Get student record: query `students` collection where `email === currentUser.email`
- Get lessons: use `getLessonsForStudent(studentId)` from `src/firebase.js`
- Get messages: use `getMessagesForStudent(studentId)` from `src/firebase.js`

### 4. Student Lessons Page
File: `src/pages/MyLessons.js` (new)

Show all lessons for this student:
- Upcoming lessons (highlighted, sorted by date)
- Past lessons (greyed out)
- Each lesson shows: date, time, duration, instructor name, notes

Use `getLessonsForStudent(studentId)` from firebase.js.

### 5. Student Messages Page
File: `src/pages/MyMessages.js` (new)

Same chat UI as the instructor's `src/pages/Conversation.js` but:
- Student sees messages from Ravi
- Student can reply (sender = studentId, receiver = "instructor")
- Auto-mark messages as read
- Poll every 10 seconds for new messages

Reuse the CSS from `src/pages/Conversation.css`.

### 6. Update Tips Page for Students
File: `src/pages/Tips.js`

Already works. Just need to:
- Hide the "+ Add Tip" button when `isStudent` is true
- Hide the "Delete" button on each tip when `isStudent` is true
- Import and use `useAuth()` from `src/context/AuthContext.js` to check `isStudent`

### 7. Add Student Email Field
File: `src/pages/AddStudent.js`

Add an email input field to the "Add Student" form. This email is used to match the student's Firebase Auth account to their student record.

Also update `src/pages/EditStudent.js` to include the email field.

### 8. Firebase Function Needed
File: `src/firebase.js`

Add this function:
```js
export const getStudentByEmail = async (email) => {
  const q = query(collection(db, "students"), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};
```

### 9. Student Routes to Add in App.js
```jsx
// Student routes (only accessible when role === "student")
<Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
<Route path="/my-lessons" element={<StudentRoute><MyLessons /></StudentRoute>} />
<Route path="/my-messages" element={<StudentRoute><MyMessages /></StudentRoute>} />
<Route path="/tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />
<Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
```

When a student navigates to `/`, redirect them to `/student-dashboard`.

## Key Files Reference
- `src/firebase.js` — all Firebase CRUD functions
- `src/context/AuthContext.js` — auth context with `isInstructor`, `isStudent`, `user`, `userProfile`
- `src/context/ToastContext.js` — toast notifications via `useToast()`
- `src/components/Sidebar.js` — instructor sidebar (reference for student sidebar)
- `src/pages/Conversation.js` + `Conversation.css` — chat UI (reference for student messages)
- `src/pages/Dashboard.js` — instructor dashboard (reference for student dashboard)

## Firebase Collections
- `users` — `{ uid, email, role, createdAt }` — Auth profiles
- `students` — `{ name, phone, email, transmission, perfectDriver, parkingPractice, profilePicture }`
- `lessons` — `{ studentId, studentName, date, time, duration, instructor, notes, timestamp }`
- `messages` — `{ sender, receiver, text, read, timestamp }` — sender is "instructor" or studentId
- `tips` — `{ title, content, type, videoUrl, timestamp }`

## After Building
Run `npm run build && firebase deploy --only hosting` to deploy.

## DO NOT
- Do not modify the instructor views (Dashboard, Students, Lessons, etc.)
- Do not change Firebase config or auth setup
- Do not add new npm packages (everything needed is already installed)
- Do not create new Firebase collections

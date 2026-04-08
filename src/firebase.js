import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
// firebase/storage and firebase/messaging are lazy-loaded for faster startup
import {
  DEMO_MODE,
  demoIds,
  demoStore,
  getDemoUser,
  getDemoUserProfile,
  getDemoStudentByEmail
} from "./demo/demoStore";

function demoClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function demoUid() {
  return getDemoUser().uid;
}

function demoId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Firebase config placeholders for public repositories.
// Real values should live in local env files that are ignored by git.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REPLACE_ME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "REPLACE_ME.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "REPLACE_ME",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "REPLACE_ME.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "REPLACE_ME",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "REPLACE_ME",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "REPLACE_ME"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1");
// Storage — lazy-loaded (only needed for profile pictures)
let _storage = null;
async function getStorageLazy() {
  if (!_storage) {
    const { getStorage } = await import("firebase/storage");
    _storage = getStorage(app);
  }
  return _storage;
}

// FCM — lazy-loaded (only needed when user interacts with notifications)
let _messaging = null;
async function getMessagingLazy() {
  if (_messaging) return _messaging;
  if (DEMO_MODE) return null;
  try {
    const { getMessaging } = await import("firebase/messaging");
    _messaging = getMessaging(app);
    return _messaging;
  } catch {
    console.warn("Push notifications not supported in this environment");
    return null;
  }
}

export const requestNotificationPermission = async () => {
  if (DEMO_MODE) return null;
  const messaging = await getMessagingLazy();
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "REPLACE_ME"
    });
    return token;
  } catch {
    console.warn("Failed to get notification token");
    return null;
  }
};

export const onForegroundMessage = async (callback) => {
  if (DEMO_MODE) return () => {};
  const messaging = await getMessagingLazy();
  if (!messaging) return () => {};
  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export const saveFcmToken = async (token) => {
  if (DEMO_MODE) return;
  const uid = getUid();
  if (!uid || !token) return;
  const docRef = doc(db, "users", uid);
  try {
    await updateDoc(docRef, { fcmToken: token });
  } catch {
    await setDoc(docRef, { fcmToken: token }, { merge: true });
  }
};

// Helper -- current user's UID (used as instructorId for instructor-scoped data)
function getUid() {
  if (DEMO_MODE) return demoUid();
  return auth.currentUser?.uid || null;
}

//
// AUTH
//
export const registerUser = async (email, password, role = "student") => {
  if (DEMO_MODE) {
    const uid = demoId("demo-user");
    demoStore.users.push({
      id: demoId("user-doc"),
      uid,
      email,
      role,
      createdAt: Date.now()
    });
    return { uid, email };
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userData = {
    uid: user.uid,
    email: user.email,
    role: role,
    createdAt: Date.now()
  };
  // Instructors get a 3-day free trial on signup
  if (role === "instructor") {
    userData.subscriptionStatus = "trialing";
    userData.trialEnd = Date.now() + 3 * 24 * 60 * 60 * 1000;
  }
  await setDoc(doc(db, "users", user.uid), userData);
  return user;
};

const registerStudentSelfOnboardFn = httpsCallable(functions, "registerStudentSelfOnboard");

export const registerStudentSelfOnboard = async (email, password, name, phone, transmission, instructorId) => {
  if (DEMO_MODE) {
    const uid = demoId("demo-student");
    demoStore.users.push({
      id: demoId("user-doc"),
      uid,
      email,
      role: "student",
      createdAt: Date.now()
    });
    demoStore.students.push({
      id: demoId("student-doc"),
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase(),
      transmission,
      instructorId: demoIds.instructor,
      perfectDriver: false,
      parkingPractice: false,
      confidenceLevel: 3,
      riskLevel: "steady"
    });
    return { uid, email };
  }

  const result = await registerStudentSelfOnboardFn({
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
    phone: phone.trim(),
    transmission,
    instructorId
  });

  // The backend creates the account; sign in locally so the user lands in their dashboard.
  const signedIn = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return result?.data || signedIn.user || signedIn;
};

export const loginUser = async (email, password) => {
  if (DEMO_MODE) {
    return getDemoUser();
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  if (DEMO_MODE) return;
  await signOut(auth);
};

// Delete instructor account and all associated data
export const deleteInstructorAccount = async () => {
  if (DEMO_MODE) return;
  const uid = getUid();
  if (!uid) throw new Error("Not authenticated");

  // Delete students, lessons, messages, notifications, tips, waiting list
  const collections = ["students", "lessons", "messages", "notifications", "tips", "waitingList"];
  for (const col of collections) {
    const q = query(collection(db, col), where("instructorId", "==", uid));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  }

  // Delete settings docs
  await deleteDoc(doc(db, "settings", `${uid}-profile`)).catch(() => {});
  await deleteDoc(doc(db, "settings", `${uid}-car`)).catch(() => {});

  // Delete instructorDirectory entry
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists() && userDoc.data().username) {
    await deleteDoc(doc(db, "instructorDirectory", userDoc.data().username)).catch(() => {});
  }

  // Delete user doc
  await deleteDoc(doc(db, "users", uid)).catch(() => {});

  // Delete Firebase Auth account
  await auth.currentUser.delete();
};

export const getUserProfile = async (uid) => {
  if (DEMO_MODE) {
    const profile = demoStore.users.find((u) => u.uid === uid) || getDemoUserProfile();
    return profile ? demoClone(profile) : null;
  }
  const docRef = doc(db, "users", uid);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

// Real-time listener for user profile — calls callback whenever the doc changes
// Falls back to a one-time read if the listener fails (e.g. permission error during token refresh)
export const subscribeUserProfile = (uid, callback) => {
  if (DEMO_MODE) {
    const profile = demoStore.users.find((u) => u.uid === uid) || getDemoUserProfile();
    callback(profile ? demoClone(profile) : null);
    return () => {};
  }
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  }, async () => {
    // Listener failed — fall back to one-time read instead of returning null
    try {
      const snapshot = await getDoc(docRef);
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    } catch {
      callback(null);
    }
  });
};

export const onAuthChange = (callback) => {
  if (DEMO_MODE) {
    callback(getDemoUser());
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const resetPassword = async (email) => {
  if (DEMO_MODE) return;
  await sendPasswordResetEmail(auth, email);
};

//
// STORAGE - Profile Pictures
//
export const uploadProfilePicture = async (studentId, file) => {
  if (DEMO_MODE) {
    const label = (studentId || "S").slice(0, 1).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#4f46e5"/><text x="50%" y="54%" font-size="64" font-family="Arial" fill="white" text-anchor="middle">${label}</text></svg>`;
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    await updateStudent(studentId, { profilePicture: url });
    return url;
  }
  const storage = await getStorageLazy();
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const storageRef = ref(storage, `profile-pictures/${studentId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateStudent(studentId, { profilePicture: url });
  return url;
};

export const deleteProfilePicture = async (studentId) => {
  if (DEMO_MODE) {
    await updateStudent(studentId, { profilePicture: null });
    return;
  }
  await updateStudent(studentId, { profilePicture: null });
  getStorageLazy().then(async (storage) => {
    const { ref, deleteObject } = await import("firebase/storage");
    deleteObject(ref(storage, `profile-pictures/${studentId}`)).catch(() => {});
  });
};

//
// STUDENTS -- scoped by instructorId
//
export const addStudent = async (studentData) => {
  if (DEMO_MODE) {
    const id = demoId("demo-student");
    const next = { id, ...studentData, instructorId: demoIds.instructor };
    demoStore.students.push(next);
    return id;
  }
  const docRef = await addDoc(collection(db, "students"), {
    ...studentData,
    instructorId: getUid()
  });
  return docRef.id;
};

export const getStudents = async () => {
  if (DEMO_MODE) {
    return demoClone(demoStore.students.filter((s) => s.instructorId === demoIds.instructor));
  }
  const uid = getUid();
  if (!uid) return [];
  const q = query(collection(db, "students"), where("instructorId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Paginated version for large student lists
export const getStudentsPaginated = async (pageSize = 25, lastDoc = null) => {
  if (DEMO_MODE) {
    const all = demoStore.students.filter((s) => s.instructorId === demoIds.instructor);
    const startIndex = lastDoc ? all.findIndex((s) => s.id === lastDoc.id) + 1 : 0;
    const page = all.slice(startIndex, startIndex + pageSize);
    return {
      students: demoClone(page),
      lastDoc: page[page.length - 1] || null,
      hasMore: startIndex + pageSize < all.length
    };
  }
  const uid = getUid();
  const constraints = [where("instructorId", "==", uid), orderBy("name"), limit(pageSize)];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  const q = query(collection(db, "students"), ...constraints);
  const snapshot = await getDocs(q);
  return {
    students: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize
  };
};

export const getStudent = async (id) => {
  if (DEMO_MODE) {
    const found = demoStore.students.find((s) => s.id === id);
    return found ? demoClone(found) : null;
  }
  const docRef = doc(db, "students", id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

// Used by student portal -- finds student record by email (no instructor filter)
export const getStudentByEmail = async (email) => {
  if (DEMO_MODE) {
    return demoClone(getDemoStudentByEmail(email));
  }
  const normalised = (email || "").trim().toLowerCase();
  const q = query(collection(db, "students"), where("email", "==", normalised));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() };
  }
  return null;
};

export const updateStudent = async (id, data) => {
  if (DEMO_MODE) {
    const index = demoStore.students.findIndex((s) => s.id === id);
    if (index >= 0) {
      demoStore.students[index] = { ...demoStore.students[index], ...data };
    }
    return;
  }
  const docRef = doc(db, "students", id);
  await updateDoc(docRef, data);
};

export const deleteStudent = async (id) => {
  if (DEMO_MODE) {
    demoStore.students = demoStore.students.filter((s) => s.id !== id);
    demoStore.lessons = demoStore.lessons.filter((l) => l.studentId !== id);
    demoStore.messages = demoStore.messages.filter((m) => m.sender !== id && m.receiver !== id);
    return;
  }
  await deleteDoc(doc(db, "students", id));
  getStorageLazy().then(async (storage) => {
    const { ref, deleteObject } = await import("firebase/storage");
    deleteObject(ref(storage, `profile-pictures/${id}`)).catch(() => {});
  });
};

//
// LESSONS -- scoped by instructorId
//
export const addLesson = async (lessonData) => {
  if (DEMO_MODE) {
    const id = demoId("demo-lesson");
    const next = {
      id,
      ...lessonData,
      instructorId: demoIds.instructor,
      timestamp: Date.now()
    };
    demoStore.lessons.push(next);
    return id;
  }
  const uid = getUid();
  const docRef = await addDoc(collection(db, "lessons"), {
    ...lessonData,
    instructorId: uid,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getLessons = async () => {
  if (DEMO_MODE) {
    return demoClone(demoStore.lessons.filter((l) => l.instructorId === demoIds.instructor));
  }
  const uid = getUid();
  if (!uid) return [];
  const q = query(collection(db, "lessons"), where("instructorId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Paginated version for large lesson lists
export const getLessonsPaginated = async (pageSize = 25, lastDoc = null) => {
  if (DEMO_MODE) {
    const all = demoStore.lessons.filter((l) => l.instructorId === demoIds.instructor);
    const startIndex = lastDoc ? all.findIndex((l) => l.id === lastDoc.id) + 1 : 0;
    const page = all.slice(startIndex, startIndex + pageSize);
    return {
      lessons: demoClone(page),
      lastDoc: page[page.length - 1] || null,
      hasMore: startIndex + pageSize < all.length
    };
  }
  const uid = getUid();
  const constraints = [where("instructorId", "==", uid), orderBy("timestamp", "desc"), limit(pageSize)];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  const q = query(collection(db, "lessons"), ...constraints);
  const snapshot = await getDocs(q);
  return {
    lessons: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize
  };
};

export const getLessonsForStudent = async (studentId) => {
  if (DEMO_MODE) {
    return demoClone(demoStore.lessons.filter((l) => l.studentId === studentId));
  }
  const q = query(collection(db, "lessons"), where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getLesson = async (id) => {
  if (DEMO_MODE) {
    const found = demoStore.lessons.find((l) => l.id === id);
    return found ? demoClone(found) : null;
  }
  const docRef = doc(db, "lessons", id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateLesson = async (id, data) => {
  if (DEMO_MODE) {
    const index = demoStore.lessons.findIndex((l) => l.id === id);
    if (index >= 0) {
      demoStore.lessons[index] = { ...demoStore.lessons[index], ...data };
    }
    return;
  }
  const docRef = doc(db, "lessons", id);
  await updateDoc(docRef, data);
};

export const deleteLesson = async (id) => {
  if (DEMO_MODE) {
    demoStore.lessons = demoStore.lessons.filter((l) => l.id !== id);
    return;
  }
  const ref = doc(db, "lessons", id);
  await deleteDoc(ref);
};

//
// MESSAGES -- scoped by instructorId
//
export const sendMessage = async (message) => {
  if (DEMO_MODE) {
    const id = demoId("demo-msg");
    const next = {
      id,
      ...message,
      instructorId: message.instructorId || demoIds.instructor,
      read: false,
      timestamp: Date.now()
    };
    demoStore.messages.push(next);
    return id;
  }
  const docRef = await addDoc(collection(db, "messages"), {
    ...message,
    instructorId: message.instructorId || getUid(),
    read: false,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getMessagesForStudent = async (studentId, instructorId) => {
  if (DEMO_MODE) {
    const iId = instructorId || demoIds.instructor;
    const all = demoStore.messages.filter((m) => m.instructorId === iId);
    return demoClone(
      all
        .filter((m) => m.sender === studentId || m.receiver === studentId)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    );
  }
  const iId = instructorId || getUid();
  const q = iId
    ? query(collection(db, "messages"), where("instructorId", "==", iId))
    : collection(db, "messages");
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return all
    .filter((m) => m.sender === studentId || m.receiver === studentId)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

export const getAllMessages = async () => {
  if (DEMO_MODE) {
    return demoClone(demoStore.messages.filter((m) => m.instructorId === demoIds.instructor));
  }
  const uid = getUid();
  if (!uid) return [];
  const q = query(collection(db, "messages"), where("instructorId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markMessageRead = async (id) => {
  if (DEMO_MODE) {
    const index = demoStore.messages.findIndex((m) => m.id === id);
    if (index >= 0) demoStore.messages[index].read = true;
    return;
  }
  await updateDoc(doc(db, "messages", id), { read: true });
};

export const markAllMessagesRead = async (studentId) => {
  if (DEMO_MODE) {
    demoStore.messages = demoStore.messages.map((m) =>
      m.sender === studentId ? { ...m, read: true } : m
    );
    return;
  }
  const uid = getUid();
  const q = query(collection(db, "messages"), where("sender", "==", studentId), where("read", "==", false));
  const snapshot = await getDocs(q);
  const updates = snapshot.docs
    .filter((d) => !uid || d.data().instructorId === uid)
    .map((d) => updateDoc(doc(db, "messages", d.id), { read: true }));
  await Promise.all(updates);
};

export const deleteMessage = async (id) => {
  if (DEMO_MODE) {
    demoStore.messages = demoStore.messages.filter((m) => m.id !== id);
    return;
  }
  await deleteDoc(doc(db, "messages", id));
};

export const deleteMessages = async (ids) => {
  if (DEMO_MODE) {
    demoStore.messages = demoStore.messages.filter((m) => !ids.includes(m.id));
    return;
  }
  await Promise.all(ids.map((id) => deleteDoc(doc(db, "messages", id))));
};

//
// NOTIFICATIONS -- scoped by instructorId
//
export const sendNotification = async (notification) => {
  if (DEMO_MODE) {
    const id = demoId("demo-notif");
    const next = {
      id,
      ...notification,
      instructorId: demoIds.instructor,
      read: false,
      timestamp: Date.now()
    };
    demoStore.notifications.push(next);
    return id;
  }
  const docRef = await addDoc(collection(db, "notifications"), {
    ...notification,
    instructorId: getUid(),
    read: false,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getNotifications = async () => {
  if (DEMO_MODE) {
    return demoClone(demoStore.notifications.filter((n) => n.instructorId === demoIds.instructor));
  }
  const uid = getUid();
  if (!uid) return [];
  const q = query(collection(db, "notifications"), where("instructorId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markNotificationRead = async (id) => {
  if (DEMO_MODE) {
    const index = demoStore.notifications.findIndex((n) => n.id === id);
    if (index >= 0) demoStore.notifications[index].read = true;
    return;
  }
  const docRef = doc(db, "notifications", id);
  await updateDoc(docRef, { read: true });
};

export const deleteNotification = async (id) => {
  if (DEMO_MODE) {
    demoStore.notifications = demoStore.notifications.filter((n) => n.id !== id);
    return;
  }
  const docRef = doc(db, "notifications", id);
  await deleteDoc(docRef);
};

//
// TIPS -- scoped by instructorId
//
export const addTip = async (tipData) => {
  if (DEMO_MODE) {
    const id = demoId("demo-tip");
    const next = {
      id,
      ...tipData,
      instructorId: demoIds.instructor,
      timestamp: Date.now()
    };
    demoStore.tips.push(next);
    return id;
  }
  const docRef = await addDoc(collection(db, "tips"), {
    ...tipData,
    instructorId: getUid(),
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getTips = async (instructorId) => {
  if (DEMO_MODE) {
    return demoClone(demoStore.tips.filter((t) => t.instructorId === demoIds.instructor));
  }
  const uid = instructorId || getUid();
  if (!uid) return [];
  const q = query(collection(db, "tips"), where("instructorId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteTip = async (id) => {
  if (DEMO_MODE) {
    demoStore.tips = demoStore.tips.filter((t) => t.id !== id);
    return;
  }
  const docRef = doc(db, "tips", id);
  await deleteDoc(docRef);
};

//
// CAR DETAILS -- per-instructor (UID-based doc)
//
export const getCarDetails = async (uid) => {
  if (DEMO_MODE) {
    return demoClone(demoStore.carDetails);
  }
  const id = uid || getUid();
  if (!id) return null;
  const docRef = doc(db, "settings", `${id}-car`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveCarDetails = async (carData) => {
  if (DEMO_MODE) {
    demoStore.carDetails = { ...demoStore.carDetails, ...carData };
    return;
  }
  const id = getUid();
  const docRef = doc(db, "settings", `${id}-car`);
  try { await updateDoc(docRef, carData); } catch { await setDoc(docRef, carData); }
};

//
// INSTRUCTOR PROFILE -- per-instructor (UID-based doc)
//
export const getInstructorProfile = async (uid) => {
  if (DEMO_MODE) {
    return demoClone(demoStore.instructorProfile);
  }
  const id = uid || getUid();
  if (!id) return null;
  const docRef = doc(db, "settings", `${id}-profile`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveInstructorProfile = async (profileData) => {
  if (DEMO_MODE) {
    demoStore.instructorProfile = { ...demoStore.instructorProfile, ...profileData };
    return;
  }
  const id = getUid();
  const docRef = doc(db, "settings", `${id}-profile`);

  // Read existing profile to detect username change
  let oldUsername = null;
  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) oldUsername = existing.data().username || null;
  } catch { /* first save */ }

  try { await updateDoc(docRef, profileData); } catch { await setDoc(docRef, profileData); }

  // Sync username to users doc
  if (profileData.username) {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, { username: profileData.username });
  }

  // Sync to public instructorDirectory for student search (no sensitive data)
  if (profileData.username || profileData.name) {
    // Delete old directory entry if username changed
    if (oldUsername && profileData.username && oldUsername !== profileData.username) {
      await deleteDoc(doc(db, "instructorDirectory", oldUsername));
    }
    const dirRef = doc(db, "instructorDirectory", profileData.username || id);
    const dirData = {
      uid: id,
      username: profileData.username || "",
      name: profileData.name || "",
      location: profileData.location || "",
      rating: profileData.rating || "",
      transmissions: profileData.transmissions || "both"
    };
    await setDoc(dirRef, dirData, { merge: true });
  }
};

export const checkUsernameAvailable = async (username) => {
  if (DEMO_MODE) return true;
  const id = getUid();
  const dirDoc = await getDoc(doc(db, "instructorDirectory", username));
  if (!dirDoc.exists()) return true;
  return dirDoc.data().uid === id;
};

export const searchInstructorByUsername = async (username) => {
  if (DEMO_MODE) return null;
  const dirDoc = await getDoc(doc(db, "instructorDirectory", username.toLowerCase()));
  if (!dirDoc.exists()) return null;
  const data = dirDoc.data();
  return {
    uid: data.uid,
    username: data.username,
    name: data.name || "Instructor",
    location: data.location || "",
    rating: data.rating || "",
    transmissions: data.transmissions || "both"
  };
};

//
// WAITING LIST -- scoped by instructorId
//
export const getWaitingList = async () => {
  if (DEMO_MODE) {
    return demoClone(
      demoStore.waitingList
        .filter((w) => w.instructorId === demoIds.instructor)
        .sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0))
    );
  }
  const uid = getUid();
  if (!uid) return [];
  const q = query(collection(db, "waitingList"), where("instructorId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
};

export const addToWaitingList = async (entry) => {
  if (DEMO_MODE) {
    const id = demoId("demo-wait");
    const next = { id, ...entry, instructorId: demoIds.instructor, addedAt: Date.now() };
    demoStore.waitingList.push(next);
    return id;
  }
  const docRef = await addDoc(collection(db, "waitingList"), {
    ...entry,
    instructorId: getUid(),
    addedAt: Date.now()
  });
  return docRef.id;
};

export const removeFromWaitingList = async (id) => {
  if (DEMO_MODE) {
    demoStore.waitingList = demoStore.waitingList.filter((w) => w.id !== id);
    return;
  }
  await deleteDoc(doc(db, "waitingList", id));
};

//
// REAL-TIME LISTENERS
//
// FUNCTIONS_BASE for calling Cloud Functions
const FUNCTION_URLS = {
  createCheckoutSession:
    import.meta.env.VITE_CREATE_CHECKOUT_SESSION_URL || "https://example.invalid/create-checkout-session",
  createPortalSession:
    import.meta.env.VITE_CREATE_PORTAL_SESSION_URL || "https://example.invalid/create-portal-session",
  validateReferralCode:
    import.meta.env.VITE_VALIDATE_REFERRAL_CODE_URL || "https://example.invalid/validate-referral-code",
};

// Get current user's Firebase ID token for authenticated API calls
export const getIdToken = async () => {
  if (DEMO_MODE) return "demo-token";
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

async function postToFunction(endpoint, payload = {}) {
  if (DEMO_MODE) {
    return { url: "/" };
  }

  const token = await getIdToken();
  if (!token) {
    throw new Error("You need to be signed in to continue.");
  }

  const url = FUNCTION_URLS[endpoint];
  if (!url) throw new Error("Unknown function: " + endpoint);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const createSubscriptionCheckout = async (role, extras = {}) => {
  const normalizedRole = role === "student" ? "student" : "instructor";
  return postToFunction("createCheckoutSession", { role: normalizedRole, ...extras });
};

export const createBillingPortalSession = async (role) => {
  const normalizedRole = role === "student" ? "student" : "instructor";
  return postToFunction("createPortalSession", { role: normalizedRole });
};

export const validateReferralCodeApi = async (code) => {
  return postToFunction("validateReferralCode", { code });
};

//
// REFERRAL SYSTEM
//
export const subscribeToMessages = (studentId, instructorId, callback) => {
  if (DEMO_MODE) {
    const iId = instructorId || demoIds.instructor;
    const msgs = demoStore.messages
      .filter(
        (m) =>
          m.instructorId === iId &&
          ((m.sender === iId && m.receiver === studentId) ||
            (m.sender === studentId && m.receiver === iId))
      )
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    callback(demoClone(msgs));
    return () => {};
  }
  const iId = instructorId || getUid();
  const isInstructor = iId === getUid();

  if (isInstructor) {
    // Instructor: single query on instructorId (their own UID), filter by student
    const q = query(collection(db, "messages"), where("instructorId", "==", iId));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (m) =>
            (m.sender === iId && m.receiver === studentId) ||
            (m.sender === studentId && m.receiver === iId)
        )
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      callback(msgs);
    });
  }

  // Student: two queries — messages they sent + messages they received
  const qSent = query(
    collection(db, "messages"),
    where("sender", "==", studentId),
    where("receiver", "==", iId)
  );
  const qReceived = query(
    collection(db, "messages"),
    where("receiver", "==", studentId),
    where("sender", "==", iId)
  );

  let sentMsgs = [];
  let receivedMsgs = [];

  function merge() {
    const all = [...sentMsgs, ...receivedMsgs]
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    callback(all);
  }

  const unsub1 = onSnapshot(qSent, (snapshot) => {
    sentMsgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    merge();
  });

  const unsub2 = onSnapshot(qReceived, (snapshot) => {
    receivedMsgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    merge();
  });

  return () => { unsub1(); unsub2(); };
};

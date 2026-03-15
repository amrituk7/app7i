import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBHAGf5NleYjckCad9mjr09_doR_5lce4Y",
  authDomain: "roadmaster-23cbc.firebaseapp.com",
  projectId: "roadmaster-23cbc",
  storageBucket: "roadmaster-23cbc.firebasestorage.app",
  messagingSenderId: "597704342474",
  appId: "1:597704342474:web:6ad71bf5dbbff79b452d33",
  measurementId: "G-GSCV96CCV9"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

//
// AUTH
//
export const registerUser = async (email, password, role = "student") => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create user profile in Firestore
  await addDoc(collection(db, "users"), {
    uid: user.uid,
    email: user.email,
    role: role,
    createdAt: Date.now()
  });
  
  return user;
};

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getUserProfile = async (uid) => {
  const q = query(collection(db, "users"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

//
// STORAGE - Profile Pictures
//
export const uploadProfilePicture = async (studentId, file) => {
  const storageRef = ref(storage, `profile-pictures/${studentId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  // Update student with profile picture URL
  await updateStudent(studentId, { profilePicture: url });
  return url;
};

export const deleteProfilePicture = async (studentId) => {
  try {
    const storageRef = ref(storage, `profile-pictures/${studentId}`);
    await deleteObject(storageRef);
  } catch (error) {
    // File might not exist, that's okay
    console.log("No profile picture to delete");
  }
  await updateStudent(studentId, { profilePicture: null });
};

//
// STUDENTS
//
export const addStudent = async (studentData) => {
  const docRef = await addDoc(collection(db, "students"), studentData);
  return docRef.id;
};

export const getStudents = async () => {
  const snapshot = await getDocs(collection(db, "students"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getStudent = async (id) => {
  const docRef = doc(db, "students", id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateStudent = async (id, data) => {
  const docRef = doc(db, "students", id);
  await updateDoc(docRef, data);
};

export const deleteStudent = async (id) => {
  // Delete profile picture first
  try {
    await deleteProfilePicture(id);
  } catch (e) {
    // Ignore if no picture
  }
  const docRef = doc(db, "students", id);
  await deleteDoc(docRef);
};

//
// LESSONS
//
export const addLesson = async (lessonData) => {
  const docRef = await addDoc(collection(db, "lessons"), {
    ...lessonData,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getLessons = async () => {
  const snapshot = await getDocs(collection(db, "lessons"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getLessonsForStudent = async (studentId) => {
  const q = query(
    collection(db, "lessons"),
    where("studentId", "==", studentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteLesson = async (id) => {
  const docRef = doc(db, "lessons", id);
  await deleteDoc(docRef);
};

//
// MESSAGES
//
export const sendMessage = async (message) => {
  const docRef = await addDoc(collection(db, "messages"), {
    ...message,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getMessagesForStudent = async (studentId) => {
  const q = query(
    collection(db, "messages"),
    where("receiver", "==", studentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

//
// NOTIFICATIONS
//
export const sendNotification = async (notification) => {
  const docRef = await addDoc(collection(db, "notifications"), {
    ...notification,
    read: false,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getNotifications = async () => {
  const snapshot = await getDocs(collection(db, "notifications"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const markNotificationRead = async (id) => {
  const docRef = doc(db, "notifications", id);
  await updateDoc(docRef, { read: true });
};

export const deleteNotification = async (id) => {
  const docRef = doc(db, "notifications", id);
  await deleteDoc(docRef);
};

//
// TIPS
//
export const addTip = async (tipData) => {
  const docRef = await addDoc(collection(db, "tips"), {
    ...tipData,
    timestamp: Date.now()
  });
  return docRef.id;
};

export const getTips = async () => {
  const snapshot = await getDocs(collection(db, "tips"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteTip = async (id) => {
  const docRef = doc(db, "tips", id);
  await deleteDoc(docRef);
};

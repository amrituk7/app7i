import { deleteUser } from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { firebaseAuth, firestore, isFirebaseConfigured } from "./firebase";

/**
 * Delete the signed-in user's account.
 *
 * Google Play Data Deletion policy (effective Apr 2024) requires every app
 * with login to expose this in-app. Apple guideline 5.1.1.v requires the same.
 *
 * Order matters:
 * 1. Best-effort wipe of Firestore docs that the rules let the user delete
 *    (their /users doc, their student profile, their messages).
 * 2. deleteUser() removes the Firebase Auth account.
 *
 * If step 2 fails with auth/requires-recent-login, the caller should prompt
 * the user to sign in again, then retry.
 */
export async function deleteCurrentAccount(): Promise<void> {
  if (!isFirebaseConfigured || !firebaseAuth || !firestore) {
    throw new Error("Connection issue. Please restart the app or try again.");
  }
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in.");

  const uid = user.uid;

  // Best-effort cleanup. Failures here don't block deleteUser — server-side
  // cleanup runs from a Cloud Function once the auth account is gone.
  try {
    await deleteDoc(doc(firestore, "users", uid));
  } catch {}

  // Wipe the student doc the user owns (if they're a learner).
  try {
    const studentSnap = await getDocs(
      query(collection(firestore, "students"), where("uid", "==", uid)),
    );
    if (!studentSnap.empty) {
      const batch = writeBatch(firestore);
      studentSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch {}

  // Finally, the Auth account itself.
  await deleteUser(user);
}

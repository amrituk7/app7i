import { deleteUser } from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { firebaseAuth, firestore, functions, isFirebaseConfigured } from "./firebase";

/**
 * Delete the signed-in user's account.
 *
 * Google Play Data Deletion policy (effective Apr 2024) requires every app
 * with login to expose this in-app. Apple guideline 5.1.1.v requires the same.
 *
 * Preferred path: the `deleteAccount` Cloud Function wipes ALL data the
 * account owns (users doc + subcollections, student profile, messages,
 * feedback rows, notifications — things rules block clients from touching)
 * and then deletes the Auth account server-side.
 *
 * Fallback (function unreachable, e.g. offline or not yet deployed): the
 * legacy client-side best-effort wipe, then deleteUser(). If that fails with
 * auth/requires-recent-login, the caller should prompt the user to sign in
 * again, then retry.
 */
export async function deleteCurrentAccount(): Promise<void> {
  if (!isFirebaseConfigured || !firebaseAuth || !firestore) {
    throw new Error("Connection issue. Please restart the app or try again.");
  }
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in.");

  if (functions) {
    try {
      await httpsCallable(functions, "deleteAccount")({});
      // Auth account is already gone server-side; drop the local session.
      try {
        await firebaseAuth.signOut();
      } catch {}
      return;
    } catch (err) {
      // The callable may fail AFTER the server already deleted the account
      // (e.g. network drop on the response). Probe before falling back so a
      // completed deletion isn't reported as an error.
      try {
        await user.reload();
      } catch (reloadErr) {
        const code = (reloadErr as { code?: string })?.code || "";
        if (/user-not-found|user-token-expired|user-disabled/.test(code)) {
          try {
            await firebaseAuth.signOut();
          } catch {}
          return;
        }
      }
      console.warn(
        "[account] server-side deleteAccount failed, falling back to client wipe",
        err instanceof Error ? err.message.slice(0, 200) : err,
      );
    }
  }

  const uid = user.uid;

  // Best-effort cleanup; failures here don't block deleteUser.
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

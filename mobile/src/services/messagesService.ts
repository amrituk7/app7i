import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "./firebase";
import { getInstructorProfile, getStudent, getStudentByUid } from "./dataService";
import type { ConversationSummary, Message } from "../types";

type MessagesCallback<T> = (value: T) => void;
type ErrorCallback = (error: Error) => void;

type SendMessageInput = {
  instructorId: string;
  studentId: string;
  sender: "instructor" | string;
  receiver: "instructor" | string;
  text: string;
};

export type StudentMessageContext = {
  instructorId: string;
  instructorName: string;
  studentId: string;
  studentName: string;
};

function db() {
  if (!firestore) throw new Error("Messages are not ready on this device. Sign out and back in?");
  return firestore;
}

function toMillis(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value) {
    const maybeTimestamp = value as { toMillis: () => number };
    return maybeTimestamp.toMillis();
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const maybeTimestamp = value as { seconds: number };
    return maybeTimestamp.seconds * 1000;
  }
  return 0;
}

function textField(data: DocumentData, key: string) {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

function asMessage(id: string, data: DocumentData): Message {
  const instructorId = textField(data, "instructorId");
  const sender = textField(data, "sender");
  const receiver = textField(data, "receiver");
  const explicitStudentId = textField(data, "studentId");
  const studentId = explicitStudentId || (sender === instructorId ? receiver : sender);

  return {
    id,
    sender,
    receiver,
    instructorId,
    studentId,
    text: textField(data, "text"),
    read: Boolean(data.read),
    timestamp: toMillis(data.timestamp),
    deleted: Boolean(data.deleted),
    deletedAt: data.deletedAt ? toMillis(data.deletedAt) : undefined,
    deletedBy: textField(data, "deletedBy") || undefined,
  };
}

function isInstructorSender(message: Message) {
  return message.sender === message.instructorId || message.sender === "instructor";
}

function normalizeParty(value: string, instructorId: string) {
  // Existing web app and Cloud Functions use the instructor uid in sender/receiver.
  return value === "instructor" ? instructorId : value;
}

async function studentName(studentId: string) {
  const student = await getStudent(studentId).catch(() => null);
  return student?.name || "Student";
}

export function subscribeConversations(
  instructorUid: string,
  callback: MessagesCallback<ConversationSummary[]>,
  onError?: ErrorCallback,
): Unsubscribe {
  // Cap the snapshot at the 150 most recent messages — enough to surface every
  // active conversation's "last message" for typical usage, and keeps the
  // read cost bounded. Requires composite index (instructorId, timestamp desc).
  const q = query(
    collection(db(), "messages"),
    where("instructorId", "==", instructorUid),
    orderBy("timestamp", "desc"),
    limit(150),
  );
  let version = 0;
  const nameCache = new Map<string, string>();

  return onSnapshot(
    q,
    (snapshot) => {
      const currentVersion = version + 1;
      version = currentVersion;
      const grouped = new Map<string, { lastMessage: Message; unreadCount: number }>();

      snapshot.docs.map((item) => asMessage(item.id, item.data())).forEach((message) => {
        if (!message.studentId) return;
        const current = grouped.get(message.studentId);
        const unreadIncrement = !message.read && !isInstructorSender(message) ? 1 : 0;

        grouped.set(message.studentId, {
          lastMessage:
            !current || message.timestamp >= current.lastMessage.timestamp
              ? message
              : current.lastMessage,
          unreadCount: (current?.unreadCount || 0) + unreadIncrement,
        });
      });

      void Promise.all(
        Array.from(grouped.entries()).map(async ([studentId, entry]) => {
          const cachedName = nameCache.get(studentId);
          const resolvedName = cachedName || await studentName(studentId);
          nameCache.set(studentId, resolvedName);
          return {
            studentId,
            studentName: resolvedName,
            lastMessage: entry.lastMessage,
            lastTimestamp: entry.lastMessage.timestamp,
            unreadCount: entry.unreadCount,
          };
        }),
      ).then((summaries) => {
        if (version !== currentVersion) return;
        callback(summaries.sort((a, b) => b.lastTimestamp - a.lastTimestamp));
      }).catch((error: unknown) => {
        if (onError) onError(error instanceof Error ? error : new Error("We're having trouble loading messages. Pull down to retry."));
      });
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

/**
 * Subscribe to a single conversation thread between an instructor and a student.
 *
 * Role-aware so we can use the right Firestore rule path for each caller:
 *
 * - **Instructor caller**: queries by `instructorId` only and filters client-side
 *   on (sender, receiver). Catches every message regardless of whether it has
 *   the `studentId` field — legacy and web-origin messages still appear.
 *
 * - **Student caller**: two parallel queries on (sender, receiver) — one for
 *   sent, one for received. Doesn't depend on `studentId` either, and matches
 *   the rule predicate (`isStudentUidForId(sender|receiver)`) so the listener
 *   isn't denied.
 *
 * `currentUid` is required so we can pick the right path. Pass `user.uid` from
 * AuthContext.
 */
export function subscribeConversation(
  instructorUid: string,
  studentId: string,
  currentUid: string | null | undefined,
  callback: MessagesCallback<Message[]>,
  onError?: ErrorCallback,
): Unsubscribe {
  if (!currentUid) {
    // Defer to instructor path so a missing uid doesn't silently produce zero
    // messages — the rule will deny if it doesn't match and onError fires.
    return subscribeAsInstructor(instructorUid, studentId, callback, onError);
  }

  const isInstructor = currentUid === instructorUid;
  if (isInstructor) {
    return subscribeAsInstructor(instructorUid, studentId, callback, onError);
  }
  return subscribeAsStudent(instructorUid, studentId, callback, onError);
}

function isMessageBetween(message: Message, instructorUid: string, studentId: string) {
  // True if the message belongs to this instructor↔student pair, regardless of
  // whether it has an explicit studentId field. Covers messages stored as
  // {sender:instructorUid, receiver:studentDocId} OR
  // {sender:studentDocId, receiver:instructorUid}.
  const a = message.sender === instructorUid && message.receiver === studentId;
  const b = message.sender === studentId && message.receiver === instructorUid;
  // Defensive: also match if the message carries an explicit studentId we know.
  const c = message.studentId === studentId && message.instructorId === instructorUid;
  return a || b || c;
}

function sortByTimestampAsc(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}

function subscribeAsInstructor(
  instructorUid: string,
  studentId: string,
  callback: MessagesCallback<Message[]>,
  onError?: ErrorCallback,
): Unsubscribe {
  // Single broad query scoped to this instructor. Cheaper than two queries, and
  // the rules already constrain the snapshot to this instructor's data.
  // Cap per-thread snapshot at the 200 most recent messages for this instructor.
  // The client-side isMessageBetween filter narrows that to the specific pair.
  // Requires composite index (instructorId, timestamp desc).
  const q = query(
    collection(db(), "messages"),
    where("instructorId", "==", instructorUid),
    orderBy("timestamp", "desc"),
    limit(200),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((item) => asMessage(item.id, item.data()));
      const thread = all.filter((message) => isMessageBetween(message, instructorUid, studentId));
      callback(sortByTimestampAsc(thread));
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

function subscribeAsStudent(
  instructorUid: string,
  studentId: string,
  callback: MessagesCallback<Message[]>,
  onError?: ErrorCallback,
): Unsubscribe {
  // Student rules require sender or receiver to map back to the caller's auth
  // uid (via the students/{id}.uid lookup). We can't query by `instructorId`
  // alone — the rule denies docs that aren't tied to the student. Use two
  // queries on the (sender, receiver) pair and union them on the client.
  const qSent = query(
    collection(db(), "messages"),
    where("sender", "==", studentId),
    where("receiver", "==", instructorUid),
  );
  const qReceived = query(
    collection(db(), "messages"),
    where("receiver", "==", studentId),
    where("sender", "==", instructorUid),
  );

  let sent: Message[] = [];
  let received: Message[] = [];
  // Microtask debounce: both onSnapshot listeners commonly fire in the same
  // event-loop tick when a new message arrives. Emitting on each fire causes
  // a render with a partial (sent-only or received-only) list, followed by
  // the correct merged render — visible as a flicker. Queueing the emit on
  // the microtask queue coalesces both updates into a single render.
  let pendingEmit = false;
  function scheduleEmit() {
    if (pendingEmit) return;
    pendingEmit = true;
    Promise.resolve().then(() => {
      pendingEmit = false;
      callback(sortByTimestampAsc([...sent, ...received]));
    });
  }

  const unsubSent = onSnapshot(
    qSent,
    (snapshot) => {
      sent = snapshot.docs.map((item) => asMessage(item.id, item.data()));
      scheduleEmit();
    },
    (error) => {
      if (onError) onError(error);
    },
  );
  const unsubReceived = onSnapshot(
    qReceived,
    (snapshot) => {
      received = snapshot.docs.map((item) => asMessage(item.id, item.data()));
      scheduleEmit();
    },
    (error) => {
      if (onError) onError(error);
    },
  );

  return () => {
    unsubSent();
    unsubReceived();
  };
}

export async function getStudentMessageContext(uid: string): Promise<StudentMessageContext | null> {
  const student = await getStudentByUid(uid);
  if (!student?.id || !student.instructorId) return null;
  const instructor = await getInstructorProfile(student.instructorId).catch(() => null);

  return {
    instructorId: student.instructorId,
    instructorName: instructor?.name || "Your instructor",
    studentId: student.id,
    studentName: student.name,
  };
}

export async function sendMessage({
  instructorId,
  studentId,
  sender,
  receiver,
  text,
}: SendMessageInput): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText) throw new Error("Enter a message first.");

  const ref = await addDoc(collection(db(), "messages"), {
    sender: normalizeParty(sender, instructorId),
    receiver: normalizeParty(receiver, instructorId),
    instructorId,
    studentId,
    text: cleanText,
    read: false,
    timestamp: serverTimestamp(),
  });

  return ref.id;
}

export async function markAsRead(messageId: string): Promise<void> {
  await updateDoc(doc(db(), "messages", messageId), { read: true });
}

/**
 * Delete every message between an instructor and a specific student.
 *
 * Uses the broad `instructorId` scope and filters client-side on
 * (sender, receiver) so legacy or web-origin messages without a `studentId`
 * field are ALSO swept up. Without this, deleted chats reappear when a
 * straggler doc fails to match the strict filter.
 *
 * Instructor-only operation — student-side delete is not supported (and
 * Firestore rules deny it anyway).
 */
export async function deleteConversation(
  instructorId: string,
  studentId: string,
): Promise<number> {
  const q = query(
    collection(db(), "messages"),
    where("instructorId", "==", instructorId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const targets = snap.docs.filter((d) => {
    const message = asMessage(d.id, d.data());
    return isMessageBetween(message, instructorId, studentId);
  });
  if (targets.length === 0) return 0;

  // Firestore writeBatch caps at 500 ops — chunk to be safe.
  for (let i = 0; i < targets.length; i += 400) {
    const chunk = targets.slice(i, i + 400);
    const batch = writeBatch(db());
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return targets.length;
}

/** Hard-delete a single message. Instructor-only path. */
export async function deleteMessage(messageId: string): Promise<void> {
  await deleteDoc(doc(db(), "messages", messageId));
}

/**
 * Soft-delete a single message. Sets text="" + deleted=true + audit fields.
 * Firestore rules require `deletedBy` to equal the caller's auth uid AND
 * the caller to be the sender of the original message — both enforced
 * server-side, so the call below will be rejected if either is wrong.
 *
 * After this, MessageBubble renders "Message deleted" instead of the text.
 * The doc is still in Firestore so the read counter and threading don't break.
 */
export async function softDeleteMessage(
  messageId: string,
  callerUid: string,
): Promise<void> {
  await updateDoc(doc(db(), "messages", messageId), {
    text: "",
    deleted: true,
    deletedAt: Date.now(),
    deletedBy: callerUid,
  });
}

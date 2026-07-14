import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";
import { firebaseFunctions, firebaseStorage, firestore } from "./firebase";
import type {
  LearningEntry,
  LearningEntryKind,
  LearningResource,
  LearningResourceType,
  LearningTopic,
  ResourceAssignment,
  StudentLearningProgress,
} from "../types";

export const DEFAULT_DRIVING_TOPICS: LearningTopic[] = [
  "Cockpit drill",
  "Moving off",
  "Junctions",
  "Roundabouts",
  "Crossroads",
  "Dual carriageways",
  "Motorways",
  "Parking manoeuvres",
  "Emergency stop",
  "Independent driving",
  "Sat Nav driving",
  "Eco driving",
  "Night driving",
].map((label) => ({ id: topicId(label), label, status: "not_started" }));

export type LearningUploadAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

export type ResourceDraft = {
  title: string;
  description?: string;
  type: LearningResourceType;
  category?: string;
  folder?: string;
  url?: string;
  pinned?: boolean;
};

export type LearningEntryDraft = {
  studentId: string;
  lessonId?: string;
  kind: LearningEntryKind;
  title: string;
  body?: string;
  topicsCovered?: string[];
  areasToImprove?: string;
  homework?: string;
  skillsAchieved?: string[];
  instructorComments?: string;
  confidenceLevel?: number;
  nextObjectives?: string;
};

function db() {
  if (!firestore) throw new Error("Firestore is not configured.");
  return firestore;
}

function storage() {
  if (!firebaseStorage) throw new Error("File storage is not configured.");
  return firebaseStorage;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function topicId(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function safeFileName(value: string) {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
  return cleaned || `resource_${Date.now()}`;
}

function asResource(id: string, data: DocumentData): LearningResource {
  return {
    id,
    instructorId: text(data.instructorId),
    title: text(data.title, "Untitled resource"),
    description: text(data.description),
    type: text(data.type, "document") as LearningResourceType,
    category: text(data.category, "General"),
    folder: text(data.folder, "My library"),
    url: text(data.url) || undefined,
    storagePath: text(data.storagePath) || undefined,
    fileName: text(data.fileName) || undefined,
    mimeType: text(data.mimeType) || undefined,
    sizeBytes: number(data.sizeBytes) || undefined,
    pinned: bool(data.pinned),
    archived: bool(data.archived),
    createdAt: number(data.createdAt),
    updatedAt: number(data.updatedAt),
  };
}

function asAssignment(id: string, data: DocumentData): ResourceAssignment {
  return {
    id,
    instructorId: text(data.instructorId),
    studentId: text(data.studentId),
    resourceId: text(data.resourceId),
    title: text(data.title, "Untitled resource"),
    description: text(data.description),
    type: text(data.type, "document") as LearningResourceType,
    category: text(data.category, "General"),
    folder: text(data.folder, "Learning Hub"),
    url: text(data.url) || undefined,
    storagePath: text(data.storagePath) || undefined,
    fileName: text(data.fileName) || undefined,
    mimeType: text(data.mimeType) || undefined,
    required: bool(data.required),
    pinned: bool(data.pinned),
    completed: bool(data.completed),
    completedAt: number(data.completedAt) || undefined,
    assignedAt: number(data.assignedAt),
    updatedAt: number(data.updatedAt),
  };
}

function asEntry(id: string, data: DocumentData): LearningEntry {
  return {
    id,
    instructorId: text(data.instructorId),
    studentId: text(data.studentId),
    lessonId: text(data.lessonId) || undefined,
    kind: text(data.kind, "manual_note") as LearningEntryKind,
    title: text(data.title, "Learning note"),
    body: text(data.body),
    topicsCovered: Array.isArray(data.topicsCovered) ? data.topicsCovered.filter((item: unknown) => typeof item === "string") : [],
    areasToImprove: text(data.areasToImprove),
    homework: text(data.homework),
    skillsAchieved: Array.isArray(data.skillsAchieved) ? data.skillsAchieved.filter((item: unknown) => typeof item === "string") : [],
    instructorComments: text(data.instructorComments),
    confidenceLevel: number(data.confidenceLevel) || undefined,
    nextObjectives: text(data.nextObjectives),
    createdAt: number(data.createdAt),
    updatedAt: number(data.updatedAt),
  };
}

async function uploadResourceFile(
  instructorId: string,
  resourceId: string,
  asset: LearningUploadAsset,
) {
  if (asset.size && asset.size > 25 * 1024 * 1024) {
    throw new Error("Files must be 25 MB or smaller.");
  }
  const path = `learning-resources/${instructorId}/${resourceId}/${safeFileName(asset.name)}`;
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const estimatedBytes = Math.floor((base64.length * 3) / 4);
  if (estimatedBytes > 25 * 1024 * 1024) {
    throw new Error("Files must be 25 MB or smaller.");
  }
  await uploadString(ref(storage(), path), base64, "base64", {
    contentType: asset.mimeType || "application/octet-stream",
  });
  return {
    storagePath: path,
    fileName: asset.name,
    mimeType: asset.mimeType || "application/octet-stream",
    sizeBytes: asset.size || estimatedBytes,
  };
}

export async function getResourceLibrary(
  instructorId: string,
  includeArchived = false,
): Promise<LearningResource[]> {
  const snap = await getDocs(query(
    collection(db(), "learningResources"),
    where("instructorId", "==", instructorId),
  ));
  return snap.docs
    .map((item) => asResource(item.id, item.data()))
    .filter((item) => includeArchived || !item.archived)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export async function createLearningResource(
  instructorId: string,
  draft: ResourceDraft,
  asset?: LearningUploadAsset,
): Promise<LearningResource> {
  const resourceRef = doc(collection(db(), "learningResources"));
  const now = Date.now();
  const upload = asset ? await uploadResourceFile(instructorId, resourceRef.id, asset) : {};
  const body = {
    instructorId,
    title: draft.title.trim(),
    description: draft.description?.trim() || "",
    type: draft.type,
    category: draft.category?.trim() || "General",
    folder: draft.folder?.trim() || "My library",
    url: draft.url?.trim() || "",
    pinned: draft.pinned === true,
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...upload,
  };
  await setDoc(resourceRef, body);
  return asResource(resourceRef.id, body);
}

export async function updateLearningResource(
  resource: LearningResource,
  patch: Partial<ResourceDraft> & { archived?: boolean },
  replacement?: LearningUploadAsset,
): Promise<LearningResource> {
  const upload = replacement
    ? await uploadResourceFile(resource.instructorId, resource.id, replacement)
    : {};
  const updated: LearningResource = {
    ...resource,
    title: patch.title?.trim() || resource.title,
    description: patch.description !== undefined ? patch.description.trim() : resource.description,
    type: patch.type || resource.type,
    category: patch.category?.trim() || resource.category,
    folder: patch.folder?.trim() || resource.folder,
    url: patch.url !== undefined ? patch.url.trim() || undefined : resource.url,
    pinned: patch.pinned ?? resource.pinned,
    archived: patch.archived ?? resource.archived,
    updatedAt: Date.now(),
    ...upload,
  };
  await updateDoc(doc(db(), "learningResources", resource.id), {
    title: updated.title,
    description: updated.description,
    type: updated.type,
    category: updated.category,
    folder: updated.folder,
    url: updated.url || "",
    pinned: updated.pinned,
    archived: updated.archived,
    updatedAt: updated.updatedAt,
    ...(replacement ? upload : {}),
  });

  const assignmentSnap = await getDocs(query(
    collection(db(), "resourceAssignments"),
    where("instructorId", "==", resource.instructorId),
    where("resourceId", "==", resource.id),
  ));
  for (let offset = 0; offset < assignmentSnap.docs.length; offset += 400) {
    const batch = writeBatch(db());
    assignmentSnap.docs.slice(offset, offset + 400).forEach((assignment) => {
      batch.update(assignment.ref, {
        title: updated.title,
        description: updated.description,
        type: updated.type,
        category: updated.category,
        folder: updated.folder,
        url: updated.url || "",
        storagePath: updated.storagePath || "",
        fileName: updated.fileName || "",
        mimeType: updated.mimeType || "",
        updatedAt: updated.updatedAt,
      });
    });
    await batch.commit();
  }

  if (replacement && resource.storagePath && resource.storagePath !== updated.storagePath) {
    await deleteObject(ref(storage(), resource.storagePath)).catch(() => undefined);
  }
  return updated;
}

export async function deleteLearningResource(resource: LearningResource): Promise<void> {
  const assignments = await getDocs(query(
    collection(db(), "resourceAssignments"),
    where("instructorId", "==", resource.instructorId),
    where("resourceId", "==", resource.id),
  ));
  for (let offset = 0; offset < assignments.docs.length; offset += 400) {
    const batch = writeBatch(db());
    assignments.docs.slice(offset, offset + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db(), "learningResources", resource.id));
  if (resource.storagePath) {
    await deleteObject(ref(storage(), resource.storagePath)).catch(() => undefined);
  }
}

export async function assignResourceToStudent(
  resource: LearningResource,
  studentId: string,
  options: { required: boolean; pinned: boolean },
): Promise<ResourceAssignment> {
  const assignmentId = `${resource.id}__${studentId}`;
  const assignmentRef = doc(db(), "resourceAssignments", assignmentId);
  const existing = await getDoc(assignmentRef);
  const now = Date.now();
  const body = {
    instructorId: resource.instructorId,
    studentId,
    resourceId: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    category: resource.category,
    folder: resource.folder,
    url: resource.url || "",
    storagePath: resource.storagePath || "",
    fileName: resource.fileName || "",
    mimeType: resource.mimeType || "",
    required: options.required,
    pinned: options.pinned,
    completed: existing.exists() ? bool(existing.data().completed) : false,
    completedAt: existing.exists() ? number(existing.data().completedAt) || null : null,
    assignedAt: existing.exists() ? number(existing.data().assignedAt, now) : now,
    updatedAt: now,
  };
  await setDoc(assignmentRef, body);
  return asAssignment(assignmentId, body);
}

export async function unassignResource(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db(), "resourceAssignments", assignmentId));
}

export async function getStudentAssignments(studentId: string): Promise<ResourceAssignment[]> {
  const snap = await getDocs(query(
    collection(db(), "resourceAssignments"),
    where("studentId", "==", studentId),
  ));
  return snap.docs
    .map((item) => asAssignment(item.id, item.data()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Number(b.required) - Number(a.required) || b.updatedAt - a.updatedAt);
}

export async function getInstructorAssignments(instructorId: string): Promise<ResourceAssignment[]> {
  const snap = await getDocs(query(
    collection(db(), "resourceAssignments"),
    where("instructorId", "==", instructorId),
  ));
  return snap.docs.map((item) => asAssignment(item.id, item.data()));
}

export async function setAssignmentCompleted(
  assignmentId: string,
  completed: boolean,
): Promise<void> {
  await updateDoc(doc(db(), "resourceAssignments", assignmentId), {
    completed,
    completedAt: completed ? Date.now() : null,
  });
}

export async function getAssignmentOpenUrl(assignment: ResourceAssignment): Promise<string> {
  if (assignment.url) return assignment.url;
  if (!assignment.storagePath) throw new Error("This resource has no file or link.");
  if (!firebaseFunctions) throw new Error("Resource downloads are unavailable.");
  const call = httpsCallable<{ assignmentId: string }, { url: string }>(
    firebaseFunctions,
    "getLearningResourceDownloadUrl",
  );
  const result = await call({ assignmentId: assignment.id });
  return result.data.url;
}

export async function getInstructorResourceOpenUrl(resource: LearningResource): Promise<string> {
  if (resource.url) return resource.url;
  if (!resource.storagePath) throw new Error("This resource has no file or link.");
  return getDownloadURL(ref(storage(), resource.storagePath));
}

export async function getLearningEntries(studentId: string): Promise<LearningEntry[]> {
  const snap = await getDocs(query(
    collection(db(), "learningEntries"),
    where("studentId", "==", studentId),
  ));
  return snap.docs
    .map((item) => asEntry(item.id, item.data()))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getInstructorLearningEntries(instructorId: string): Promise<LearningEntry[]> {
  const snap = await getDocs(query(
    collection(db(), "learningEntries"),
    where("instructorId", "==", instructorId),
  ));
  return snap.docs
    .map((item) => asEntry(item.id, item.data()))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveLearningEntry(
  instructorId: string,
  draft: LearningEntryDraft,
): Promise<LearningEntry> {
  const entryRef = draft.kind === "lesson_summary" && draft.lessonId
    ? doc(db(), "learningEntries", draft.lessonId)
    : doc(collection(db(), "learningEntries"));
  const existing = await getDoc(entryRef);
  const now = Date.now();
  const body = {
    instructorId,
    studentId: draft.studentId,
    lessonId: draft.lessonId || "",
    kind: draft.kind,
    title: draft.title.trim(),
    body: draft.body?.trim() || "",
    topicsCovered: draft.topicsCovered || [],
    areasToImprove: draft.areasToImprove?.trim() || "",
    homework: draft.homework?.trim() || "",
    skillsAchieved: draft.skillsAchieved || [],
    instructorComments: draft.instructorComments?.trim() || "",
    confidenceLevel: draft.confidenceLevel || null,
    nextObjectives: draft.nextObjectives?.trim() || "",
    createdAt: existing.exists() ? number(existing.data().createdAt, now) : now,
    updatedAt: now,
  };
  await setDoc(entryRef, body);
  return asEntry(entryRef.id, body);
}

export async function deleteLearningEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db(), "learningEntries", entryId));
}

export async function getStudentLearningProgress(
  instructorId: string,
  studentId: string,
): Promise<StudentLearningProgress> {
  const progressId = `${instructorId}__${studentId}`;
  const snap = await getDoc(doc(db(), "studentLearningProgress", progressId));
  if (!snap.exists()) {
    return {
      id: progressId,
      instructorId,
      studentId,
      topics: DEFAULT_DRIVING_TOPICS.map((topic) => ({ ...topic })),
      overallPercent: 0,
      updatedAt: 0,
    };
  }
  const data = snap.data();
  const topics = Array.isArray(data.topics)
    ? data.topics
      .filter((item: unknown) => item && typeof item === "object")
      .map((item: Record<string, unknown>) => ({
        id: text(item.id),
        label: text(item.label),
        status: text(item.status, "not_started") as LearningTopic["status"],
        updatedAt: number(item.updatedAt) || undefined,
      }))
      .filter((item: LearningTopic) => item.id && item.label)
    : DEFAULT_DRIVING_TOPICS.map((topic) => ({ ...topic }));
  return {
    id: progressId,
    instructorId,
    studentId,
    topics,
    overallPercent: number(data.overallPercent),
    updatedAt: number(data.updatedAt),
  };
}

export async function saveStudentLearningTopics(
  instructorId: string,
  studentId: string,
  topics: LearningTopic[],
): Promise<StudentLearningProgress> {
  const now = Date.now();
  const completed = topics.filter((topic) => topic.status === "completed").length;
  const inProgress = topics.filter((topic) => topic.status === "in_progress").length;
  const overallPercent = topics.length
    ? Math.round(((completed + inProgress * 0.5) / topics.length) * 100)
    : 0;
  const result: StudentLearningProgress = {
    id: `${instructorId}__${studentId}`,
    instructorId,
    studentId,
    topics,
    overallPercent,
    updatedAt: now,
  };
  await setDoc(doc(db(), "studentLearningProgress", result.id), result);
  return result;
}

export function createCustomLearningTopic(label: string): LearningTopic {
  return { id: `${topicId(label)}_${Date.now().toString(36)}`, label: label.trim(), status: "not_started" };
}

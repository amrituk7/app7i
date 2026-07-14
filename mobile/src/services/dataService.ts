import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { firebaseAuth, firebaseFunctions, firestore } from "./firebase";
import type {
  CarDetails,
  Lesson,
  LessonPayment,
  MockTest,
  PaymentMethod,
  PaymentStatus,
  Student,
  TestResult,
  Tip,
  TipType,
} from "../types";

export type StudentSkillAggregate = {
  key: string;
  label: string;
  averageRating: number;
  percent: number;
  lessonsRated: number;
};

export type InstructorPublicProfile = {
  uid: string;
  name: string;
  areas: string;
  transmission: string;
  email: string;
  phone: string;
  yearsQualified: number;
  adiApproved: boolean;
  weekdayRate: number;
  sundayRate: number;
  testDayFee: number;
};

export type InstructorProfileTransmission = "manual" | "automatic" | "both";

export type InstructorProfile = {
  uid?: string;
  username: string;
  name: string;
  location: string;
  transmissions: InstructorProfileTransmission;
  rating: number | string;
  hourlyRate: number | string;
  // Credentials
  yearsQualified?: number | string;
  adiApproved?: boolean;
  // Real rates (weekdayRate is the primary/flat rate; mirrors hourlyRate)
  weekdayRate?: number | string;
  sundayRate?: number | string;
  testDayFee?: number | string;
};

export type StudentWriteData = {
  name: string;
  phone: string;
  email: string;
  transmission: Student["transmission"];
  language?: string;
  practiceFocus?: string;
  practiceTips?: string;
};

const skillLabels: Record<string, string> = {
  cockpitChecks: "Cockpit checks",
  movingOff: "Moving off and stopping",
  mirrors: "Mirrors and signals",
  useOfSpeed: "Use of speed",
  junctions: "Junctions and emerging",
  roundabouts: "Roundabouts",
  pedestrianCrossings: "Pedestrian crossings",
  positioning: "Position and lane discipline",
  awareness: "Awareness and planning",
  dualCarriageways: "Dual carriageways",
  independentDriving: "Independent driving",
  parallelParking: "Parallel parking",
  forwardParking: "Forward bay parking",
  reverseParking: "Reverse bay parking",
  // Legacy keys — kept so older lesson docs still display sensibly
  parking: "Parking",
  maneuvers: "Other maneuvers",
};

// DVSA category map — used by the Road-to-License gamified view to group
// related skills into "laps" the student can clear.
export const SKILL_CATEGORY_ORDER = [
  "Vehicle controls",
  "Observations",
  "Control",
  "Junctions",
  "Hazards",
  "Open road",
  "Manoeuvres",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORY_ORDER)[number];

const skillCategory: Record<string, SkillCategory> = {
  cockpitChecks: "Vehicle controls",
  movingOff: "Vehicle controls",
  mirrors: "Observations",
  useOfSpeed: "Control",
  junctions: "Junctions",
  roundabouts: "Junctions",
  pedestrianCrossings: "Hazards",
  positioning: "Hazards",
  awareness: "Hazards",
  dualCarriageways: "Open road",
  independentDriving: "Open road",
  parallelParking: "Manoeuvres",
  forwardParking: "Manoeuvres",
  reverseParking: "Manoeuvres",
  // legacy
  parking: "Manoeuvres",
  maneuvers: "Manoeuvres",
};

export function categoryForSkill(key: string): SkillCategory {
  return skillCategory[key] || "Control";
}

function db() {
  if (!firestore) throw new Error("Firestore not configured.");
  return firestore;
}

function todayStr() {
  // sv-SE locale produces YYYY-MM-DD in London timezone, matching lesson date storage format
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London" }).format(new Date());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textField(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function currentUid() {
  const uid = firebaseAuth?.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function currentEmail() {
  return firebaseAuth?.currentUser?.email?.trim().toLowerCase() || "";
}

function normalizeTransmission(value: unknown): Student["transmission"] {
  return value === "automatic" || value === "auto" ? "automatic" : "manual";
}

function normalizeProfileTransmission(value: unknown): InstructorProfileTransmission {
  if (value === "manual" || value === "automatic" || value === "both") return value;
  return "both";
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function cleanStudentWriteData(data: StudentWriteData) {
  return {
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    transmission: normalizeTransmission(data.transmission),
    language: data.language?.trim() || "",
    practiceFocus: data.practiceFocus?.trim() || "",
    practiceTips: data.practiceTips?.trim() || "",
  };
}

function friendlySkillLabel(key: string) {
  if (skillLabels[key]) return skillLabels[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function readNumericRating(value: unknown): number | null {
  const rawValue = isRecord(value)
    ? value.rating ?? value.value ?? value.score ?? value.level
    : value;
  const numeric = typeof rawValue === "number" || typeof rawValue === "string"
    ? Number(rawValue)
    : Number.NaN;

  if (Number.isNaN(numeric)) return null;
  const normalized = numeric > 5 && numeric <= 100 ? numeric / 20 : numeric;
  return Math.min(5, Math.max(0, normalized));
}

function readReviewSkillRatings(review: unknown): Record<string, number> {
  if (!isRecord(review)) return {};
  const rawSkills = review.skills;
  const ratings: Record<string, number> = {};

  if (Array.isArray(rawSkills)) {
    rawSkills.forEach((item) => {
      if (!isRecord(item)) return;
      const key = typeof item.key === "string"
        ? item.key
        : typeof item.name === "string"
          ? item.name
          : "";
      const rating = readNumericRating(item);
      if (key && rating !== null) ratings[key] = rating;
    });
    return ratings;
  }

  if (isRecord(rawSkills)) {
    Object.entries(rawSkills).forEach(([key, value]) => {
      const rating = readNumericRating(value);
      if (rating !== null) ratings[key] = rating;
    });
  }

  return ratings;
}

function readReviewSkillNotes(review: unknown): Record<string, string> {
  if (!isRecord(review)) return {};
  const raw = review.skillNotes;
  if (!isRecord(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim().slice(0, 500);
    }
  }
  return out;
}

function lessonNotes(data: DocumentData) {
  const review = isRecord(data.review) ? data.review : {};
  const reviewNotes = [
    textField(review, "notes"),
    textField(review, "strengths"),
    textField(review, "focusNext"),
    textField(review, "homework"),
  ].filter(Boolean);

  return textField(data, "notes", "lessonNotes") || reviewNotes.join("\n") || undefined;
}

function asInstructorProfile(uid: string, data: DocumentData): InstructorPublicProfile {
  const num = (value: unknown) => (Number(value) > 0 ? Number(value) : 0);
  return {
    uid,
    name: textField(data, "name", "displayName", "businessName", "schoolName") || "Your instructor",
    areas: textField(data, "areas", "teachingAreas", "area", "location") || "Teaching area to confirm",
    transmission: textField(data, "transmissions", "transmission") || "Transmission to confirm",
    email: textField(data, "contactEmail", "email"),
    phone: textField(data, "contactPhone", "phone"),
    yearsQualified: num(data.yearsQualified),
    adiApproved: data.adiApproved === true,
    weekdayRate: num(data.weekdayRate ?? data.hourlyRate),
    sundayRate: num(data.sundayRate),
    testDayFee: num(data.testDayFee),
  };
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  if (["paid", "cash", "card", "bank", "package"].includes(String(value))) return "paid";
  if (value === "waived") return "waived";
  if (value === "unpaid" || value === "not_paid" || value === "overdue") return "unpaid";
  return "pending";
}

function normalizePaymentMethod(value: unknown, statusValue?: unknown): PaymentMethod {
  const candidate = value || statusValue;
  return candidate === "cash" || candidate === "card" || candidate === "bank" || candidate === "package"
    ? candidate
    : null;
}

function asLesson(id: string, data: DocumentData): Lesson {
  return {
    id,
    instructorId: data.instructorId || undefined,
    studentId: data.studentId || "",
    studentName: data.studentName || "Student",
    date: data.date || "",
    time: data.time || "",
    durationMinutes: Math.round((Number(data.duration) || 1) * 60),
    pickup: data.pickup || data.location || "",
    status: (data.review?.status as Lesson["status"]) || "scheduled",
    paymentStatus: normalizePaymentStatus(data.review?.paymentStatus),
    paymentMethod: normalizePaymentMethod(data.review?.paymentMethod, data.review?.paymentStatus),
    price: Number(data.price || data.rateApplied) || 0,
    notes: lessonNotes(data),
    skillRatings: readReviewSkillRatings(data.review),
    skillNotes: readReviewSkillNotes(data.review),
    recurringGroupId: textField(data, "recurringGroupId") || undefined,
    recurringIndex:
      typeof data.recurringIndex === "number" ? data.recurringIndex : undefined,
    recurringWeeks:
      typeof data.recurringWeeks === "number" ? data.recurringWeeks : undefined,
  };
}

function asStudent(id: string, data: DocumentData): Student {
  return {
    id,
    uid: textField(data, "uid") || undefined,
    instructorId: textField(data, "instructorId") || undefined,
    name: data.name || "Unnamed",
    phone: data.phone || "",
    email: data.email || "",
    language: textField(data, "language") || undefined,
    practiceFocus: textField(data, "practiceFocus") || undefined,
    practiceTips: textField(data, "practiceTips") || undefined,
    nextLesson: data.nextLessonDate || "",
    progress: Number(data.progressPercent) || 0,
    testDate: data.testDate || undefined,
    outstandingBalance: Number(data.outstandingBalance) || 0,
    transmission: normalizeTransmission(data.transmission),
    // ----- Test readiness -----
    theoryPassed: typeof data.theoryPassed === "boolean" ? data.theoryPassed : undefined,
    theoryTestDate: textField(data, "theoryTestDate") || undefined,
    practicalTestDate: textField(data, "practicalTestDate") || undefined,
    practicalTestTime: textField(data, "practicalTestTime") || undefined,
    testCentre: textField(data, "testCentre") || undefined,
    testBookingFee: typeof data.testBookingFee === "number" ? data.testBookingFee : undefined,
    testBookingRef: textField(data, "testBookingRef") || undefined,
    testCandidateNumber: textField(data, "testCandidateNumber") || undefined,
    testBookingPaid: typeof data.testBookingPaid === "boolean" ? data.testBookingPaid : undefined,
    practicalTestStatus:
      data.practicalTestStatus === "completed" || data.practicalTestStatus === "cancelled"
        ? data.practicalTestStatus
        : "upcoming",
    testMeetingLocation: textField(data, "testMeetingLocation") || undefined,
    testVehicle: textField(data, "testVehicle") || undefined,
    practicalTestNotes: textField(data, "practicalTestNotes") || undefined,
    testResult:
      data.testResult === "pass" || data.testResult === "fail" ? data.testResult : null,
    testFaults: isRecord(data.testFaults)
      ? {
          minor: Number(data.testFaults.minor) || 0,
          serious: Number(data.testFaults.serious) || 0,
          dangerous: Number(data.testFaults.dangerous) || 0,
        }
      : undefined,
    mockTests: Array.isArray(data.mockTests)
      ? data.mockTests
          .filter((m: unknown) => isRecord(m))
          .map((m): MockTest => {
            const obj = m as Record<string, unknown>;
            const faults = isRecord(obj.faults) ? obj.faults : {};
            return {
              id: typeof obj.id === "string" ? obj.id : String(obj.id || Math.random()),
              date: typeof obj.date === "string" ? obj.date : "",
              faults: {
                minor: Number((faults as Record<string, unknown>).minor) || 0,
                serious: Number((faults as Record<string, unknown>).serious) || 0,
                dangerous: Number((faults as Record<string, unknown>).dangerous) || 0,
              },
              instructorNote:
                typeof obj.instructorNote === "string" ? obj.instructorNote : undefined,
            };
          })
      : undefined,
    readinessScore:
      typeof data.readinessScore === "number" ? data.readinessScore : undefined,
  };
}

function asLessonPayment(id: string, lesson: DocumentData): LessonPayment {
  const rawStatus = lesson.review?.paymentStatus;
  return {
    id,
    studentName: lesson.studentName || "Student",
    studentId: typeof lesson.studentId === "string" ? lesson.studentId : undefined,
    amount: Number(lesson.price || lesson.rateApplied) || 0,
    status: normalizePaymentStatus(rawStatus),
    method: normalizePaymentMethod(lesson.review?.paymentMethod, rawStatus),
    lessonDate: lesson.date || "",
    lessonTime: typeof lesson.time === "string" ? lesson.time : undefined,
    lessonStatus: lesson.review?.status === "completed" || lesson.review?.status === "cancelled"
      ? lesson.review.status
      : "scheduled",
    reminderSentAt: typeof lesson.review?.paymentReminderLastSentAt === "number"
      ? lesson.review.paymentReminderLastSentAt
      : undefined,
    reminderCount: Number(lesson.review?.paymentReminderCount) || 0,
  };
}

async function runQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  mapper: (id: string, data: DocumentData) => T,
): Promise<T[]> {
  const q = query(collection(db(), collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapper(d.id, d.data()));
}

/** Lessons for a specific date (YYYY-MM-DD), ordered by time. */
export async function getLessonsByDate(instructorUid: string, date: string): Promise<Lesson[]> {
  return runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      where("date", "==", date),
      orderBy("time", "asc"),
    ],
    asLesson,
  );
}

/** Lessons across a date range (inclusive). Used for week/month view. */
export async function getLessonsInRange(
  instructorUid: string,
  fromDate: string,
  toDate: string,
): Promise<Lesson[]> {
  return runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      where("date", ">=", fromDate),
      where("date", "<=", toDate),
      orderBy("date", "asc"),
      orderBy("time", "asc"),
    ],
    asLesson,
  );
}

export async function getTodayLessons(instructorUid: string): Promise<Lesson[]> {
  return runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      where("date", "==", todayStr()),
      orderBy("time", "asc"),
    ],
    asLesson,
  );
}

export async function getUpcomingLessons(instructorUid: string, max = 20): Promise<Lesson[]> {
  return runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      where("date", ">=", todayStr()),
      orderBy("date", "asc"),
      orderBy("time", "asc"),
      fsLimit(max),
    ],
    asLesson,
  );
}

export async function getInstructorLessons(instructorUid: string, max = 500): Promise<Lesson[]> {
  return runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      orderBy("date", "desc"),
      fsLimit(max),
    ],
    asLesson,
  );
}

export async function getStudents(instructorUid: string, max = 100): Promise<Student[]> {
  return runQuery(
    "students",
    [
      where("instructorId", "==", instructorUid),
      orderBy("name", "asc"),
      fsLimit(max),
    ],
    asStudent,
  );
}

export async function getUpcomingTests(instructorUid: string): Promise<Student[]> {
  const today = todayStr();
  const all = await getStudents(instructorUid, 200);
  return all
    .filter((s) =>
      !!s.practicalTestDate &&
      s.practicalTestDate >= today &&
      s.testResult === null &&
      s.practicalTestStatus !== "cancelled" &&
      s.practicalTestStatus !== "completed"
    )
    .sort((a, b) => (a.practicalTestDate ?? "").localeCompare(b.practicalTestDate ?? ""));
}

export async function createStudent(data: StudentWriteData): Promise<string> {
  const instructorId = currentUid();
  const payload = cleanStudentWriteData(data);
  const ref = await addDoc(collection(db(), "students"), {
    ...payload,
    instructorId,
    progressPercent: 0,
    outstandingBalance: 0,
    nextLessonDate: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getStudent(studentId: string): Promise<Student | null> {
  const snap = await getDoc(doc(db(), "students", studentId));
  if (!snap.exists()) return null;
  return asStudent(snap.id, snap.data());
}

export async function updateStudent(studentId: string, data: StudentWriteData): Promise<void> {
  await updateDoc(doc(db(), "students", studentId), {
    ...cleanStudentWriteData(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudent(studentId: string): Promise<void> {
  const instructorId = currentUid();
  const store = db();

  // Fetch related docs in parallel before batching deletes.
  // Messages: query broadly by instructorId then filter client-side so legacy
  // docs without a studentId field are also swept up.
  const [lessonsSnap, msgsSnap, waitingSnap] = await Promise.all([
    getDocs(query(
      collection(store, "lessons"),
      where("studentId", "==", studentId),
      where("instructorId", "==", instructorId),
    )),
    getDocs(query(
      collection(store, "messages"),
      where("instructorId", "==", instructorId),
    )),
    getDocs(query(
      collection(store, "waitingList"),
      where("instructorId", "==", instructorId),
      where("studentId", "==", studentId),
    )),
  ]);

  const messageTargets = msgsSnap.docs.filter((d) => {
    const data = d.data();
    const sid = String(data.studentId || "");
    const sender = String(data.sender || "");
    const receiver = String(data.receiver || "");
    return sid === studentId || sender === studentId || receiver === studentId;
  });

  const toDelete = [...lessonsSnap.docs, ...messageTargets, ...waitingSnap.docs];
  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = writeBatch(store);
    toDelete.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(doc(store, "students", studentId));
}

// ---------------- Test readiness writers ----------------

export type TestReadinessUpdate = Partial<{
  theoryPassed: boolean;
  theoryTestDate: string;
  practicalTestDate: string;
  practicalTestTime: string;
  testCentre: string;
  testBookingFee: number | null;
  testBookingRef: string;
  testCandidateNumber: string;
  testBookingPaid: boolean;
  practicalTestStatus: "upcoming" | "completed" | "cancelled";
  testMeetingLocation: string;
  testVehicle: string;
  practicalTestNotes: string;
  testResult: TestResult;
  testFaults: { minor: number; serious: number; dangerous: number };
  readinessScore: number;
}>;

/** Patch the test-readiness fields on a student doc. Empty strings clear the
 *  date fields so the instructor can remove a booked-but-rescheduled date. */
export async function updateStudentTestReadiness(
  studentId: string,
  update: TestReadinessUpdate,
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if ("theoryPassed" in update) payload.theoryPassed = Boolean(update.theoryPassed);
  if ("theoryTestDate" in update) payload.theoryTestDate = update.theoryTestDate || null;
  if ("practicalTestDate" in update) payload.practicalTestDate = update.practicalTestDate || null;
  if ("practicalTestTime" in update) payload.practicalTestTime = (update.practicalTestTime || "").trim() || null;
  if ("testCentre" in update) payload.testCentre = (update.testCentre || "").trim() || null;
  if ("testBookingFee" in update) {
    const fee = update.testBookingFee;
    payload.testBookingFee = typeof fee === "number" && fee > 0 ? fee : null;
  }
  if ("testBookingRef" in update) payload.testBookingRef = (update.testBookingRef || "").trim() || null;
  if ("testCandidateNumber" in update) {
    payload.testCandidateNumber = (update.testCandidateNumber || "").trim().toUpperCase() || null;
  }
  if ("testBookingPaid" in update) payload.testBookingPaid = Boolean(update.testBookingPaid);
  if ("practicalTestStatus" in update) payload.practicalTestStatus = update.practicalTestStatus || "upcoming";
  if ("testMeetingLocation" in update) payload.testMeetingLocation = (update.testMeetingLocation || "").trim() || null;
  if ("testVehicle" in update) payload.testVehicle = (update.testVehicle || "").trim() || null;
  if ("practicalTestNotes" in update) payload.practicalTestNotes = (update.practicalTestNotes || "").trim() || null;
  if ("testResult" in update) payload.testResult = update.testResult || null;
  if ("testFaults" in update) {
    payload.testFaults = update.testFaults
      ? {
          minor: Math.max(0, Math.round(Number(update.testFaults.minor) || 0)),
          serious: Math.max(0, Math.round(Number(update.testFaults.serious) || 0)),
          dangerous: Math.max(0, Math.round(Number(update.testFaults.dangerous) || 0)),
        }
      : null;
  }
  if ("readinessScore" in update) {
    const n = Math.max(0, Math.min(10, Math.round(Number(update.readinessScore) || 0)));
    payload.readinessScore = n;
  }
  await updateDoc(doc(db(), "students", studentId), payload);
}

export async function addMockTest(
  studentId: string,
  mock: Omit<MockTest, "id"> & { id?: string },
  existing: MockTest[] = [],
): Promise<MockTest> {
  const next: MockTest = {
    id: mock.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: mock.date || new Date().toISOString().slice(0, 10),
    faults: {
      minor: Math.max(0, Math.round(Number(mock.faults?.minor) || 0)),
      serious: Math.max(0, Math.round(Number(mock.faults?.serious) || 0)),
      dangerous: Math.max(0, Math.round(Number(mock.faults?.dangerous) || 0)),
    },
    instructorNote: mock.instructorNote?.trim() || undefined,
  };
  const updated = [...existing, next].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  await updateDoc(doc(db(), "students", studentId), {
    mockTests: updated,
    updatedAt: serverTimestamp(),
  });
  return next;
}

export async function removeMockTest(
  studentId: string,
  mockId: string,
  existing: MockTest[],
): Promise<void> {
  const updated = existing.filter((m) => m.id !== mockId);
  await updateDoc(doc(db(), "students", studentId), {
    mockTests: updated,
    updatedAt: serverTimestamp(),
  });
}

export type LessonWriteData = {
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  durationHours: number;
  pickup: string;
  price: number;
  notes?: string;
  transmission?: Student["transmission"];
  lessonType?: "normal" | "test-day";
};

export async function createLesson(data: LessonWriteData): Promise<string> {
  const instructorId = currentUid();
  const ref = await addDoc(collection(db(), "lessons"), {
    studentId: data.studentId,
    studentName: data.studentName,
    date: data.date,
    time: data.time,
    duration: data.durationHours,
    pickup: data.pickup.trim(),
    price: data.price,
    rateApplied: data.price,
    notes: data.notes?.trim() || "",
    transmission: data.transmission || "manual",
    lessonType: data.lessonType || "normal",
    instructorId,
    timestamp: serverTimestamp(),
    review: { status: "scheduled", paymentStatus: "pending" },
  });
  return ref.id;
}

// ---------------- Recurring lesson series ----------------

function shiftDateByDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function newRecurringGroupId(): string {
  return `rg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Build the list of dates a recurring series would land on, BEFORE writing
 * anything. Used by the BookLesson UI to preview occurrences and let the
 * instructor mark holidays/exceptions to skip.
 */
export function previewRecurringDates(startDate: string, weeks: number): string[] {
  const total = Math.max(1, Math.min(52, Math.round(weeks)));
  return Array.from({ length: total }, (_, i) => shiftDateByDays(startDate, 7 * i));
}

/**
 * Create N weekly-recurring lessons. Each occurrence is a separate Firestore
 * doc — no joins needed at read time. They share `recurringGroupId` so we can
 * bulk-edit/cancel later.
 *
 * `skipDates` — any ISO dates in this list are dropped from the series.
 * The `recurringIndex` numbering uses the ORIGINAL position so "5 of 12"
 * stays meaningful even if some are skipped (5 might be missing — that's
 * the point).
 *
 * Returns the array of created lesson ids in order.
 */
export async function createRecurringLessons(
  seed: LessonWriteData,
  weeks: number,
  skipDates: string[] = [],
): Promise<{ groupId: string; lessonIds: string[]; skipped: number }> {
  const totalWeeks = Math.max(1, Math.min(52, Math.round(weeks)));
  const skipSet = new Set(skipDates);
  const groupId = newRecurringGroupId();
  const instructorId = currentUid();
  const lessonIds: string[] = [];
  let skipped = 0;

  for (let i = 0; i < totalWeeks; i++) {
    const date = i === 0 ? seed.date : shiftDateByDays(seed.date, 7 * i);
    if (skipSet.has(date)) {
      skipped += 1;
      continue;
    }
    const ref = await addDoc(collection(db(), "lessons"), {
      studentId: seed.studentId,
      studentName: seed.studentName,
      date,
      time: seed.time,
      duration: seed.durationHours,
      pickup: seed.pickup.trim(),
      price: seed.price,
      rateApplied: seed.price,
      notes: seed.notes?.trim() || "",
      transmission: seed.transmission || "manual",
      lessonType: seed.lessonType || "normal",
      instructorId,
      timestamp: serverTimestamp(),
      review: { status: "scheduled", paymentStatus: "pending" },
      recurringGroupId: groupId,
      recurringIndex: i + 1,
      recurringWeeks: totalWeeks,
    });
    lessonIds.push(ref.id);
  }

  return { groupId, lessonIds, skipped };
}

export type SeriesScope = "this" | "future" | "all";

/**
 * Cancel one, future, or all lessons in a recurring series. "Cancelling" sets
 * `review.status: cancelled` rather than hard-deleting so payment audits stay
 * intact and feedback summaries can still reference the lesson id.
 *
 * `pivotLessonId` is required for scope === "future" — we cancel everything
 * with `recurringIndex >= pivot.recurringIndex`.
 */
export async function cancelLessonSeries(
  groupId: string,
  scope: SeriesScope,
  pivotLessonId?: string,
): Promise<number> {
  const q = query(
    collection(db(), "lessons"),
    where("recurringGroupId", "==", groupId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  let pivotIndex = 0;
  if (scope === "future") {
    if (!pivotLessonId) throw new Error("Future scope requires pivotLessonId.");
    const pivotDoc = snap.docs.find((d) => d.id === pivotLessonId);
    pivotIndex = Number(pivotDoc?.data().recurringIndex || 0);
  }

  const targets = snap.docs.filter((d) => {
    if (scope === "all") return true;
    if (scope === "this") return d.id === pivotLessonId;
    if (scope === "future") return Number(d.data().recurringIndex || 0) >= pivotIndex;
    return false;
  });

  for (let i = 0; i < targets.length; i += 400) {
    const chunk = targets.slice(i, i + 400);
    const batch = writeBatch(db());
    chunk.forEach((d) =>
      batch.update(d.ref, {
        "review.status": "cancelled",
        "review.cancelledAt": serverTimestamp(),
        "review.cancelledBy": "instructor_recurring",
      }),
    );
    await batch.commit();
  }
  return targets.length;
}

/**
 * Patch fields on every lesson in the series matching the scope.
 * Use this for "every Tuesday at 4pm → move all to 5pm" type bulk edits.
 *
 * Refuses to patch the date field — that would shift the schedule and is
 * better done by cancelling + re-creating the series.
 */
export async function updateLessonSeries(
  groupId: string,
  patch: Partial<Pick<LessonWriteData, "time" | "durationHours" | "pickup" | "price" | "notes">>,
  scope: SeriesScope,
  pivotLessonId?: string,
): Promise<number> {
  if (Object.keys(patch).length === 0) return 0;

  const q = query(
    collection(db(), "lessons"),
    where("recurringGroupId", "==", groupId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  let pivotIndex = 0;
  if (scope === "future") {
    if (!pivotLessonId) throw new Error("Future scope requires pivotLessonId.");
    const pivotDoc = snap.docs.find((d) => d.id === pivotLessonId);
    pivotIndex = Number(pivotDoc?.data().recurringIndex || 0);
  }

  const targets = snap.docs.filter((d) => {
    if (scope === "all") return true;
    if (scope === "this") return d.id === pivotLessonId;
    if (scope === "future") return Number(d.data().recurringIndex || 0) >= pivotIndex;
    return false;
  });

  const writePayload: Record<string, unknown> = {};
  if (patch.time !== undefined) writePayload.time = patch.time;
  if (patch.durationHours !== undefined) writePayload.duration = patch.durationHours;
  if (patch.pickup !== undefined) writePayload.pickup = patch.pickup.trim();
  if (patch.price !== undefined) {
    writePayload.price = patch.price;
    writePayload.rateApplied = patch.price;
  }
  if (patch.notes !== undefined) writePayload.notes = patch.notes.trim();

  for (let i = 0; i < targets.length; i += 400) {
    const chunk = targets.slice(i, i + 400);
    const batch = writeBatch(db());
    chunk.forEach((d) => batch.update(d.ref, writePayload));
    await batch.commit();
  }
  return targets.length;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await deleteDoc(doc(db(), "lessons", lessonId));
}

export async function getOpenLessonPayments(instructorUid: string, max = 50): Promise<LessonPayment[]> {
  const todayIso = todayStr();
  const lessons = await runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      orderBy("date", "desc"),
      fsLimit(max * 3),
    ],
    (id, data) => ({ id, data }),
  );
  return lessons
    .map(({ id, data }) => asLessonPayment(id, data))
    .filter((payment) =>
      payment.lessonDate <= todayIso
      && payment.lessonStatus !== "cancelled"
      && (payment.status === "pending" || payment.status === "unpaid"),
    )
    .slice(0, max);
}

export async function getPaidLessonPayments(instructorUid: string, max = 50): Promise<LessonPayment[]> {
  const lessons = await runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      orderBy("date", "desc"),
      fsLimit(max * 3),
    ],
    (id, data) => ({ id, data }),
  );
  return lessons
    .map(({ id, data }) => asLessonPayment(id, data))
    .filter((payment) => payment.lessonStatus !== "cancelled" && payment.status === "paid")
    .slice(0, max);
}

export async function getLessonPayments(instructorUid: string, max = 100): Promise<LessonPayment[]> {
  // Payment records are derived from lessons. Future bookings remain in the
  // calendar until their lesson date is ready for payment review.
  // (We use the lesson's own `date` field — instructor-local YYYY-MM-DD.)
  const todayIso = todayStr();
  return runQuery(
    "lessons",
    [
      where("instructorId", "==", instructorUid),
      where("date", "<=", todayIso),
      orderBy("date", "desc"),
      fsLimit(max),
    ],
    asLessonPayment,
  ).then((payments) => payments.filter((payment) => payment.lessonStatus !== "cancelled"));
}

/** For the student portal, read the student doc by uid or claim an unlinked email match. */
export async function getStudentByUid(uid: string): Promise<Student | null> {
  const uidQuery = query(collection(db(), "students"), where("uid", "==", uid), fsLimit(1));
  const uidSnap = await getDocs(uidQuery);
  if (!uidSnap.empty) {
    const match = uidSnap.docs[0];
    return asStudent(match.id, match.data());
  }

  const email = currentEmail();
  if (!email) return null;

  const emailQuery = query(collection(db(), "students"), where("email", "==", email), fsLimit(1));
  const emailSnap = await getDocs(emailQuery);
  if (emailSnap.empty) return null;

  const match = emailSnap.docs[0];
  const data = match.data();
  if (textField(data, "uid")) return null;

  await updateDoc(doc(db(), "students", match.id), {
    uid,
    linkedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return asStudent(match.id, { ...data, uid });
}

/** Load a single lesson by id. Returns null if not found. */
export async function getLesson(lessonId: string): Promise<Lesson | null> {
  const ref = doc(db(), "lessons", lessonId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return asLesson(snap.id, snap.data());
}

// ------------------------------------------------------------
// Lesson feedback (anonymous, student-only writes)
// Doc ID format: `${lessonId}__${studentUid}` so Firestore rules can match
// ownership without storing studentUid in the body.
// ------------------------------------------------------------
export type LessonFeedbackPayload = {
  lessonId: string;
  instructorId: string;
  rating: number;
  positiveText: string;
  constructiveText: string;
  wantsMore: string[];
};

export type LessonFeedbackRecord = LessonFeedbackPayload & {
  id: string;
  createdAt?: number;
  updatedAt?: number;
};

function lessonFeedbackDocId(lessonId: string, studentUid: string): string {
  return `${lessonId}__${studentUid}`;
}

export async function getMyLessonFeedback(
  lessonId: string,
  studentUid: string,
): Promise<LessonFeedbackRecord | null> {
  if (!lessonId || !studentUid) return null;
  const ref = doc(db(), "lessonFeedback", lessonFeedbackDocId(lessonId, studentUid));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<LessonFeedbackRecord, "id">;
  return { id: snap.id, ...data };
}

// Calendar sync: per-instructor iCal feed token. Server-generated.
export async function ensureCalendarToken(
  rotate = false,
): Promise<{ ok: boolean; token?: string; url?: string }> {
  if (!firebaseFunctions) return { ok: false };
  const { httpsCallable } = await import("firebase/functions");
  const callable = httpsCallable(firebaseFunctions, "ensureCalendarToken");
  const result = await callable({ rotate: !!rotate });
  return (result?.data as { ok: boolean; token?: string; url?: string }) || { ok: false };
}

export type InstructorFeedbackSummary = {
  id: string;
  instructorId: string;
  averageRating: number;
  basedOnCount: number;
  liked: string;
  wantMore: string;
  suggestion: string;
  generatedAt: number;
};

/** Latest aggregated summary for an instructor (Phase 3). Null until 10
 *  responses have accumulated. */
export async function getLatestFeedbackSummary(
  instructorUid: string,
): Promise<InstructorFeedbackSummary | null> {
  if (!instructorUid) return null;
  const q = query(
    collection(db(), "instructorFeedbackSummaries"),
    where("instructorId", "==", instructorUid),
    orderBy("generatedAt", "desc"),
    fsLimit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const data = docSnap.data() as Omit<InstructorFeedbackSummary, "id">;
  return { id: docSnap.id, ...data };
}

export async function submitLessonFeedback(
  payload: LessonFeedbackPayload & { studentUid: string },
): Promise<{ ok: true; id: string }> {
  const { lessonId, studentUid, instructorId } = payload;
  if (!lessonId || !studentUid || !instructorId) {
    throw new Error("submitLessonFeedback requires lessonId, studentUid, instructorId");
  }
  const id = lessonFeedbackDocId(lessonId, studentUid);
  const ref = doc(db(), "lessonFeedback", id);
  const existing = await getDoc(ref);

  const body: Record<string, unknown> = {
    lessonId,
    instructorId,
    rating: Math.max(1, Math.min(5, Math.round(Number(payload.rating) || 0))),
    positiveText: String(payload.positiveText || "").trim().slice(0, 1000),
    constructiveText: String(payload.constructiveText || "").trim().slice(0, 1000),
    wantsMore: Array.isArray(payload.wantsMore)
      ? payload.wantsMore.slice(0, 10).map((w) => String(w).slice(0, 60))
      : [],
    updatedAt: Date.now(),
  };
  if (!existing.exists()) {
    body.createdAt = Date.now();
  }
  await setDoc(ref, body);
  return { ok: true, id };
}

/** Mark a lesson as paid (sets review.paymentStatus = "paid"). */
export async function markLessonPaid(
  lessonId: string,
  method: "cash" | "card" | "bank" = "cash",
): Promise<void> {
  return setLessonPaymentStatus(lessonId, "paid", method);
}

/**
 * Single entry point for the post-lesson payment review. Payment status and
 * method are stored separately so reports remain consistent.
 */
export async function setLessonPaymentStatus(
  lessonId: string,
  status: PaymentStatus,
  method: PaymentMethod = null,
): Promise<void> {
  const ref = doc(db(), "lessons", lessonId);
  const paidMethod = status === "paid" ? method : null;
  const update: Record<string, unknown> = {
    "review.paymentStatus": status,
    "review.paymentMethod": paidMethod,
    "review.paymentMarkedBy": firebaseAuth?.currentUser?.uid || null,
    "review.paymentMarkedAt": Date.now(),
    "review.paidAt": status === "paid" ? serverTimestamp() : null,
    "review.waivedAt": status === "waived" ? serverTimestamp() : null,
  };
  await updateDoc(ref, update);
}

/** Update lesson notes (instructor-side). */
export async function updateLessonNotes(lessonId: string, notes: string): Promise<void> {
  const ref = doc(db(), "lessons", lessonId);
  await updateDoc(ref, { notes });
}

/** Update lesson date/time/duration/pickup/price. */
export async function updateLesson(
  lessonId: string,
  data: Partial<{
    date: string;
    time: string;
    durationHours: number;
    pickup: string;
    price: number;
    notes: string;
  }>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.date !== undefined) payload.date = data.date;
  if (data.time !== undefined) payload.time = data.time;
  if (data.durationHours !== undefined) payload.duration = data.durationHours;
  if (data.pickup !== undefined) payload.pickup = data.pickup.trim();
  if (data.price !== undefined) {
    payload.price = data.price;
    payload.rateApplied = data.price;
  }
  if (data.notes !== undefined) payload.notes = data.notes.trim();
  payload.updatedAt = serverTimestamp();
  await updateDoc(doc(db(), "lessons", lessonId), payload);
}

export type LessonAttendance = "pending" | "attended" | "noshow" | "cancelled";

/** Mark whether the lesson actually happened. Used to track no-shows so we
 * can show instructors what they're costing — and tune reminder timings. */
export async function setLessonAttendance(
  lessonId: string,
  attendance: LessonAttendance,
): Promise<void> {
  await updateDoc(doc(db(), "lessons", lessonId), {
    attendance,
    attendanceUpdatedAt: serverTimestamp(),
  });
}

/** Rate a single skill on a lesson (1-5 stars). Pass current rating set so we can
 * recompute and persist an overall score (0-10) alongside the per-skill rating. */
export async function setLessonSkillNote(
  lessonId: string,
  skillKey: string,
  note: string,
): Promise<void> {
  const trimmed = String(note || "").trim().slice(0, 500);
  await updateDoc(doc(db(), "lessons", lessonId), {
    [`review.skillNotes.${skillKey}`]: trimmed || null,
    "review.updatedAt": serverTimestamp(),
  });
}

export async function rateLessonSkill(
  lessonId: string,
  skillKey: string,
  rating: number,
  allRatings?: Record<string, number>,
): Promise<void> {
  const clean = Math.max(0, Math.min(5, Math.round(rating)));
  const merged = { ...(allRatings || {}), [skillKey]: clean };
  const values = Object.values(merged).filter((v) => typeof v === "number" && v > 0);
  const overall =
    values.length === 0
      ? 0
      : Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 2 * 10) / 10;

  await updateDoc(doc(db(), "lessons", lessonId), {
    [`review.skills.${skillKey}`]: clean,
    "review.overallScore": overall,
    "review.skillsRated": values.length,
    "review.updatedAt": serverTimestamp(),
  });
}

export async function getStudentLessons(
  studentDocId: string,
  max = 20,
  instructorUid?: string,
): Promise<Lesson[]> {
  const constraints: QueryConstraint[] = [
    where("studentId", "==", studentDocId),
  ];
  if (instructorUid) {
    constraints.push(where("instructorId", "==", instructorUid));
  }
  constraints.push(orderBy("date", "desc"), fsLimit(max));

  return runQuery(
    "lessons",
    constraints,
    asLesson,
  );
}

// Shared progress selector — single source of truth for "how far along is
// this student". Both the Home dashboard and the Progress tab call this so
// the percentages can never disagree.
export type StudentProgressSummary = {
  /** Mean of all rated-skill percentages (0-100). 0 if no skills rated yet. */
  percent: number;
  /** Total skills the instructor has rated at least once. */
  ratedCount: number;
  /** How many skills are at "Competent" (4) or higher. */
  competentCount: number;
  /** Lowest-rated skill key, useful for "focus next" prompts. Null if nothing rated. */
  weakestKey: string | null;
  /** Display label for `weakestKey`. */
  weakestLabel: string | null;
};

export function summariseProgressFromAggregate(
  aggregate: StudentSkillAggregate[],
): StudentProgressSummary {
  if (!aggregate.length) {
    return { percent: 0, ratedCount: 0, competentCount: 0, weakestKey: null, weakestLabel: null };
  }
  const total = aggregate.reduce((sum, s) => sum + s.percent, 0);
  const percent = Math.round(total / aggregate.length);
  const competentCount = aggregate.filter((s) => s.averageRating >= 4).length;
  // Lowest-rated wins. Stable tiebreak: more lessons-rated first (more
  // confidence the rating reflects reality).
  const weakest = [...aggregate].sort(
    (a, b) => a.averageRating - b.averageRating || b.lessonsRated - a.lessonsRated,
  )[0];
  return {
    percent,
    ratedCount: aggregate.length,
    competentCount,
    weakestKey: weakest?.key ?? null,
    weakestLabel: weakest?.label ?? null,
  };
}

export async function getStudentProgressSummary(
  studentDocId: string,
): Promise<StudentProgressSummary> {
  const aggregate = await getStudentSkillsAggregate(studentDocId);
  return summariseProgressFromAggregate(aggregate);
}

export async function getStudentSkillsAggregate(
  studentDocId: string,
  max = 50,
  instructorUid?: string,
): Promise<StudentSkillAggregate[]> {
  const lessons = await getStudentLessons(studentDocId, max, instructorUid);
  const buckets = new Map<string, { total: number; count: number }>();

  lessons.forEach((lesson) => {
    Object.entries(lesson.skillRatings || {}).forEach(([key, rating]) => {
      const current = buckets.get(key) || { total: 0, count: 0 };
      buckets.set(key, {
        total: current.total + rating,
        count: current.count + 1,
      });
    });
  });

  return Array.from(buckets.entries())
    .map(([key, bucket]) => {
      const averageRating = bucket.count ? bucket.total / bucket.count : 0;
      return {
        key,
        label: friendlySkillLabel(key),
        averageRating,
        percent: Math.round((averageRating / 5) * 100),
        lessonsRated: bucket.count,
      };
    })
    .sort((a, b) => b.lessonsRated - a.lessonsRated || b.percent - a.percent || a.label.localeCompare(b.label));
}

export async function saveInstructorProfile(
  profile: InstructorProfile,
  opts?: { previousUsername?: string },
): Promise<void> {
  const uid = currentUid();
  const username = normalizeUsername(profile.username);
  if (!username) throw new Error("Username is required.");

  const profileRef = doc(db(), "settings", `${uid}-profile`);
  const directoryRef = doc(db(), "instructorDirectory", username);

  // Fast path: when the caller tells us the username hasn't changed, the
  // directory doc is already ours — skip every pre-read and go straight to the
  // batched write (a single network round-trip).
  const prevUsername = normalizeUsername(opts?.previousUsername || "");
  let oldUsername = prevUsername;

  if (prevUsername !== username) {
    // Username is new or changed: check uniqueness, and (only when the caller
    // couldn't tell us the previous name) read it for rename cleanup.
    const [existing, directorySnap] = await Promise.all([
      prevUsername ? Promise.resolve(null) : getDoc(profileRef).catch(() => null),
      getDoc(directoryRef),
    ]);
    if (!prevUsername) {
      oldUsername = existing?.exists()
        ? normalizeUsername(String(existing.data().username || ""))
        : "";
    }
    if (directorySnap.exists() && directorySnap.data().uid !== uid) {
      throw new Error("username-taken");
    }
  }

  const ratingNumber = Math.min(5, Math.max(1, Number(profile.rating) || 5));
  const weekdayRateNumber = Math.max(0, Number(profile.weekdayRate ?? profile.hourlyRate) || 0);
  const sundayRateNumber = Math.max(0, Number(profile.sundayRate) || 0);
  const testDayFeeNumber = Math.max(0, Number(profile.testDayFee) || 0);
  const yearsQualifiedNumber = Math.max(0, Math.min(70, Math.round(Number(profile.yearsQualified) || 0)));
  const adiApproved = profile.adiApproved === true;
  const cleanProfile = {
    username,
    name: profile.name.trim(),
    location: profile.location.trim(),
    transmissions: normalizeProfileTransmission(profile.transmissions),
    rating: ratingNumber,
    hourlyRate: weekdayRateNumber, // backward-compat: flat rate mirrors weekday rate
    weekdayRate: weekdayRateNumber,
    sundayRate: sundayRateNumber,
    testDayFee: testDayFeeNumber,
    yearsQualified: yearsQualifiedNumber,
    adiApproved,
    updatedAt: serverTimestamp(),
  };

  // All writes go out in a single atomic batch = one network round-trip.
  const batch = writeBatch(db());
  batch.set(profileRef, cleanProfile, { merge: true });
  batch.set(
    doc(db(), "users", uid),
    {
      username,
      displayName: cleanProfile.name,
      onboardingComplete: true,
    },
    { merge: true },
  );
  batch.set(
    directoryRef,
    {
      uid,
      username,
      name: cleanProfile.name,
      location: cleanProfile.location,
      rating: cleanProfile.rating,
      transmissions: cleanProfile.transmissions,
      yearsQualified: yearsQualifiedNumber,
      adiApproved,
      weekdayRate: weekdayRateNumber,
      sundayRate: sundayRateNumber,
      testDayFee: testDayFeeNumber,
    },
    { merge: true },
  );
  await batch.commit();

  // Rare: username changed. Best-effort cleanup of the old directory entry —
  // kept outside the batch so a denied/failed delete can't fail the whole save.
  if (oldUsername && oldUsername !== username) {
    await deleteDoc(doc(db(), "instructorDirectory", oldUsername)).catch(() => {});
  }
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) return false;

  const directorySnap = await getDoc(doc(db(), "instructorDirectory", cleanUsername));
  if (!directorySnap.exists()) return true;
  return directorySnap.data().uid === currentUid();
}

export type InstructorDirectoryEntry = {
  uid: string;
  username: string;
  name: string;
  location: string;
  rating: number | string;
  transmissions: string;
};

function asDirectoryEntry(data: DocumentData): InstructorDirectoryEntry {
  return {
    uid: String(data.uid || ""),
    username: String(data.username || ""),
    name: String(data.name || "Your instructor"),
    location: String(data.location || ""),
    rating: typeof data.rating === "number" ? data.rating : data.rating || "",
    transmissions: String(data.transmissions || "both"),
  };
}

/** Public lookup — used by student signup. No auth required. */
export async function searchInstructorByUsername(
  username: string,
): Promise<InstructorDirectoryEntry | null> {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  const snap = await getDoc(doc(db(), "instructorDirectory", clean));
  if (!snap.exists()) return null;
  return asDirectoryEntry(snap.data());
}

/** Resolve an invite-link uid (from QR / shared URL) to a directory entry. */
export async function searchInstructorByUid(
  uid: string,
): Promise<InstructorDirectoryEntry | null> {
  const clean = uid.trim();
  if (!clean) return null;
  const q = query(
    collection(db(), "instructorDirectory"),
    where("uid", "==", clean),
    fsLimit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return asDirectoryEntry(snap.docs[0].data());
}

export async function getMyInstructorProfile(): Promise<InstructorProfile | null> {
  const uid = currentUid();
  const profileSnap = await getDoc(doc(db(), "settings", `${uid}-profile`));
  if (!profileSnap.exists()) return null;

  const data = profileSnap.data();
  const num = (value: unknown) => (Number(value) > 0 ? Number(value) : 0);
  return {
    uid,
    username: textField(data, "username"),
    name: textField(data, "name"),
    location: textField(data, "location"),
    transmissions: normalizeProfileTransmission(data.transmissions),
    rating: typeof data.rating === "number" || typeof data.rating === "string" ? data.rating : 5,
    hourlyRate:
      typeof data.hourlyRate === "number" || typeof data.hourlyRate === "string" ? data.hourlyRate : 0,
    weekdayRate: num(data.weekdayRate ?? data.hourlyRate),
    sundayRate: num(data.sundayRate),
    testDayFee: num(data.testDayFee),
    yearsQualified: num(data.yearsQualified),
    adiApproved: data.adiApproved === true,
  };
}

export async function getCarDetails(uid: string): Promise<CarDetails | null> {
  const snap = await getDoc(doc(db(), "settings", `${uid}-car`));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    make: d.make ?? "",
    model: d.model ?? "",
    year: d.year ?? "",
    registration: d.registration ?? "",
    colour: d.colour ?? "",
    fuelType: d.fuelType ?? "petrol",
    insuranceExpiry: d.insuranceExpiry ?? "",
    motExpiry: d.motExpiry ?? "",
    taxExpiry: d.taxExpiry ?? "",
    adiBadgeExpiry: d.adiBadgeExpiry ?? "",
    lastServiceDate: d.lastServiceDate ?? "",
    nextServiceDate: d.nextServiceDate ?? "",
    tyreCheckDate: d.tyreCheckDate ?? "",
    brakeCheckDate: d.brakeCheckDate ?? "",
    oilCheckDate: d.oilCheckDate ?? "",
    mileage: d.mileage ?? "",
    notes: d.notes ?? "",
    serviceLog: Array.isArray(d.serviceLog)
      ? d.serviceLog
          .filter((e: unknown): e is Record<string, unknown> => !!e && typeof e === "object")
          .map((e) => ({
            id: String(e.id ?? ""),
            date: typeof e.date === "string" ? e.date : "",
            text: typeof e.text === "string" ? e.text : "",
          }))
          .filter((e) => e.text.trim().length > 0)
      : [],
  };
}

export async function saveCarDetails(uid: string, data: Partial<CarDetails>): Promise<void> {
  await setDoc(doc(db(), "settings", `${uid}-car`), { ...data }, { merge: true });
}

// ─── Tips ────────────────────────────────────────────────────────────────────

function asTip(id: string, data: DocumentData): Tip {
  return {
    id,
    instructorId: data.instructorId ?? "",
    title: data.title ?? "",
    description: typeof data.description === "string" ? data.description : undefined,
    type: (data.type === "video" || data.type === "pdf" || data.type === "note") ? data.type as TipType : "note",
    videoUrl: typeof data.videoUrl === "string" && data.videoUrl ? data.videoUrl : undefined,
    pdfUrl: typeof data.pdfUrl === "string" && data.pdfUrl ? data.pdfUrl : undefined,
    timestamp: typeof data.timestamp?.toMillis === "function" ? data.timestamp.toMillis() : Date.now(),
  };
}

export async function getTips(instructorUid: string): Promise<Tip[]> {
  return runQuery(
    "tips",
    [
      where("instructorId", "==", instructorUid),
      orderBy("timestamp", "desc"),
    ],
    asTip,
  );
}

export async function addTip(
  instructorUid: string,
  data: Pick<Tip, "title" | "description" | "type" | "videoUrl" | "pdfUrl">,
): Promise<string> {
  const ref = await addDoc(collection(db(), "tips"), {
    instructorId: instructorUid,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    type: data.type,
    videoUrl: data.videoUrl?.trim() || null,
    pdfUrl: data.pdfUrl?.trim() || null,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTip(
  tipId: string,
  data: Pick<Tip, "title" | "description" | "type" | "videoUrl" | "pdfUrl">,
): Promise<void> {
  await updateDoc(doc(db(), "tips", tipId), {
    title: data.title.trim(),
    description: data.description?.trim() || null,
    type: data.type,
    videoUrl: data.videoUrl?.trim() || null,
    pdfUrl: data.pdfUrl?.trim() || null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTip(tipId: string): Promise<void> {
  await deleteDoc(doc(db(), "tips", tipId));
}

export async function getInstructorProfile(instructorUid: string): Promise<InstructorPublicProfile | null> {
  if (!instructorUid) return null;

  const directDirectorySnap = await getDoc(doc(db(), "instructorDirectory", instructorUid)).catch(() => null);
  if (directDirectorySnap?.exists()) {
    return asInstructorProfile(instructorUid, directDirectorySnap.data());
  }

  const directoryByUid = await getDocs(
    query(collection(db(), "instructorDirectory"), where("uid", "==", instructorUid), fsLimit(1)),
  ).catch(() => null);
  if (directoryByUid && !directoryByUid.empty) {
    return asInstructorProfile(instructorUid, directoryByUid.docs[0].data());
  }

  const userSnap = await getDoc(doc(db(), "users", instructorUid)).catch(() => null);
  if (userSnap?.exists()) {
    return asInstructorProfile(instructorUid, userSnap.data());
  }

  return null;
}

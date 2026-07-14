export type TipType = "video" | "pdf" | "note";

export type Tip = {
  id: string;
  instructorId: string;
  title: string;
  description?: string;
  type: TipType;
  videoUrl?: string;
  pdfUrl?: string;
  timestamp: number;
};

export type CarFuelType = "petrol" | "diesel" | "electric" | "hybrid";

export type CarServiceEntry = {
  id: string;
  date: string; // ISO YYYY-MM-DD, or "" for migrated legacy notes
  text: string;
};

export type CarDetails = {
  make: string;
  model: string;
  year: string;
  registration: string;
  colour: string;
  fuelType: CarFuelType;
  insuranceExpiry: string;
  motExpiry: string;
  taxExpiry: string;
  adiBadgeExpiry: string;
  lastServiceDate: string;
  nextServiceDate: string;
  tyreCheckDate: string;
  brakeCheckDate: string;
  oilCheckDate: string;
  mileage: string;
  notes: string;
  serviceLog: CarServiceEntry[];
};

export type UserRole = "instructor" | "student";

// Values the web/backend actually write to users.subscriptionStatus. Kept wide
// so the mobile billing gate can read every real state (incl. "unpaid").
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "cancelled"
  | "trial_expired"
  | "unpaid"
  | "none";

export type AppUser = {
  uid: string;
  email: string;
  /** From firebaseAuth.currentUser.emailVerified — gate Firestore writes on this. */
  emailVerified: boolean;
  displayName?: string;
  role: UserRole;
  onboardingComplete: boolean;
  subscriptionStatus?: SubscriptionStatus;
  /** Unix ms timestamp for when the trial ends. */
  trialEnd?: number;
  /** Internal/admin marker. This does not grant billing access. */
  isDeveloper?: boolean;
};

export type MockTest = {
  /** Stable id (Firestore-style — `${Date.now()}_${random}`). */
  id: string;
  /** ISO date YYYY-MM-DD when the mock was conducted. */
  date: string;
  /** DVSA-style fault counts. Pass = minor < 16 AND serious === 0 AND dangerous === 0. */
  faults: {
    minor: number;
    serious: number;
    dangerous: number;
  };
  /** Optional one-line note from the instructor. */
  instructorNote?: string;
};

export type TestResult = "pass" | "fail" | null;

export type Student = {
  id: string;
  uid?: string;
  instructorId?: string;
  name: string;
  phone: string;
  email: string;
  language?: string;
  practiceFocus?: string;
  practiceTips?: string;
  nextLesson: string;
  progress: number;
  testDate?: string;
  outstandingBalance: number;
  transmission: "manual" | "automatic";
  // ----- Test readiness (Phase: outcomes tracking) -----
  /** Did the student pass the DVSA theory test? Required before practical. */
  theoryPassed?: boolean;
  /** ISO date the theory test was passed (or is booked for). */
  theoryTestDate?: string;
  /** ISO date of the practical test (booked or completed). */
  practicalTestDate?: string;
  /** Time of the practical test, e.g. "09:48". */
  practicalTestTime?: string;
  /** Free text — DVSA test centre name (e.g. "Uxbridge"). */
  testCentre?: string;
  /** Fee paid to book the practical test slot (DVSA fee, £23 standard). */
  testBookingFee?: number;
  /** DVSA booking reference for the practical test slot. */
  testBookingRef?: string;
  /** Candidate's driving licence number used for the DVSA booking. */
  testCandidateNumber?: string;
  /** Whether the student has paid / reimbursed the booking fee. */
  testBookingPaid?: boolean;
  practicalTestStatus?: "upcoming" | "completed" | "cancelled";
  testMeetingLocation?: string;
  testVehicle?: string;
  practicalTestNotes?: string;
  /** Set after the practical test happens. */
  testResult?: TestResult;
  /** DVSA fault counts on the actual test. Useful for retake planning. */
  testFaults?: { minor: number; serious: number; dangerous: number };
  /** History of mock-test results — newest first when displayed. */
  mockTests?: MockTest[];
  /** Instructor's gut-call readiness, 0-10. 7+ contributes to "Ready for test". */
  readinessScore?: number;
};

export type Lesson = {
  id: string;
  instructorId?: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  durationMinutes: number;
  pickup: string;
  status: "scheduled" | "completed" | "cancelled";
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  price: number;
  notes?: string;
  skillRatings?: Record<string, number>;
  /** Optional per-skill instructor comment ("Smooth on roundabouts but rushed the lifesaver"). */
  skillNotes?: Record<string, string>;
  attendance?: "pending" | "attended" | "noshow" | "cancelled";
  attendanceUpdatedAt?: number;
  reminderStatus?: Record<string, Record<string, number | string>>;
  // ----- Recurring lesson series -----
  /** All lessons in a recurring booking share this id. Set on creation, never edited. */
  recurringGroupId?: string;
  /** 1-based position in the series ("3 of 8"). */
  recurringIndex?: number;
  /** Total occurrences when the series was booked. */
  recurringWeeks?: number;
};

export type PaymentStatus = "pending" | "paid" | "unpaid" | "waived";

export type PaymentMethod = "cash" | "card" | "bank" | "package" | null;

/** A lesson payment record. App7i records payment; it does not collect it. */
export type LessonPayment = {
  id: string;
  studentName: string;
  /** Firestore student doc id, when known — lets us filter per-student. */
  studentId?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  lessonDate: string;
  lessonTime?: string;
  lessonStatus: Lesson["status"];
  reminderSentAt?: number;
  reminderCount: number;
};

export type LearningResourceType =
  | "note"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "link"
  | "youtube"
  | "mock_test"
  | "lesson_plan"
  | "checklist";

export type LearningResource = {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  type: LearningResourceType;
  category: string;
  folder: string;
  url?: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ResourceAssignment = {
  id: string;
  instructorId: string;
  studentId: string;
  resourceId: string;
  title: string;
  description: string;
  type: LearningResourceType;
  category: string;
  folder: string;
  url?: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  required: boolean;
  pinned: boolean;
  completed: boolean;
  completedAt?: number;
  assignedAt: number;
  updatedAt: number;
};

export type LearningEntryKind = "lesson_summary" | "manual_note" | "homework";

export type LearningEntry = {
  id: string;
  instructorId: string;
  studentId: string;
  lessonId?: string;
  kind: LearningEntryKind;
  title: string;
  body: string;
  topicsCovered: string[];
  areasToImprove: string;
  homework: string;
  skillsAchieved: string[];
  instructorComments: string;
  confidenceLevel?: number;
  nextObjectives: string;
  createdAt: number;
  updatedAt: number;
};

export type LearningTopicStatus = "not_started" | "in_progress" | "completed";

export type LearningTopic = {
  id: string;
  label: string;
  status: LearningTopicStatus;
  updatedAt?: number;
};

export type StudentLearningProgress = {
  id: string;
  instructorId: string;
  studentId: string;
  topics: LearningTopic[];
  overallPercent: number;
  updatedAt: number;
};

// ─── Business records: expenses + mileage ─────────────────────────────────────
// These are owned by the instructor and used to compute net profit + HMRC
// mileage allowance on the Earnings screen.

export type ExpenseCategory =
  | "fuel"
  | "insurance"
  | "mot"
  | "service"
  | "tax"
  | "adi_badge"
  | "training"
  | "phone"
  | "marketing"
  | "other";

export type Expense = {
  id: string;
  instructorId: string;
  /** ISO date YYYY-MM-DD the expense was incurred. */
  date: string;
  category: ExpenseCategory;
  /** Amount in GBP (pounds, two decimals). */
  amount: number;
  /** Short description ("Esso fuel", "Direct Line car insurance Q3"). */
  description: string;
  /** Optional vendor name for accounting reference. */
  vendor?: string;
  /** Unix ms timestamp the record was created. Used for sort and audit. */
  createdAt: number;
};

export type MileageEntry = {
  id: string;
  instructorId: string;
  /** ISO date YYYY-MM-DD the miles were driven. */
  date: string;
  /** Miles driven on business (pickups, lessons, travel between students). */
  miles: number;
  /** Optional description ("3 lessons: pickup loop Hayes → Uxbridge"). */
  description?: string;
  /** Optional reference to a lesson id, so we can show "linked to lesson X". */
  lessonId?: string;
  /** Unix ms timestamp the record was created. */
  createdAt: number;
};

export type Message = {
  id: string;
  sender: string;
  receiver: string;
  instructorId: string;
  studentId: string;
  text: string;
  read: boolean;
  timestamp: number;
  /** Soft-delete flag. Set true when the sender removes their message. */
  deleted?: boolean;
  /** Unix ms when soft-delete happened. */
  deletedAt?: number;
  /** UID of whoever ran the delete (always the sender; rules enforce this). */
  deletedBy?: string;
};

export type ConversationSummary = {
  studentId: string;
  studentName: string;
  lastMessage: Message;
  lastTimestamp: number;
  unreadCount: number;
};

// Test-readiness checklist. 6 gates an instructor can confidently say have
// to be true before a student should sit the DVSA practical. Pure function so
// it can be reused by the student Home banner, the instructor StudentProfile,
// and the web StudentReport.

import type { MockTest, Student, Lesson } from "../types";

const TEST_READY_SKILL_THRESHOLD = 10; // of 14 DVSA categories
const MIN_PASSING_MOCKS = 2;
const MIN_READINESS_SCORE = 7;
const PASS_FAULT_LIMIT = 16; // < 16 minors, 0 serious/dangerous = pass

export type ReadinessGate = {
  key: string;
  label: string;
  done: boolean;
  detail?: string;
};

export type ReadinessResult = {
  gates: ReadinessGate[];
  doneCount: number;
  totalCount: number;
  /** True only when every gate is green. The "book your test" moment. */
  isReady: boolean;
};

export function isMockPass(mock: MockTest): boolean {
  const faults = mock.faults || { minor: 0, serious: 0, dangerous: 0 };
  return (
    Number(faults.minor || 0) < PASS_FAULT_LIMIT
    && Number(faults.serious || 0) === 0
    && Number(faults.dangerous || 0) === 0
  );
}

export function passingMockCount(mocks: MockTest[] | undefined): number {
  return (mocks || []).filter(isMockPass).length;
}

export function latestMock(mocks: MockTest[] | undefined): MockTest | null {
  if (!mocks || mocks.length === 0) return null;
  return [...mocks].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
}

/**
 * Build the 6-gate readiness checklist.
 *
 * @param student   the student doc
 * @param lessons   recent lessons (used to count unpaid + competent skills)
 * @param competentSkillCount  passed in instead of recomputed because the
 *                             Road-to-License card has it cached
 */
export function computeTestReadiness(
  student: Student | null | undefined,
  lessons: Lesson[],
  competentSkillCount: number,
): ReadinessResult {
  const mocks = student?.mockTests || [];
  const passingMocks = passingMockCount(mocks);
  const unpaidLessons = lessons.filter(
    (l) => l.paymentStatus === "unpaid" || l.paymentStatus === "not_paid",
  ).length;
  const readiness = Number(student?.readinessScore || 0);

  const gates: ReadinessGate[] = [
    {
      key: "theory",
      label: "Theory test passed",
      done: Boolean(student?.theoryPassed),
      detail: student?.theoryPassed
        ? "Done"
        : student?.theoryTestDate
          ? `Booked for ${student.theoryTestDate}`
          : "Book the theory test first",
    },
    {
      key: "skills",
      label: `${TEST_READY_SKILL_THRESHOLD}+ DVSA skills competent`,
      done: competentSkillCount >= TEST_READY_SKILL_THRESHOLD,
      detail: `${competentSkillCount} of 14 competent`,
    },
    {
      key: "mocks",
      label: `${MIN_PASSING_MOCKS}+ mock tests passed`,
      done: passingMocks >= MIN_PASSING_MOCKS,
      detail:
        mocks.length === 0
          ? "No mocks yet"
          : `${passingMocks} pass${passingMocks === 1 ? "" : "es"} of ${mocks.length}`,
    },
    {
      key: "instructor",
      label: `Instructor readiness ${MIN_READINESS_SCORE}+ /10`,
      done: readiness >= MIN_READINESS_SCORE,
      detail: readiness > 0 ? `Currently ${readiness}/10` : "Not rated yet",
    },
    {
      key: "payments",
      label: "All lessons paid up",
      done: unpaidLessons === 0,
      detail:
        unpaidLessons === 0
          ? "Settled"
          : `${unpaidLessons} unpaid lesson${unpaidLessons === 1 ? "" : "s"}`,
    },
    {
      key: "booking",
      label: "Practical test date booked",
      done: Boolean(student?.practicalTestDate),
      detail: student?.practicalTestDate
        ? `${student.practicalTestDate}${student.testCentre ? ` · ${student.testCentre}` : ""}`
        : "Not booked",
    },
  ];

  const doneCount = gates.filter((g) => g.done).length;
  return {
    gates,
    doneCount,
    totalCount: gates.length,
    isReady: doneCount === gates.length,
  };
}

export function describeMockResult(mock: MockTest): string {
  const f = mock.faults || { minor: 0, serious: 0, dangerous: 0 };
  return isMockPass(mock)
    ? `Pass · ${f.minor} minor`
    : `Fail · ${f.minor} minor, ${f.serious} serious, ${f.dangerous} dangerous`;
}

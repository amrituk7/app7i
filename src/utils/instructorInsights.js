export const SKILL_DEFINITIONS = [
  { key: "cockpitChecks", label: "Cockpit checks" },
  { key: "movingOff", label: "Moving off" },
  { key: "junctions", label: "Junctions" },
  { key: "roundabouts", label: "Roundabouts" },
  { key: "mirrors", label: "Mirrors and signals" },
  { key: "parking", label: "Parking" },
  { key: "maneuvers", label: "Maneuvers" },
  { key: "independentDriving", label: "Independent driving" }
];

export const SKILL_LEVEL_LABELS = [
  "Not started",
  "Introduced",
  "Needs support",
  "Steady",
  "Confident",
  "Test ready"
];

export const DEFAULT_PROGRESS = SKILL_DEFINITIONS.reduce((accumulator, skill) => {
  accumulator[skill.key] = 0;
  return accumulator;
}, {});

export const DEFAULT_STUDENT_INSIGHTS = {
  theoryPassed: false,
  theoryTestDate: "",
  practicalTestDate: "",
  mockTestScore: "",
  lessonBalance: "",
  confidenceLevel: 3,
  riskLevel: "steady",
  nextFocus: "",
  progress: DEFAULT_PROGRESS
};

export const DEFAULT_LESSON_REVIEW = {
  status: "scheduled",
  coachScore: 3,
  skillsCovered: [],
  strengths: "",
  focusNext: "",
  homework: "",
  privateNotes: "",
  followUpNeeded: false,
  paymentStatus: "pending"
};

export function clampSkillValue(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.min(5, Math.max(0, numericValue));
}

export function normalizeStudentInsights(student = {}) {
  const normalizedProgress = { ...DEFAULT_PROGRESS };
  const incomingProgress = student.progress || {};

  SKILL_DEFINITIONS.forEach((skill) => {
    normalizedProgress[skill.key] = clampSkillValue(incomingProgress[skill.key]);
  });

  return {
    ...DEFAULT_STUDENT_INSIGHTS,
    ...student,
    confidenceLevel: Math.min(5, Math.max(1, Number(student.confidenceLevel || 3))),
    mockTestScore:
      student.mockTestScore === "" || student.mockTestScore === undefined
        ? ""
        : Number(student.mockTestScore),
    lessonBalance:
      student.lessonBalance === "" || student.lessonBalance === undefined
        ? ""
        : Number(student.lessonBalance),
    progress: normalizedProgress
  };
}

export function normalizeLessonReview(lesson = {}) {
  const incomingReview = lesson.review || {};
  const skillsCovered = Array.isArray(incomingReview.skillsCovered)
    ? incomingReview.skillsCovered.filter(Boolean)
    : [];

  return {
    ...DEFAULT_LESSON_REVIEW,
    ...incomingReview,
    coachScore: Math.min(5, Math.max(1, Number(incomingReview.coachScore || 3))),
    skillsCovered
  };
}

export function getProgressSummary(student = {}) {
  const normalizedStudent = normalizeStudentInsights(student);
  const skillValues = SKILL_DEFINITIONS.map(
    (skill) => normalizedStudent.progress[skill.key] || 0
  );
  const total = skillValues.reduce((sum, value) => sum + value, 0);
  const average = total / SKILL_DEFINITIONS.length;
  const percent = Math.round((average / 5) * 100);
  const completedSkills = skillValues.filter((value) => value >= 4).length;
  const lowSkills = skillValues.filter((value) => value <= 2).length;

  let readiness = "Early lessons";
  let tone = "early";

  if (percent >= 80 && normalizedStudent.theoryPassed) {
    readiness = "Test ready";
    tone = "ready";
  } else if (percent >= 60) {
    readiness = "Building consistency";
    tone = "steady";
  } else if (percent >= 40) {
    readiness = "Developing core skills";
    tone = "developing";
  }

  if (normalizedStudent.riskLevel === "watch") {
    tone = "watch";
  }

  return {
    average,
    percent,
    completedSkills,
    lowSkills,
    readiness,
    tone
  };
}

export function getSkillLevelLabel(value) {
  return SKILL_LEVEL_LABELS[clampSkillValue(value)] || SKILL_LEVEL_LABELS[0];
}

export function getUpcomingTestText(student = {}) {
  const normalizedStudent = normalizeStudentInsights(student);
  if (!normalizedStudent.practicalTestDate) {
    return "";
  }

  const today = new Date();
  const testDate = new Date(normalizedStudent.practicalTestDate);
  const diffMs = testDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(diffMs / 86400000);

  if (dayDiff < 0) {
    return "Test date passed";
  }

  if (dayDiff === 0) {
    return "Test is today";
  }

  if (dayDiff === 1) {
    return "Test is tomorrow";
  }

  return `${dayDiff} days until test`;
}

export function getLatestReviewLesson(lessons = []) {
  return lessons.find((lesson) => lesson.review && lesson.review.status !== "scheduled") || null;
}

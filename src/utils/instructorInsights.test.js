import {
  SKILL_DEFINITIONS,
  SKILL_LEVEL_LABELS,
  DEFAULT_PROGRESS,
  DEFAULT_LESSON_REVIEW,
  clampSkillValue,
  normalizeStudentInsights,
  normalizeLessonReview,
  getProgressSummary,
  getSkillLevelLabel,
  getUpcomingTestText,
  getLatestReviewLesson
} from "./instructorInsights";

describe("clampSkillValue", () => {
  test("clamps values to 0-5 range", () => {
    expect(clampSkillValue(0)).toBe(0);
    expect(clampSkillValue(5)).toBe(5);
    expect(clampSkillValue(-1)).toBe(0);
    expect(clampSkillValue(10)).toBe(5);
    expect(clampSkillValue(3)).toBe(3);
  });

  test("handles non-numeric values", () => {
    expect(clampSkillValue("abc")).toBe(0);
    expect(clampSkillValue(null)).toBe(0);
    expect(clampSkillValue(undefined)).toBe(0);
    expect(clampSkillValue("3")).toBe(3);
  });
});

describe("normalizeStudentInsights", () => {
  test("returns defaults for empty student", () => {
    const result = normalizeStudentInsights({});
    expect(result.theoryPassed).toBe(false);
    expect(result.confidenceLevel).toBe(3);
    expect(result.progress.cockpitChecks).toBe(0);
  });

  test("preserves existing values", () => {
    const student = {
      theoryPassed: true,
      confidenceLevel: 5,
      progress: { cockpitChecks: 4, junctions: 3 }
    };
    const result = normalizeStudentInsights(student);
    expect(result.theoryPassed).toBe(true);
    expect(result.confidenceLevel).toBe(5);
    expect(result.progress.cockpitChecks).toBe(4);
    expect(result.progress.junctions).toBe(3);
    expect(result.progress.roundabouts).toBe(0);
  });

  test("clamps out-of-range progress values", () => {
    const result = normalizeStudentInsights({ progress: { cockpitChecks: 99 } });
    expect(result.progress.cockpitChecks).toBe(5);
  });
});

describe("normalizeLessonReview", () => {
  test("returns defaults for empty lesson", () => {
    const result = normalizeLessonReview({});
    expect(result.status).toBe("scheduled");
    expect(result.coachScore).toBe(3);
    expect(result.skillsCovered).toEqual([]);
  });

  test("filters falsy values from skillsCovered", () => {
    const result = normalizeLessonReview({
      review: { skillsCovered: ["junctions", null, "", "parking"] }
    });
    expect(result.skillsCovered).toEqual(["junctions", "parking"]);
  });
});

describe("getProgressSummary", () => {
  test("returns early lessons for new student", () => {
    const result = getProgressSummary({});
    expect(result.percent).toBe(0);
    expect(result.readiness).toBe("Early lessons");
    expect(result.tone).toBe("early");
  });

  test("returns test ready for advanced student with theory passed", () => {
    const progress = {};
    SKILL_DEFINITIONS.forEach((s) => { progress[s.key] = 5; });
    const result = getProgressSummary({ progress, theoryPassed: true });
    expect(result.percent).toBe(100);
    expect(result.readiness).toBe("Test ready");
    expect(result.tone).toBe("ready");
  });

  test("watch risk overrides tone", () => {
    const progress = {};
    SKILL_DEFINITIONS.forEach((s) => { progress[s.key] = 5; });
    const result = getProgressSummary({ progress, theoryPassed: true, riskLevel: "watch" });
    expect(result.tone).toBe("watch");
  });
});

describe("getSkillLevelLabel", () => {
  test("returns correct labels", () => {
    expect(getSkillLevelLabel(0)).toBe("Not started");
    expect(getSkillLevelLabel(5)).toBe("Test ready");
    expect(getSkillLevelLabel(3)).toBe("Steady");
  });
});

describe("getLatestReviewLesson", () => {
  test("returns null for empty array", () => {
    expect(getLatestReviewLesson([])).toBeNull();
  });

  test("returns first non-scheduled lesson", () => {
    const lessons = [
      { id: "1", review: { status: "scheduled" } },
      { id: "2", review: { status: "completed", strengths: "good" } },
      { id: "3", review: { status: "completed" } }
    ];
    expect(getLatestReviewLesson(lessons).id).toBe("2");
  });
});

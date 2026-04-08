import {
  getLessonTimestamp,
  isUpcomingLesson,
  sortLessonsAscending,
  sortLessonsDescending,
  formatLessonDate,
  getLessonCountdown
} from "./studentPortal";

describe("getLessonTimestamp", () => {
  test("returns timestamp from date and time", () => {
    const lesson = { date: "2026-03-20", time: "10:00" };
    const result = getLessonTimestamp(lesson);
    expect(result).toBe(new Date("2026-03-20T10:00").getTime());
  });

  test("falls back to lesson.timestamp for invalid date", () => {
    const lesson = { date: "", time: "", timestamp: 12345 };
    expect(getLessonTimestamp(lesson)).toBe(12345);
  });

  test("defaults time to 00:00", () => {
    const lesson = { date: "2026-03-20" };
    const result = getLessonTimestamp(lesson);
    expect(result).toBe(new Date("2026-03-20T00:00").getTime());
  });
});

describe("isUpcomingLesson", () => {
  test("returns true for future lesson", () => {
    const future = { date: "2099-01-01", time: "10:00" };
    expect(isUpcomingLesson(future)).toBe(true);
  });

  test("returns false for past lesson", () => {
    const past = { date: "2020-01-01", time: "10:00" };
    expect(isUpcomingLesson(past)).toBe(false);
  });
});

describe("sortLessonsAscending", () => {
  test("sorts lessons by date ascending", () => {
    const lessons = [
      { date: "2026-03-20", time: "10:00" },
      { date: "2026-03-18", time: "10:00" },
      { date: "2026-03-19", time: "10:00" }
    ];
    const sorted = sortLessonsAscending(lessons);
    expect(sorted[0].date).toBe("2026-03-18");
    expect(sorted[2].date).toBe("2026-03-20");
  });

  test("does not mutate original array", () => {
    const lessons = [
      { date: "2026-03-20", time: "10:00" },
      { date: "2026-03-18", time: "10:00" }
    ];
    sortLessonsAscending(lessons);
    expect(lessons[0].date).toBe("2026-03-20");
  });
});

describe("sortLessonsDescending", () => {
  test("sorts lessons by date descending", () => {
    const lessons = [
      { date: "2026-03-18", time: "10:00" },
      { date: "2026-03-20", time: "10:00" }
    ];
    const sorted = sortLessonsDescending(lessons);
    expect(sorted[0].date).toBe("2026-03-20");
  });
});

describe("getLessonCountdown", () => {
  test("returns 'today' for today's lesson", () => {
    const today = new Date();
    const lesson = {
      date: today.toISOString().split("T")[0],
      time: "23:59"
    };
    expect(getLessonCountdown(lesson)).toBe("today");
  });

  test("returns 'tomorrow' for tomorrow's lesson", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const lesson = {
      date: tomorrow.toISOString().split("T")[0],
      time: "10:00"
    };
    expect(getLessonCountdown(lesson)).toBe("tomorrow");
  });

  test("returns 'in X days' for future lessons", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const lesson = {
      date: future.toISOString().split("T")[0],
      time: "10:00"
    };
    expect(getLessonCountdown(lesson)).toBe("in 5 days");
  });
});

export function getLessonTimestamp(lesson) {
  const timestamp = new Date(`${lesson.date || ""}T${lesson.time || "00:00"}`).getTime();
  if (Number.isNaN(timestamp)) {
    return lesson.timestamp || 0;
  }
  return timestamp;
}

export function isUpcomingLesson(lesson, now = Date.now()) {
  return getLessonTimestamp(lesson) >= now;
}

export function sortLessonsAscending(lessons) {
  return [...lessons].sort((firstLesson, secondLesson) => {
    return getLessonTimestamp(firstLesson) - getLessonTimestamp(secondLesson);
  });
}

export function sortLessonsDescending(lessons) {
  return [...lessons].sort((firstLesson, secondLesson) => {
    return getLessonTimestamp(secondLesson) - getLessonTimestamp(firstLesson);
  });
}

export function formatLessonDate(lesson) {
  const timestamp = getLessonTimestamp(lesson);
  if (!timestamp) {
    return "Date not set";
  }

  return new Date(timestamp).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getLessonCountdown(lesson) {
  const timestamp = getLessonTimestamp(lesson);
  if (!timestamp) {
    return "";
  }

  const now = new Date();
  const lessonDate = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfLessonDay = new Date(
    lessonDate.getFullYear(),
    lessonDate.getMonth(),
    lessonDate.getDate()
  ).getTime();
  const dayDifference = Math.round((startOfLessonDay - startOfToday) / 86400000);

  if (dayDifference <= 0) {
    return "today";
  }

  if (dayDifference === 1) {
    return "tomorrow";
  }

  return `in ${dayDifference} days`;
}

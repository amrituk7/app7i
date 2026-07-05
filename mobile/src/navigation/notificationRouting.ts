// Maps backend push payload `data.url` strings to React Navigation routes.
// The backend uses web-style paths because the same notification has to deep-
// link into both the web app and the native app. Keep this table in sync with
// `functions/index.js` push payloads.

export type NavigationTarget = {
  screen: string;
  params?: Record<string, unknown>;
};

export function urlToNavigationTarget(url: string): NavigationTarget | null {
  if (!url || typeof url !== "string") return null;
  const path = url.split("?")[0].replace(/^https?:\/\/[^/]+/, "");
  if (!path) return null;

  // /lessons/{id} → instructor LessonDetail
  const lessonMatch = path.match(/^\/lessons\/([^/]+)$/);
  if (lessonMatch) {
    return { screen: "LessonDetail", params: { lessonId: lessonMatch[1] } };
  }

  // /lesson-feedback/{id} → student LessonFeedback
  const feedbackMatch = path.match(/^\/lesson-feedback\/([^/]+)$/);
  if (feedbackMatch) {
    return { screen: "LessonFeedback", params: { lessonId: feedbackMatch[1] } };
  }

  // /feedback-summary → instructor FeedbackSummary
  if (path === "/feedback-summary") {
    return { screen: "FeedbackSummary" };
  }

  // /students/{id} → instructor StudentProfile
  const studentMatch = path.match(/^\/students\/([^/]+)$/);
  if (studentMatch) {
    return { screen: "StudentProfile", params: { studentId: studentMatch[1] } };
  }

  // /messages → conversations list (instructor) / messages tab (student)
  if (path === "/messages" || path === "/my-messages") {
    return { screen: "Messages" };
  }

  // /car-details → instructor CarDetails (not yet on mobile, fall through)
  // /notifications → notification hub (not yet on mobile, fall through)

  return null;
}

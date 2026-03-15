import React, { useEffect, useMemo, useState } from "react";
import {
  getStudent,
  getMessagesForStudent,
  deleteStudent,
  getLessonsForStudent,
  updateStudent
} from "../firebase";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import ProfilePicture from "../components/ProfilePicture";
import {
  SKILL_DEFINITIONS,
  getLatestReviewLesson,
  getProgressSummary,
  getSkillLevelLabel,
  getUpcomingTestText,
  normalizeLessonReview,
  normalizeStudentInsights
} from "../utils/instructorInsights";
import "./StudentProfile.css";

function getLessonDateValue(lesson) {
  const fallback = lesson.timestamp || 0;
  if (!lesson.date) {
    return fallback;
  }

  return new Date(`${lesson.date}T${lesson.time || "00:00"}`).getTime() || fallback;
}

function formatLessonDate(date, time) {
  if (!date) {
    return "Date not set";
  }

  const lessonDate = new Date(`${date}T${time || "00:00"}`);
  return lessonDate.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const studentData = await getStudent(id);
        if (!studentData) {
          showToast("Student not found", "error");
          navigate("/students");
          return;
        }

        setStudent(normalizeStudentInsights(studentData));
        const [messageData, lessonData] = await Promise.all([
          getMessagesForStudent(id),
          getLessonsForStudent(id)
        ]);

        setMessages(
          messageData.sort(
            (firstMessage, secondMessage) =>
              (secondMessage.timestamp || 0) - (firstMessage.timestamp || 0)
          )
        );
        setLessons(
          lessonData.sort(
            (firstLesson, secondLesson) =>
              getLessonDateValue(secondLesson) - getLessonDateValue(firstLesson)
          )
        );
      } catch {
        showToast("Failed to load student", "error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, showToast, navigate]);

  function whatsappLink(phone, name) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    const intl = digits.startsWith("44") ? digits : digits.startsWith("0") ? "44" + digits.slice(1) : "44" + digits;
    const msg = encodeURIComponent(`Hi ${name || ""}, just a reminder about your upcoming driving lesson with Ravi. See you soon!`);
    return `https://wa.me/${intl}?text=${msg}`;
  }

  async function handleMarkPassed() {
    if (!window.confirm(`Mark ${student.name} as TEST PASSED? 🎉`)) return;
    try {
      await updateStudent(student.id, { testPassed: true, testPassedDate: new Date().toISOString().slice(0, 10) });
      setStudent(prev => ({ ...prev, testPassed: true, testPassedDate: new Date().toISOString().slice(0, 10) }));
      showToast("🎉 Congratulations! Marked as passed!", "success");
    } catch {
      showToast("Failed to update", "error");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete ${student?.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteStudent(id);
      showToast("Student deleted", "success");
      navigate("/students");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error: " + (err?.code || err?.message || "Failed to delete"), "error");
    }
  }

  const progressSummary = useMemo(() => getProgressSummary(student || {}), [student]);
  const latestReviewLesson = useMemo(() => getLatestReviewLesson(lessons), [lessons]);
  const latestReview = latestReviewLesson ? normalizeLessonReview(latestReviewLesson) : null;
  const upcomingTestText = getUpcomingTestText(student || {});
  const recentMessages = messages.slice(0, 3);
  const recentLessons = lessons.slice(0, 6);

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (!student) return <p style={{ padding: "20px" }}>Student not found</p>;

  return (
    <div className="student-profile-page">
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Link to="/students">
          <button type="button" className="student-back-button" style={{ marginBottom: 0 }}>
            ← Back to Students
          </button>
        </Link>
        <Link to={`/students/${id}/report`}>
          <button type="button" style={{ background: "#1f2937", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            🖨️ Print Report
          </button>
        </Link>
      </div>

      <section className="student-profile-hero">
        <div className="student-profile-identity">
          <ProfilePicture
            studentId={student.id}
            studentName={student.name}
            profilePicture={student.profilePicture}
            editable={true}
            size="large"
            onUpdate={(url) => setStudent((prev) => ({ ...prev, profilePicture: url }))}
          />

          <div className="student-profile-heading">
            <h1>{student.name || "Unnamed Student"}</h1>
            <p className="student-subline">
              Instructor view for lesson planning, progress tracking, and follow-up.
            </p>

            <div className="student-meta-chips">
              <span className="student-meta-chip">{student.phone || "No phone saved"}</span>
              <span className="student-meta-chip">
                {student.transmission || "Transmission not set"}
              </span>
              <span className="student-meta-chip">
                Theory {student.theoryPassed ? "passed" : "pending"}
              </span>
              {student.parkingPractice && (
                <span className="student-meta-chip">Parking follow-up needed</span>
              )}
            </div>

            {student.testPassed && (
              <div style={{ background: "#d1fae5", border: "1px solid #10b981", borderRadius: "10px", padding: "10px 16px", marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🏆</span>
                <div>
                  <strong style={{ color: "#065f46" }}>Test Passed!</strong>
                  {student.testPassedDate && <span style={{ color: "#065f46", fontSize: "12px", marginLeft: "8px" }}>{student.testPassedDate}</span>}
                </div>
              </div>
            )}
            <div className="student-action-row" style={{ marginTop: "18px" }}>
              <Link className="student-action-button primary" to={`/students/edit/${student.id}`}>
                Update Tracker
              </Link>
              <Link
                className="student-action-button secondary"
                to={`/book-lesson?studentId=${student.id}&studentName=${encodeURIComponent(student.name || "")}`}
              >
                Book Lesson
              </Link>
              <Link className="student-action-button primary" to={`/messages/${student.id}`}>
                Open Messages
              </Link>
              {student.phone && (
                <a
                  href={whatsappLink(student.phone, student.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="student-action-button"
                  style={{ background: "#25d366", color: "white", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                >
                  💬 WhatsApp
                </a>
              )}
              {!student.testPassed && (
                <button className="student-action-button" onClick={handleMarkPassed}
                  style={{ background: "#f59e0b", color: "white", border: "none", cursor: "pointer" }}>
                  🏆 Mark Passed
                </button>
              )}
              <button className="student-action-button student-delete-button" onClick={handleDelete}>
                Delete Student
              </button>
            </div>
          </div>
        </div>

        <div className="student-hero-summary">
          <div className="student-summary-card">
            <span>Overall progress</span>
            <strong>{progressSummary.percent}%</strong>
            <small>{progressSummary.readiness}</small>
          </div>
          <div className="student-summary-card">
            <span>Confidence</span>
            <strong>{student.confidenceLevel}/5</strong>
            <small>Instructor confidence read</small>
          </div>
          <div className="student-summary-card">
            <span>Mock test</span>
            <strong>{student.mockTestScore === "" ? "--" : `${student.mockTestScore}%`}</strong>
            <small>Latest recorded score</small>
          </div>
          <div className="student-summary-card">
            <span>Lesson balance</span>
            <strong>{student.lessonBalance === "" ? "--" : student.lessonBalance}</strong>
            <small>Credits or hours remaining</small>
          </div>
        </div>
      </section>

      <div className="student-profile-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="student-card-panel">
            <div className="student-readiness-row">
              <div>
                <h2>Skill Progress</h2>
                <p className="student-card-subtext">
                  Skill-by-skill view of where the learner is strong and where the next sessions
                  should focus.
                </p>
              </div>
              <div>
                <span className={`student-readiness-badge ${progressSummary.tone}`}>
                  {progressSummary.readiness}
                </span>
                <div className="student-readiness-stat" style={{ marginTop: "8px" }}>
                  {progressSummary.completedSkills} of {SKILL_DEFINITIONS.length} skills at strong
                  level
                </div>
              </div>
            </div>

            <div className="student-skill-list">
              {SKILL_DEFINITIONS.map((skill) => {
                const value = student.progress?.[skill.key] || 0;
                return (
                  <div key={skill.key} className="student-skill-item">
                    <div className="student-skill-topline">
                      <span className="student-skill-name">{skill.label}</span>
                      <span className="student-skill-level">
                        {value}/5 - {getSkillLevelLabel(value)}
                      </span>
                    </div>
                    <div className="student-skill-track">
                      <div
                        className="student-skill-fill"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="student-card-panel">
            <h2>Lesson History</h2>
            <p className="student-card-subtext">
              Recent sessions and review status. Open any lesson to update the review or send
              follow-up.
            </p>

            {recentLessons.length === 0 ? (
              <p className="student-empty">No lessons yet.</p>
            ) : (
              <div className="student-history-list">
                {recentLessons.map((lesson) => {
                  const lessonReview = normalizeLessonReview(lesson);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/lessons/${lesson.id}`}
                      className="student-history-link"
                    >
                      <div className="student-history-item">
                        <strong>{formatLessonDate(lesson.date, lesson.time)}</strong>
                        <div className="student-history-meta">
                          {lesson.duration ? `${lesson.duration} hr` : "1 hr"} lesson
                          {lessonReview.status !== "scheduled"
                            ? ` | ${lessonReview.status}`
                            : ""}
                        </div>
                        {lessonReview.focusNext && (
                          <p className="student-review-text">
                            Next focus: {lessonReview.focusNext}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
                {lessons.length > recentLessons.length && (
                  <Link to={`/lessons?studentId=${student.id}`}>Open full lesson log</Link>
                )}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="student-card-panel">
            <h2>Readiness Snapshot</h2>
            <p className="student-card-subtext">
              Keep test planning, confidence, and instructor follow-up visible in one place.
            </p>

            <div className="student-insight-list">
              <div className="student-insight-item">
                <span>Practical test</span>
                <strong>{student.practicalTestDate || "Not booked"}</strong>
              </div>
              <div className="student-insight-item">
                <span>Countdown</span>
                <strong>{upcomingTestText || "No test date set"}</strong>
              </div>
              <div className="student-insight-item">
                <span>Mock score</span>
                <strong>
                  {student.mockTestScore === "" ? "Not logged" : `${student.mockTestScore}%`}
                </strong>
              </div>
              <div className="student-insight-item">
                <span>Watch level</span>
                <strong>
                  {student.riskLevel === "watch" ? "Needs follow-up" : "Steady"}
                </strong>
              </div>
            </div>

            <div className="student-insight-note">
              <strong>Next focus:</strong>{" "}
              {student.nextFocus || "No next-focus note saved yet. Update it from the tracker."}
            </div>
          </section>

          <section className="student-card-panel">
            <h2>Latest Lesson Review</h2>
            <p className="student-card-subtext">
              Pulls the most recent reviewed lesson so the next session starts with context.
            </p>

            {!latestReview || !latestReviewLesson ? (
              <p className="student-empty">No post-lesson review has been saved yet.</p>
            ) : (
              <div className="student-review-card">
                <strong>{formatLessonDate(latestReviewLesson.date, latestReviewLesson.time)}</strong>
                <div className="review-chip-row" style={{ marginTop: "10px" }}>
                  <span className="review-chip">Coach score {latestReview.coachScore}/5</span>
                  <span className="review-chip">Payment {latestReview.paymentStatus}</span>
                  {latestReview.followUpNeeded && (
                    <span className="review-chip">Follow-up needed</span>
                  )}
                </div>
                {latestReview.skillsCovered.length > 0 && (
                  <div className="student-skill-tags" style={{ marginTop: "12px" }}>
                    {latestReview.skillsCovered.map((skillKey) => {
                      const skill = SKILL_DEFINITIONS.find((item) => item.key === skillKey);
                      return (
                        <span key={skillKey} className="student-skill-tag">
                          {skill?.label || skillKey}
                        </span>
                      );
                    })}
                  </div>
                )}
                {latestReview.strengths && (
                  <p className="student-review-text">
                    <strong>Strengths:</strong> {latestReview.strengths}
                  </p>
                )}
                {latestReview.focusNext && (
                  <p className="student-review-text">
                    <strong>Next focus:</strong> {latestReview.focusNext}
                  </p>
                )}
                {latestReview.homework && (
                  <p className="student-review-text">
                    <strong>Homework:</strong> {latestReview.homework}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="student-card-panel">
            <h2>Recent Messages</h2>
            <p className="student-card-subtext">
              Quick conversation snapshot before you call, message, or book the next lesson.
            </p>

            {recentMessages.length === 0 ? (
              <p className="student-empty">No messages yet.</p>
            ) : (
              <div className="student-message-list">
                {recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`student-message-item ${
                      message.sender === "instructor" ? "instructor" : ""
                    }`}
                  >
                    <strong>{message.sender === "instructor" ? "You" : student.name}</strong>
                    <p className="student-review-text">{message.text}</p>
                    {message.timestamp && (
                      <div className="student-message-meta">
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "14px" }}>
              <Link to={`/messages/${student.id}`}>Open full conversation</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

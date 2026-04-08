import React, { useEffect, useState } from "react";
import {
  getLesson,
  updateLesson,
  deleteLesson,
  sendMessage
} from "../firebase";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  SKILL_DEFINITIONS,
  normalizeLessonReview
} from "../utils/instructorInsights";
import "./LessonDetails.css";

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "15px",
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "12px"
};

export default function LessonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, instructorName } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [review, setReview] = useState(normalizeLessonReview());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const found = await getLesson(id);
        if (!found) {
          showToast("Lesson not found", "error");
          navigate("/lessons");
          return;
        }
        setLesson(found);
        setReview(normalizeLessonReview(found));
      } catch {
        showToast("Failed to load lesson", "error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, showToast, navigate]);

  async function handleSaveSchedule(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLesson(id, {
        date: lesson.date,
        time: lesson.time,
        duration: lesson.duration || 1,
        notes: lesson.notes || ""
      });
      showToast("Lesson updated!", "success");
      setEditing(false);
    } catch {
      showToast("Failed to update lesson", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReview(e) {
    e.preventDefault();
    setReviewSaving(true);
    try {
      await updateLesson(id, {
        review: {
          ...review,
          coachScore: Number(review.coachScore || 3)
        }
      });
      setLesson((prev) => ({
        ...prev,
        review: {
          ...review,
          coachScore: Number(review.coachScore || 3)
        }
      }));
      showToast("Review saved", "success");
    } catch {
      showToast("Failed to save review", "error");
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(id);
      showToast("Lesson deleted", "success");
      navigate("/lessons");
    } catch {
      showToast("Failed to delete lesson", "error");
    }
  }

  async function handleConfirmCancel() {
    setCancelling(true);
    try {
      const updatedReview = {
        ...review,
        status: "cancelled",
        cancelReason: cancelReason || "No reason given"
      };
      await updateLesson(id, { review: updatedReview });
      setReview(updatedReview);
      setLesson((prev) => ({ ...prev, review: updatedReview }));

      if (lesson.studentId) {
        const reasonPart = cancelReason ? ` Reason: ${cancelReason}.` : "";
        await sendMessage({
          sender: user?.uid,
          receiver: lesson.studentId,
          text: `Hi ${lesson.studentName}, your lesson on ${lesson.date} at ${lesson.time} has been cancelled.${reasonPart} Please message me to reschedule. - ${instructorName}`
        });
      }

      showToast("Lesson cancelled and student notified", "success");
      setShowCancelModal(false);
      setCancelReason("");
    } catch {
      showToast("Failed to cancel lesson", "error");
    } finally {
      setCancelling(false);
    }
  }

  async function handleSendReviewSummary() {
    if (!lesson?.studentId) {
      showToast("No student linked", "error");
      return;
    }

    const summaryLines = [
      `Hi ${lesson.studentName}, here is your lesson summary for ${lesson.date} at ${lesson.time}.`,
      review.strengths ? `What went well: ${review.strengths}` : "",
      review.focusNext ? `Next focus: ${review.focusNext}` : "",
      review.homework ? `Practice before next lesson: ${review.homework}` : ""
    ].filter(Boolean);

    try {
      await sendMessage({
        sender: user?.uid,
        receiver: lesson.studentId,
        text: summaryLines.join(" ")
      });
      showToast("Lesson summary sent", "success");
    } catch {
      showToast("Failed to send summary", "error");
    }
  }

  function toggleSkill(skillKey) {
    setReview((prev) => {
      const currentSkills = prev.skillsCovered || [];
      const nextSkills = currentSkills.includes(skillKey)
        ? currentSkills.filter((item) => item !== skillKey)
        : [...currentSkills, skillKey];

      return {
        ...prev,
        skillsCovered: nextSkills
      };
    });
  }

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (!lesson) return <p style={{ padding: "20px" }}>Lesson not found</p>;

  return (
    <div className="lesson-details-page">
      <Link to="/lessons">
        <button type="button" className="lesson-back-button">
          Back to Lessons
        </button>
      </Link>

      <section className="lesson-header-card">
        <div className="lesson-header-copy">
          <h1>{lesson.studentName || "Unknown Student"}</h1>
          <p>Lesson planning, notes, review, payment, and follow-up in one place.</p>
          <div className="lesson-chip-row" style={{ marginTop: "14px" }}>
            <span className="lesson-chip">{lesson.date || "No date"}</span>
            <span className="lesson-chip">{lesson.time || "No time"}</span>
            <span className="lesson-chip">
              {lesson.duration ? `${lesson.duration} hr` : "1 hr"}
            </span>
            <span className="lesson-chip">{review.status}</span>
          </div>
        </div>

        <div className="lesson-action-row">
          {!editing && (
            <button onClick={() => setEditing(true)} type="button">
              Edit Schedule
            </button>
          )}
          {lesson.studentId && (
            <Link to={`/students/${lesson.studentId}`}>
              <button type="button">View Student</button>
            </Link>
          )}
          {lesson.studentId && (
            <Link to={`/messages/${lesson.studentId}`}>
              <button type="button">Message Student</button>
            </Link>
          )}
        </div>
      </section>

      <div className="lesson-shell-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="lesson-panel">
            <h2>Lesson Overview</h2>
            <p className="lesson-panel-subtext">
              Keep the time, duration, and working notes current without leaving the review flow.
            </p>

            {!editing ? (
              <>
                <div className="lesson-info-grid">
                  <div className="lesson-info-card">
                    <span>Date</span>
                    <strong>{lesson.date || "Not set"}</strong>
                  </div>
                  <div className="lesson-info-card">
                    <span>Time</span>
                    <strong>{lesson.time || "Not set"}</strong>
                  </div>
                  <div className="lesson-info-card">
                    <span>Duration</span>
                    <strong>{lesson.duration ? `${lesson.duration} hour` : "1 hour"}</strong>
                  </div>
                  <div className="lesson-info-card">
                    <span>Instructor</span>
                    <strong>{lesson.instructor || "Instructor"}</strong>
                  </div>
                </div>

                <div className="lesson-note-box">
                  <strong>Lesson notes</strong>
                  <p style={{ marginBottom: 0 }}>{lesson.notes || "No lesson notes yet."}</p>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveSchedule}>
                <div className="lesson-form-grid">
                  <div className="lesson-field">
                    <label>Date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={lesson.date || ""}
                      onChange={(e) => setLesson({ ...lesson, date: e.target.value })}
                    />
                  </div>
                  <div className="lesson-field">
                    <label>Time</label>
                    <input
                      style={inputStyle}
                      type="time"
                      value={lesson.time || ""}
                      onChange={(e) => setLesson({ ...lesson, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="lesson-field">
                  <label>Duration</label>
                  <select
                    style={inputStyle}
                    value={lesson.duration || "1"}
                    onChange={(e) =>
                      setLesson({ ...lesson, duration: Number(e.target.value) })
                    }
                  >
                    <option value="1">1 hour</option>
                    <option value="1.5">1.5 hours</option>
                    <option value="2">2 hours</option>
                  </select>
                </div>

                <div className="lesson-field">
                  <label>Notes</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "88px", resize: "vertical" }}
                    placeholder="Lesson notes..."
                    value={lesson.notes || ""}
                    onChange={(e) => setLesson({ ...lesson, notes: e.target.value })}
                  />
                </div>

                <div className="lesson-review-toolbar">
                  <button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Schedule"}
                  </button>
                  <button
                    type="button"
                    className="lesson-secondary-button"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="lesson-panel">
            <h2>Post-Lesson Review</h2>
            <p className="lesson-panel-subtext">
              Capture the outcome straight after the session so the student profile and next lesson
              start with context.
            </p>

            <form onSubmit={handleSaveReview}>
              <div className="lesson-form-grid">
                <div className="lesson-field">
                  <label>Lesson status</label>
                  <select
                    style={inputStyle}
                    value={review.status}
                    onChange={(e) => setReview({ ...review, status: e.target.value })}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="follow-up">Needs follow-up</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="lesson-field">
                  <label>Coach score</label>
                  <select
                    style={inputStyle}
                    value={review.coachScore}
                    onChange={(e) =>
                      setReview({ ...review, coachScore: Number(e.target.value) })
                    }
                  >
                    <option value={1}>1 - Rough lesson</option>
                    <option value={2}>2 - Needs support</option>
                    <option value={3}>3 - Solid base</option>
                    <option value={4}>4 - Strong drive</option>
                    <option value={5}>5 - Very test ready</option>
                  </select>
                </div>
                <div className="lesson-field">
                  <label>Payment status</label>
                  <select
                    style={inputStyle}
                    value={review.paymentStatus}
                    onChange={(e) => setReview({ ...review, paymentStatus: e.target.value })}
                  >
                    <option value="pending">Unpaid</option>
                    <option value="cash">Paid — Cash</option>
                    <option value="card">Paid — Card</option>
                    <option value="bank">Paid — Bank Transfer</option>
                    <option value="package">Covered by package</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>
                <div className="lesson-field">
                  <label>Follow-up</label>
                  <label className="lesson-review-skill" style={{ marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      checked={review.followUpNeeded}
                      onChange={(e) =>
                        setReview({ ...review, followUpNeeded: e.target.checked })
                      }
                    />
                    <span>Flag for follow-up before next lesson</span>
                  </label>
                </div>
              </div>

              <div className="lesson-field">
                <label>Skills covered</label>
                <div className="lesson-review-skill-grid">
                  {SKILL_DEFINITIONS.map((skill) => (
                    <label key={skill.key} className="lesson-review-skill">
                      <input
                        type="checkbox"
                        checked={review.skillsCovered.includes(skill.key)}
                        onChange={() => toggleSkill(skill.key)}
                      />
                      <span>{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="lesson-field">
                <label>Strengths</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "74px", resize: "vertical" }}
                  placeholder="What went well in this lesson?"
                  value={review.strengths}
                  onChange={(e) => setReview({ ...review, strengths: e.target.value })}
                />
              </div>

              <div className="lesson-field">
                <label>Next focus</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "74px", resize: "vertical" }}
                  placeholder="What should the next lesson target?"
                  value={review.focusNext}
                  onChange={(e) => setReview({ ...review, focusNext: e.target.value })}
                />
              </div>

              <div className="lesson-field">
                <label>Homework / practice</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "74px", resize: "vertical" }}
                  placeholder="What should the student practise before next time?"
                  value={review.homework}
                  onChange={(e) => setReview({ ...review, homework: e.target.value })}
                />
              </div>

              <div className="lesson-field">
                <label>Private notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "74px", resize: "vertical" }}
                  placeholder="Private instructor notes"
                  value={review.privateNotes}
                  onChange={(e) => setReview({ ...review, privateNotes: e.target.value })}
                />
              </div>

              <div className="lesson-review-toolbar">
                <button type="submit" disabled={reviewSaving}>
                  {reviewSaving ? "Saving..." : "Save Review"}
                </button>
                {lesson.studentId && (
                  <button
                    type="button"
                    className="lesson-secondary-button"
                    onClick={handleSendReviewSummary}
                  >
                    Send Review Summary
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="lesson-panel">
            <h2>Instructor Actions</h2>
            <p className="lesson-panel-subtext">
              Shortcuts for the actions you typically take after opening a lesson.
            </p>

            <div className="lesson-review-toolbar">
              {lesson.studentId && (
                <Link to={`/students/${lesson.studentId}`}>
                  <button type="button">Open Student Profile</button>
                </Link>
              )}
              {lesson.studentId && (
                <Link to={`/messages/${lesson.studentId}`}>
                  <button type="button">Open Messages</button>
                </Link>
              )}
              <Link to={`/lessons/${id}/invoice`}>
                <button type="button">🧾 Generate Invoice</button>
              </Link>
              <Link to="/book-lesson">
                <button type="button">Book Next Lesson</button>
              </Link>
              {lesson.studentId && (
                <button
                  type="button"
                  className="lesson-warning-button"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel and Notify
                </button>
              )}
              <button
                type="button"
                className="lesson-danger-button"
                onClick={handleDelete}
              >
                Delete Lesson
              </button>
            </div>

            {showCancelModal && (
              <div className="lesson-cancel-modal">
                <h3>Cancel This Lesson</h3>
                <p>Enter a reason (optional). The student will be notified via messages.</p>
                <textarea
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  placeholder="e.g. Instructor unavailable, car issue, rescheduling..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="lesson-review-toolbar" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className="lesson-warning-button"
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                  <button
                    type="button"
                    className="lesson-secondary-button"
                    onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                  >
                    Keep Lesson
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="lesson-panel">
            <h2>Review Snapshot</h2>
            <p className="lesson-panel-subtext">
              Current review state for quick scanning before you leave the page.
            </p>

            <div className="lesson-info-grid">
              <div className="lesson-info-card">
                <span>Status</span>
                <strong>{review.status}</strong>
              </div>
              <div className="lesson-info-card">
                <span>Coach score</span>
                <strong>{review.coachScore}/5</strong>
              </div>
              <div className="lesson-info-card">
                <span>Payment</span>
                <strong>
                  {{ pending: "Unpaid", cash: "Cash", card: "Card", bank: "Bank Transfer", package: "Package", paid: "Paid", waived: "Waived" }[review.paymentStatus] || review.paymentStatus}
                </strong>
              </div>
              <div className="lesson-info-card">
                <span>Follow-up</span>
                <strong>{review.followUpNeeded ? "Required" : "Not flagged"}</strong>
              </div>
            </div>

            {review.skillsCovered.length > 0 && (
              <div className="lesson-success-panel">
                <strong>Skills covered</strong>
                <div className="lesson-chip-row" style={{ marginTop: "10px" }}>
                  {review.skillsCovered.map((skillKey) => {
                    const skill = SKILL_DEFINITIONS.find((item) => item.key === skillKey);
                    return (
                      <span key={skillKey} className="lesson-chip">
                        {skill?.label || skillKey}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {(review.strengths || review.focusNext || review.homework) && (
              <div className="lesson-success-panel">
                {review.strengths && (
                  <p style={{ marginTop: 0 }}>
                    <strong>Strengths:</strong> {review.strengths}
                  </p>
                )}
                {review.focusNext && (
                  <p>
                    <strong>Next focus:</strong> {review.focusNext}
                  </p>
                )}
                {review.homework && (
                  <p style={{ marginBottom: 0 }}>
                    <strong>Homework:</strong> {review.homework}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

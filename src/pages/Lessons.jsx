import React, { useEffect, useMemo, useState } from "react";
import { getLessons, getLessonsForStudent, deleteLesson } from "../firebase";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./Lessons.css";

const STATUS_COLORS = {
  scheduled: { bg: "rgba(196, 106, 45, 0.12)", text: "#8f491d" },
  completed: { bg: "rgba(47, 107, 95, 0.12)", text: "#236f56" },
  cancelled: { bg: "rgba(194, 75, 67, 0.12)", text: "#a4463f" },
  "no-show": { bg: "rgba(185, 109, 30, 0.12)", text: "#996024" }
};

const PAYMENT_COLORS = {
  paid: "#236f56",
  cash: "#236f56",
  card: "#236f56",
  bank: "#236f56",
  package: "#236f56",
  waived: "#6e7b83",
  pending: "#b96d1e"
};

function isUpcomingLesson(lesson) {
  const dateTime = new Date(`${lesson.date}T${lesson.time || "00:00"}`);
  return dateTime >= new Date() && (!lesson.review?.status || lesson.review?.status === "scheduled");
}

function formatLessonDateParts(dateString) {
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: "--", month: "Date", dow: "TBD" };
  }
  return {
    day: String(parsed.getDate()).padStart(2, "0"),
    month: parsed.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    dow: parsed.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()
  };
}

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const studentId = searchParams.get("studentId");

  useEffect(() => {
    async function load() {
      try {
        const data = studentId ? await getLessonsForStudent(studentId) : await getLessons();
        setLessons(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      } catch {
        showToast("Failed to load lessons", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId, showToast]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(id);
      setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
      showToast("Lesson deleted", "success");
    } catch {
      showToast("Failed to delete lesson", "error");
    }
  }

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchSearch =
        !search ||
        (lesson.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (lesson.date || "").includes(search) ||
        (lesson.notes || "").toLowerCase().includes(search.toLowerCase());
      const status = lesson.review?.status || "scheduled";
      const payment = lesson.review?.paymentStatus || "pending";
      const matchStatus = filterStatus === "all" || status === filterStatus;
      const matchPayment =
        filterPayment === "all" ||
        (filterPayment === "paid" && ["paid", "cash", "card", "bank", "package"].includes(payment)) ||
        (filterPayment === "unpaid" && ["pending", ""].includes(payment));
      return matchSearch && matchStatus && matchPayment;
    });
  }, [lessons, search, filterStatus, filterPayment]);

  const upcoming = filtered.filter((lesson) => isUpcomingLesson(lesson));
  const past = filtered.filter((lesson) => !upcoming.includes(lesson));
  const completedCount = lessons.filter((lesson) => lesson.review?.status === "completed").length;
  const cancelledCount = lessons.filter((lesson) => lesson.review?.status === "cancelled").length;
  const paidCount = lessons.filter((lesson) => ["paid", "cash", "card", "bank", "package"].includes(lesson.review?.paymentStatus)).length;

  if (loading) {
    return (
      <div className="lessons-page">
        <div className="lessons-loading-shell">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className="lessons-page">
      <section className="lessons-hero">
        <div className="lessons-hero-copy">
          <span className="lessons-eyebrow">{studentId ? "Student schedule" : "Lesson planner"}</span>
          <h1>{studentId ? "Student Lessons" : "All Lessons"}</h1>
          <p>
            Track upcoming drives, spot unpaid sessions quickly, and keep the diary feeling calm
            instead of crowded.
          </p>
        </div>
        <div className="lessons-header-actions">
          {studentId && (
            <button className="lessons-btn-outline" onClick={() => navigate("/lessons")}>
              View All
            </button>
          )}
          <button className="lessons-btn-primary" onClick={() => navigate("/book-lesson")}>
            + Book Lesson
          </button>
        </div>
      </section>

      <div className="lessons-summary-grid">
        <article className="lessons-summary-card">
          <span className="lessons-summary-label">Total lessons</span>
          <strong className="lessons-summary-value">{lessons.length}</strong>
          <p className="lessons-summary-note">Everything currently on the books.</p>
        </article>
        <article className="lessons-summary-card">
          <span className="lessons-summary-label">Upcoming</span>
          <strong className="lessons-summary-value">{upcoming.length}</strong>
          <p className="lessons-summary-note">Scheduled drives still ahead.</p>
        </article>
        <article className="lessons-summary-card">
          <span className="lessons-summary-label">Completed</span>
          <strong className="lessons-summary-value">{completedCount}</strong>
          <p className="lessons-summary-note">Lessons marked as finished.</p>
        </article>
        <article className="lessons-summary-card">
          <span className="lessons-summary-label">Paid</span>
          <strong className="lessons-summary-value">{paidCount}</strong>
          <p className="lessons-summary-note">{cancelledCount} cancelled sessions in the log.</p>
        </article>
      </div>

      <section className="lessons-filter-panel">
        <div className="lessons-filter-copy">
          <h2>Refine the list</h2>
          <p>Search by learner, date, or notes, then narrow things down by status or payment.</p>
        </div>
        <div className="lessons-filters">
          <input
            className="lessons-search"
            type="text"
            placeholder="Search student, date, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No show</option>
          </select>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="lessons-empty">No lessons match your current filters.</div>
      )}

      {upcoming.length > 0 && (
        <section className="lessons-section">
          <h2>Upcoming</h2>
          <div className="lessons-list">
            {upcoming.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="lessons-section">
          <h2>Past Lessons</h2>
          <div className="lessons-list">
            {past.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} onDelete={handleDelete} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LessonCard({ lesson, onDelete, past }) {
  const status = lesson.review?.status || "scheduled";
  const payment = lesson.review?.paymentStatus || "pending";
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.scheduled;
  const payColor = PAYMENT_COLORS[payment] || PAYMENT_COLORS.pending;
  const isPaid = ["paid", "cash", "card", "bank", "package"].includes(payment);
  const dateParts = formatLessonDateParts(lesson.date);

  return (
    <article className={`lesson-card-new ${past ? "past" : "upcoming"}`}>
      <div className="lesson-card-left">
        <div className="lesson-card-date">
          <span className="lesson-date-month">{dateParts.month}</span>
          <strong>{dateParts.day}</strong>
          <span className="lesson-date-dow">{dateParts.dow}</span>
        </div>
      </div>
      <div className="lesson-card-body">
        <div className="lesson-card-top-row">
          <div>
            <h3>{lesson.studentName || "Unknown Student"}</h3>
            <p className="lesson-card-time">{lesson.time || "Time not set"}</p>
          </div>
          <span
            className="lesson-status-badge"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {status}
          </span>
        </div>

        <div className="lesson-card-meta">
          <span>{lesson.duration || 1}hr with {lesson.instructor || "Instructor"}</span>
          {lesson.notes && <span>{lesson.notes}</span>}
        </div>

        <div className="lesson-card-footer">
          <span className="lesson-payment" style={{ color: payColor }}>
            {isPaid ? "Paid" : payment === "waived" ? "Waived" : "Unpaid"}
          </span>
          <div className="lesson-card-actions">
            <Link to={`/lessons/${lesson.id}`} className="lesson-link-btn">Review</Link>
            {lesson.studentId && (
              <Link to={`/students/${lesson.studentId}`} className="lesson-link-btn">
                Student
              </Link>
            )}
            <button className="lesson-delete-btn" onClick={() => onDelete(lesson.id)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { getStudents, deleteStudent } from "../firebase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getProgressSummary,
  getUpcomingTestText,
  normalizeStudentInsights
} from "../utils/instructorInsights";
import LanguageBadge from "../components/LanguageBadge";
import { LANGUAGES } from "../config/languages";
import "./Students.css";

function whatsappLink(phone, name, instructor) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("44")
    ? digits
    : digits.startsWith("0")
      ? "44" + digits.slice(1)
      : "44" + digits;
  const msg = encodeURIComponent(
    `Hi ${name || ""}, just a reminder about your upcoming driving lesson with ${instructor || "your instructor"}!`
  );
  return `https://wa.me/${intl}?text=${msg}`;
}

function StudentAvatar({ name, picture }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (picture) {
    return <img src={picture} alt="" className="student-avatar-img" />;
  }
  return <div className="student-avatar-initials">{initial}</div>;
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [langFilter, setLangFilter] = useState("");
  const { showToast } = useToast();
  const { instructorName } = useAuth();

  useEffect(() => {
    getStudents()
      .then((data) => setStudents(data.map(normalizeStudentInsights)))
      .catch(() => showToast("Failed to load students", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const studentSummaries = useMemo(() => {
    return students.map((student) => ({
      student,
      summary: getProgressSummary(student),
      testText: getUpcomingTestText(student)
    }));
  }, [students]);

  const filteredSummaries = langFilter
    ? studentSummaries.filter(({ student }) => (student.language || "en") === langFilter)
    : studentSummaries;

  const readyCount = studentSummaries.filter(({ summary }) => summary.readiness === "Test ready").length;
  const bookedTests = students.filter((student) => student.practicalTestDate && !student.testPassed).length;
  const focusCount = students.filter((student) => student.nextFocus || student.riskLevel === "watch").length;

  async function handleDelete(e, id, name) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete ${name || "this student"}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteStudent(id);
      setStudents((prev) => prev.filter((student) => student.id !== id));
      showToast("Student deleted", "success");
    } catch {
      showToast("Failed to delete student", "error");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="students-page">
        <div className="students-loading-shell">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="students-page">
      <section className="students-hero">
        <div className="students-hero-copy">
          <span className="students-eyebrow">Learner roster</span>
          <h1>Students</h1>
          <p>
            Keep a clear view of readiness, booked tests, and the learners who need a tighter
            follow-up plan this week.
          </p>
        </div>
        <Link to="/students/add" className="students-add-link">
          <button>+ Add Student</button>
        </Link>
      </section>

      <div className="students-summary-grid">
        <article className="students-summary-card">
          <span className="students-summary-label">Total learners</span>
          <strong className="students-summary-value">{students.length}</strong>
          <p className="students-summary-note">Your active student roster.</p>
        </article>
        <article className="students-summary-card">
          <span className="students-summary-label">Test ready</span>
          <strong className="students-summary-value">{readyCount}</strong>
          <p className="students-summary-note">Students close to driving test standard.</p>
        </article>
        <article className="students-summary-card">
          <span className="students-summary-label">Tests booked</span>
          <strong className="students-summary-value">{bookedTests}</strong>
          <p className="students-summary-note">Upcoming practical tests already in the diary.</p>
        </article>
        <article className="students-summary-card">
          <span className="students-summary-label">Needs focus</span>
          <strong className="students-summary-value">{focusCount}</strong>
          <p className="students-summary-note">Learners flagged for the next lesson plan.</p>
        </article>
      </div>

      {students.length > 0 && (
        <div className="students-filter-row">
          <select
            className="students-lang-filter"
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      {students.length === 0 && (
        <div className="students-empty">
          <p>No students yet.</p>
          <Link to="/students/add">
            <button>Add your first student</button>
          </Link>
        </div>
      )}

      <div className="students-list">
        {filteredSummaries.map(({ student, summary, testText }) => {
          const waLink = whatsappLink(student.phone, student.name, instructorName);

          return (
            <article key={student.id} className="student-card">
              <Link to={`/students/${student.id}`} className="student-card-link">
                <StudentAvatar name={student.name} picture={student.profilePicture} />
                <div className="student-card-body">
                  <div className="student-card-head">
                    <h3>{student.name || "Unnamed Student"}</h3>
                    <p>{student.phone || "No phone"} | {student.transmission || "Transmission not set"}</p>
                  </div>

                  <div className="student-card-chip-row">
                    <span className={`student-readiness-pill ${summary.tone}`}>
                      {summary.readiness}
                    </span>
                    <LanguageBadge code={student.language} />
                    {student.theoryPassed && <span className="student-card-chip">Theory passed</span>}
                    {student.testPassed && (
                      <span className="student-card-chip student-card-chip-gold">Test passed</span>
                    )}
                    {student.practicalTestDate && !student.testPassed && (
                      <span className="student-card-chip">{testText}</span>
                    )}
                  </div>

                  <div className="student-card-progress">
                    <div className="student-card-progress-top">
                      <span>Progress</span>
                      <strong>{summary.percent}%</strong>
                    </div>
                    <div className="student-card-progress-track">
                      <div
                        className="student-card-progress-fill"
                        style={{ width: `${summary.percent}%` }}
                      />
                    </div>
                  </div>

                  {student.nextFocus && (
                    <p className="student-card-note">Next focus: {student.nextFocus}</p>
                  )}
                </div>
              </Link>

              <div className="student-card-actions">
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="student-card-wa-btn"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  className="student-card-delete-btn"
                  onClick={(e) => handleDelete(e, student.id, student.name)}
                  disabled={deleting === student.id}
                >
                  {deleting === student.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

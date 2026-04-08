import React, { useEffect, useState } from "react";
import { getStudent, getLessonsForStudent, getInstructorProfile } from "../firebase";
import { useParams, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import {
  SKILL_DEFINITIONS,
  SKILL_LEVEL_LABELS,
  getProgressSummary,
  getUpcomingTestText,
  normalizeStudentInsights,
  normalizeLessonReview
} from "../utils/instructorInsights";
import "./StudentReport.css";

const TONE_COLOR = {
  ready: "#10b981",
  steady: "#3b82f6",
  developing: "#f59e0b",
  early: "#9ca3af",
  watch: "#ef4444",
};

export default function StudentReport() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [iProfile, setIProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, l, p] = await Promise.all([getStudent(id), getLessonsForStudent(id), getInstructorProfile().catch(() => null)]);
        if (!s) { showToast("Student not found", "error"); return; }
        setStudent(normalizeStudentInsights(s));
        setLessons(l.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
        if (p) setIProfile(p);
      } catch {
        showToast("Failed to load report", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading) return <p style={{ padding: "20px" }}>Loading report...</p>;
  if (!student) return <p style={{ padding: "20px" }}>Student not found.</p>;

  const summary = getProgressSummary(student);
  const testText = getUpcomingTestText(student);
  const completed = lessons.filter(l => l.review?.status === "completed");
  const upcoming = lessons.filter(l => {
    const dt = new Date(`${l.date}T${l.time || "00:00"}`);
    return dt >= new Date() && (!l.review?.status || l.review.status === "scheduled");
  });

  const lastReview = completed.find(l => l.review?.strengths || l.review?.focusNext);
  const review = lastReview ? normalizeLessonReview(lastReview) : null;

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="report-wrap">
      <div className="report-no-print">
        <Link to={`/students/${id}`}>
          <button style={{ marginBottom: "16px" }}>← Back to Profile</button>
        </Link>
        <button className="report-print-btn" onClick={() => window.print()}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="report-page">
        <div className="report-header">
          <div>
            <div className="report-logo">Pass with {iProfile?.name || "Instructor"}</div>
            <div className="report-subtitle">Student Progress Report</div>
          </div>
          <div className="report-date">Generated {today}</div>
        </div>

        <div className="report-student-info">
          <div className="report-avatar">
            {student.profilePicture
              ? <img src={student.profilePicture} alt="profile" />
              : <span>{(student.name || "?").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <h1>{student.name || "Unknown Student"}</h1>
            <div className="report-meta-row">
              <span>{student.transmission || "Manual"} transmission</span>
              {student.phone && <span>📞 {student.phone}</span>}
              {student.email && <span>✉ {student.email}</span>}
            </div>
            <div className="report-badges">
              <span className="report-badge" style={{ background: TONE_COLOR[summary.tone] }}>
                {summary.readiness}
              </span>
              {student.theoryPassed && <span className="report-badge green">Theory Passed</span>}
              {testText && <span className="report-badge blue">{testText}</span>}
            </div>
          </div>
        </div>

        <div className="report-section-grid">
          <div className="report-stat-box">
            <span>Lessons Completed</span>
            <strong>{completed.length}</strong>
          </div>
          <div className="report-stat-box">
            <span>Upcoming Lessons</span>
            <strong>{upcoming.length}</strong>
          </div>
          <div className="report-stat-box">
            <span>Overall Progress</span>
            <strong>{summary.percent}%</strong>
          </div>
          <div className="report-stat-box">
            <span>Skills at Test Level</span>
            <strong>{summary.completedSkills}/{SKILL_DEFINITIONS.length}</strong>
          </div>
        </div>

        <div className="report-section">
          <h2>Overall Progress</h2>
          <div className="report-progress-bar-track">
            <div className="report-progress-bar-fill" style={{ width: `${summary.percent}%`, background: TONE_COLOR[summary.tone] }} />
          </div>
          <p style={{ textAlign: "right", fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{summary.percent}% — {summary.readiness}</p>
        </div>

        <div className="report-section">
          <h2>Skill Breakdown</h2>
          <div className="report-skills-grid">
            {SKILL_DEFINITIONS.map(skill => {
              const val = student.progress?.[skill.key] || 0;
              const label = SKILL_LEVEL_LABELS[val] || "Not started";
              const pct = (val / 5) * 100;
              const color = val >= 4 ? "#10b981" : val >= 3 ? "#3b82f6" : val >= 2 ? "#f59e0b" : "#e5e7eb";
              return (
                <div key={skill.key} className="report-skill-row">
                  <div className="report-skill-label">
                    <span>{skill.label}</span>
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                  </div>
                  <div className="report-skill-track">
                    <div className="report-skill-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(review || student.nextFocus) && (
          <div className="report-section">
            <h2>Instructor Notes</h2>
            <div className="report-notes-grid">
              {review?.strengths && (
                <div className="report-note-box green-tint">
                  <strong>Strengths</strong>
                  <p>{review.strengths}</p>
                </div>
              )}
              {(review?.focusNext || student.nextFocus) && (
                <div className="report-note-box amber-tint">
                  <strong>Areas to Focus</strong>
                  <p>{review?.focusNext || student.nextFocus}</p>
                </div>
              )}
              {review?.homework && (
                <div className="report-note-box blue-tint">
                  <strong>Practice at Home</strong>
                  <p>{review.homework}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {student.practicalTestDate && (
          <div className="report-section">
            <h2>Test Information</h2>
            <div className="report-test-row">
              <div>
                <strong>Practical Test Date</strong>
                <p>{new Date(student.practicalTestDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              {student.theoryTestDate && (
                <div>
                  <strong>Theory Test Date</strong>
                  <p>{new Date(student.theoryTestDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="report-section">
            <h2>Upcoming Lessons</h2>
            <div className="report-lessons-list">
              {upcoming.slice(0, 5).map(l => (
                <div key={l.id} className="report-lesson-row">
                  <span>{l.date} at {l.time}</span>
                  <span>{l.duration || 1} hour{l.duration > 1 ? "s" : ""} with {l.instructor || "Instructor"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="report-footer">
          <p>Pass with {iProfile?.name || "Instructor"} · Generated {today}</p>
          <p>This report is for learning progress purposes only.</p>
        </div>
      </div>
    </div>
  );
}

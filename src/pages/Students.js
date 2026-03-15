import React, { useEffect, useState } from "react";
import { getStudents, deleteStudent } from "../firebase";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import {
  getProgressSummary,
  getUpcomingTestText,
  normalizeStudentInsights
} from "../utils/instructorInsights";
import "./Students.css";

function whatsappLink(phone, name) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("44") ? digits : digits.startsWith("0") ? "44" + digits.slice(1) : "44" + digits;
  const msg = encodeURIComponent(`Hi ${name || ""}, just a reminder about your upcoming driving lesson with Ravi!`);
  return `https://wa.me/${intl}?text=${msg}`;
}

function getInitialAvatar(name) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  const colors = ["#4A90E2", "#F5A623", "#7ED321", "#BD10E0", "#50E3C2"];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: "50px", height: "50px", borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "22px", color: "white", fontWeight: "bold", flexShrink: 0
    }}>
      {initial}
    </div>
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudents();
        setStudents(data.map((student) => normalizeStudentInsights(student)));
      } catch {
        showToast("Failed to load students", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  async function handleDelete(e, id, name) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete ${name || "this student"}?`)) return;
    try {
      await deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      showToast("Student deleted", "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error: " + (err?.code || err?.message || "Failed to delete"), "error");
    }
  }

  if (loading) return <p style={{ padding: "20px" }}>Loading students...</p>;

  return (
    <div className="students-page">
      <div className="students-toolbar">
        <div>
          <h1>Students</h1>
          <p>Track readiness, next focus, and lesson momentum across your full learner list.</p>
        </div>
        <Link to="/students/add">
          <button style={{ background: "#2563eb", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            + Add Student
          </button>
        </Link>
      </div>

      {students.length === 0 && (
        <p style={{ color: "#888" }}>No students yet. Add your first student!</p>
      )}

      <div className="students-list">
        {students.map((s) => {
          const summary = getProgressSummary(s);
          const testText = getUpcomingTestText(s);

          return (
            <div key={s.id} className="student-card">
              <Link to={`/students/${s.id}`} className="student-card-link">
                {s.profilePicture
                ? <img src={s.profilePicture} alt="profile" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
                : getInitialAvatar(s.name)
                }
                <div className="student-card-body">
                  <div className="student-card-head">
                    <h3>{s.name || "Unnamed Student"}</h3>
                    <p>{s.phone || "No phone"} | {s.transmission || "N/A"} transmission</p>
                  </div>

                  <div className="student-card-chip-row">
                    <span className={`student-readiness-pill ${summary.tone}`}>
                      {summary.readiness}
                    </span>
                    {s.theoryPassed && <span className="student-card-chip">Theory passed</span>}
                    {s.practicalTestDate && (
                      <span className="student-card-chip">{testText}</span>
                    )}
                  </div>

                  <div className="student-card-progress">
                    <div className="student-card-progress-top">
                      <span>Overall progress</span>
                      <strong>{summary.percent}%</strong>
                    </div>
                    <div className="student-card-progress-track">
                      <div
                        className="student-card-progress-fill"
                        style={{ width: `${summary.percent}%` }}
                      />
                    </div>
                  </div>

                  <p className="student-card-note">
                    Next focus: {s.nextFocus || "Not set yet"}
                  </p>
                </div>
              </Link>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {s.testPassed && (
                  <span title="Test Passed!" style={{ fontSize: "18px" }}>🏆</span>
                )}
                {s.phone && (
                  <a
                    href={whatsappLink(s.phone, s.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ background: "#25d366", color: "white", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", textDecoration: "none" }}
                  >
                    💬
                  </a>
                )}
                <button
                  onClick={(e) => handleDelete(e, s.id, s.name)}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStudent } from "../firebase";
import { useToast } from "../context/ToastContext";

export default function TestDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudent(id);
        setStudent(data);
      } catch {
        showToast("Failed to load test details", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (!student) return <p style={{ padding: "20px" }}>Student not found.</p>;

  const hasTest = !!student.testDate;

  return (
    <div style={{ maxWidth: "500px", padding: "20px" }}>
      <Link to={`/students/${id}`}>
        <button style={{ marginBottom: "20px", background: "none", border: "1px solid #ddd", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>
          Back to {student.name}
        </button>
      </Link>

      <h1 style={{ marginBottom: "6px" }}>Test Details</h1>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>{student.name}</p>

      {student.testPassed && (
        <div style={{ background: "#d1fae5", borderRadius: "10px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "32px" }}>🏆</div>
          <div style={{ fontWeight: "700", color: "#065f46", fontSize: "18px" }}>Test Passed!</div>
          {student.testPassedDate && <div style={{ color: "#065f46", fontSize: "14px" }}>{student.testPassedDate}</div>}
        </div>
      )}

      {hasTest ? (
        <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "20px" }}>
          {[
            ["Test Date", student.testDate],
            ["Test Time", student.testTime],
            ["Test Centre", student.testCentre],
            ["Booking Reference", student.testRef],
            ["Candidate Number", student.candidateNumber],
            ["Fee Status", student.testFeeStatus]
          ].map(([label, value]) => value ? (
            <div key={label} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontWeight: "600", minWidth: "160px", color: "#555" }}>{label}</span>
              <span style={{ color: "#111", textTransform: "capitalize" }}>{value}</span>
            </div>
          ) : null)}

          {student.testDate && !student.testPassed && (
            <div style={{ marginTop: "16px", background: "#eff6ff", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "14px", color: "#1e40af", fontWeight: "600" }}>
                {(() => {
                  const testDateTime = new Date(`${student.testDate}T${student.testTime || "09:00"}`);
                  const now = new Date();
                  const diff = testDateTime - now;
                  if (diff < 0) return "Test date has passed";
                  const days = Math.floor(diff / 86400000);
                  return days === 0 ? "Test is today!" : `${days} day${days !== 1 ? "s" : ""} until test`;
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
          <p style={{ color: "#6b7280" }}>No test booked yet.</p>
          <Link to={`/students/${id}`}>
            <button style={{ marginTop: "10px", background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Add Test Booking
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

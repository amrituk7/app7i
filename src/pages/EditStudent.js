import React, { useEffect, useState } from "react";
import { getStudent, updateStudent, sendNotification } from "../firebase";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import ProfilePicture from "../components/ProfilePicture";
import {
  DEFAULT_PROGRESS,
  SKILL_DEFINITIONS,
  SKILL_LEVEL_LABELS,
  normalizeStudentInsights
} from "../utils/instructorInsights";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "15px",
  marginBottom: "14px",
  boxSizing: "border-box"
};

const sectionStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px"
};

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const found = await getStudent(id);
        if (!found) {
          showToast("Student not found", "error");
          navigate("/students");
          return;
        }
        setStudent(normalizeStudentInsights(found));
      } catch {
        showToast("Failed to load student", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!student.name?.trim()) {
      showToast("Please enter a name", "error");
      return;
    }
    if (!student.phone?.trim()) {
      showToast("Please enter a phone number", "error");
      return;
    }
    if (!student.email?.trim()) {
      showToast("Please enter an email address", "error");
      return;
    }

    setSaving(true);
    try {
      await updateStudent(id, {
        name: student.name.trim(),
        phone: student.phone.trim(),
        email: student.email.trim(),
        transmission: student.transmission || "manual",
        perfectDriver: student.perfectDriver || false,
        parkingPractice: student.parkingPractice || false,
        theoryPassed: student.theoryPassed || false,
        theoryTestDate: student.theoryTestDate || "",
        practicalTestDate: student.practicalTestDate || "",
        mockTestScore:
          student.mockTestScore === "" || student.mockTestScore === undefined
            ? ""
            : Number(student.mockTestScore),
        lessonBalance:
          student.lessonBalance === "" || student.lessonBalance === undefined
            ? ""
            : Number(student.lessonBalance),
        confidenceLevel: Number(student.confidenceLevel || 3),
        riskLevel: student.riskLevel || "steady",
        nextFocus: student.nextFocus?.trim() || "",
        progress: {
          ...DEFAULT_PROGRESS,
          ...(student.progress || {})
        }
      });
      await sendNotification({
        title: "Student Updated",
        message: `${student.name}'s profile was updated`
      });
      showToast("Student updated!", "success");
      navigate(`/students/${id}`);
    } catch {
      showToast("Failed to update student", "error");
      setSaving(false);
    }
  }

  function updateProgress(skillKey, value) {
    setStudent((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        [skillKey]: Number(value)
      }
    }));
  }

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (!student) return <p style={{ padding: "20px" }}>Student not found</p>;

  return (
    <div style={{ maxWidth: "900px" }}>
      <Link to={`/students/${id}`}>
        <button
          type="button"
          style={{
            marginBottom: "20px",
            background: "none",
            border: "1px solid #ddd",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Back to Profile
        </button>
      </Link>

      <h1 style={{ marginBottom: "24px" }}>Edit Student</h1>

      <div style={{ marginBottom: "24px" }}>
        <ProfilePicture
          studentId={student.id}
          studentName={student.name}
          profilePicture={student.profilePicture}
          editable={true}
          size="large"
          onUpdate={(url) => setStudent((prev) => ({ ...prev, profilePicture: url }))}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Core Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Full Name
              </label>
              <input
                style={inputStyle}
                placeholder="Name"
                value={student.name || ""}
                onChange={(e) => setStudent({ ...student, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Phone Number
              </label>
              <input
                style={inputStyle}
                placeholder="Phone"
                value={student.phone || ""}
                onChange={(e) => setStudent({ ...student, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Email Address
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="student@example.com"
                value={student.email || ""}
                onChange={(e) => setStudent({ ...student, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Transmission
              </label>
              <select
                style={inputStyle}
                value={student.transmission || "manual"}
                onChange={(e) => setStudent({ ...student, transmission: e.target.value })}
              >
                <option value="manual">Manual</option>
                <option value="auto">Automatic</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Next Focus
              </label>
              <input
                style={inputStyle}
                placeholder="Roundabouts, smooth stops..."
                value={student.nextFocus || ""}
                onChange={(e) => setStudent({ ...student, nextFocus: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={student.perfectDriver || false}
                onChange={(e) => setStudent({ ...student, perfectDriver: e.target.checked })}
              />
              <span>Perfect Driver</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={student.parkingPractice || false}
                onChange={(e) => setStudent({ ...student, parkingPractice: e.target.checked })}
              />
              <span>Needs Parking Practice</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={student.theoryPassed || false}
                onChange={(e) => setStudent({ ...student, theoryPassed: e.target.checked })}
              />
              <span>Theory Passed</span>
            </label>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Instructor Tracker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Practical Test Date
              </label>
              <input
                style={inputStyle}
                type="date"
                value={student.practicalTestDate || ""}
                onChange={(e) => setStudent({ ...student, practicalTestDate: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Theory Test Date
              </label>
              <input
                style={inputStyle}
                type="date"
                value={student.theoryTestDate || ""}
                onChange={(e) => setStudent({ ...student, theoryTestDate: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Mock Test Score
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={student.mockTestScore}
                onChange={(e) => setStudent({ ...student, mockTestScore: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Lesson Balance
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                placeholder="Hours or credits left"
                value={student.lessonBalance}
                onChange={(e) => setStudent({ ...student, lessonBalance: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Confidence Level
              </label>
              <select
                style={inputStyle}
                value={student.confidenceLevel || 3}
                onChange={(e) =>
                  setStudent({ ...student, confidenceLevel: Number(e.target.value) })
                }
              >
                <option value={1}>1 - Very low</option>
                <option value={2}>2 - Needs support</option>
                <option value={3}>3 - Steady</option>
                <option value={4}>4 - Confident</option>
                <option value={5}>5 - Test calm</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Watch Level
              </label>
              <select
                style={inputStyle}
                value={student.riskLevel || "steady"}
                onChange={(e) => setStudent({ ...student, riskLevel: e.target.value })}
              >
                <option value="steady">Steady</option>
                <option value="watch">Needs close follow-up</option>
              </select>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "8px" }}>Skill Progress Tracker</h2>
          <p style={{ marginTop: 0, marginBottom: "18px", color: "#64748b" }}>
            Keep each driving area on a 0-5 scale so readiness is visible across the app.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px 16px" }}>
            {SKILL_DEFINITIONS.map((skill) => (
              <div
                key={skill.key}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "14px"
                }}
              >
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                    color: "#0f172a"
                  }}
                >
                  {skill.label}
                </label>
                <select
                  style={{ ...inputStyle, marginBottom: "8px" }}
                  value={student.progress?.[skill.key] ?? 0}
                  onChange={(e) => updateProgress(skill.key, e.target.value)}
                >
                  {SKILL_LEVEL_LABELS.map((label, index) => (
                    <option key={label} value={index}>
                      {index} - {label}
                    </option>
                  ))}
                </select>
                <div style={{ height: "8px", borderRadius: "999px", background: "#e2e8f0", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${((student.progress?.[skill.key] ?? 0) / 5) * 100}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: "linear-gradient(90deg, #2563eb 0%, #10b981 100%)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            background: saving ? "#93c5fd" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

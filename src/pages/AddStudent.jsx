import React, { useState, useEffect } from "react";
import { addStudent, sendNotification, getStudents } from "../firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_PROGRESS } from "../utils/instructorInsights";

export default function AddStudent() {
  const location = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [transmission, setTransmission] = useState("");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isPremium } = useAuth();

  // Read prefill data from waiting list "Convert to Student"
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("prefill");
    if (!raw) return;
    try {
      const data = JSON.parse(decodeURIComponent(raw));
      if (data.name) setName(data.name);
      if (data.phone) setPhone(data.phone);
      if (data.email) setEmail(data.email);
      if (data.transmission) setTransmission(data.transmission);
      if (data.language) setLanguage(data.language);
    } catch {
      // bad param — ignore
    }
  }, [location.search]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { showToast("Please enter a name", "error"); return; }
    if (!phone.trim()) { showToast("Please enter a phone number", "error"); return; }
    if (!email.trim()) { showToast("Please enter an email address", "error"); return; }
    if (!transmission) { showToast("Please select a transmission type", "error"); return; }

    setSaving(true);
    try {
      const all = await getStudents();


      if (all.find(s => s.phone === phone.trim())) {
        showToast("A student with this phone number already exists", "error");
        setSaving(false);
        return;
      }
      if (all.find(s => (s.email || "").toLowerCase() === email.trim().toLowerCase())) {
        showToast("A student with this email already exists", "error");
        setSaving(false);
        return;
      }
      await addStudent({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        transmission,
        language: language || "en",
        perfectDriver: false,
        parkingPractice: false,
        theoryPassed: false,
        theoryTestDate: "",
        practicalTestDate: "",
        mockTestScore: "",
        lessonBalance: "",
        confidenceLevel: 3,
        riskLevel: "steady",
        nextFocus: "",
        progress: { ...DEFAULT_PROGRESS }
      });
      await sendNotification({ title: "New Student Added", message: `${name.trim()} has been added as a student` });
      showToast("Student added successfully!", "success");
      navigate("/students");
    } catch {
      showToast("Failed to add student. Please try again.", "error");
      setSaving(false);
    }
  }

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", marginBottom: "14px", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: "480px" }}>
      <Link to="/students">
        <button type="button" style={{ marginBottom: "20px", background: "none", border: "1px solid #ddd", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>
          ← Back to Students
        </button>
      </Link>

      <h1 style={{ marginBottom: "24px" }}>Add Student</h1>

      <form onSubmit={handleSubmit}>
        <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Full Name</label>
        <input style={inputStyle} placeholder="e.g. John Smith" value={name} onChange={e => setName(e.target.value)} />

        <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Phone Number</label>
        <input style={inputStyle} placeholder="e.g. 07700 900123" value={phone} onChange={e => setPhone(e.target.value)} />

        <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Email Address</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="e.g. student@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Transmission</label>
        <select style={inputStyle} value={transmission} onChange={e => setTransmission(e.target.value)}>
          <option value="">Select transmission type</option>
          <option value="manual">Manual</option>
          <option value="auto">Automatic</option>
        </select>

        <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Preferred Language</label>
        <select style={inputStyle} value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="pa">Punjabi</option>
          <option value="ur">Urdu</option>
        </select>

        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", padding: "12px", background: saving ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Adding..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}

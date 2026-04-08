import React, { useEffect, useState } from "react";
import { getStudents, addLesson, sendNotification, getLessons, getInstructorProfile } from "../firebase";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_LESSON_REVIEW } from "../utils/instructorInsights";

function addWeeks(dateStr, weeks) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export default function BookLesson() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("1");
  const [transmission, setTransmission] = useState("manual");
  const [lessonType, setLessonType] = useState("normal"); // normal | test-day
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [weeks, setWeeks] = useState("4");
  const [blockBooking, setBlockBooking] = useState(false);
  const [blockLessons, setBlockLessons] = useState("10");
  const [blockPrice, setBlockPrice] = useState("360");
  const [blockPaid, setBlockPaid] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { instructorName } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [data, iProfile] = await Promise.all([getStudents(), getInstructorProfile()]);
        setStudents(data);
        if (iProfile) setProfile(iProfile);
        const preselectedId = searchParams.get("studentId");
        if (preselectedId) setStudentId(preselectedId);
        const preDate = searchParams.get("date");
        if (preDate) setDate(preDate);
        const preTime = searchParams.get("time");
        if (preTime) setTime(preTime);
      } catch {
        showToast("Failed to load students", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchParams, showToast]);

  // Calculate the per-hour rate based on profile pricing, transmission, and day
  function calcRate(lessonDate) {
    if (lessonType === "test-day" && profile?.testDayFee) return Number(profile.testDayFee);
    const d = lessonDate ? new Date(lessonDate) : new Date();
    const isSunday = d.getDay() === 0;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (transmission === "auto") {
      if (isSunday && profile?.autoSundayRate) return Number(profile.autoSundayRate);
      if (!isSunday && profile?.autoWeekdayRate) return Number(profile.autoWeekdayRate);
      if (isWeekend && profile?.autoWeekendRate) return Number(profile.autoWeekendRate);
    } else {
      if (profile?.manualRate) return Number(profile.manualRate);
      if (!isWeekend && profile?.manualWeekdayRate) return Number(profile.manualWeekdayRate);
      if (isWeekend && profile?.manualWeekendRate) return Number(profile.manualWeekendRate);
    }
    return Number(profile?.hourlyRate) || 35;
  }

  // When block booking is toggled on, turn off recurring and vice versa
  function handleBlockToggle(checked) {
    setBlockBooking(checked);
    if (checked) setRecurring(false);
  }
  function handleRecurringToggle(checked) {
    setRecurring(checked);
    if (checked) setBlockBooking(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!studentId) { showToast("Please select a student", "error"); return; }
    if (!date) { showToast("Please select a date", "error"); return; }
    if (!time) { showToast("Please select a time", "error"); return; }

    const student = students.find(s => s.id === studentId);
    if (!student) { showToast("Student not found", "error"); return; }

    // Double-booking check
    try {
      const existing = await getLessons();
      const conflict = existing.find(
        (l) => l.date === date && l.time === time && l.review?.status !== "cancelled"
      );
      if (conflict) {
        showToast(`Booking conflict: ${conflict.studentName || "Another student"} already has a lesson on ${date} at ${time}.`, "error");
        return;
      }
    } catch {
      showToast("Could not verify conflicts — booking anyway.", "error");
    }

    const totalLessons = blockBooking ? Number(blockLessons) : recurring ? Number(weeks) : 1;

    setSaving(true);
    setSavedCount(0);

    try {
      // Generate a package ID for block bookings
      const packageId = blockBooking ? `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null;
      const pkgPrice = blockBooking ? Number(blockPrice) || 0 : null;
      const pkgSize = blockBooking ? totalLessons : null;

      for (let i = 0; i < totalLessons; i++) {
        const lessonDate = i === 0 ? date : addWeeks(date, i);
        const review = { ...DEFAULT_LESSON_REVIEW };

        // If block booking and paid upfront, mark all lessons
        if (blockBooking && blockPaid) {
          review.paymentStatus = blockPaid;
        }

        const rateApplied = calcRate(lessonDate);

        const lessonData = {
          studentId,
          studentName: student.name || "Unknown",
          studentPhone: student.phone || "",
          studentEmail: student.email || "",
          date: lessonDate,
          time,
          duration: Number(duration),
          transmission,
          lessonType,
          rateApplied,
          instructor: instructorName,
          notes: notes.trim(),
          review
        };

        // Add package metadata
        if (packageId) {
          lessonData.packageId = packageId;
          lessonData.packagePrice = pkgPrice;
          lessonData.packageSize = pkgSize;
        }

        await addLesson(lessonData);
        setSavedCount(i + 1);
      }

      await sendNotification({
        title: blockBooking ? "Block Booking Created" : recurring ? "Recurring Lessons Booked" : "Lesson Booked",
        message: blockBooking
          ? `${totalLessons}-lesson package for ${student.name} — £${blockPrice} (${blockPaid || "unpaid"})`
          : recurring
            ? `${totalLessons} lessons booked for ${student.name} starting ${date} at ${time}`
            : `Lesson for ${student.name} on ${date} at ${time}`
      });

      showToast(
        blockBooking ? `${totalLessons}-lesson package booked!` : recurring ? `${totalLessons} lessons booked!` : "Lesson booked!",
        "success"
      );
      navigate("/lessons");
    } catch {
      showToast("Failed to book lesson", "error");
      setSaving(false);
    }
  }

  const inp = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", marginBottom: "14px", boxSizing: "border-box" };
  const lbl = { fontWeight: "600", display: "block", marginBottom: "4px", fontSize: "14px" };
  const toggleBox = { background: "#f9fafb", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", border: "1px solid #e5e7eb" };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: "480px" }}>
      <Link to="/lessons">
        <button type="button" style={{ marginBottom: "20px", background: "none", border: "1px solid #ddd", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>
          Back to Lessons
        </button>
      </Link>

      <h1 style={{ marginBottom: "6px" }}>Book Lesson</h1>
      <p style={{ color: "#6b7280", marginBottom: "24px", fontSize: "14px" }}>
        Schedule a single lesson, recurring weekly, or a block package.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={lbl}>Student</label>
        <select style={inp} value={studentId} onChange={e => setStudentId(e.target.value)}>
          <option value="">Select a student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name || "Unnamed"}</option>
          ))}
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div>
            <label style={lbl}>Date</label>
            <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Time</label>
            <input style={inp} type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <label style={lbl}>Duration</label>
        <select style={inp} value={duration} onChange={e => setDuration(e.target.value)}>
          <option value="1">1 hour</option>
          <option value="1.5">1.5 hours</option>
          <option value="2">2 hours</option>
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div>
            <label style={lbl}>Transmission</label>
            <select style={inp} value={transmission} onChange={e => setTransmission(e.target.value)}>
              <option value="manual">Manual</option>
              <option value="auto">Automatic</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Lesson Type</label>
            <select style={inp} value={lessonType} onChange={e => setLessonType(e.target.value)}>
              <option value="normal">Normal Lesson</option>
              <option value="test-day">Test Day</option>
            </select>
          </div>
        </div>

        {date && (
          <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "14px", color: "#065f46" }}>
            Rate: <strong>£{calcRate(date)}{lessonType === "test-day" ? " (test day fee)" : "/hr"}</strong>
            {lessonType !== "test-day" && <span> · Total: £{(calcRate(date) * Number(duration)).toFixed(2)}</span>}
          </div>
        )}

        <label style={lbl}>Notes (optional)</label>
        <textarea
          style={{ ...inp, minHeight: "70px", resize: "vertical" }}
          placeholder="e.g. Focus on roundabouts, bay parking..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Recurring toggle */}
        <div style={toggleBox}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: recurring ? "12px" : "0" }}>
            <input
              type="checkbox"
              checked={recurring}
              onChange={e => handleRecurringToggle(e.target.checked)}
              style={{ width: "18px", height: "18px", margin: 0 }}
            />
            <span style={{ fontWeight: "600", fontSize: "14px" }}>Recurring — same time every week</span>
          </label>
          {recurring && (
            <div>
              <label style={{ ...lbl, marginTop: "4px" }}>Number of weeks</label>
              <select style={{ ...inp, marginBottom: 0 }} value={weeks} onChange={e => setWeeks(e.target.value)}>
                {[2,4,6,8,10,12].map(w => <option key={w} value={w}>{w} weeks</option>)}
              </select>
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                Will book {weeks} lessons every 7 days starting {date || "your chosen date"}.
              </p>
            </div>
          )}
        </div>

        {/* Block Booking toggle */}
        <div style={{ ...toggleBox, borderColor: blockBooking ? "#667eea" : "#e5e7eb", background: blockBooking ? "#f5f3ff" : "#f9fafb" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: blockBooking ? "12px" : "0" }}>
            <input
              type="checkbox"
              checked={blockBooking}
              onChange={e => handleBlockToggle(e.target.checked)}
              style={{ width: "18px", height: "18px", margin: 0 }}
            />
            <span style={{ fontWeight: "600", fontSize: "14px" }}>Block Package — discounted bundle</span>
          </label>
          {blockBooking && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <div>
                  <label style={lbl}>Number of lessons</label>
                  <select style={inp} value={blockLessons} onChange={e => setBlockLessons(e.target.value)}>
                    {[5,8,10,12,15,20].map(n => <option key={n} value={n}>{n} lessons</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Total price (£)</label>
                  <input
                    style={inp}
                    type="number"
                    min="0"
                    value={blockPrice}
                    onChange={e => setBlockPrice(e.target.value)}
                  />
                </div>
              </div>

              <p style={{ fontSize: "13px", color: "#667eea", fontWeight: "600", margin: "0 0 12px" }}>
                £{(Number(blockPrice) / Number(blockLessons)).toFixed(2)} per lesson · Saving vs £{((Number(duration) || 1) * calcRate(date) * Number(blockLessons)).toFixed(0)} at standard rate
              </p>

              <label style={lbl}>Has the student paid?</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { value: "", label: "Not yet", bg: "#f3f4f6", color: "#6b7280" },
                  { value: "cash", label: "Cash", bg: "#d1fae5", color: "#065f46" },
                  { value: "card", label: "Card", bg: "#dbeafe", color: "#1e40af" },
                  { value: "bank", label: "Bank Transfer", bg: "#ede9fe", color: "#5b21b6" }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBlockPaid(opt.value)}
                    style={{
                      padding: "8px 16px",
                      border: blockPaid === opt.value ? "2px solid #667eea" : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      background: opt.bg,
                      color: opt.color,
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    {blockPaid === opt.value ? "✓ " : ""}{opt.label}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
                {blockLessons} lessons booked weekly from {date || "your chosen date"}. {blockPaid ? `All marked as paid (${blockPaid}).` : "Payment pending — mark as paid later from Earnings."}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%", padding: "14px",
            background: saving ? "#6ee7b7" : blockBooking ? "linear-gradient(135deg, #667eea, #764ba2)" : "#10b981",
            color: "white", border: "none", borderRadius: "10px",
            fontSize: "16px", fontWeight: "bold", cursor: "pointer"
          }}
        >
          {saving
            ? `Booking ${savedCount}/${blockBooking ? blockLessons : recurring ? weeks : 1}...`
            : blockBooking
              ? `Book ${blockLessons}-Lesson Package — £${blockPrice}`
              : recurring
                ? `Book ${weeks} Weekly Lessons`
                : "Book Lesson"}
        </button>
      </form>
    </div>
  );
}

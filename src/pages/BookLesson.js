import React, { useEffect, useState } from "react";
import { getStudents, addLesson, sendNotification } from "../firebase";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function BookLesson() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [instructor, setInstructor] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudents();
        setStudents(data);
        
        // Pre-select student if provided in URL
        const preselectedId = searchParams.get("studentId");
        if (preselectedId) {
          setStudentId(preselectedId);
        }
      } catch (error) {
        console.error("Error loading students:", error);
        showToast("Failed to load students", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchParams, showToast]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!studentId) {
      showToast("Please select a student", "error");
      return;
    }
    if (!date) {
      showToast("Please select a date", "error");
      return;
    }
    if (!time) {
      showToast("Please select a time", "error");
      return;
    }
    if (!instructor.trim()) {
      showToast("Please enter an instructor name", "error");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      showToast("Selected student not found", "error");
      return;
    }

    setSaving(true);

    try {
      await addLesson({
        studentId,
        studentName: student.name || "Unknown",
        date,
        time,
        instructor: instructor.trim(),
        notes: notes.trim()
      });

      await sendNotification({
        title: "Lesson Booked",
        message: `Lesson booked for ${student.name || "Unknown"} on ${date}`
      });

      showToast("Lesson booked successfully", "success");
      navigate("/lessons");
    } catch (error) {
      console.error("Error booking lesson:", error);
      showToast("Failed to book lesson. Please try again.", "error");
      setSaving(false);
    }
  }

  if (loading) return <p>Loading students...</p>;

  return (
    <div>
      <Link to="/lessons">
        <button type="button" style={{ marginBottom: "20px" }}>Back to Lessons</button>
      </Link>

      <form onSubmit={handleSubmit}>
        <h1>Book Lesson</h1>

        <select value={studentId} onChange={e => setStudentId(e.target.value)}>
          <option value="">Select student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name || "Unnamed Student"}</option>
          ))}
        </select>

        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
        />
        <input 
          type="time" 
          value={time} 
          onChange={e => setTime(e.target.value)} 
        />
        <input 
          placeholder="Instructor" 
          value={instructor} 
          onChange={e => setInstructor(e.target.value)} 
        />
        <textarea 
          placeholder="Notes (optional)" 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
        />

        <button type="submit" disabled={saving}>
          {saving ? "Booking..." : "Book Lesson"}
        </button>
      </form>
    </div>
  );
}

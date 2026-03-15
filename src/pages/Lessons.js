import React, { useEffect, useState } from "react";
import { getLessons, getLessonsForStudent, deleteLesson } from "../firebase";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./Lessons.css";

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    async function load() {
      try {
        let data;
        if (studentId) {
          data = await getLessonsForStudent(studentId);
        } else {
          data = await getLessons();
        }
        setLessons(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      } catch (error) {
        console.error("Error loading lessons:", error);
        showToast("Failed to load lessons", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId, showToast]);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      await deleteLesson(id);
      setLessons(prev => prev.filter(l => l.id !== id));
      showToast("Lesson deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      showToast("Failed to delete lesson", "error");
    }
  }

  if (loading) return <p>Loading lessons...</p>;

  return (
    <div className="lessons-container">
      <Link to="/">
        <button type="button" style={{ marginBottom: "20px" }}>Back to Dashboard</button>
      </Link>

      <h1>
        {studentId ? "Lessons for Student" : "All Lessons"}
      </h1>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => navigate("/book-lesson")}>+ Book Lesson</button>
        {studentId && (
          <button onClick={() => navigate("/lessons")}>View All Lessons</button>
        )}
      </div>

      {lessons.length === 0 && <p>No lessons found.</p>}

      <div className="lessons-list">
        {lessons.map(lesson => (
          <div key={lesson.id} className="lesson-card">
            <h3>{lesson.studentName || "Unknown Student"}</h3>
            <p>Date: {lesson.date || "N/A"}</p>
            <p>Time: {lesson.time || "N/A"}</p>
            <p>Instructor: {lesson.instructor || "N/A"}</p>
            {lesson.notes && <p>Notes: {lesson.notes}</p>}

            <div className="actions" style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <Link to={`/lessons/${lesson.id}`}>View Details</Link>
              {lesson.studentId && (
                <Link to={`/students/${lesson.studentId}`}>View Student</Link>
              )}
              <button 
                onClick={() => handleDelete(lesson.id)}
                style={{ background: "#ef4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

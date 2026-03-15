import React, { useEffect, useState } from "react";
import { getLessons, deleteLesson } from "../firebase";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./LessonDetails.css";

export default function LessonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getLessons();
        const found = all.find(l => l.id === id);
        if (!found) {
          showToast("Lesson not found", "error");
          navigate("/lessons");
          return;
        }
        setLesson(found);
      } catch (error) {
        console.error("Error loading lesson:", error);
        showToast("Failed to load lesson", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast, navigate]);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      await deleteLesson(id);
      showToast("Lesson deleted successfully", "success");
      navigate("/lessons");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      showToast("Failed to delete lesson", "error");
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!lesson) return <p>Lesson not found</p>;

  return (
    <div className="lesson-details">
      <Link to="/lessons">
        <button type="button" style={{ marginBottom: "20px" }}>Back to Lessons</button>
      </Link>

      <h1>Lesson Details</h1>

      <p><strong>Student:</strong> {lesson.studentName || "Unknown"}</p>
      <p><strong>Date:</strong> {lesson.date || "N/A"}</p>
      <p><strong>Time:</strong> {lesson.time || "N/A"}</p>
      <p><strong>Instructor:</strong> {lesson.instructor || "N/A"}</p>
      <p><strong>Notes:</strong> {lesson.notes || "None"}</p>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        {lesson.studentId && (
          <Link to={`/students/${lesson.studentId}`}>
            <button>View Student Profile</button>
          </Link>
        )}
        <button onClick={handleDelete} style={{ background: "#ef4444" }}>
          Delete Lesson
        </button>
      </div>
    </div>
  );
}

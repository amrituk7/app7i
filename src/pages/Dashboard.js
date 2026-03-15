import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudents, getLessons } from "../firebase";
import "./Dashboard.css";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    manual: 0,
    auto: 0,
    perfect: 0,
    parking: 0,
    todayLessons: 0
  });

  useEffect(() => {
    async function load() {
      try {
        const [studentsData, lessonsData] = await Promise.all([
          getStudents(),
          getLessons()
        ]);
        
        setStudents(studentsData);
        setLessons(lessonsData);

        const today = new Date().toISOString().split("T")[0];
        
        setStats({
          total: studentsData.length,
          manual: studentsData.filter(s => s.transmission?.toLowerCase() === "manual").length,
          auto: studentsData.filter(s => s.transmission?.toLowerCase() === "auto").length,
          perfect: studentsData.filter(s => s.perfectDriver === true).length,
          parking: studentsData.filter(s => s.parkingPractice === true).length,
          todayLessons: lessonsData.filter(l => l.date === today).length
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const upcomingLessons = lessons
    .filter(l => new Date(l.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Instructor Dashboard</h1>
        <p>Welcome back! Here's an overview of your driving school.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-box total">
          <div className="stat-icon">S</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-box lessons">
          <div className="stat-icon">L</div>
          <div className="stat-content">
            <h3>{stats.todayLessons}</h3>
            <p>Lessons Today</p>
          </div>
        </div>

        <div className="stat-box manual">
          <div className="stat-icon">M</div>
          <div className="stat-content">
            <h3>{stats.manual}</h3>
            <p>Manual Learners</p>
          </div>
        </div>

        <div className="stat-box auto">
          <div className="stat-icon">A</div>
          <div className="stat-content">
            <h3>{stats.auto}</h3>
            <p>Auto Learners</p>
          </div>
        </div>

        <div className="stat-box perfect">
          <div className="stat-icon">P</div>
          <div className="stat-content">
            <h3>{stats.perfect}</h3>
            <p>Perfect Drivers</p>
          </div>
        </div>

        <div className="stat-box parking">
          <div className="stat-icon">K</div>
          <div className="stat-content">
            <h3>{stats.parking}</h3>
            <p>Parking Practice</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <div className="section-header">
            <h2>Recent Students</h2>
            <Link to="/students">View all</Link>
          </div>
          {students.length === 0 ? (
            <p className="empty-text">No students yet</p>
          ) : (
            <div className="recent-list">
              {students.slice(-5).reverse().map(s => (
                <Link key={s.id} to={`/students/${s.id}`} className="recent-card">
                  <div className="student-avatar">
                    {(s.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="student-info">
                    <h4>{s.name || "Unnamed"}</h4>
                    <span>{s.transmission || "N/A"} transmission</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-header">
            <h2>Upcoming Lessons</h2>
            <Link to="/lessons">View all</Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <p className="empty-text">No upcoming lessons</p>
          ) : (
            <div className="lessons-list">
              {upcomingLessons.map(l => (
                <Link key={l.id} to={`/lessons/${l.id}`} className="lesson-item">
                  <div className="lesson-date-box">
                    <span className="day">{new Date(l.date).getDate()}</span>
                    <span className="month">{new Date(l.date).toLocaleString("default", { month: "short" })}</span>
                  </div>
                  <div className="lesson-info">
                    <h4>{l.studentName || "Student"}</h4>
                    <span>{l.time || "TBD"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/students/add">
            <button>+ Add Student</button>
          </Link>
          <Link to="/book-lesson">
            <button style={{ background: "#10b981" }}>+ Book Lesson</button>
          </Link>
          <Link to="/tips">
            <button style={{ background: "#f59e0b" }}>+ Add Tip</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

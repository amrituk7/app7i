import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStudents, getLessons, getInstructorProfile, updateLesson } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getProgressSummary,
  getUpcomingTestText,
  normalizeLessonReview,
  normalizeStudentInsights
} from "../utils/instructorInsights";
import "./Dashboard.css";

// Icons as inline SVGs for cleaner code
function Icon({ name, size = 20 }) {
  const icons = {
    users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    car: <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h12l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M7 17a2 2 0 1 0 4 0M13 17a2 2 0 1 0 4 0" />,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />,
    lightbulb: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.9V17h8v-2.1A7 7 0 0 0 12 2z" /></>,
    chevronRight: <polyline points="9 18 15 12 9 6" />,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === "users" && <><circle cx="9" cy="7" r="4" />{icons.users}</>}
      {name === "calendar" && icons.calendar}
      {name === "car" && icons.car}
      {name === "clock" && icons.clock}
      {name === "award" && icons.award}
      {name === "target" && icons.target}
      {name === "plus" && icons.plus}
      {name === "book" && icons.book}
      {name === "lightbulb" && icons.lightbulb}
      {name === "chevronRight" && icons.chevronRight}
      {name === "trophy" && icons.trophy}
      {name === "alert" && icons.alert}
      {name === "dollar" && icons.dollar}
    </svg>
  );
}

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(35);
  const { showToast } = useToast();
  const { instructorName } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [studentsData, lessonsData, profile] = await Promise.all([
          getStudents(), getLessons(), getInstructorProfile()
        ]);
        if (profile?.hourlyRate) setRate(Number(profile.hourlyRate) || 35);
        setStudents(studentsData.map(normalizeStudentInsights));
        setLessons(lessonsData);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Computed data
  const stats = useMemo(() => ({
    total: students.length,
    manual: students.filter(s => s.transmission?.toLowerCase() === "manual").length,
    auto: students.filter(s => s.transmission?.toLowerCase() === "auto").length,
    todayLessons: lessons.filter(l => l.date === todayStr).length,
    tomorrowLessons: lessons.filter(l => l.date === tomorrowStr).length,
  }), [students, lessons, todayStr, tomorrowStr]);

  const todayLessons = useMemo(() =>
    lessons.filter(l => l.date === todayStr).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [lessons, todayStr]
  );

  const upcomingLessons = useMemo(() =>
    lessons.filter(l => new Date(l.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5),
    [lessons]
  );

  const readyStudents = useMemo(() =>
    students.filter(s => getProgressSummary(s).readiness === "Test ready").slice(0, 3),
    [students]
  );

  const unpaidLessons = useMemo(() =>
    lessons.filter(l => {
      const r = normalizeLessonReview(l);
      return r.status !== "scheduled" && r.status !== "cancelled" && 
        !["paid", "cash", "card", "bank", "package", "waived"].includes(r.paymentStatus);
    }),
    [lessons]
  );

  const unpaidTotal = useMemo(() =>
    unpaidLessons.reduce((sum, l) => sum + (Number(l.duration) || 1) * rate, 0),
    [unpaidLessons, rate]
  );

  const passedToday = useMemo(() =>
    students.filter(s => s.testPassed && s.testPassedDate === todayStr),
    [students, todayStr]
  );

  async function handleQuickPay(lessonId, method) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    try {
      const updatedReview = { ...lesson.review, paymentStatus: method };
      await updateLesson(lessonId, { review: updatedReview });
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, review: updatedReview } : l));
      showToast(`Marked as ${method}`, "success");
    } catch {
      showToast("Failed to update payment", "error");
    }
  }

  if (loading) {
    return (
      <div className="dash">
        <div className="dash-loading">
          <div className="dash-loading-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <h1>{greeting}, {instructorName || "Instructor"}</h1>
          <p>Here&apos;s what&apos;s happening with your driving school today.</p>
        </div>
        <div className="dash-header-actions">
          <Link to="/book-lesson" className="dash-btn dash-btn-primary">
            <Icon name="plus" size={16} />
            Book Lesson
          </Link>
          <Link to="/students/add" className="dash-btn dash-btn-secondary">
            Add Student
          </Link>
        </div>
      </header>

      {/* Celebration Banner */}
      {passedToday.length > 0 && (
        <div className="dash-banner dash-banner-success">
          <div className="dash-banner-icon">
            <Icon name="trophy" size={24} />
          </div>
          <div className="dash-banner-content">
            <strong>Test Passed Today!</strong>
            <p>{passedToday.map(s => s.name).join(", ")} passed their driving test. Congratulations!</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="dash-stats">
        <Link to="/students" className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon-green">
            <Icon name="users" size={22} />
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{stats.total}</span>
            <span className="dash-stat-label">Total Students</span>
          </div>
        </Link>

        <Link to="/lessons" className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon-blue">
            <Icon name="calendar" size={22} />
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{stats.todayLessons}</span>
            <span className="dash-stat-label">Lessons Today</span>
          </div>
        </Link>

        <Link to="/students" className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon-amber">
            <Icon name="car" size={22} />
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{stats.manual}</span>
            <span className="dash-stat-label">Manual Learners</span>
          </div>
        </Link>

        <Link to="/students" className="dash-stat">
          <div className="dash-stat-icon dash-stat-icon-purple">
            <Icon name="clock" size={22} />
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{stats.auto}</span>
            <span className="dash-stat-label">Auto Learners</span>
          </div>
        </Link>
      </div>

      {/* Today's Schedule */}
      {todayLessons.length > 0 && (
        <section className="dash-card">
          <div className="dash-card-header">
            <h2>Today&apos;s Schedule</h2>
            <Link to="/calendar" className="dash-card-link">
              View Calendar <Icon name="chevronRight" size={14} />
            </Link>
          </div>
          <div className="dash-schedule">
            {todayLessons.map((lesson, i) => (
              <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="dash-schedule-item" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="dash-schedule-time">{lesson.time || "TBD"}</div>
                <div className="dash-schedule-info">
                  <span className="dash-schedule-name">{lesson.studentName || "Student"}</span>
                  <span className="dash-schedule-meta">{lesson.duration || 1}hr lesson</span>
                </div>
                <div className="dash-schedule-arrow">
                  <Icon name="chevronRight" size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Two Column Layout */}
      <div className="dash-grid">
        {/* Upcoming Lessons */}
        <section className="dash-card">
          <div className="dash-card-header">
            <h2>Upcoming Lessons</h2>
            <Link to="/lessons" className="dash-card-link">
              View All <Icon name="chevronRight" size={14} />
            </Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <div className="dash-empty">
              <Icon name="calendar" size={32} />
              <p>No upcoming lessons scheduled</p>
              <Link to="/book-lesson" className="dash-btn dash-btn-small">Book a Lesson</Link>
            </div>
          ) : (
            <div className="dash-list">
              {upcomingLessons.map(lesson => (
                <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="dash-list-item">
                  <div className="dash-list-date">
                    <span className="dash-list-day">{new Date(lesson.date).getDate()}</span>
                    <span className="dash-list-month">{new Date(lesson.date).toLocaleString("default", { month: "short" })}</span>
                  </div>
                  <div className="dash-list-info">
                    <span className="dash-list-title">{lesson.studentName || "Student"}</span>
                    <span className="dash-list-meta">{lesson.time || "TBD"} · {lesson.duration || 1}hr</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Test Ready Students */}
        <section className="dash-card">
          <div className="dash-card-header">
            <h2>Test Ready</h2>
            <Link to="/students" className="dash-card-link">
              All Students <Icon name="chevronRight" size={14} />
            </Link>
          </div>
          {readyStudents.length === 0 ? (
            <div className="dash-empty">
              <Icon name="award" size={32} />
              <p>No test-ready students yet</p>
            </div>
          ) : (
            <div className="dash-list">
              {readyStudents.map(student => (
                <Link to={`/students/${student.id}`} key={student.id} className="dash-list-item">
                  <div className="dash-list-avatar">
                    {(student.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="dash-list-info">
                    <span className="dash-list-title">{student.name || "Student"}</span>
                    <span className="dash-list-meta">{getUpcomingTestText(student) || "Ready to book test"}</span>
                  </div>
                  <span className="dash-list-badge dash-badge-success">Ready</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Unpaid Lessons */}
      {unpaidLessons.length > 0 && (
        <section className="dash-card dash-card-warning">
          <div className="dash-card-header">
            <h2>
              <Icon name="dollar" size={20} />
              Unpaid Lessons
            </h2>
            <span className="dash-unpaid-total">£{unpaidTotal.toFixed(0)} owed</span>
          </div>
          <div className="dash-unpaid-list">
            {unpaidLessons.slice(0, 5).map(lesson => (
              <div key={lesson.id} className="dash-unpaid-row">
                <Link to={`/lessons/${lesson.id}`} className="dash-unpaid-info">
                  <span className="dash-unpaid-name">{lesson.studentName || "Student"}</span>
                  <span className="dash-unpaid-meta">
                    {lesson.date} · {lesson.duration || 1}hr · £{((Number(lesson.duration) || 1) * rate).toFixed(0)}
                  </span>
                </Link>
                <div className="dash-unpaid-actions">
                  <button className="dash-pay-btn dash-pay-cash" onClick={() => handleQuickPay(lesson.id, "cash")}>Cash</button>
                  <button className="dash-pay-btn dash-pay-card" onClick={() => handleQuickPay(lesson.id, "card")}>Card</button>
                  <button className="dash-pay-btn dash-pay-bank" onClick={() => handleQuickPay(lesson.id, "bank")}>Bank</button>
                </div>
              </div>
            ))}
          </div>
          {unpaidLessons.length > 5 && (
            <Link to="/earnings" className="dash-card-footer-link">
              View all {unpaidLessons.length} unpaid lessons <Icon name="chevronRight" size={14} />
            </Link>
          )}
        </section>
      )}

      {/* Quick Actions */}
      <section className="dash-quick-actions">
        <Link to="/book-lesson" className="dash-quick-action">
          <div className="dash-quick-icon dash-quick-icon-green">
            <Icon name="plus" size={24} />
          </div>
          <span>Book Lesson</span>
        </Link>
        <Link to="/students/add" className="dash-quick-action">
          <div className="dash-quick-icon dash-quick-icon-blue">
            <Icon name="users" size={24} />
          </div>
          <span>Add Student</span>
        </Link>
        <Link to="/tips" className="dash-quick-action">
          <div className="dash-quick-icon dash-quick-icon-amber">
            <Icon name="lightbulb" size={24} />
          </div>
          <span>Add Tip</span>
        </Link>
        <Link to="/earnings" className="dash-quick-action">
          <div className="dash-quick-icon dash-quick-icon-purple">
            <Icon name="dollar" size={24} />
          </div>
          <span>View Earnings</span>
        </Link>
      </section>
    </div>
  );
}

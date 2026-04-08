import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStudents, getLessons, sendMessage, getInstructorProfile, updateLesson } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import TopBar from "../components/TopBar";
import "../components/TopBar.css";
import DrivingMotionHero from "../components/DrivingMotionHero";
import {
  getProgressSummary,
  getUpcomingTestText,
  normalizeLessonReview,
  normalizeStudentInsights
} from "../utils/instructorInsights";
import "./Dashboard.css";

const statCardConfig = [
  { key: "total", className: "total", icon: "S", label: "Total Students", to: "/students" },
  { key: "todayLessons", className: "lessons", icon: "L", label: "Lessons Today", to: "/lessons" },
  { key: "manual", className: "manual", icon: "M", label: "Manual Learners", to: "/students" },
  { key: "auto", className: "auto", icon: "A", label: "Auto Learners", to: "/students" },
  { key: "perfect", className: "perfect", icon: "P", label: "Perfect Drivers", to: "/students" },
  { key: "parking", className: "parking", icon: "K", label: "Parking Practice", to: "/students" }
];

const quickActionConfig = [
  { to: "/students/add", label: "+ Add Student", className: "primary" },
  { to: "/book-lesson", label: "+ Book Lesson", className: "book" },
  { to: "/tips", label: "+ Add Tip", className: "tip" }
];

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(35);
  const [stats, setStats] = useState({
    total: 0, manual: 0, auto: 0, perfect: 0, parking: 0, todayLessons: 0
  });
  const [sentReminders, setSentReminders] = useState({});
  const { showToast } = useToast();
  const { user, instructorName } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [studentsData, lessonsData, profile] = await Promise.all([
          getStudents(), getLessons(), getInstructorProfile()
        ]);
        if (profile?.hourlyRate) setRate(Number(profile.hourlyRate) || 35);
        const normalizedStudents = studentsData.map(normalizeStudentInsights);
        setStudents(normalizedStudents);
        setLessons(lessonsData);
        const today = new Date().toISOString().split("T")[0];
        setStats({
          total: normalizedStudents.length,
          manual: normalizedStudents.filter(s => s.transmission?.toLowerCase() === "manual").length,
          auto: normalizedStudents.filter(s => s.transmission?.toLowerCase() === "auto").length,
          perfect: normalizedStudents.filter(s => s.perfectDriver === true).length,
          parking: normalizedStudents.filter(s => s.parkingPractice === true).length,
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

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const upcomingLessons = useMemo(() =>
    lessons.filter(l => new Date(l.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5),
    [lessons]
  );
  const statCards = statCardConfig.map(c => ({ ...c, value: stats[c.key] ?? 0 }));
  const readyStudents = useMemo(() =>
    students.filter(s => getProgressSummary(s).readiness === "Test ready").slice(0, 4),
    [students]
  );
  const followUpStudents = useMemo(() =>
    students.filter(s => { const sum = getProgressSummary(s); return s.riskLevel === "watch" || sum.lowSkills >= 3; }).slice(0, 4),
    [students]
  );
  const todayLessonsList = useMemo(() =>
    lessons.filter(l => l.date === todayStr).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [lessons, todayStr]
  );
  const tomorrowLessons = useMemo(() => lessons.filter(l => l.date === tomorrowStr), [lessons, tomorrowStr]);

  const unpaidLessons = useMemo(() =>
    lessons.filter(l => {
      const r = normalizeLessonReview(l);
      return r.status !== "scheduled" && r.status !== "cancelled" && !["paid", "cash", "card", "bank", "package", "waived"].includes(r.paymentStatus);
    }),
    [lessons]
  );
  const unpaidTotal = useMemo(() =>
    unpaidLessons.reduce((sum, l) => sum + (Number(l.duration) || 1) * rate, 0),
    [unpaidLessons, rate]
  );

  // Lessons that just finished (within last 2 hours) and unpaid — for payment reminder
  const justFinished = useMemo(() => {
    const now = new Date();
    return lessons.filter(l => {
      if (l.date !== todayStr || !l.time) return false;
      const r = normalizeLessonReview(l);
      if (["paid", "cash", "card", "bank", "package", "waived"].includes(r.paymentStatus)) return false;
      const [h, m] = l.time.split(":").map(Number);
      const endMs = new Date(l.date + "T" + l.time).getTime() + (Number(l.duration) || 1) * 3600000;
      return endMs < now.getTime() && now.getTime() - endMs < 7200000; // ended within last 2hrs
    });
  }, [lessons, todayStr]);

  const passedToday = useMemo(() => students.filter(s => s.testPassed && s.testPassedDate === todayStr), [students, todayStr]);

  async function handleSendReminder(lesson) {
    if (!lesson.studentId) { showToast("No student linked", "error"); return; }
    try {
      await sendMessage({
        sender: user?.uid,
        receiver: lesson.studentId,
        text: `Hi ${lesson.studentName}, this is a reminder that you have a driving lesson tomorrow (${lesson.date}) at ${lesson.time}. Please confirm or let me know if you need to reschedule. - ${instructorName}`
      });
      setSentReminders(prev => ({ ...prev, [lesson.id]: true }));
      showToast(`Reminder sent to ${lesson.studentName}`, "success");
    } catch {
      showToast("Failed to send reminder", "error");
    }
  }

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
      <div className="dashboard-wrapper">
        <TopBar title="Dashboard" subtitle="Loading..." />
        <div className="dashboard-container dashboard-loading"><p>Loading dashboard...</p></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <TopBar title="Dashboard" subtitle={`Welcome back, ${instructorName || "Instructor"}`} />
      <div className="dashboard-container">
        {passedToday.length > 0 && (
        <div className="dash-banner dash-banner-green">
          <span style={{ fontSize: "28px" }}>🏆</span>
          <div>
            <strong>Test Passed Today!</strong>
            <p>{passedToday.map(s => s.name).join(", ")} passed their driving test. Congratulations!</p>
          </div>
        </div>
      )}

      {/* Payment reminder for just-finished lessons */}
      {justFinished.length > 0 && (
        <div className="dash-banner dash-banner-amber">
          <span style={{ fontSize: "24px" }}>💰</span>
          <div style={{ flex: 1 }}>
            <strong>Just finished — did they pay?</strong>
            {justFinished.map(l => (
              <div key={l.id} className="dash-pay-row">
                <Link to={`/lessons/${l.id}`} className="dash-pay-name">
                  {l.studentName || "Unknown"} — {l.time} ({l.duration || 1}hr · £{((Number(l.duration) || 1) * rate).toFixed(0)})
                </Link>
                <div className="dash-pay-btns">
                  <button className="qp cash" onClick={() => handleQuickPay(l.id, "cash")}>Cash</button>
                  <button className="qp card" onClick={() => handleQuickPay(l.id, "card")}>Card</button>
                  <button className="qp bank" onClick={() => handleQuickPay(l.id, "bank")}>Bank</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayLessonsList.length > 0 && (
        <div className="dash-banner dash-banner-blue">
          <strong>📅 Today — {todayLessonsList.length} lesson{todayLessonsList.length > 1 ? "s" : ""}</strong>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
            {todayLessonsList.map(l => (
              <Link key={l.id} to={`/lessons/${l.id}`} className="dash-today-chip">
                {l.time} · {l.studentName || "Unknown"}
              </Link>
            ))}
          </div>
        </div>
      )}

      <DrivingMotionHero stats={stats} eyebrow="Welcome back" title="Instructor Dashboard" subtitle="Here's an overview of your driving school." />

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <Link key={card.key} to={card.to} className="stat-link" aria-label={`Open ${card.label.toLowerCase()}`}>
            <div className={`stat-box ${card.className} dash-fade-in`} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-content"><h3>{card.value}</h3><p>{card.label}</p></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="section-card dash-fade-in">
          <div className="section-header"><h2>Recent Students</h2><Link to="/students">View all</Link></div>
          {students.length === 0 ? <p className="empty-text">No students yet</p> : (
            <div className="recent-list">
              {students.slice(-5).reverse().map(student => (
                <Link key={student.id} to={`/students/${student.id}`} className="recent-card">
                  <div className="student-avatar">{(student.name || "?").charAt(0).toUpperCase()}</div>
                  <div className="student-info"><h4>{student.name || "Unnamed"}</h4><span>{student.transmission || "N/A"} transmission</span></div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="section-card dash-fade-in" style={{ animationDelay: "0.06s" }}>
          <div className="section-header"><h2>Upcoming Lessons</h2><Link to="/lessons">View all</Link></div>
          {upcomingLessons.length === 0 ? <p className="empty-text">No upcoming lessons</p> : (
            <div className="lessons-list">
              {upcomingLessons.map(lesson => (
                <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="lesson-item">
                  <div className="lesson-date-box">
                    <span className="day">{new Date(lesson.date).getDate()}</span>
                    <span className="month">{new Date(lesson.date).toLocaleString("default", { month: "short" })}</span>
                  </div>
                  <div className="lesson-info"><h4>{lesson.studentName || "Student"}</h4><span>{lesson.time || "TBD"}</span></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card dash-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="section-header"><h2>Test Readiness</h2><Link to="/students">Open students</Link></div>
          {readyStudents.length === 0 ? <p className="empty-text">No test-ready students yet</p> : (
            <div className="recent-list">
              {readyStudents.map(student => (
                <Link key={student.id} to={`/students/${student.id}`} className="recent-card">
                  <div className="student-avatar">{(student.name || "?").charAt(0).toUpperCase()}</div>
                  <div className="student-info"><h4>{student.name || "Unnamed"}</h4><span>{getUpcomingTestText(student) || "Ready to book a test"}</span></div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="section-card dash-fade-in" style={{ animationDelay: "0.14s" }}>
          <div className="section-header"><h2>Follow-up Radar</h2><Link to="/students">Open tracker</Link></div>
          {followUpStudents.length === 0 ? <p className="empty-text">No students flagged for close follow-up</p> : (
            <div className="recent-list">
              {followUpStudents.map(student => (
                <Link key={student.id} to={`/students/${student.id}`} className="recent-card">
                  <div className="student-avatar">{(student.name || "?").charAt(0).toUpperCase()}</div>
                  <div className="student-info"><h4>{student.name || "Unnamed"}</h4><span>{student.nextFocus || "Needs a focused next lesson plan"}</span></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tomorrow's Lessons */}
      {tomorrowLessons.length > 0 && (
        <div className="section-card dash-fade-in" style={{ marginBottom: "20px", borderLeft: "4px solid #f59e0b" }}>
          <div className="section-header"><h2>⏰ Tomorrow's Lessons ({tomorrowLessons.length})</h2></div>
          <div className="lessons-list">
            {tomorrowLessons.map(lesson => (
              <div key={lesson.id} className="dash-reminder-row">
                <Link to={`/lessons/${lesson.id}`} className="dash-reminder-info">
                  <strong>{lesson.studentName || "Student"}</strong>
                  <span>{lesson.time || "TBD"} — {lesson.duration ? `${lesson.duration}hr` : "1hr"}</span>
                </Link>
                <button
                  onClick={() => handleSendReminder(lesson)}
                  disabled={sentReminders[lesson.id]}
                  className={`dash-reminder-btn ${sentReminders[lesson.id] ? "sent" : ""}`}
                >
                  {sentReminders[lesson.id] ? "✓ Sent" : "📩 Remind"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unpaid */}
      {unpaidLessons.length > 0 && (
        <div className="section-card dash-fade-in" style={{ marginBottom: "20px", borderLeft: "4px solid #f59e0b" }}>
          <div className="section-header"><h2>💷 Unpaid — £{unpaidTotal.toFixed(0)} owed</h2><Link to="/earnings">View all</Link></div>
          <div className="lessons-list">
            {unpaidLessons.slice(0, 5).map(l => (
              <div key={l.id} className="dash-pay-row">
                <Link to={`/lessons/${l.id}`} className="dash-pay-name">
                  {l.studentName || "Unknown"} — {l.date} · {l.duration || 1}hr · £{((Number(l.duration) || 1) * rate).toFixed(0)}
                </Link>
                <div className="dash-pay-btns">
                  <button className="qp cash" onClick={() => handleQuickPay(l.id, "cash")}>Cash</button>
                  <button className="qp card" onClick={() => handleQuickPay(l.id, "card")}>Card</button>
                  <button className="qp bank" onClick={() => handleQuickPay(l.id, "bank")}>Bank</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        <div className="quick-actions dash-fade-in" style={{ animationDelay: "0.18s" }}>
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActionConfig.map(action => (
              <Link key={action.to} to={action.to}>
                <button className={`action-button ${action.className}`}>{action.label}</button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

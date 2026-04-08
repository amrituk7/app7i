import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getLessonsForStudent,
  getMessagesForStudent,
  getStudentByEmail,
  getInstructorProfile
} from "../firebase";
import {
  formatLessonDate,
  getLessonCountdown,
  isUpcomingLesson,
  sortLessonsAscending
} from "../utils/studentPortal";
import {
  SKILL_DEFINITIONS,
  SKILL_LEVEL_LABELS,
  getProgressSummary,
  normalizeStudentInsights
} from "../utils/instructorInsights";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [messages, setMessages] = useState([]);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const studentRecord = await getStudentByEmail(user.email);
        if (!studentRecord) {
          setMissingProfile(true);
          setLoading(false);
          return;
        }

        setStudent(studentRecord);
        const [studentLessons, studentMessages, iProfile] = await Promise.all([
          getLessonsForStudent(studentRecord.id),
          getMessagesForStudent(studentRecord.id),
          studentRecord.instructorId
            ? getInstructorProfile(studentRecord.instructorId).catch(() => null)
            : Promise.resolve(null)
        ]);

        setLessons(studentLessons);
        setMessages(studentMessages);
        if (iProfile) setInstructorProfile(iProfile);
      } catch (error) {
        console.error("Error loading student dashboard:", error);
        showToast("Failed to load your dashboard", "error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, showToast]);

  const upcomingLessons = useMemo(() => {
    return sortLessonsAscending(lessons.filter((lesson) => isUpcomingLesson(lesson)));
  }, [lessons]);
  const totalLessonsTaken = useMemo(() => {
    return lessons.filter((lesson) => !isUpcomingLesson(lesson)).length;
  }, [lessons]);

  const nextLesson = upcomingLessons[0] || null;
  const recentInstructorMessages = useMemo(() => {
    return [...messages]
      .filter((message) => message.sender !== student?.id)
      .sort((firstMessage, secondMessage) => {
        return (secondMessage.timestamp || 0) - (firstMessage.timestamp || 0);
      })
      .slice(0, 3);
  }, [messages, student?.id]);

  const manualRate =
    instructorProfile?.manualRate ||
    instructorProfile?.manualWeekdayRate ||
    "";
  const manualWeekendRate = instructorProfile?.manualWeekendRate || "";
  const autoSundayRate =
    instructorProfile?.autoSundayRate ||
    instructorProfile?.autoWeekendRate ||
    "";
  const autoWeekdayRate = instructorProfile?.autoWeekdayRate || "";
  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="sd-loading">
          <div className="sd-loading__spinner" />
          <p>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (missingProfile || !student) {
    return (
      <div className="student-dashboard">
        <div className="student-empty-shell">
          <h1>Your student profile is not linked yet</h1>
          <p>
            Your instructor needs to add your email address to your student record before your portal can
            show lessons and messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <motion.div
        className="student-dashboard-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div>
          <span className="student-dashboard-eyebrow">Student Portal</span>
          <h1>Welcome back, {student.name || "driver"}.</h1>
          <p>
            Check your next lesson, catch up on messages from your instructor, and keep your learning plan in
            view.
          </p>
        </div>
        <div className="student-dashboard-actions">
          <Link to="/my-lessons" className="student-dashboard-link-card">
            View my lessons
          </Link>
          <Link to="/my-messages" className="student-dashboard-link-card">
            Open messages
          </Link>
        </div>
      </motion.div>

      <div className="student-stats-grid">
        <motion.div
          className="student-stat-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <span>Total lessons</span>
          <strong>{totalLessonsTaken}</strong>
        </motion.div>
        <motion.div
          className="student-stat-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <span>Upcoming lessons</span>
          <strong>{upcomingLessons.length}</strong>
        </motion.div>
      </div>

      {instructorProfile && (
        <motion.section
          className="student-dashboard-panel"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
          style={{ marginBottom: "20px" }}
        >
          <div className="student-panel-header">
            <h2>Your Instructor</h2>
          </div>
          <div className="sd-instructor-grid">
            <div className="sd-instructor-name-col">
              <div className="sd-instructor-name">{instructorProfile.name || "Instructor"}</div>
              {instructorProfile.rating && (
                <div className="sd-instructor-rating">
                  {"★".repeat(Math.round(Number(instructorProfile.rating)))} {instructorProfile.rating}/5
                </div>
              )}
              {instructorProfile.location && <div className="sd-instructor-location">{instructorProfile.location}</div>}
              {instructorProfile.phone && <div className="sd-instructor-phone">Tel: {instructorProfile.phone}</div>}
              {instructorProfile.serviceNotes && <div className="sd-instructor-notes">{instructorProfile.serviceNotes}</div>}
            </div>
            <div className="sd-instructor-pricing-box">
              <div className="sd-pricing-title">Pricing</div>
              {manualRate && <div className="sd-pricing-row">Manual: £{manualRate}/hr</div>}
              {manualWeekendRate && <div className="sd-pricing-row">Manual weekend: £{manualWeekendRate}/hr</div>}
              {autoSundayRate && <div className="sd-pricing-row">Auto Sunday: £{autoSundayRate}/hr</div>}
              {autoWeekdayRate && <div className="sd-pricing-row">Auto weekday: £{autoWeekdayRate}/hr</div>}
              {instructorProfile.testDayFee && <div className="sd-pricing-row sd-pricing-row--bold">Test day: £{instructorProfile.testDayFee}</div>}
              {!manualRate && !autoSundayRate && !autoWeekdayRate && !manualWeekendRate && instructorProfile.hourlyRate && (
                <div className="sd-pricing-row">£{instructorProfile.hourlyRate}/hr</div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      <div className="student-dashboard-grid">
        <motion.section
          className="student-dashboard-panel next-lesson-panel"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.14 }}
        >
          <div className="student-panel-header">
            <h2>Next Lesson</h2>
            <Link to="/my-lessons">View all</Link>
          </div>
          {!nextLesson ? (
            <div className="student-empty-state">
              <p>No upcoming lessons booked yet.</p>
              <small>Your instructor will add your next lesson when it is scheduled.</small>
            </div>
          ) : (
            <div className="next-lesson-card">
              <div className="next-lesson-countdown">{getLessonCountdown(nextLesson)}</div>
              <h3>{formatLessonDate(nextLesson)}</h3>
              <p>{nextLesson.duration ? `${nextLesson.duration} hour lesson` : "1 hour lesson"}</p>
              <p>Instructor: {nextLesson.instructor || "Instructor"}</p>
              {nextLesson.notes && <small>{nextLesson.notes}</small>}
            </div>
          )}
        </motion.section>

        <motion.section
          className="student-dashboard-panel"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.2 }}
        >
          <div className="student-panel-header">
            <h2>Recent Messages</h2>
            <Link to="/my-messages">View all</Link>
          </div>
          {recentInstructorMessages.length === 0 ? (
            <div className="student-empty-state">
              <p>No messages yet.</p>
              <small>Your latest instructor updates will appear here.</small>
            </div>
          ) : (
            <div className="student-message-preview-list">
              {recentInstructorMessages.map((message) => (
                <div key={message.id} className="student-message-preview">
                  <strong>Your Instructor</strong>
                  <p>{message.text}</p>
                  {message.timestamp && (
                    <small>{new Date(message.timestamp).toLocaleString()}</small>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {student.progress && (
        <motion.section
          className="student-dashboard-panel"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.26 }}
        >
          {(() => {
            const norm = normalizeStudentInsights(student);
            const summary = getProgressSummary(norm);
            return (
              <>
                <div className="student-panel-header">
                  <h2>My Progress</h2>
                  <span className="sd-progress-summary">
                    {summary.percent}% — {summary.readiness}
                  </span>
                </div>
                <div className="student-progress-bar-track">
                  <div
                    className="student-progress-bar-fill"
                    style={{ width: `${summary.percent}%` }}
                  />
                </div>
                <div className="student-skills-grid">
                  {SKILL_DEFINITIONS.map((skill) => {
                    const val = norm.progress?.[skill.key] || 0;
                    const label = SKILL_LEVEL_LABELS[val] || "Not started";
                    const pct = (val / 5) * 100;
                    const color = val >= 4 ? "#10b981" : val >= 3 ? "#3b82f6" : val >= 2 ? "#f59e0b" : "#d1d5db";
                    return (
                      <div key={skill.key} className="student-skill-row">
                        <div className="student-skill-label">
                          <span>{skill.label}</span>
                          <span style={{ color, fontWeight: 600, fontSize: "12px" }}>{label}</span>
                        </div>
                        <div className="student-skill-track">
                          <div className="student-skill-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </motion.section>
      )}
    </div>
  );
}

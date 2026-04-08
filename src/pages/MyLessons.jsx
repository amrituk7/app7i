import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getLessonsForStudent, getStudentByEmail } from "../firebase";
import {
  formatLessonDate,
  getLessonCountdown,
  isUpcomingLesson,
  sortLessonsAscending,
  sortLessonsDescending
} from "../utils/studentPortal";
import "./MyLessons.css";

/* ── Inline SVG icons ── */
function IconClock()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconUser()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconNote()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IconCar()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>; }
function IconCalendar() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }

function countdownVariant(text) {
  if (!text) return "default";
  const t = text.toLowerCase();
  if (t === "today") return "today";
  if (t === "tomorrow") return "tomorrow";
  if (t.startsWith("in")) return "upcoming";
  return "default";
}

function LessonCard({ lesson, variant = "upcoming" }) {
  const countdown  = getLessonCountdown(lesson);
  const badgeType  = countdownVariant(countdown);
  const isPast     = variant === "past";
  const dateLabel  = formatLessonDate(lesson);
  const duration   = lesson.duration ? `${lesson.duration} hr` : "1 hr";
  const instructor = lesson.instructor && lesson.instructor !== "Instructor"
    ? lesson.instructor : "Your Instructor";
  const hasNotes   = lesson.notes && lesson.notes.trim().length > 0;
  const transmission = lesson.transmission ? lesson.transmission : null;

  return (
    <div className={`ml-card ml-card--${variant}`}>
      {/* Accent stripe */}
      {!isPast && <div className="ml-card__stripe" />}

      <div className="ml-card__inner">
        {/* ── Row 1: Date + Badge ── */}
        <div className="ml-card__top">
          <div className="ml-card__date-block">
            <span className="ml-card__date">{dateLabel}</span>
          </div>
          {!isPast && countdown && (
            <span className={`ml-badge ml-badge--${badgeType}`}>{countdown}</span>
          )}
          {isPast && (
            <span className="ml-badge ml-badge--past">Completed</span>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="ml-card__divider" />

        {/* ── Row 2: Meta info ── */}
        <div className="ml-card__meta">
          <span className="ml-card__meta-item">
            <IconClock />
            {lesson.time || "TBC"}
          </span>
          <span className="ml-card__meta-item">
            <IconCalendar />
            {duration}
          </span>
          {transmission && (
            <span className="ml-card__meta-item">
              <IconCar />
              {transmission}
            </span>
          )}
        </div>

        {/* ── Row 3: Instructor ── */}
        <div className="ml-card__instructor">
          <IconUser />
          <span>{instructor}</span>
        </div>

        {/* ── Row 4: Notes ── */}
        <div className={`ml-card__notes ${!hasNotes ? "ml-card__notes--empty" : ""}`}>
          <IconNote />
          <span>{hasNotes ? lesson.notes : "No lesson notes added yet"}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, count }) {
  return (
    <div className="ml-section-header">
      <div className="ml-section-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {count > 0 && <span className="ml-section-count">{count}</span>}
    </div>
  );
}

export default function MyLessons() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent]           = useState(null);
  const [lessons, setLessons]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user?.email) { setLoading(false); return; }
      try {
        const rec = await getStudentByEmail(user.email);
        if (!rec) { setMissingProfile(true); setLoading(false); return; }
        setStudent(rec);
        setLessons(await getLessonsForStudent(rec.id));
      } catch {
        showToast("Failed to load your lessons", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, showToast]);

  const upcomingLessons = useMemo(
    () => sortLessonsAscending(lessons.filter(isUpcomingLesson)),
    [lessons]
  );
  const pastLessons = useMemo(
    () => sortLessonsDescending(lessons.filter(l => !isUpcomingLesson(l))),
    [lessons]
  );

  if (loading) {
    return (
      <div className="ml-page">
        <div className="ml-loading">
          <div className="ml-loading__spinner" />
          <p>Loading your lessons…</p>
        </div>
      </div>
    );
  }

  if (missingProfile || !student) {
    return (
      <div className="ml-page">
        <div className="ml-empty-state">
          <div className="ml-empty-state__icon">📋</div>
          <h3>Profile not linked yet</h3>
          <p>Your instructor needs to add your email address to your student record before your lessons appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-page">

      {/* ── Page header ── */}
      <div className="ml-page-header">
        <div>
          <h1>My Lessons</h1>
          <p>Your upcoming schedule and lesson history.</p>
        </div>
        <Link to="/student-dashboard" className="ml-back-link">← Dashboard</Link>
      </div>

      {/* ── Upcoming ── */}
      <section className="ml-section">
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          title="Upcoming Lessons"
          count={upcomingLessons.length}
        />
        {upcomingLessons.length === 0 ? (
          <div className="ml-empty">
            <p>No upcoming lessons booked yet.</p>
          </div>
        ) : (
          <div className="ml-list">
            {upcomingLessons.map(l => (
              <LessonCard key={l.id} lesson={l} variant="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* ── Past ── */}
      <section className="ml-section">
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>}
          title="Past Lessons"
          count={pastLessons.length}
        />
        {pastLessons.length === 0 ? (
          <div className="ml-empty">
            <p>Your completed lessons will appear here.</p>
          </div>
        ) : (
          <div className="ml-list">
            {pastLessons.map(l => (
              <LessonCard key={l.id} lesson={l} variant="past" />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

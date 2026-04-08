import React, { useEffect, useState, useMemo, useRef } from "react";
import { getLessons } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./Calendar.css";

const PX      = 64;          // pixels per hour
const START   = 6;           // 6 am
const END     = 22;          // 10 pm
const TOTAL_H = END - START; // 16 hours  →  1024 px grid
const HOURS   = Array.from({ length: TOTAL_H }, (_, i) => i + START);
const MONTHS  = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/* ── Date helpers ─────────────────────────────────────────────────────── */

function toStr(d) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function getWeekDates(base) {
  const d = new Date(base);
  const dow = d.getDay() || 7; // Mon=1 … Sun=7
  d.setDate(d.getDate() - dow + 1);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return nd;
  });
}

function getMonthGrid(year, month) {
  // 42 cells (6 weeks), Mon-first
  const first = new Date(year, month, 1);
  const dow   = first.getDay() || 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dow + 1);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function parseLessonTop(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h)) return null;
  const top = (h - START + m / 60) * PX;
  return top < 0 || top >= TOTAL_H * PX ? null : top;
}

function lessonPx(duration) {
  return Math.max(Number(duration) || 1, 0.5) * PX - 4;
}

function fmtH(h) {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

/* ── Status colour tokens (mapped to CSS vars defined in Calendar.css) ── */
const SC = {
  scheduled: { bg: "var(--cal-blue-bg)",  bdr: "var(--cal-blue)",  fg: "var(--cal-blue-fg)"  },
  completed: { bg: "var(--cal-green-bg)", bdr: "var(--cal-green)", fg: "var(--cal-green-fg)" },
  cancelled: { bg: "var(--cal-red-bg)",   bdr: "var(--cal-red)",   fg: "var(--cal-red-fg)"   },
  "no-show": { bg: "var(--cal-amber-bg)", bdr: "var(--cal-amber)", fg: "var(--cal-amber-fg)" },
};
const STATUS_LABELS = ["scheduled", "completed", "cancelled", "no-show"];

/* ── MiniCalendar ──────────────────────────────────────────────────────── */

function MiniCalendar({ date, onSelect, dots }) {
  const todayStr = toStr(new Date());
  const selStr   = toStr(date);
  const [y,  setY]  = useState(date.getFullYear());
  const [mo, setMo] = useState(date.getMonth());
  const grid = useMemo(() => getMonthGrid(y, mo), [y, mo]);

  function prev() {
    if (mo === 0) { setMo(11); setY(v => v - 1); }
    else setMo(v => v - 1);
  }
  function next() {
    if (mo === 11) { setMo(0); setY(v => v + 1); }
    else setMo(v => v + 1);
  }

  // Keep mini-cal in sync when parent navigates
  useEffect(() => {
    setY(date.getFullYear());
    setMo(date.getMonth());
  }, [date]);

  return (
    <div className="mini-cal">
      <div className="mini-cal-bar">
        <button onClick={prev} aria-label="Prev month">‹</button>
        <span>{MONTHS[mo].slice(0, 3)} {y}</span>
        <button onClick={next} aria-label="Next month">›</button>
      </div>
      <div className="mini-cal-grid">
        {"MTWTFSS".split("").map((c, i) => (
          <span key={i} className="mini-dow">{c}</span>
        ))}
        {grid.map((d, i) => {
          const ds      = toStr(d);
          const isToday = ds === todayStr;
          const isSel   = ds === selStr;
          const other   = d.getMonth() !== mo;
          const hasDot  = !isSel && dots?.[ds];
          return (
            <button
              key={i}
              className={
                "mini-day" +
                (isToday ? " is-today" : "") +
                (isSel   ? " is-sel"   : "") +
                (other   ? " other-mo" : "")
              }
              onClick={() => onSelect(new Date(d))}
            >
              {d.getDate()}
              {hasDot && <span className="mini-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── TimeGrid  (shared by Week and Day views) ─────────────────────────── */

function TimeGrid({ dates, lessonsByDay, todayStr }) {
  const navigate = useNavigate();
  const [nowTop, setNowTop] = useState(null);
  const bodyRef  = useRef(null);

  useEffect(() => {
    function tick() {
      const n = new Date();
      const t = (n.getHours() - START + n.getMinutes() / 60) * PX;
      setNowTop(t >= 0 && t <= TOTAL_H * PX ? t : null);
    }
    tick();
    const timer = setInterval(tick, 60_000);
    // Scroll to ~1.5 hrs before current time on mount
    if (bodyRef.current) {
      const n = new Date();
      bodyRef.current.scrollTop = Math.max(0, (n.getHours() - START - 1.5) * PX);
    }
    return () => clearInterval(timer);
  }, []); // eslint-disable-line

  function bookSlot(d, h, half) {
    navigate(`/book-lesson?date=${toStr(d)}&time=${String(h).padStart(2, "0")}:${half ? "30" : "00"}`);
  }

  return (
    <div className="tg-wrap">
      {/* Sticky day headers */}
      <div className="tg-head">
        <div className="tg-gutter" />
        {dates.map(d => {
          const ds      = toStr(d);
          const isToday = ds === todayStr;
          return (
            <div key={ds} className={`tg-col-head${isToday ? " tg-today-head" : ""}`}>
              <span className="tg-dow">
                {d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()}
              </span>
              <span className={`tg-dnum${isToday ? " tg-today-circle" : ""}`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable time body */}
      <div className="tg-body" ref={bodyRef}>
        <div className="tg-inner" style={{ height: `${TOTAL_H * PX}px` }}>

          {/* Time label gutter */}
          <div className="tg-gutter tg-labels">
            {HOURS.map(h =>
              h > START ? (
                <div
                  key={h}
                  className="tg-label"
                  style={{ top: `${(h - START) * PX}px` }}
                >
                  {fmtH(h)}
                </div>
              ) : null
            )}
          </div>

          {/* Day columns */}
          <div className="tg-cols">
            {dates.map(d => {
              const ds         = toStr(d);
              const isToday    = ds === todayStr;
              const dayLessons = lessonsByDay[ds] || [];
              return (
                <div key={ds} className={`tg-col${isToday ? " tg-col-today" : ""}`}>

                  {/* Clickable half-hour slots */}
                  {HOURS.map(h => (
                    <React.Fragment key={h}>
                      <div
                        className="tg-slot"
                        style={{ top: `${(h - START) * PX}px` }}
                        onClick={() => bookSlot(d, h, false)}
                        title={`Book at ${fmtH(h)}`}
                      />
                      <div
                        className="tg-slot tg-slot-half"
                        style={{ top: `${(h - START) * PX + PX / 2}px` }}
                        onClick={() => bookSlot(d, h, true)}
                        title={`Book at ${fmtH(h)}:30`}
                      />
                    </React.Fragment>
                  ))}

                  {/* Current-time indicator */}
                  {isToday && nowTop !== null && (
                    <div className="tg-now" style={{ top: `${nowTop}px` }}>
                      <span className="tg-now-dot" />
                    </div>
                  )}

                  {/* Lesson blocks */}
                  {dayLessons.map(l => {
                    const top = parseLessonTop(l.time);
                    if (top === null) return null;
                    const status = l.review?.status || "scheduled";
                    const c      = SC[status] || SC.scheduled;
                    return (
                      <Link
                        key={l.id}
                        to={`/lessons/${l.id}`}
                        className="tg-lesson"
                        style={{
                          top:             `${top}px`,
                          height:          `${lessonPx(l.duration)}px`,
                          background:      c.bg,
                          borderLeftColor: c.bdr,
                          color:           c.fg,
                        }}
                        onClick={e => e.stopPropagation()}
                        title={`${l.studentName || "?"} – ${l.time} (${l.duration}hr)`}
                      >
                        <strong>{l.studentName || "?"}</strong>
                        <span>{l.time} · {l.duration || 1}hr</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MonthView ─────────────────────────────────────────────────────────── */

function MonthView({ year, month, lessonsByDay, todayStr, onDayClick }) {
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const MAX  = 3;

  return (
    <div className="month-view">
      <div className="month-dow-row">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="month-dow">{d}</div>
        ))}
      </div>
      <div className="month-grid">
        {grid.map((d, i) => {
          const ds      = toStr(d);
          const isToday = ds === todayStr;
          const other   = d.getMonth() !== month;
          const lessons = lessonsByDay[ds] || [];
          return (
            <div
              key={i}
              className={
                "month-cell" +
                (isToday ? " month-today" : "") +
                (other   ? " month-other" : "")
              }
              onClick={() => onDayClick(d)}
            >
              <span className={`month-num${isToday ? " month-today-circle" : ""}`}>
                {d.getDate()}
              </span>
              <div className="month-lesson-list">
                {lessons.slice(0, MAX).map(l => {
                  const s = l.review?.status || "scheduled";
                  const c = SC[s] || SC.scheduled;
                  return (
                    <Link
                      key={l.id}
                      to={`/lessons/${l.id}`}
                      className="month-chip"
                      style={{
                        background:      c.bg,
                        borderLeftColor: c.bdr,
                        color:           c.fg,
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {l.studentName || "?"}
                    </Link>
                  );
                })}
                {lessons.length > MAX && (
                  <span className="month-more">+{lessons.length - MAX} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Calendar (main component) ─────────────────────────────────────────── */

export default function Calendar() {
  const { showToast } = useToast();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState(() => window.innerWidth < 640 ? "day" : "week");
  const [base, setBase]       = useState(new Date());
  const todayStr              = toStr(new Date());

  useEffect(() => {
    getLessons()
      .then(setLessons)
      .catch(() => showToast("Failed to load lessons", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const lessonsByDay = useMemo(() => {
    const m = {};
    lessons.forEach(l => {
      if (!l.date) return;
      (m[l.date] = m[l.date] || []).push(l);
    });
    return m;
  }, [lessons]);

  const dots = useMemo(() => {
    const d = {};
    Object.keys(lessonsByDay).forEach(k => { d[k] = true; });
    return d;
  }, [lessonsByDay]);

  const todayCount = lessonsByDay[todayStr]?.length || 0;
  const upcomingCount = useMemo(
    () => lessons.filter((lesson) => {
      const dateTime = new Date(`${lesson.date}T${lesson.time || "00:00"}`);
      return dateTime >= new Date() && (!lesson.review?.status || lesson.review?.status === "scheduled");
    }).length,
    [lessons]
  );

  const selectedWeekCount = useMemo(
    () => getWeekDates(base).reduce((sum, day) => sum + (lessonsByDay[toStr(day)]?.length || 0), 0),
    [base, lessonsByDay]
  );

  const selectedMonthCount = useMemo(
    () => Object.entries(lessonsByDay)
      .filter(([dateString]) => {
        const date = new Date(dateString);
        return date.getFullYear() === base.getFullYear() && date.getMonth() === base.getMonth();
      })
      .reduce((sum, [, dayLessons]) => sum + dayLessons.length, 0),
    [base, lessonsByDay]
  );

  const weekDates = useMemo(
    () => view === "week" ? getWeekDates(base) : null,
    [view, base]
  );

  function shift(delta) {
    setBase(d => {
      const n = new Date(d);
      if (view === "month")      n.setMonth(n.getMonth() + delta);
      else if (view === "week")  n.setDate(n.getDate() + delta * 7);
      else                       n.setDate(n.getDate() + delta);
      return n;
    });
  }

  function getTitle() {
    if (view === "month") return `${MONTHS[base.getMonth()]} ${base.getFullYear()}`;
    if (view === "week")  {
      const wk = getWeekDates(base);
      const a  = wk[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const b  = wk[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return `${a} – ${b}`;
    }
    return base.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function getCount() {
    if (view === "month") {
      const yr = base.getFullYear(), mo = base.getMonth();
      return Object.entries(lessonsByDay)
        .filter(([ds]) => { const d = new Date(ds); return d.getFullYear() === yr && d.getMonth() === mo; })
        .reduce((s, [, v]) => s + v.length, 0);
    }
    if (view === "week") {
      return getWeekDates(base).reduce((s, d) => s + (lessonsByDay[toStr(d)]?.length || 0), 0);
    }
    return (lessonsByDay[toStr(base)] || []).length;
  }

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-loading-shell">Loading calendar...</div>
      </div>
    );
  }

  const count = getCount();

  return (
    <div className="calendar-page">
      <section className="calendar-hero">
        <div className="calendar-hero-copy">
          <span className="calendar-eyebrow">Scheduling board</span>
          <h1>Calendar</h1>
          <p>
            Move between month, week, and day views while keeping the lesson load readable at a
            glance.
          </p>
        </div>
        <Link to={`/book-lesson?date=${toStr(base)}`} className="calendar-hero-action">
          <button>+ Book Lesson</button>
        </Link>
      </section>

      <div className="calendar-summary-grid">
        <article className="calendar-summary-card">
          <span className="calendar-summary-label">Today</span>
          <strong className="calendar-summary-value">{todayCount}</strong>
          <p className="calendar-summary-note">Lessons booked for today.</p>
        </article>
        <article className="calendar-summary-card">
          <span className="calendar-summary-label">Upcoming</span>
          <strong className="calendar-summary-value">{upcomingCount}</strong>
          <p className="calendar-summary-note">Scheduled lessons still ahead.</p>
        </article>
        <article className="calendar-summary-card">
          <span className="calendar-summary-label">Selected week</span>
          <strong className="calendar-summary-value">{selectedWeekCount}</strong>
          <p className="calendar-summary-note">Visible in the current weekly run.</p>
        </article>
        <article className="calendar-summary-card">
          <span className="calendar-summary-label">Selected month</span>
          <strong className="calendar-summary-value">{selectedMonthCount}</strong>
          <p className="calendar-summary-note">All lessons inside this month.</p>
        </article>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="cal-toolbar">
        <div className="cal-tb-left">
          <button className="cal-nav-btn" onClick={() => shift(-1)} aria-label="Previous">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="cal-today-btn" onClick={() => setBase(new Date())}>Today</button>
          <button className="cal-nav-btn" onClick={() => shift(1)} aria-label="Next">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <h1 className="cal-title">{getTitle()}</h1>
          <span className="cal-count">{count} lesson{count !== 1 ? "s" : ""}</span>
        </div>
        <div className="cal-tb-right">
          <div className="cal-view-tabs">
            {["month", "week", "day"].map(v => (
              <button
                key={v}
                className={`cal-view-tab${view === v ? " active" : ""}`}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <Link to={`/book-lesson?date=${toStr(base)}`}>
            <button className="cal-book-btn">+ Book</button>
          </Link>
        </div>
      </div>

      {/* ── Shell ──────────────────────────────────────────── */}
      <div className="cal-shell">

        {/* Sidebar */}
        <aside className="cal-side">
          <Link to={`/book-lesson?date=${toStr(base)}`} className="cal-add-link">
            <button className="cal-add-btn">+ New Lesson</button>
          </Link>

          <MiniCalendar
            date={base}
            onSelect={d => {
              setBase(d);
              if (view === "month") setView("day");
            }}
            dots={dots}
          />

          <div className="cal-legend">
            <p className="cal-legend-title">Status</p>
            {STATUS_LABELS.map(k => {
              const c = SC[k];
              return (
                <div key={k} className="cal-legend-row">
                  <span className="cal-legend-dot" style={{ background: c.bdr }} />
                  <span className="cal-legend-name">{k.replace("-", " ")}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main view area */}
        <div className="cal-main">
          {view === "month" && (
            <MonthView
              year={base.getFullYear()}
              month={base.getMonth()}
              lessonsByDay={lessonsByDay}
              todayStr={todayStr}
              onDayClick={d => { setBase(d); setView("day"); }}
            />
          )}
          {view === "week" && (
            <TimeGrid
              dates={weekDates}
              lessonsByDay={lessonsByDay}
              todayStr={todayStr}
            />
          )}
          {view === "day" && (
            <TimeGrid
              dates={[base]}
              lessonsByDay={lessonsByDay}
              todayStr={todayStr}
            />
          )}
        </div>
      </div>
    </div>
  );
}

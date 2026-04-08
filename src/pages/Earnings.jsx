import React, { useEffect, useState, useMemo, useCallback } from "react";
import { getLessons, getInstructorProfile, updateLesson } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./Earnings.css";

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function lessonEarning(lesson, defaultRate) {
  if (lesson.lessonType === "test-day" && lesson.rateApplied) return Number(lesson.rateApplied);
  const duration = Number(lesson.duration) || 1;
  const rate = lesson.rateApplied ? Number(lesson.rateApplied) : defaultRate;
  return duration * rate;
}

function paymentLabel(status) {
  if (status === "paid") return { text: "Paid", color: "#10b981" };
  if (status === "cash") return { text: "Cash", color: "#10b981" };
  if (status === "card") return { text: "Card", color: "#3b82f6" };
  if (status === "bank") return { text: "Bank Transfer", color: "#8b5cf6" };
  if (status === "package") return { text: "Package", color: "#06b6d4" };
  if (status === "pending") return { text: "Unpaid", color: "#f59e0b" };
  if (status === "waived") return { text: "Waived", color: "#9ca3af" };
  return { text: status || "Unpaid", color: "#f59e0b" };
}

function isPaid(status) {
  return ["paid", "cash", "card", "bank"].includes(status);
}

function exportToCSV(lessons, rate) {
  const rows = [
    ["Student", "Date", "Time", "Duration (hrs)", "Amount (£)", "Payment Method", "Lesson Status"]
  ];
  lessons.forEach((l) => {
    rows.push([
      l.studentName || "Unknown",
      l.date || "",
      l.time || "",
      l.duration || 1,
      lessonEarning(l, rate).toFixed(2),
      l.review?.paymentStatus || "pending",
      l.review?.status || "scheduled"
    ]);
  });
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pass-with-ravi-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Earnings() {
  const { showToast } = useToast();
  const [lessons, setLessons] = useState([]);
  const [rate, setRate] = useState(35);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month"); // month | week | all

  useEffect(() => {
    async function load() {
      try {
        const [allLessons, profile] = await Promise.all([getLessons(), getInstructorProfile()]);
        setLessons(allLessons);
        if (profile?.hourlyRate) setRate(Number(profile.hourlyRate) || 35);
      } catch {
        showToast("Failed to load earnings", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const completedLessons = useMemo(
    () => {
      const today = new Date().toISOString().slice(0, 10);
      return lessons.filter((l) => {
        const status = l.review?.status;
        if (status && status !== "scheduled" && status !== "cancelled") return true;
        // Lessons without a review field (older data): include if date is in the past
        if (!status && l.date && l.date < today) return true;
        return false;
      });
    },
    [lessons]
  );

  const now = useMemo(() => new Date(), []);
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisWeekKey = getWeekKey(now.toISOString().slice(0, 10));

  const thisMonthLessons = useMemo(
    () => completedLessons.filter((l) => getMonthKey(l.date) === thisMonthKey),
    [completedLessons, thisMonthKey]
  );

  const thisWeekLessons = useMemo(
    () => completedLessons.filter((l) => getWeekKey(l.date) === thisWeekKey),
    [completedLessons, thisWeekKey]
  );

  const unpaidLessons = useMemo(
    () => completedLessons.filter((l) => !isPaid(l.review?.paymentStatus)),
    [completedLessons]
  );

  const totalEarned = useMemo(
    () => completedLessons.filter((l) => isPaid(l.review?.paymentStatus)).reduce((sum, l) => sum + lessonEarning(l, rate), 0),
    [completedLessons, rate]
  );

  const monthEarned = useMemo(
    () => thisMonthLessons.filter((l) => isPaid(l.review?.paymentStatus)).reduce((sum, l) => sum + lessonEarning(l, rate), 0),
    [thisMonthLessons, rate]
  );

  const weekEarned = useMemo(
    () => thisWeekLessons.filter((l) => isPaid(l.review?.paymentStatus)).reduce((sum, l) => sum + lessonEarning(l, rate), 0),
    [thisWeekLessons, rate]
  );

  const unpaidTotal = useMemo(
    () => unpaidLessons.reduce((sum, l) => sum + lessonEarning(l, rate), 0),
    [unpaidLessons, rate]
  );

  const methodBreakdown = useMemo(() => {
    const methods = { cash: 0, card: 0, bank: 0, package: 0 };
    const methodCounts = { cash: 0, card: 0, bank: 0, package: 0 };
    completedLessons.forEach((l) => {
      const ps = l.review?.paymentStatus;
      if (ps === "cash" || ps === "card" || ps === "bank" || ps === "package") {
        methods[ps] += lessonEarning(l, rate);
        methodCounts[ps] += 1;
      } else if (ps === "paid") {
        methods.cash += lessonEarning(l, rate);
        methodCounts.cash += 1;
      }
    });
    return [
      { key: "cash", label: "Cash", amount: methods.cash, count: methodCounts.cash, color: "#10b981" },
      { key: "card", label: "Card", amount: methods.card, count: methodCounts.card, color: "#3b82f6" },
      { key: "bank", label: "Bank Transfer", amount: methods.bank, count: methodCounts.bank, color: "#8b5cf6" },
      { key: "package", label: "Package", amount: methods.package, count: methodCounts.package, color: "#06b6d4" },
    ].filter((m) => m.count > 0);
  }, [completedLessons, rate]);

  // Monthly breakdown for last 6 months
  const monthlyBreakdown = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const monthLessons = completedLessons.filter((l) => getMonthKey(l.date) === key);
      const earned = monthLessons.filter((l) => isPaid(l.review?.paymentStatus)).reduce((sum, l) => sum + lessonEarning(l, rate), 0);
      months.push({ key, label, earned, count: monthLessons.length });
    }
    return months;
  }, [completedLessons, rate, now]);

  const maxEarned = Math.max(...monthlyBreakdown.map((m) => m.earned), 1);

  const markPaid = useCallback(async (lessonId, method) => {
    try {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;
      const updatedReview = { ...lesson.review, paymentStatus: method };
      await updateLesson(lessonId, { review: updatedReview });
      setLessons((prev) =>
        prev.map((l) => l.id === lessonId ? { ...l, review: updatedReview } : l)
      );
      showToast(`Marked as ${method}`, "success");
    } catch {
      showToast("Failed to update payment", "error");
    }
  }, [lessons, showToast]);

  const displayLessons = view === "month" ? thisMonthLessons : view === "week" ? thisWeekLessons : completedLessons;

  if (loading) return <p style={{ padding: "20px" }}>Loading earnings...</p>;

  return (
    <div className="earnings-page">
      <h1 className="earnings-title">Earnings</h1>
      <p className="earnings-sub">Based on £{rate}/hr from your profile. Update in <a href="/profile">My Profile</a>.</p>

      <div className="earnings-stat-grid">
        <div className="earnings-stat green">
          <span>This Week</span>
          <strong>£{weekEarned.toFixed(0)}</strong>
          <small>{thisWeekLessons.length} lessons</small>
        </div>
        <div className="earnings-stat blue">
          <span>This Month</span>
          <strong>£{monthEarned.toFixed(0)}</strong>
          <small>{thisMonthLessons.length} lessons</small>
        </div>
        <div className="earnings-stat purple">
          <span>Total Earned</span>
          <strong>£{totalEarned.toFixed(0)}</strong>
          <small>{completedLessons.filter((l) => isPaid(l.review?.paymentStatus)).length} paid lessons</small>
        </div>
        <div className="earnings-stat amber">
          <span>Unpaid</span>
          <strong>£{unpaidTotal.toFixed(0)}</strong>
          <small>{unpaidLessons.length} lessons owed</small>
        </div>
      </div>

      {methodBreakdown.length > 0 && (
        <div className="earnings-chart-card">
          <h2>Payment Methods</h2>
          <div className="earnings-method-grid">
            {methodBreakdown.map((m) => (
              <div key={m.key} className="earnings-method-item">
                <div className="earnings-method-dot" style={{ background: m.color }} />
                <div className="earnings-method-info">
                  <strong>{m.label}</strong>
                  <span>£{m.amount.toFixed(0)} · {m.count} lesson{m.count !== 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="earnings-chart-card">
        <h2>Last 6 Months</h2>
        <div className="earnings-bar-chart">
          {monthlyBreakdown.map((m) => (
            <div key={m.key} className="earnings-bar-col">
              <span className="earnings-bar-value">£{m.earned.toFixed(0)}</span>
              <div className="earnings-bar-track">
                <div
                  className={`earnings-bar-fill ${m.key === thisMonthKey ? "active" : ""}`}
                  style={{ height: `${(m.earned / maxEarned) * 100}%` }}
                />
              </div>
              <span className="earnings-bar-label">{m.label}</span>
              <small>{m.count} lessons</small>
            </div>
          ))}
        </div>
      </div>

      {unpaidLessons.length > 0 && (
        <div className="earnings-unpaid-card">
          <h2>Unpaid Lessons ({unpaidLessons.length}) — £{unpaidTotal.toFixed(0)} owed</h2>
          <div className="earnings-lesson-list">
            {unpaidLessons.slice(0, 20).map((l) => (
              <div key={l.id} className="earnings-lesson-row unpaid-row">
                <a href={`/lessons/${l.id}`} className="earnings-unpaid-info">
                  <strong>{l.studentName || "Unknown"}</strong>
                  <small>{l.date} at {l.time} · {l.duration || 1}hr · £{lessonEarning(l, rate).toFixed(0)}</small>
                </a>
                <div className="earnings-quick-pay">
                  <button className="quick-pay-btn cash" onClick={() => markPaid(l.id, "cash")}>Cash</button>
                  <button className="quick-pay-btn card" onClick={() => markPaid(l.id, "card")}>Card</button>
                  <button className="quick-pay-btn bank" onClick={() => markPaid(l.id, "bank")}>Bank</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="earnings-history-card">
        <div className="earnings-history-header">
          <h2>Lesson History</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="earnings-filter-tabs">
              {["week", "month", "all"].map((v) => (
                <button
                  key={v}
                  className={view === v ? "active" : ""}
                  onClick={() => setView(v)}
                >
                  {v === "week" ? "This week" : v === "month" ? "This month" : "All time"}
                </button>
              ))}
            </div>
            <button
              className="earnings-csv-btn"
              onClick={() => exportToCSV(completedLessons, rate)}
              title="Export all completed lessons as CSV"
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>
        <div className="earnings-lesson-list">
          {displayLessons.length === 0 && <p className="earnings-empty">No lessons in this period.</p>}
          {displayLessons.map((l) => {
            const label = paymentLabel(l.review?.paymentStatus);
            return (
              <a key={l.id} href={`/lessons/${l.id}`} className="earnings-lesson-row">
                <div>
                  <strong>{l.studentName || "Unknown"}</strong>
                  <small>{l.date} at {l.time} · {l.duration || 1}hr · {l.review?.status || ""}</small>
                </div>
                <div className="earnings-lesson-right">
                  <span style={{ color: label.color, fontSize: "12px" }}>{label.text}</span>
                  <strong>£{lessonEarning(l, rate).toFixed(0)}</strong>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

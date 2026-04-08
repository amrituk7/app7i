import React, { useEffect, useState } from "react";
import { getLesson, getInstructorProfile } from "../firebase";
import { useParams, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./LessonInvoice.css";

export default function LessonInvoice() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [lesson, setLesson] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [l, p] = await Promise.all([getLesson(id), getInstructorProfile()]);
        if (!l) { showToast("Lesson not found", "error"); return; }
        setLesson(l);
        setProfile(p || {});
      } catch {
        showToast("Failed to load invoice", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading) return <p style={{ padding: "20px" }}>Loading invoice...</p>;
  if (!lesson) return <p style={{ padding: "20px" }}>Lesson not found.</p>;

  const isTestDay = lesson.lessonType === "test-day";
  const rate = lesson.rateApplied ? Number(lesson.rateApplied) : (Number(profile?.hourlyRate) || 35);
  const duration = Number(lesson.duration) || 1;
  const amount = isTestDay ? rate.toFixed(2) : (rate * duration).toFixed(2);
  const payStatus = lesson.review?.paymentStatus || "pending";
  const isPaid = ["paid", "cash", "card", "bank", "package"].includes(payStatus);

  const invoiceNum = `RM-${new Date(lesson.date || Date.now()).getFullYear()}-${id.slice(-5).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const lessonDate = lesson.date
    ? new Date(lesson.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Unknown date";

  return (
    <div className="inv-wrap">
      <div className="inv-no-print">
        <Link to={`/lessons/${id}`}>
          <button>← Back to Lesson</button>
        </Link>
        <button className="inv-print-btn" onClick={() => window.print()}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="inv-page">
        <div className="inv-header">
          <div>
            <div className="inv-logo">Pass with {profile?.name || "Instructor"}</div>
            <div className="inv-logo-sub">Driving Instructor</div>
          </div>
          <div className="inv-header-right">
            <div className="inv-title">INVOICE</div>
            <div className="inv-num">{invoiceNum}</div>
            <div className="inv-date-issued">Issued: {today}</div>
          </div>
        </div>

        <div className="inv-parties">
          <div className="inv-party">
            <div className="inv-party-label">From</div>
            <div className="inv-party-name">{profile?.name || "Instructor"}</div>
            {profile?.phone && <div className="inv-party-detail">📞 {profile.phone}</div>}
            {profile?.email && <div className="inv-party-detail">✉ {profile.email}</div>}
            {profile?.adiBadgeNumber && <div className="inv-party-detail">ADI No: {profile.adiBadgeNumber}</div>}
          </div>
          <div className="inv-party">
            <div className="inv-party-label">To</div>
            <div className="inv-party-name">{lesson.studentName || "Student"}</div>
            {lesson.studentPhone && <div className="inv-party-detail">📞 {lesson.studentPhone}</div>}
            {lesson.studentEmail && <div className="inv-party-detail">✉ {lesson.studentEmail}</div>}
          </div>
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {isTestDay ? "Test Day" : "Driving Lesson"}
                {lesson.transmission && <div className="inv-note" style={{ textTransform: "capitalize" }}>{lesson.transmission} transmission</div>}
                {lesson.notes && <div className="inv-note">{lesson.notes}</div>}
              </td>
              <td>{lessonDate}</td>
              <td>{isTestDay ? "—" : `${duration} hour${duration !== 1 ? "s" : ""}`}</td>
              <td>{isTestDay ? "Fixed fee" : `£${rate.toFixed(2)}/hr`}</td>
              <td className="inv-amount">£{amount}</td>
            </tr>
          </tbody>
        </table>

        <div className="inv-totals">
          <div className="inv-total-row">
            <span>Subtotal</span>
            <span>£{amount}</span>
          </div>
          <div className="inv-total-row inv-total-bold">
            <span>Total Due</span>
            <span>£{amount}</span>
          </div>
        </div>

        <div className={`inv-status-badge ${isPaid ? "paid" : "unpaid"}`}>
          {isPaid ? `✓ PAID (${payStatus})` : "⚠ PAYMENT PENDING"}
        </div>

        {!isPaid && (
          <div className="inv-payment-info">
            <strong>Payment Methods</strong>
            <p>Cash · Bank Transfer · {profile?.paymentMethods || "Please ask your instructor"}</p>
          </div>
        )}

        <div className="inv-footer">
          <p>Thank you for choosing Pass with {profile?.name || "Instructor"}</p>
          <p>This invoice was generated on {today}</p>
        </div>
      </div>
    </div>
  );
}

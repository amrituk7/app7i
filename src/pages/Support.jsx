import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import "./Support.css";

const SUPPORT_EMAIL = "support@app7i.com";

export default function Support() {
  const { userProfile, user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const isRefundRequest = searchParams.get("topic") === "refund";
  const [subject, setSubject] = useState(isRefundRequest ? "Refund request" : "");
  const [message, setMessage] = useState(
    isRefundRequest
      ? "Please review my refund request. Reason:\n\nBilling email:\nApproximate charge date:\nAny extra context:"
      : ""
  );
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "supportTickets"), {
        uid: user?.uid || null,
        email: userProfile?.email || user?.email || "unknown",
        name: userProfile?.name || "",
        role: userProfile?.role || "",
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
        createdAt: Date.now(),
      });
      showToast("Message sent! We'll get back to you soon.", "success");
      setSubject("");
      setMessage("");
    } catch {
      showToast(`Failed to send. Please contact ${SUPPORT_EMAIL} directly.`, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-container">
      {isRefundRequest && (
        <div className="support-banner">
          <strong>Refund request</strong>
          <span>Use this form to send a simple refund request to the team.</span>
        </div>
      )}

      <h1>App Support</h1>
      <p className="support-subtitle">
        Use this page for customer support, general queries, and concerns/issues. We keep the process simple and clear.
      </p>

      <div className="support-purpose-list">
        <div className="support-purpose-card">
          <strong>Customer support</strong>
          <span>Account help, billing questions, and app guidance.</span>
        </div>
        <div className="support-purpose-card">
          <strong>Queries</strong>
          <span>Product questions, setup help, and general requests.</span>
        </div>
        <div className="support-purpose-card">
          <strong>Concerns/issues</strong>
          <span>Report bugs, billing concerns, or anything that feels off.</span>
        </div>
      </div>

      <form className="support-form" onSubmit={handleSubmit}>
        <label>
          Subject
          <input
            id="support-subject"
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. App is loading slowly"
            maxLength={100}
          />
        </label>
        <label>
          Message
          <textarea
            id="support-message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue or question..."
            rows={6}
            maxLength={2000}
          />
        </label>
        <button type="submit" className="support-btn" disabled={sending}>
          {sending ? "Sending..." : "Send Message"}
        </button>
      </form>

      <div className="support-alt">
        <p>Direct contact reference: <strong>{SUPPORT_EMAIL}</strong></p>
      </div>
    </div>
  );
}

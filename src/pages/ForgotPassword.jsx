import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../firebase";
import "./Auth.css";

function getErrorMessage(code) {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email address. Please check the email or register a new account.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return "Failed to send reset email. Please try again.";
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim()) { setErrorMsg("Please enter your email address."); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error) {
      setErrorMsg(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>App7i</h1>
          <p>Reset your password</p>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
            <h3 style={{ marginBottom: "8px" }}>Check your email</h3>
            <p style={{ color: "#555", marginBottom: "8px" }}>
              A password reset link has been sent to <strong>{email}</strong>.
            </p>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
              Can't find it? Check your <strong>spam / junk folder</strong>.
            </p>
            <Link to="/login">
              <button className="auth-button">Back to Login</button>
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                  placeholder="Enter your email"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
                  padding: "10px 14px", borderRadius: "8px", fontSize: "14px", marginBottom: "14px"
                }}>
                  {errorMsg}
                  {errorMsg.includes("No account") && (
                    <> <Link to="/register" style={{ color: "#dc2626", fontWeight: "bold" }}>Register here</Link>.</>
                  )}
                </div>
              )}

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <p className="auth-footer">
              Remember your password? <Link to="/login">Sign in here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

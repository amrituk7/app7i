import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./Auth.css";

export default function RegisterInstructor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { showToast("Please enter your email", "error"); return; }
    if (!password.trim()) { showToast("Please create a password", "error"); return; }
    if (password !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    if (!agreedToTerms) { showToast("You must agree to the Terms and Conditions", "error"); return; }

    setLoading(true);
    try {
      await registerUser(email.trim().toLowerCase(), password, "instructor");
      showToast("Welcome! Let's set up your profile.", "success");
      navigate("/profile");
    } catch (error) {
      showToast(error.message || "Failed to create account", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Set up your account</h1>
          <p>Create your instructor login to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              id="instr-email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              id="instr-password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password (min 6 chars)"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              id="instr-confirm-password"
              name="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          <div className="auth-terms-row">
            <input
              type="checkbox"
              id="terms-agree"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
            />
            <label htmlFor="terms-agree">
              I have read and agree to the{" "}
              <Link to="/terms" target="_blank">Terms and Conditions</Link>
            </label>
          </div>

          <button type="submit" className="auth-button" disabled={loading || !agreedToTerms}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

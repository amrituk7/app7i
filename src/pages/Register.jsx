import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerStudentSelfOnboard, searchInstructorByUsername } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./Auth.css";

export default function Register() {
  const [step, setStep] = useState(1); // 1 = find instructor, 2 = register
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundInstructor, setFoundInstructor] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transmission, setTransmission] = useState("manual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) { showToast("Enter your instructor's username", "error"); return; }
    setSearching(true);
    setFoundInstructor(null);
    try {
      const result = await searchInstructorByUsername(searchQuery.trim());
      if (result) {
        setFoundInstructor(result);
      } else {
        showToast("No instructor found with that username", "error");
      }
    } catch {
      showToast("Search failed — try again", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { showToast("Please enter your name", "error"); return; }
    if (!email.trim()) { showToast("Please enter your email", "error"); return; }
    if (!password.trim()) { showToast("Please create a password", "error"); return; }
    if (password !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    if (!agreedToTerms) { showToast("You must agree to the Terms and Conditions", "error"); return; }

    setLoading(true);
    try {
      await registerStudentSelfOnboard(
        email.trim().toLowerCase(),
        password,
        name.trim(),
        phone.trim(),
        transmission,
        foundInstructor.uid
      );
      showToast("Account created! Welcome.", "success");
      navigate("/student-dashboard");
    } catch (error) {
      showToast(error.message || "Failed to create account", "error");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Find your instructor
  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Find your instructor</h1>
            <p>Search by your instructor's username to get started</p>
          </div>

          <form onSubmit={handleSearch} className="auth-form">
            <div className="form-group">
              <label>Instructor username</label>
              <input
                id="instructor-search"
                name="instructor-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="e.g. ravi_driving"
                autoComplete="off"
              />
            </div>

            <button type="submit" className="auth-button" disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {foundInstructor && (
            <div className="instructor-result" style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "rgba(196, 106, 45, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(196, 106, 45, 0.3)"
            }}>
              <h3 style={{ margin: "0 0 0.25rem", color: "#c46a2d" }}>{foundInstructor.name}</h3>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", color: "#999" }}>@{foundInstructor.username}</p>
              {foundInstructor.location && (
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#aaa" }}>{foundInstructor.location}</p>
              )}
              <button
                className="auth-button"
                onClick={() => setStep(2)}
                style={{ marginTop: "0.5rem" }}
              >
                This is my instructor — Continue
              </button>
            </div>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Register
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Joining <strong>{foundInstructor.name}</strong> (@{foundInstructor.username})</p>
        </div>

        <button
          type="button"
          onClick={() => { setStep(1); setFoundInstructor(null); }}
          style={{ background: "none", border: "none", color: "#c46a2d", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1rem" }}
        >
          ← Choose a different instructor
        </button>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Your Name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 07700 900000"
              autoComplete="tel"
            />
          </div>
          <div className="form-group">
            <label>Transmission</label>
            <select id="reg-transmission" name="transmission" value={transmission} onChange={e => setTransmission(e.target.value)}>
              <option value="manual">Manual</option>
              <option value="auto">Automatic</option>
            </select>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              id="reg-email"
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
              id="reg-password"
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
              id="reg-confirm-password"
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

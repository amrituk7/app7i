import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      showToast("Welcome back!", "success");
      navigate("/");
    } catch (error) {
      showToast(error.message || "Failed to login", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="auth-footer">
          Student? Ask your instructor for an invite link
        </p>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>
          <Link to="/terms" style={{ color: "#9ca3af" }}>Terms &amp; Conditions</Link>
          {" · "}
          <Link to="/privacy" style={{ color: "#9ca3af" }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

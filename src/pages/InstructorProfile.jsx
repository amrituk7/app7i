import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstructorProfile, saveInstructorProfile, checkUsernameAvailable, deleteInstructorAccount, getLessons, getStudents } from "../firebase";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import "./InstructorProfile.css";

function transmissionLabel(value) {
  if (value === "manual") return "Manual only";
  if (value === "auto") return "Auto only";
  return "Manual and auto";
}

function initialsFromName(name, email) {
  return (name || email || "R")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Google Business review URL — update with your actual Google Business Place ID
const GOOGLE_REVIEW_URL = "https://g.page/r/app7i/review";

export default function InstructorProfile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setInstructorName, logout, user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    phone: "",
    email: "",
    licenceNumber: "",
    adiBadgeNumber: "",
    adiBadgeExpiry: "",
    hourlyRate: "",
    bio: "",
    areas: "",
    location: "",
    rating: "",
    manualRate: "",
    autoSundayRate: "",
    testDayFee: "",
    helpsWithTestBooking: false,
    manualWeekdayRate: "",
    autoWeekdayRate: "",
    manualWeekendRate: "",
    autoWeekendRate: "",
    transmissions: "both",
    serviceNotes: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getInstructorProfile();
        if (data) setProfile((prev) => ({ ...prev, ...data }));
        else setEditing(true);
      } catch {
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const rateLines = useMemo(() => {
    const parts = [];
    if (profile.manualRate) parts.push(`Manual: GBP ${profile.manualRate}/hr`);
    else if (profile.manualWeekdayRate) parts.push(`Manual weekday: GBP ${profile.manualWeekdayRate}/hr`);
    if (profile.autoSundayRate) parts.push(`Auto Sunday: GBP ${profile.autoSundayRate}/hr`);
    else if (profile.autoWeekdayRate) parts.push(`Auto weekday: GBP ${profile.autoWeekdayRate}/hr`);
    if (profile.testDayFee) parts.push(`Test day fee: GBP ${profile.testDayFee}`);
    if (parts.length === 0 && profile.hourlyRate) parts.push(`Standard: GBP ${profile.hourlyRate}/hr`);
    return parts;
  }, [profile]);

  const detailRows = [
    ["Phone", profile.phone],
    ["Email", profile.email],
    ["Location", profile.location],
    ["ADI badge", profile.adiBadgeNumber],
    ["ADI expiry", profile.adiBadgeExpiry],
    ["Licence number", profile.licenceNumber]
  ].filter(([, value]) => value);

  const serviceRows = [
    ["Transmissions", transmissionLabel(profile.transmissions)],
    ["Areas covered", profile.areas],
    ["Test booking help", profile.helpsWithTestBooking ? "Yes" : ""],
    ["Services", profile.serviceNotes]
  ].filter(([, value]) => value);

  const hasSavedProfile = Boolean(
    profile.name ||
    profile.phone ||
    profile.email ||
    profile.location ||
    profile.bio
  );

  async function handleSave(e) {
    e.preventDefault();
    if (profile.username) {
      const cleaned = profile.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleaned !== profile.username) {
        showToast("Username can only contain lowercase letters, numbers, and underscores", "error");
        return;
      }
      if (cleaned.length < 3) {
        showToast("Username must be at least 3 characters", "error");
        return;
      }
    }
    setSaving(true);
    try {
      if (profile.username) {
        const available = await checkUsernameAvailable(profile.username);
        if (!available) {
          showToast("Username already taken — try another", "error");
          setSaving(false);
          return;
        }
      }
      await saveInstructorProfile(profile);
      if (profile.name) setInstructorName(profile.name);
      showToast("Profile saved!", "success");
      setEditing(false);
      // Check if user qualifies for review prompt
      maybeShowReviewPrompt();
    } catch (err) {
      console.error("Profile save error:", err);
      showToast("Failed to save profile: " + (err.message || "unknown error"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function maybeShowReviewPrompt() {
    const dismissed = localStorage.getItem("app7i_review_dismissed");
    const shown = localStorage.getItem("app7i_review_shown");
    if (dismissed || shown) return;
    try {
      const [students, lessons] = await Promise.all([getStudents(), getLessons()]);
      const createdAt = user?.metadata?.creationTime;
      const daysSinceSignup = createdAt ? (Date.now() - new Date(createdAt).getTime()) / 86400000 : 0;
      if (students.length >= 3 || lessons.length >= 5 || daysSinceSignup >= 3) {
        setShowReviewPrompt(true);
        localStorage.setItem("app7i_review_shown", "1");
      }
    } catch {}
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") { showToast("Type DELETE to confirm", "error"); return; }
    setDeleting(true);
    try {
      await deleteInstructorAccount();
      await logout();
      showToast("Account deleted", "success");
      navigate("/");
    } catch (err) {
      showToast("Failed to delete account: " + (err.message || ""), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="instructor-profile-page">
        <div className="profile-loading-shell">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="instructor-profile-page">
      <section className="profile-hero">
        <div className="profile-hero-copy">
          <span className="profile-eyebrow">Instructor identity</span>
          <h1>{editing ? "Edit Your Profile" : "Instructor Profile"}</h1>
          <p>
            Shape how students see your teaching style, pricing, and the service you offer before
            they even message you.
          </p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="profile-hero-btn">
            Edit Profile
          </button>
        )}
      </section>

      {!editing ? (
        <div className="profile-view-grid">
          <section className="profile-card profile-card-primary">
            <div className="profile-card-top">
              <div className="profile-avatar">
                {initialsFromName(profile.name, profile.email)}
              </div>
              <div className="profile-title-block">
                <h2>{profile.name || "Add your instructor profile"}</h2>
                {profile.rating && (
                  <p className="profile-rating">Rating {profile.rating}/5</p>
                )}
                {profile.username && (
                  <p className="profile-username">@{profile.username}</p>
                )}
                <p className="profile-lead">
                  {profile.bio || "Add a short bio so students understand your teaching style and what makes your lessons feel different."}
                </p>
              </div>
            </div>
            <div className="profile-tag-row">
              <span className="profile-tag">{transmissionLabel(profile.transmissions)}</span>
              {profile.location && <span className="profile-tag">{profile.location}</span>}
              {profile.helpsWithTestBooking && (
                <span className="profile-tag profile-tag-accent">Helps with test booking</span>
              )}
            </div>
          </section>

          <section className="profile-card">
            <h3>Contact and credentials</h3>
            {detailRows.length === 0 ? (
              <p className="profile-empty-note">Add your phone, email, and credentials to complete this section.</p>
            ) : (
              <div className="profile-detail-list">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="profile-detail-row">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="profile-card">
            <h3>Service footprint</h3>
            {serviceRows.length === 0 ? (
              <p className="profile-empty-note">Add your service coverage and teaching notes so students know what to expect.</p>
            ) : (
              <div className="profile-detail-list">
                {serviceRows.map(([label, value]) => (
                  <div key={label} className="profile-detail-row">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="profile-card profile-pricing-card">
            <h3>Pricing</h3>
            {rateLines.length === 0 ? (
              <p className="profile-empty-note">Add your rates so the pricing panel is ready for students.</p>
            ) : (
              <div className="profile-pricing-list">
                {rateLines.map((line) => (
                  <div key={line} className="profile-pricing-line">{line}</div>
                ))}
              </div>
            )}
          </section>

          {!hasSavedProfile && (
            <section className="profile-card">
              <h3>Start here</h3>
              <p className="profile-empty-note">Use Edit Profile to add your details, rates, and teaching notes.</p>
            </section>
          )}
        </div>
      ) : (
        <form className="profile-form" onSubmit={handleSave}>
          <section className="profile-form-card">
            <div className="profile-section-heading">
              <h2>Basics</h2>
              <p>Your public identity, credentials, and main contact details.</p>
            </div>

            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Username</span>
                <input
                  placeholder="e.g. ravi_driving"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                />
                <small style={{ color: "#999", fontSize: "0.75rem" }}>Students will search this to find you</small>
              </label>
              <label className="profile-field">
                <span>Full name</span>
                <input
                  placeholder="e.g. Ravi Singh"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Phone</span>
                <input
                  placeholder="07700 900123"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="ravi@example.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Location</span>
                <input
                  placeholder="e.g. East London"
                  value={profile.location || ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Rating out of 5</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="e.g. 4.8"
                  value={profile.rating || ""}
                  onChange={(e) => setProfile({ ...profile, rating: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Default rate</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 35"
                  value={profile.hourlyRate}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>ADI badge number</span>
                <input
                  placeholder="ADI badge number"
                  value={profile.adiBadgeNumber}
                  onChange={(e) => setProfile({ ...profile, adiBadgeNumber: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>ADI badge expiry</span>
                <input
                  type="date"
                  value={profile.adiBadgeExpiry}
                  onChange={(e) => setProfile({ ...profile, adiBadgeExpiry: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Driving licence number</span>
                <input
                  placeholder="Licence number"
                  value={profile.licenceNumber}
                  onChange={(e) => setProfile({ ...profile, licenceNumber: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Transmissions</span>
                <select
                  value={profile.transmissions}
                  onChange={(e) => setProfile({ ...profile, transmissions: e.target.value })}
                >
                  <option value="both">Manual and auto</option>
                  <option value="manual">Manual only</option>
                  <option value="auto">Auto only</option>
                </select>
              </label>
            </div>
          </section>

          <section className="profile-form-card">
            <div className="profile-section-heading">
              <h2>Pricing</h2>
              <p>Keep your headline rates clear and easy to compare.</p>
            </div>

            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Manual rate</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 35"
                  value={profile.manualRate || ""}
                  onChange={(e) => setProfile({ ...profile, manualRate: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Auto Sunday rate</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 38"
                  value={profile.autoSundayRate || ""}
                  onChange={(e) => setProfile({ ...profile, autoSundayRate: e.target.value })}
                />
              </label>
              <label className="profile-field">
                <span>Test day fee</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 180"
                  value={profile.testDayFee || ""}
                  onChange={(e) => setProfile({ ...profile, testDayFee: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="profile-form-card">
            <div className="profile-section-heading">
              <h2>Service details</h2>
              <p>Tell students where you work and how you support them.</p>
            </div>

            <div className="profile-form-stack">
              <label className="profile-checkbox-row">
                <input
                  type="checkbox"
                  checked={!!profile.helpsWithTestBooking}
                  onChange={(e) => setProfile({ ...profile, helpsWithTestBooking: e.target.checked })}
                />
                <span>Helps with DVSA test booking</span>
              </label>

              <label className="profile-field">
                <span>Areas covered</span>
                <input
                  placeholder="e.g. East London, Ilford, Barking"
                  value={profile.areas}
                  onChange={(e) => setProfile({ ...profile, areas: e.target.value })}
                />
              </label>

              <label className="profile-field">
                <span>Services and notes</span>
                <textarea
                  rows="3"
                  placeholder="e.g. Intensive courses, motorway practice, support with test prep"
                  value={profile.serviceNotes || ""}
                  onChange={(e) => setProfile({ ...profile, serviceNotes: e.target.value })}
                />
              </label>

              <label className="profile-field">
                <span>Bio</span>
                <textarea
                  rows="4"
                  placeholder="Brief description about yourself as an instructor"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </label>
            </div>
          </section>

          <div className="profile-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {hasSavedProfile && (
              <button type="button" className="profile-cancel-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {/* ── Settings section ── */}
      <section className="profile-card profile-settings-card">
        <h3>Settings</h3>
        <div className="profile-settings-list">
          <button className="profile-settings-btn" onClick={() => setShowReviewPrompt(true)}>
            <span>Give us feedback</span>
            <small>Help us improve App7i</small>
          </button>
          <a className="profile-settings-btn" href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            <span>Leave a Google Review</span>
            <small>Takes less than 30 seconds</small>
          </a>
          <button className="profile-settings-btn profile-settings-danger" onClick={() => setShowDeleteModal(true)}>
            <span>Delete Account</span>
            <small>Permanently remove all your data</small>
          </button>
        </div>
      </section>

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="profile-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <h2>Delete your account?</h2>
            <p className="profile-modal-warning">
              This will permanently delete your data, students, lessons, messages, and billing history. This action cannot be undone.
            </p>
            <label className="profile-modal-label">
              Type <strong>DELETE</strong> to confirm
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </label>
            <div className="profile-modal-actions">
              <button className="profile-modal-cancel" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
                Cancel
              </button>
              <button className="profile-modal-delete" onClick={handleDeleteAccount} disabled={deleting || deleteConfirm !== "DELETE"}>
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Prompt Modal ── */}
      {showReviewPrompt && (
        <div className="profile-modal-overlay" onClick={() => setShowReviewPrompt(false)}>
          <div className="profile-modal profile-modal-review" onClick={e => e.stopPropagation()}>
            <h2>Enjoying App7i?</h2>
            <p>Your feedback helps us grow and build a better app for instructors like you.</p>
            <div className="profile-modal-actions profile-modal-actions-stack">
              <a className="profile-modal-primary" href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" onClick={() => setShowReviewPrompt(false)}>
                Leave a Google Review
              </a>
              <a className="profile-modal-secondary" href="mailto:support@app7i.com?subject=App7i Feedback" onClick={() => setShowReviewPrompt(false)}>
                Send us feedback instead
              </a>
              <button className="profile-modal-muted" onClick={() => { localStorage.setItem("app7i_review_dismissed", "1"); setShowReviewPrompt(false); }}>
                Remind me later
              </button>
            </div>
            <p className="profile-modal-micro">Takes less than 30 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTips, addTip, deleteTip, getStudentByEmail } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Tips.css";

export default function Tips() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTip, setNewTip] = useState({ title: "", content: "", type: "text", videoUrl: "" });
  const [saving, setSaving] = useState(false);
  const { isStudent, user } = useAuth();
  const { showToast } = useToast();

  const loadTips = useCallback(async () => {
    try {
      let instructorId = null;
      if (isStudent && user?.email) {
        const studentRecord = await getStudentByEmail(user.email).catch(() => null);
        instructorId = studentRecord?.instructorId || null;
        if (isStudent && !instructorId) {
          // Student record exists but has no instructorId — show friendly empty state
          setTips([]);
          return;
        }
      }
      const data = await getTips(instructorId);
      setTips(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    } catch (error) {
      console.error("Error loading tips:", error);
      showToast("Failed to load tips", "error");
    } finally {
      setLoading(false);
    }
  }, [isStudent, user, showToast]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  async function handleAddTip(e) {
    e.preventDefault();

    if (!newTip.title.trim() || !newTip.content.trim()) {
      showToast("Please fill in title and content", "error");
      return;
    }

    if (newTip.type === "video" && !newTip.videoUrl.trim()) {
      showToast("Please provide a video URL", "error");
      return;
    }

    setSaving(true);

    try {
      await addTip({
        title: newTip.title.trim(),
        content: newTip.content.trim(),
        type: newTip.type,
        videoUrl: newTip.type === "video" ? newTip.videoUrl.trim() : null
      });
      showToast("Tip added successfully", "success");
      setNewTip({ title: "", content: "", type: "text", videoUrl: "" });
      setShowForm(false);
      await loadTips();
    } catch (error) {
      console.error("Error adding tip:", error);
      showToast("Failed to add tip", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTip(id) {
    if (!window.confirm("Delete this tip?")) return;

    try {
      await deleteTip(id);
      setTips(tips.filter((tip) => tip.id !== id));
      showToast("Tip deleted", "success");
    } catch (error) {
      console.error("Error deleting tip:", error);
      showToast("Failed to delete tip", "error");
    }
  }

  function getEmbedUrl(url) {
    if (!url) return null;
    // Only allow YouTube URLs — block all other sources to prevent XSS
    const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    // Not a recognised YouTube URL — don't render iframe
    return null;
  }

  if (loading) return <p>Loading tips...</p>;

  return (
    <div className="tips-page">
      <Link to={isStudent ? "/student-dashboard" : "/"}>
        <button type="button" className="back-btn">Back to Dashboard</button>
      </Link>

      <div className="tips-header">
        <div>
          <h1>Instructor Tips</h1>
          <p>Expert advice to help you become a confident driver</p>
        </div>
        {!isStudent && (
          <button
            className="add-tip-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Tip"}
          </button>
        )}
      </div>

      {!isStudent && showForm && (
        <form className="tip-form" onSubmit={handleAddTip}>
          <input
            placeholder="Tip Title"
            value={newTip.title}
            onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
          />

          <select
            value={newTip.type}
            onChange={(e) => setNewTip({ ...newTip, type: e.target.value })}
          >
            <option value="text">Text Tip</option>
            <option value="video">Video Tip</option>
          </select>

          {newTip.type === "video" && (
            <input
              placeholder="YouTube URL"
              value={newTip.videoUrl}
              onChange={(e) => setNewTip({ ...newTip, videoUrl: e.target.value })}
            />
          )}

          <textarea
            placeholder="Tip Content / Description"
            value={newTip.content}
            onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
            rows={4}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add Tip"}
          </button>
        </form>
      )}

      {tips.length === 0 ? (
        <div className="no-tips">
          <p>No tips yet. Check back soon!</p>
        </div>
      ) : (
        <div className="tips-list">
          {tips.map((tip) => (
            <div key={tip.id} className="tip-card">
              <div className="tip-header">
                <h3>{tip.title || "Untitled Tip"}</h3>
                {!isStudent && (
                  <button
                    className="delete-tip-btn"
                    onClick={() => handleDeleteTip(tip.id)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {tip.type === "video" && tip.videoUrl && getEmbedUrl(tip.videoUrl) && (
                <div className="tip-video">
                  <iframe
                    src={getEmbedUrl(tip.videoUrl)}
                    title={tip.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  />
                </div>
              )}

              <p className="tip-content">{tip.content || ""}</p>

              <small className="tip-date">
                {tip.timestamp ? new Date(tip.timestamp).toLocaleDateString() : ""}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

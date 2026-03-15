import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTips, addTip, deleteTip } from "../firebase";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import "./Tips.css";

export default function Tips() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTip, setNewTip] = useState({ title: "", content: "", type: "text", videoUrl: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { isInstructor } = useAuth();

  useEffect(() => {
    loadTips();
  }, []);

  async function loadTips() {
    try {
      const data = await getTips();
      setTips(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error("Error loading tips:", error);
      showToast("Failed to load tips", "error");
    } finally {
      setLoading(false);
    }
  }

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
      setTips(tips.filter(t => t.id !== id));
      showToast("Tip deleted", "success");
    } catch (error) {
      console.error("Error deleting tip:", error);
      showToast("Failed to delete tip", "error");
    }
  }

  function getEmbedUrl(url) {
    // Convert YouTube URLs to embed format
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }

  if (loading) return <p>Loading tips...</p>;

  return (
    <div className="tips-page">
      <Link to="/">
        <button type="button" className="back-btn">Back to Dashboard</button>
      </Link>

      <div className="tips-header">
        <div>
          <h1>Ravi's Tips</h1>
          <p>Expert advice to help you become a confident driver</p>
        </div>
        {isInstructor && (
          <button 
            className="add-tip-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Tip"}
          </button>
        )}
      </div>

      {showForm && (
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
                {isInstructor && (
                  <button 
                    className="delete-tip-btn"
                    onClick={() => handleDeleteTip(tip.id)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {tip.type === "video" && tip.videoUrl && (
                <div className="tip-video">
                  <iframe
                    src={getEmbedUrl(tip.videoUrl)}
                    title={tip.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
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

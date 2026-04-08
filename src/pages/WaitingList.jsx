import React, { useEffect, useState } from "react";
import { getWaitingList, addToWaitingList, removeFromWaitingList } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./WaitingList.css";

const EMPTY = { name: "", phone: "", email: "", transmission: "manual", notes: "" };

export default function WaitingList() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWaitingList()
      .then(setList)
      .catch(() => showToast("Failed to load waiting list", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const id = await addToWaitingList(form);
      setList((l) => [...l, { id, ...form, addedAt: Date.now() }]);
      setForm(EMPTY);
      setShowForm(false);
      showToast("Added to waiting list", "success");
    } catch {
      showToast("Failed to add", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove ${name || "this person"} from the waiting list?`)) return;
    try {
      await removeFromWaitingList(id);
      setList((l) => l.filter((e) => e.id !== id));
      showToast("Removed from waiting list", "success");
    } catch {
      showToast("Failed to remove", "error");
    }
  }

  function bookLesson(entry) {
    const prefill = encodeURIComponent(JSON.stringify({
      name: entry.name,
      phone: entry.phone,
      email: entry.email,
      transmission: entry.transmission
    }));
    navigate(`/students/add?prefill=${prefill}`);
  }

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="wl-page">
      <div className="wl-header">
        <div>
          <h1>Waiting List</h1>
          <p>{list.length} {list.length === 1 ? "person" : "people"} waiting for a lesson slot</p>
        </div>
        <button className="wl-add-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Person"}
        </button>
      </div>

      {showForm && (
        <form className="wl-form" onSubmit={handleAdd}>
          <h2>Add to Waiting List</h2>
          <div className="wl-form-grid">
            <div className="wl-form-group">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="wl-form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="07..." />
            </div>
            <div className="wl-form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@..." />
            </div>
            <div className="wl-form-group">
              <label>Transmission</label>
              <select name="transmission" value={form.transmission} onChange={handleChange}>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
          </div>
          <div className="wl-form-group">
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Wants early mornings, weekends only..." rows={2} />
          </div>
          <button type="submit" className="wl-save-btn" disabled={saving}>
            {saving ? "Adding..." : "Add to List"}
          </button>
        </form>
      )}

      {list.length === 0 && !showForm && (
        <div className="wl-empty">
          <p>No one on the waiting list yet.</p>
          <small>Add people who want lessons but don't have a slot yet.</small>
        </div>
      )}

      <div className="wl-list">
        {list.map((entry, i) => (
          <div key={entry.id} className="wl-card">
            <div className="wl-card-left">
              <span className="wl-position">#{i + 1}</span>
              <div className="wl-avatar">
                {(entry.name || "?").charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="wl-card-body">
              <div className="wl-card-top">
                <h3>{entry.name || "Unnamed"}</h3>
                <span className="wl-transmission">{entry.transmission || "manual"}</span>
              </div>
              <div className="wl-card-meta">
                {entry.phone && <span>📞 {entry.phone}</span>}
                {entry.email && <span>✉ {entry.email}</span>}
                {entry.addedAt && <span>Added {new Date(entry.addedAt).toLocaleDateString("en-GB")}</span>}
              </div>
              {entry.notes && <p className="wl-card-notes">{entry.notes}</p>}
              <div className="wl-card-actions">
                <button className="wl-action-link" onClick={() => bookLesson(entry)}>
                  Convert to Student
                </button>
                <button className="wl-remove-btn" onClick={() => handleRemove(entry.id, entry.name)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

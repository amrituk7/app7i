import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNotifications, markNotificationRead, deleteNotification } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./NotificationCenter.css";

export default function NotificationCenter() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications();
        setList(data.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Error loading notifications:", error);
        showToast("Failed to load notifications", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  async function handleRead(id) {
    try {
      await markNotificationRead(id);
      setList(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showToast("Failed to mark as read", "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this notification?")) return;

    try {
      await deleteNotification(id);
      setList(prev => prev.filter(n => n.id !== id));
      showToast("Notification deleted", "success");
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast("Failed to delete notification", "error");
    }
  }

  async function handleMarkAllRead() {
    const unread = list.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map(n => markNotificationRead(n.id)));
      setList(prev => prev.map(n => ({ ...n, read: true })));
      showToast("All marked as read", "success");
    } catch (error) {
      console.error("Error marking all as read:", error);
      showToast("Failed to mark all as read", "error");
    }
  }

  if (loading) return <p>Loading notifications...</p>;

  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div className="notification-container">
      <Link to="/">
        <button type="button" className="back-btn">Back to Dashboard</button>
      </Link>

      <div className="notif-header">
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="no-notifications">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notif-list">
          {list.map(n => (
            <div key={n.id} className={`notif-item ${n.read ? "read" : "unread"}`}>
              <div className="notif-content">
                <h3>{n.title || "Notification"}</h3>
                <p>{n.message || ""}</p>
                <small>{n.timestamp ? new Date(n.timestamp).toLocaleString() : ""}</small>
              </div>
              <div className="notif-actions">
                {!n.read && (
                  <button className="read-btn" onClick={() => handleRead(n.id)}>
                    Mark read
                  </button>
                )}
                <button className="delete-btn" onClick={() => handleDelete(n.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

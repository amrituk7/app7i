import React, { useEffect, useState } from "react";
import { getAllMessages, getStudents } from "../firebase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Messages.css";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid;

  useEffect(() => {
    async function load() {
      try {
        const [messages, students] = await Promise.all([getAllMessages(), getStudents()]);
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s; });

        // Group messages by student
        const convMap = {};
        messages.forEach(msg => {
          const studentId = msg.sender === uid ? msg.receiver : msg.sender;
          if (!studentId) return;
          if (!convMap[studentId]) {
            convMap[studentId] = {
              studentId,
              studentName: studentMap[studentId]?.name || "Unknown Student",
              profilePicture: studentMap[studentId]?.profilePicture || null,
              messages: [],
              unread: 0,
              lastMessage: null,
              lastTimestamp: 0
            };
          }
          convMap[studentId].messages.push(msg);
          if (msg.sender !== uid && !msg.read) {
            convMap[studentId].unread++;
          }
          if ((msg.timestamp || 0) > convMap[studentId].lastTimestamp) {
            convMap[studentId].lastTimestamp = msg.timestamp || 0;
            convMap[studentId].lastMessage = msg;
          }
        });

        // Sort by most recent message
        const sorted = Object.values(convMap).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
        setConversations(sorted);
      } catch {
        showToast("Failed to load messages", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast, uid]);

  function getInitial(name) {
    return (name || "?").charAt(0).toUpperCase();
  }

  function getTimeAgo(timestamp) {
    if (!timestamp) return "";
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  if (loading) return <p style={{ padding: "20px" }}>Loading messages...</p>;

  return (
    <div className="messages-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>Messages</h1>
          {totalUnread > 0 && (
            <p style={{ color: "#2563eb", fontWeight: "600", margin: "4px 0 0" }}>
              {totalUnread} unread message{totalUnread > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
          <h3>No messages yet</h3>
          <p>Go to a student's profile to send them a message.</p>
          <Link to="/students">
            <button style={{ marginTop: "16px", background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
              View Students
            </button>
          </Link>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map(conv => (
            <Link
              key={conv.studentId}
              to={`/messages/${conv.studentId}`}
              className={`conversation-card ${conv.unread > 0 ? "unread" : ""}`}
            >
              <div className="conv-avatar">
                {conv.profilePicture ? (
                  <img src={conv.profilePicture} alt="" />
                ) : (
                  <div className="conv-avatar-initial">{getInitial(conv.studentName)}</div>
                )}
              </div>
              <div className="conv-content">
                <div className="conv-top">
                  <h3>{conv.studentName}</h3>
                  <span className="conv-time">{getTimeAgo(conv.lastTimestamp)}</span>
                </div>
                <div className="conv-bottom">
                  <p className="conv-preview">
                    {conv.lastMessage?.sender === uid && <span className="you-label">You: </span>}
                    {conv.lastMessage?.text || "No messages"}
                  </p>
                  {conv.unread > 0 && (
                    <span className="unread-badge">{conv.unread}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

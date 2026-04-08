import { useEffect, useState, useRef, useCallback } from "react";
import { getStudent, sendMessage, markAllMessagesRead, deleteMessage, deleteMessages, subscribeToMessages, db } from "../firebase";
import { doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Conversation.css";

const QUICK_REPLIES = [
  "Running 5 min late",
  "See you tomorrow!",
  "Lesson confirmed",
  "Can we reschedule?",
  "Great job today!",
  "Don't forget your provisional",
];

function groupByDate(messages) {
  const groups = [];
  let currentLabel = null;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const msg of messages) {
    const d = new Date(msg.timestamp || 0);
    let label;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

    if (label !== currentLabel) {
      groups.push({ type: "date", label });
      currentLabel = label;
    }
    groups.push({ type: "msg", data: msg });
  }
  return groups;
}

export default function Conversation() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid;
  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [studentTyping, setStudentTyping] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    getStudent(studentId)
      .then(setStudent)
      .catch(() => showToast("Failed to load student", "error"))
      .finally(() => setLoading(false));
  }, [studentId, showToast]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(studentId, uid, (msgs) => {
      setMessages(msgs);
      markAllMessagesRead(studentId).catch(() => {});
    });
    return () => unsubscribe();
  }, [studentId, uid]);

  useEffect(() => {
    if (!uid || !studentId) return;
    const typingRef = doc(db, "typing", `${studentId}_${uid}`);
    const unsub = onSnapshot(typingRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStudentTyping(data.isTyping && Date.now() - (data.timestamp || 0) < 10000);
      } else {
        setStudentTyping(false);
      }
    });
    return () => unsub();
  }, [uid, studentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, studentTyping]);

  const setTyping = useCallback((isTyping) => {
    if (!uid || !studentId) return;
    const typingRef = doc(db, "typing", `${uid}_${studentId}`);
    if (isTyping) {
      setDoc(typingRef, { isTyping: true, timestamp: Date.now() }, { merge: true }).catch(() => {});
    } else {
      deleteDoc(typingRef).catch(() => {});
    }
  }, [uid, studentId]);

  function handleInputChange(e) {
    setText(e.target.value);
    setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 3000);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const msgText = text.trim();
    setText("");
    setShowQuick(false);
    setTyping(false);
    clearTimeout(typingTimeout.current);
    try {
      await sendMessage({ sender: uid, receiver: studentId, text: msgText });
    } catch {
      showToast("Failed to send message", "error");
      setText(msgText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleQuickReply(msg) {
    setText(msg);
    setShowQuick(false);
    inputRef.current?.focus();
  }

  // Tap to select, tap again to deselect
  function handleBubbleTap(msgId) {
    setSelectedId(prev => prev === msgId ? null : msgId);
  }

  // Long press to select (mobile)
  function handleTouchStart(msgId) {
    longPressTimer.current = setTimeout(() => {
      setSelectedId(msgId);
    }, 500);
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimer.current);
  }

  async function handleDelete(msgId) {
    try {
      await deleteMessage(msgId);
      setSelectedId(null);
      showToast("Message deleted", "success");
    } catch {
      showToast("Failed to delete message", "error");
    }
  }

  async function handleClearChat() {
    const myMsgIds = messages.filter(m => m.sender === uid).map(m => m.id);
    if (myMsgIds.length === 0) {
      showToast("No messages to delete", "error");
      setShowClearConfirm(false);
      return;
    }
    try {
      await deleteMessages(myMsgIds);
      setShowClearConfirm(false);
      showToast(`${myMsgIds.length} message${myMsgIds.length > 1 ? "s" : ""} deleted`, "success");
    } catch {
      showToast("Failed to clear messages", "error");
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied", "success");
      setSelectedId(null);
    }).catch(() => {});
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const grouped = groupByDate(messages);

  if (loading) {
    return (
      <div className="conversation-page">
        <div className="chat-loading">
          <div className="chat-loading-dot" /><div className="chat-loading-dot" /><div className="chat-loading-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-page">
      <div className="conv-header">
        <Link to="/messages" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <div className="conv-header-info">
          {student?.profilePicture ? (
            <img src={student.profilePicture} alt="" className="conv-header-avatar" />
          ) : (
            <div className="conv-header-avatar-initial">
              {(student?.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2>{student?.name || "Unknown Student"}</h2>
            <span className="conv-header-status">
              {studentTyping ? "typing..." : <Link to={"/students/" + studentId} className="view-profile-link">View profile</Link>}
            </span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="conv-header-menu" onClick={() => setShowClearConfirm(true)} title="Clear my messages" aria-label="Clear chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        )}
      </div>

      {/* Clear chat confirmation */}
      {showClearConfirm && (
        <div className="chat-confirm-bar">
          <span>Delete all your sent messages?</span>
          <div className="chat-confirm-actions">
            <button className="chat-confirm-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
            <button className="chat-confirm-delete" onClick={handleClearChat}>Delete all</button>
          </div>
        </div>
      )}

      <div className="chat-messages" onClick={() => setSelectedId(null)}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <p>Send the first message!</p>
          </div>
        ) : (
          grouped.map((item, i) =>
            item.type === "date" ? (
              <div key={"d-" + i} className="chat-date-divider">
                <span>{item.label}</span>
              </div>
            ) : (
              <div
                key={item.data.id}
                className={"chat-bubble " + (item.data.sender === uid ? "sent" : "received") + (selectedId === item.data.id ? " selected" : "")}
                onClick={(e) => { e.stopPropagation(); handleBubbleTap(item.data.id); }}
                onTouchStart={() => handleTouchStart(item.data.id)}
                onTouchEnd={handleTouchEnd}
              >
                <p className="bubble-text">{item.data.text}</p>
                <div className="bubble-meta">
                  <span className="bubble-time">{formatTime(item.data.timestamp)}</span>
                  {item.data.sender === uid && (
                    <span className="bubble-status" title={item.data.read ? "Read" : "Sent"}>
                      {item.data.read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>

                {/* Action bar — shows on tap/long-press */}
                {selectedId === item.data.id && (
                  <div className="bubble-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleCopy(item.data.text)} title="Copy">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Copy
                    </button>
                    {item.data.sender === uid && (
                      <button className="bubble-action-delete" onClick={() => handleDelete(item.data.id)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          )
        )}
        {studentTyping && (
          <div className="chat-bubble received typing-bubble">
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showQuick && (
        <div className="quick-replies">
          {QUICK_REPLIES.map((qr) => (
            <button key={qr} className="quick-reply-btn" onClick={() => handleQuickReply(qr)}>{qr}</button>
          ))}
        </div>
      )}

      <form className="chat-input-bar" onSubmit={handleSend}>
        <button type="button" className="chat-quick-toggle" onClick={() => setShowQuick(!showQuick)} title="Quick replies" aria-label="Quick replies">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          rows={1}
          className="chat-textarea"
        />
        <button type="submit" className="chat-send-btn" disabled={sending || !text.trim()} aria-label="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  );
}

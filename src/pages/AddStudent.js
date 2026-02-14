import React, { useEffect, useState } from "react";
import { getStudent, sendMessage, getMessagesForStudent } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Load student + messages
  useEffect(() => {
    async function loadStudent() {
      const data = await getStudent(id);
      setStudent(data);
    }
    loadStudent();

    // Load messages
    getMessagesForStudent(id, setMessages);
  }, [id]);

  // Send message
  async function handleSend() {
    if (!newMessage.trim()) return;

    await sendMessage(id, newMessage);
    setNewMessage("");
  }

  if (!student) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "600px" }}>
      
      {/* Profile Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px"
        }}
      >
        {/* Profile Picture */}
        {student.photoURL ? (
          <img
            src={student.photoURL}
            alt="profile"
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ccc"
            }}
          />
        ) : (
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "black"
            }}
          />
        )}

        {/* Student Info */}
        <div>
          <h2>{student.name}</h2>
          <p>Phone: {student.phone}</p>
          <p>Transmission: {student.transmission}</p>
          <p>Perfect Driver: {student.perfectDriver ? "Yes" : "No"}</p>
          <p>Parking Practice: {student.parkingPractice ? "Yes" : "No"}</p>

          <button
            onClick={() => navigate(`/students/edit/${id}`)}
            style={{
              marginTop: "10px",
              padding: "8px 14px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Edit Student
          </button>
        </div>
      </div>

      {/* Messages Section */}
      <h3>Messages</h3>
      <div style={{ marginBottom: "20px" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <p>{msg.text}</p>
            <small>{msg.timestamp}</small>
          </div>
        ))}
      </div>

      {/* Send Message */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Send a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "10px 16px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
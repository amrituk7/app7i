import React, { useEffect, useState } from "react";
import { getStudents, deleteStudent } from "../firebase";
import { Link } from "react-router-dom";
import "./Students.css";

function getInitialAvatarSmall(name) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  const colors = ["#4A90E2", "#F5A623", "#7ED321", "#BD10E0", "#50E3C2"];
  const color = colors[initial.charCodeAt(0) % colors.length];

  return (
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        color: "white",
        fontWeight: "bold"
      }}
    >
      {initial}
    </div>
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await getStudents();
      setStudents(data);
    }
    load();
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}?`)) return;

    await deleteStudent(id);
    setStudents(students.filter((s) => s.id !== id));
  }

  return (
    <div className="students-page">
      <h1>Students</h1>

      <div className="students-list">
        {students.map((s) => (
          <div key={s.id} className="student-card">

            <Link to={`/students/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              {s.photoURL ? (
                <img
                  src={s.photoURL}
                  alt="profile"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "8px"
                  }}
                />
              ) : (
                getInitialAvatarSmall(s.name)
              )}

              <h3>{s.name}</h3>
              <p>{s.phone}</p>
              <p>{s.transmission || "N/A"} transmission</p>
            </Link>

            <button
              onClick={() => handleDelete(s.id, s.name)}
              style={{
                marginTop: "10px",
                background: "red",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Delete
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}
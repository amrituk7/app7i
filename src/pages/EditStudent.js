import React, { useEffect, useState } from "react";
import {
  getStudents,
  updateStudent,
  deleteStudent,
  sendNotification
} from "../firebase";
import { useParams, useNavigate } from "react-router-dom";

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);

  useEffect(() => {
    async function load() {
      const all = await getStudents();
      const found = all.find((s) => s.id === id);
      setStudent(found);
    }
    load();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    await updateStudent(id, student);

    await sendNotification({
      title: "Student Updated",
      message: `${student.name}'s profile was updated`
    });

    navigate("/students");
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${student.name}?`)) return;

    await deleteStudent(id);

    await sendNotification({
      title: "Student Deleted",
      message: `${student.name} was removed`
    });

    navigate("/students");
  }

  if (!student) return <p>Loading...</p>;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "500px",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
      }}
    >
      <h1>Edit Student</h1>

      <input
        value={student.name}
        onChange={(e) => setStudent({ ...student, name: e.target.value })}
        placeholder="Name"
        style={{
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc"
        }}
      />

      <input
        value={student.phone}
        onChange={(e) => setStudent({ ...student, phone: e.target.value })}
        placeholder="Phone"
        style={{
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc"
        }}
      />

      <select
        value={student.transmission}
        onChange={(e) =>
          setStudent({ ...student, transmission: e.target.value })
        }
        style={{
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc"
        }}
      >
        <option value="manual">Manual</option>
        <option value="auto">Auto</option>
      </select>

      <button
        type="submit"
        style={{
          padding: "10px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Save
      </button>

      <button
        type="button"
        onClick={handleDelete}
        style={{
          padding: "10px",
          background: "red",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Delete Student
      </button>
    </form>
  );
}
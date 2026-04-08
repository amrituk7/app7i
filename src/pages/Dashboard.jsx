import { Link } from "react-router-dom";
import "./Dashboard.css";

const nextSteps = [
  { to: "/students", label: "Students", detail: "Open learner records and progress." },
  { to: "/lessons", label: "Lessons", detail: "Review upcoming bookings and lesson history." },
  { to: "/messages", label: "Messages", detail: "Check student conversations and reminders." },
  { to: "/calendar", label: "Calendar", detail: "See your schedule in calendar view." },
];

export default function Dashboard() {
  return (
    <div className="dashboard-shell">
      <section className="dashboard-shell__hero">
        <span className="dashboard-shell__eyebrow">Instructor Area</span>
        <h1>Dashboard refresh in progress.</h1>
        <p>
          The previous dashboard has been cleared out so a new version can be rebuilt cleanly. Your core areas are
          still available below while the replacement is being prepared.
        </p>
      </section>

      <section className="dashboard-shell__panel">
        <div className="dashboard-shell__panel-header">
          <h2>Keep Working</h2>
          <p>Use these routes while the new dashboard is under construction.</p>
        </div>

        <div className="dashboard-shell__grid">
          {nextSteps.map((item) => (
            <Link key={item.to} to={item.to} className="dashboard-shell__card">
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

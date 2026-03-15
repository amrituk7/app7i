import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: "H" },
    { to: "/students", label: "Students", icon: "S" },
    { to: "/lessons", label: "Lessons", icon: "L" },
    { to: "/book-lesson", label: "Book Lesson", icon: "+" },
    { to: "/important-notes", label: "Important Notes", icon: "N" },
    { to: "/tips", label: "Ravi's Tips", icon: "T" },
    { to: "/resources", label: "DVLA Resources", icon: "R" },
    { to: "/notifications", label: "Notifications", icon: "B" },
  ];

  return (
    <div className="sidebar">
      <h2 className="logo">RoadMaster</h2>

      <nav>
        {links.map((link) => (
          <Link 
            key={link.to}
            to={link.to} 
            className={location.pathname === link.to ? "active" : ""}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

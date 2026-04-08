import { useAuth } from "../context/AuthContext";

export default function TopBar({ title = "Dashboard", subtitle = "Welcome back" }) {
  const { userProfile, instructorName } = useAuth();
  const initials = (userProfile?.name || userProfile?.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-titles">
          <p className="topbar-subtitle">{subtitle}</p>
          <h1 className="topbar-title">{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="topbar-search">
          <svg className="topbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search..." className="topbar-search-input" />
          <kbd className="topbar-kbd">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="topbar-icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="topbar-notif-dot" />
        </button>

        {/* User */}
        <div className="topbar-user">
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{instructorName || "Instructor"}</span>
            <span className="topbar-user-role">Pro Plan</span>
          </div>
          <svg className="topbar-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </header>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getInstructorProfile } from "../firebase";
import "./Sidebar.css";

// ── Shared SVG icon component (mirrors instructor sidebar) ────────
function Icon({ d, d2, circle, cx, cy, r, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="nav-icon" aria-hidden="true">
      {circle && <circle cx={cx} cy={cy} r={r} />}
      {d && <path d={d} />}
      {d2 && <path d={d2} />}
    </svg>
  );
}

const ICONS = {
  dashboard:  { d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", d2: "M9 22V12h6v10" },
  lessons:    { d: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  messages:   { d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  tips:       { d: "M9 18h6m-5 4h4M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" },
  resources:  { d: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" },
  sun:        { d: "M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42", circle: true, cx: 12, cy: 12, r: 5 },
  moon:       { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
  logout:     { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" },
  support:    { d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z", d2: "M9 9a3 3 0 116 0c0 2-3 3-3 3m0 4h.01" },
  close:      { d: "M18 6L6 18M6 6l12 12" },
};

const NAV_LINKS = [
  { to: "/student-dashboard", label: "My Dashboard", icon: "dashboard"  },
  { to: "/my-lessons",        label: "My Lessons",   icon: "lessons"    },
  { to: "/my-messages",       label: "Messages",     icon: "messages"   },
  { to: "/tips",              label: "Tips",         icon: "tips"       },
  { to: "/resources",         label: "DVLA Resources",icon: "resources" },
  { to: "/support",           label: "App Support",   icon: "support"  },
];

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function StudentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen]   = useState(false);
  const [dark, setDark]   = useState(() => localStorage.getItem("rmDark") === "1");
  const [instructorName, setInstructorName] = useState("Instructor");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());

  // Load instructor name from student's linked instructor
  useEffect(() => {
    async function loadInstructorName() {
      try {
        // Get student's instructorId from their student record
        const { getStudentByEmail } = await import("../firebase");
        if (!userProfile?.email) return;
        const student = await getStudentByEmail(userProfile.email);
        if (student?.instructorId) {
          const profile = await getInstructorProfile(student.instructorId);
          if (profile?.name) setInstructorName(profile.name);
        }
      } catch {}
    }
    loadInstructorName();
  }, [userProfile?.email]);

  // Listen for install prompt
  useEffect(() => {
    if (isStandalone()) return;
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Keep dark-mode class in sync if instructor already toggled it
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.body.classList.toggle("dark", next);
    localStorage.setItem("rmDark", next ? "1" : "");
  }

  async function handleLogout() {
    try {
      await logout();
      showToast("Logged out", "success");
      navigate("/login");
    } catch {
      showToast("Failed to logout", "error");
    }
  }

  const initials = (userProfile?.name || userProfile?.email || "S")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button className="sidebar-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <div className={"sidebar" + (open ? " sidebar-mobile-open" : "")}>

        {/* ── Logo strip ── */}
        <div className="sidebar-top-row">
          <div className="sidebar-logo">
            <img src="/logo.svg" alt="" className="sidebar-logo-icon" />
            <span className="sidebar-logo-text">Pass with <span>{instructorName}</span></span>
          </div>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close">
            <Icon {...ICONS.close} size={16} />
          </button>
        </div>

        {/* ── User block ── */}
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-role">Student</span>
            <span className="user-email">{userProfile?.email || "—"}</span>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav>
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to}
              className={"sidebar-nav-link" + (location.pathname === link.to ? " active" : "")}
              onClick={() => setOpen(false)}>
              <Icon {...ICONS[link.icon]} size={17} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Install App ── */}
        {!installed && (
          <div style={{ padding: "0 16px 8px" }}>
            <button
              className="sidebar-nav-link"
              style={{ width: "100%", textAlign: "left", background: "rgba(196,106,45,0.15)", borderRadius: "8px", border: "none", cursor: "pointer", color: "#c46a2d", fontWeight: 600 }}
              onClick={async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === "accepted") { setInstalled(true); setDeferredPrompt(null); }
                } else {
                  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
                  if (isIOS) {
                    showToast("Tap the Share button, then 'Add to Home Screen'", "info");
                  } else {
                    showToast("Open in Chrome → menu → 'Install app' or 'Add to Home Screen'", "info");
                  }
                }
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3" />
              </svg>
              Install App
            </button>
          </div>
        )}

        {/* ── Dark mode + Logout ── */}
        <div className="sidebar-bottom">
          <button className="sidebar-theme-btn" onClick={toggleDark}>
            <Icon {...(dark ? ICONS.sun : ICONS.moon)} size={15} />
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <Icon {...ICONS.logout} size={15} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

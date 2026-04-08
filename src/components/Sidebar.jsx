import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getStudents } from "../firebase";
import "./Sidebar.css";

// ── Clean SVG icons ──────────────────────────────────────────────
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
  dashboard:     { d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", d2: "M9 22V12h6v10" },
  students:      { d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", d2: "M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.74", circle: true, cx: 9, cy: 7, r: 4 },
  lessons:       { d: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  bookLesson:    { d: "M12 5v14M5 12h14" },
  calendar:      { d: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  earnings:      { d: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  billing:       { d: "M2 7h20", d2: "M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2zm12 10h4" },
  waitingList:   { d: "M12 2a10 10 0 100 20A10 10 0 0012 2z", d2: "M12 6v6l4 2" },
  messages:      { d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  car:           { d: "M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h12l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-2m-5 0H8m9 0a2 2 0 11-4 0m-5 0a2 2 0 11-4 0" },
  notes:         { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", d2: "M14 2v6h6M16 13H8m8 4H8m2-8H8" },
  tips:          { d: "M9 18h6m-5 4h4M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" },
  resources:     { d: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" },
  notifications: { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0" },
  profile:       { d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", circle: true, cx: 12, cy: 7, r: 4 },
  sun:           { d: "M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42", circle: true, cx: 12, cy: 12, r: 5 },
  moon:          { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
  logout:        { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" },
  search:        { d: "M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" },
  qr:            { d: "M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h3v3h-3zm3 0h4m-4 4h4m0-4v4" },
  support:       { d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z", d2: "M9 9a3 3 0 116 0c0 2-3 3-3 3m0 4h.01" },
  close:         { d: "M18 6L6 18M6 6l12 12" },
};

const NAV_LINKS = [
  { to: "/",               label: "Dashboard",      icon: "dashboard"     },
  { to: "/students",       label: "Students",       icon: "students"      },
  { to: "/lessons",        label: "Lessons",        icon: "lessons"       },
  { to: "/book-lesson",    label: "Book Lesson",    icon: "bookLesson"    },
  { to: "/calendar",       label: "Calendar",       icon: "calendar"      },
  { to: "/earnings",       label: "Earnings",       icon: "earnings"      },
  { to: "/pricing",        label: "Billing",        icon: "billing"       },
  { to: "/waiting-list",   label: "Waiting List",   icon: "waitingList"   },
  { to: "/messages",       label: "Messages",       icon: "messages"      },
  { to: "/car-details",    label: "My Car",         icon: "car"           },
  { to: "/important-notes",label: "Important Notes",icon: "notes"         },
  { to: "/tips",           label: "Tips",           icon: "tips"          },
  { to: "/resources",      label: "Resources",      icon: "resources"     },
  { to: "/notifications",  label: "Notifications",  icon: "notifications" },
  { to: "/profile",        label: "My Profile",     icon: "profile"       },
  { to: "/support",        label: "App Support",    icon: "support"       },
];

const APP_URL = "https://app7i.com";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userProfile, instructorName, user, isPremium, trialExpired, trialEnd } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen]         = useState(false);
  const [dark, setDark]         = useState(() => localStorage.getItem("rmDark") === "1");
  const [search, setSearch]     = useState("");
  const [students, setStudents] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showQR, setShowQR]     = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );
  const searchRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (appInstalled) return;
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [appInstalled]);

  useEffect(() => {
    getStudents().then(setStudents).catch(() => {});
  }, []);

  const searchResults = search.trim().length > 1
    ? students.filter(s => (s.name || "").toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

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

  const inviteUrl = user?.uid ? `${APP_URL}/register?instructor=${user.uid}` : APP_URL;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("Link copied!", "success");
    } catch {
      showToast("Copy: " + inviteUrl, "info");
    }
  }

  const initials = (userProfile?.name || userProfile?.email || "R")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button className="sidebar-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
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
            <span className="user-role">{instructorName}</span>
            {userProfile?.username && <span className="user-email">@{userProfile.username}</span>}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="sidebar-search-wrap" ref={searchRef}>
          <Icon {...ICONS.search} size={14} />
          <input
            className="sidebar-search"
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 500)}
          />
          {showResults && searchResults.length > 0 && (
            <div className="sidebar-search-results">
              {searchResults.map(s => (
                <div key={s.id} className="sidebar-search-result"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { navigate(`/students/${s.id}`); setSearch(""); setShowResults(false); setOpen(false); }}>
                  <span>{s.name || "Unnamed"}</span>
                  <small>{s.transmission || ""}</small>
                </div>
              ))}
            </div>
          )}
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

        {/* ── Upgrade banner (free tier) ── */}
        {!isPremium && (
          <Link to="/pricing" className="sidebar-upgrade-btn">
            {trialExpired ? "Trial ended — Upgrade" : "Upgrade plan"}
          </Link>
        )}

        {/* ── Invite / QR ── */}
        {isPremium && (
          <button className="sidebar-invite-btn" onClick={() => setShowQR(true)}>
            <Icon {...ICONS.qr} size={16} />
            Invite Students
          </button>
        )}

        {/* ── Install App ── */}
        {!appInstalled && (
          <div style={{ padding: "0 16px 8px" }}>
            <button
              className="sidebar-nav-link"
              style={{ width: "100%", textAlign: "left", background: "rgba(196,106,45,0.15)", borderRadius: "8px", border: "none", cursor: "pointer", color: "#c46a2d", fontWeight: 600 }}
              onClick={async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === "accepted") { setAppInstalled(true); setDeferredPrompt(null); }
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

      {/* ── QR Code modal ── */}
      {showQR && (
        <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h2>Invite Students</h2>
              <button className="qr-close" onClick={() => setShowQR(false)}>
                <Icon {...ICONS.close} size={18} />
              </button>
            </div>
            <p className="qr-subtitle">Students scan this to open the Pass with {instructorName} app on app7i.com</p>
            <div className="qr-code-wrap">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inviteUrl)}&color=273038&bgcolor=fffaf4&margin=12&qzone=1`}
                alt={`Pass with ${instructorName} app QR code`}
                className="qr-code-img"
                width={200}
                height={200}
              />
            </div>
            <p className="qr-url">{APP_URL}</p>
            <div className="qr-actions">
              <button className="qr-copy-btn" onClick={copyLink}>
                Copy Link
              </button>
              <a
                className="qr-whatsapp-btn"
                href={`https://wa.me/?text=${encodeURIComponent("Join my driving lesson app — Pass with " + instructorName + ": " + inviteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
            </div>
            <p className="qr-hint">Students open the link in Chrome and tap <strong>"Add to Home Screen"</strong> to install Pass with {instructorName}</p>
          </div>
        </div>
      )}
    </>
  );
}

import { getLanguage } from "../config/languages";

const BADGE_STYLES = {
  en: { background: "rgba(100,116,139,0.1)", color: "#475569" },
  pa: { background: "rgba(196,106,45,0.1)", color: "#92400e" },
  ur: { background: "rgba(59,130,246,0.1)", color: "#1d4ed8" },
};

export default function LanguageBadge({ code }) {
  if (!code || code === "en") return null;
  const lang = getLanguage(code);
  const style = BADGE_STYLES[code] || BADGE_STYLES.en;

  return (
    <span
      className="student-card-chip"
      style={{ ...style, fontSize: "10px", padding: "4px 8px" }}
    >
      {lang.label}
    </span>
  );
}

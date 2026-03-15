import React from "react";
import { Link } from "react-router-dom";
import "./Resources.css";

const dvlaResources = [
  {
    title: "Book Your Driving Test",
    description: "Schedule your practical driving test with DVSA",
    url: "https://www.gov.uk/book-driving-test",
    icon: "calendar"
  },
  {
    title: "Cancel or Change Test",
    description: "Need to reschedule? Change your test date here",
    url: "https://www.gov.uk/change-driving-test",
    icon: "refresh"
  },
  {
    title: "Highway Code",
    description: "Learn the rules of the road - essential reading",
    url: "https://www.gov.uk/guidance/the-highway-code",
    icon: "book"
  },
  {
    title: "Theory Test Practice",
    description: "Practice questions and hazard perception",
    url: "https://www.gov.uk/theory-test/revision-and-practice",
    icon: "check"
  },
  {
    title: "Apply for Provisional Licence",
    description: "Get your provisional driving licence",
    url: "https://www.gov.uk/apply-first-provisional-driving-licence",
    icon: "id"
  },
  {
    title: "Check Driving Licence",
    description: "View your licence information and points",
    url: "https://www.gov.uk/view-driving-licence",
    icon: "search"
  }
];

function ResourceIcon({ type }) {
  const icons = {
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    refresh: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    id: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    )
  };

  return <div className="resource-icon">{icons[type]}</div>;
}

export default function Resources() {
  return (
    <div className="resources-page">
      <Link to="/">
        <button type="button" className="back-btn">Back to Dashboard</button>
      </Link>

      <div className="resources-header">
        <h1>DVLA Resources</h1>
        <p>Quick access to official DVLA services and information</p>
      </div>

      <div className="resources-grid">
        {dvlaResources.map((resource, index) => (
          <a
            key={index}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-card"
          >
            <ResourceIcon type={resource.icon} />
            <div className="resource-content">
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
            </div>
            <span className="resource-arrow">-&gt;</span>
          </a>
        ))}
      </div>

      <div className="resources-help">
        <h2>Need Help?</h2>
        <p>Contact your instructor for personalized guidance on test preparation and practice sessions.</p>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import "./DrivingMotionHero.css";

export default function DrivingMotionHero({
  stats,
  eyebrow = "Road overview",
  title = "Instructor Dashboard",
  subtitle = "Welcome back! Here's an overview of your driving school."
}) {
  const highlights = [
    { label: "Learners on the books", value: stats.total ?? 0, to: "/students" },
    { label: "Road sessions today", value: stats.todayLessons ?? 0, to: "/lessons" },
    { label: "Parking focus", value: stats.parking ?? 0, to: "/students" }
  ];

  return (
    <section className="driving-hero">
      <div className="driving-hero-copy">
        <span className="driving-hero-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>

        <div className="driving-hero-highlights">
          {highlights.map((highlight, index) => (
            <div
              key={highlight.label}
              className="hero-highlight-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link
                to={highlight.to}
                className="hero-highlight-link"
                aria-label={`Open ${highlight.label.toLowerCase()}`}
              >
                <strong>{highlight.value}</strong>
                <span>{highlight.label}</span>
                <small>Open</small>
              </Link>
            </div>
          ))}
        </div>

        <div className="driving-hero-cues">
          <span className="cue-pill mirror" style={{ animationDelay: "0s" }}>Mirror check</span>
          <span className="cue-pill signal" style={{ animationDelay: "0.2s" }}>Signal set</span>
          <span className="cue-pill turn" style={{ animationDelay: "0.4s" }}>Smooth turn</span>
        </div>
      </div>

      <div className="driving-hero-scene" aria-hidden="true">
        <div className="scene-glow scene-glow-one" />
        <div className="scene-glow scene-glow-two" />

        <Link to="/lessons" className="scene-status-card scene-link-card" aria-label="Open lessons">
          <span>Lesson pulse</span>
          <strong>{stats.todayLessons ?? 0}</strong>
          <small>sessions lined up</small>
        </Link>

        <div className="scene-traffic-light">
          <span className="traffic-bulb red" />
          <span className="traffic-bulb amber" />
          <span className="traffic-bulb green" />
        </div>

        <div className="scene-marker scene-marker-left">
          <div className="marker-cone" />
        </div>
        <div className="scene-marker scene-marker-right">
          <div className="marker-sign">P</div>
        </div>

        <div className="road-frame">
          <div className="road-surface" />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="lane-segment" style={{ top: `${i * 90 - 60}px`, animationDelay: `${i * 0.4}s` }} />
          ))}
          <span className="route-dot dot-one" />
          <span className="route-dot dot-two" />
          <span className="route-dot dot-three" />
          <div className="road-note road-note-top">Mirror</div>
          <div className="road-note road-note-bottom">Park</div>
          <div className="road-car">
            <div className="road-car-roof" />
            <div className="road-car-body">
              <span className="road-car-window" />
              <span className="road-car-window" />
              <span className="road-car-emblem">L</span>
            </div>
            <span className="road-wheel road-wheel-back" />
            <span className="road-wheel road-wheel-front" />
          </div>
        </div>

        <div className="scene-coach-card">
          <Link to="/book-lesson" className="scene-link-card scene-coach-link" aria-label="Book a lesson">
            <span>Book next</span>
            <strong>Jump straight to lesson booking.</strong>
          </Link>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getLessons, getTips } from "../firebase";
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCard } from "../components/Animations";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [pastLessons, setPastLessons] = useState([]);
  const [recentTips, setRecentTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load lessons for this student (by email match or future: by studentId linked to user)
        const allLessons = await getLessons();
        const now = Date.now();
        
        // Filter lessons - in a real app, you'd filter by student's linked profile
        const studentLessons = allLessons.filter(l => 
          l.studentEmail === userProfile?.email || 
          l.studentName?.toLowerCase().includes(userProfile?.email?.split("@")[0]?.toLowerCase() || "")
        );

        const upcoming = studentLessons
          .filter(l => new Date(`${l.date}T${l.time}`).getTime() > now)
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
          .slice(0, 5);

        const past = studentLessons
          .filter(l => new Date(`${l.date}T${l.time}`).getTime() <= now)
          .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))
          .slice(0, 5);

        setUpcomingLessons(upcoming);
        setPastLessons(past);

        // Load recent tips
        const tips = await getTips();
        setRecentTips(tips.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast("Failed to load some data", "error");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, userProfile, showToast]);

  if (loading) {
    return (
      <div className="student-dashboard">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <FadeIn>
        <div className="dashboard-header">
          <div className="welcome-section">
            <motion.div 
              className="avatar-large"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              {userProfile?.email?.charAt(0).toUpperCase() || "S"}
            </motion.div>
            <div>
              <h1>Welcome back!</h1>
              <p>{userProfile?.email || "Student"}</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <FadeIn delay={0.1}>
          <div className="dashboard-section quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <Link to="/resources">
                <AnimatedCard className="action-card">
                  <div className="action-icon book">B</div>
                  <span>Book Test</span>
                </AnimatedCard>
              </Link>
              <Link to="/resources">
                <AnimatedCard className="action-card">
                  <div className="action-icon code">H</div>
                  <span>Highway Code</span>
                </AnimatedCard>
              </Link>
              <Link to="/tips">
                <AnimatedCard className="action-card">
                  <div className="action-icon tips">T</div>
                  <span>View Tips</span>
                </AnimatedCard>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* Upcoming Lessons */}
        <FadeIn delay={0.2}>
          <div className="dashboard-section">
            <h2>Upcoming Lessons</h2>
            {upcomingLessons.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming lessons scheduled</p>
                <small>Your instructor will book your next lesson soon!</small>
              </div>
            ) : (
              <StaggerContainer className="lessons-list">
                {upcomingLessons.map((lesson) => (
                  <StaggerItem key={lesson.id}>
                    <div className="lesson-card upcoming">
                      <div className="lesson-date">
                        <span className="day">{new Date(lesson.date).getDate()}</span>
                        <span className="month">{new Date(lesson.date).toLocaleString("default", { month: "short" })}</span>
                      </div>
                      <div className="lesson-details">
                        <strong>{lesson.time || "TBD"}</strong>
                        <span>with {lesson.instructor || "Instructor"}</span>
                        {lesson.notes && <small>{lesson.notes}</small>}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </FadeIn>

        {/* Past Lessons */}
        <FadeIn delay={0.3}>
          <div className="dashboard-section">
            <h2>Recent Lessons</h2>
            {pastLessons.length === 0 ? (
              <div className="empty-state">
                <p>No past lessons yet</p>
                <small>Your lesson history will appear here</small>
              </div>
            ) : (
              <StaggerContainer className="lessons-list">
                {pastLessons.map((lesson) => (
                  <StaggerItem key={lesson.id}>
                    <div className="lesson-card past">
                      <div className="lesson-date">
                        <span className="day">{new Date(lesson.date).getDate()}</span>
                        <span className="month">{new Date(lesson.date).toLocaleString("default", { month: "short" })}</span>
                      </div>
                      <div className="lesson-details">
                        <strong>{lesson.time || "Completed"}</strong>
                        <span>with {lesson.instructor || "Instructor"}</span>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </FadeIn>

        {/* Recent Tips */}
        <FadeIn delay={0.4}>
          <div className="dashboard-section tips-section">
            <div className="section-header">
              <h2>Ravi's Tips</h2>
              <Link to="/tips" className="view-all">View all</Link>
            </div>
            {recentTips.length === 0 ? (
              <div className="empty-state">
                <p>No tips yet</p>
              </div>
            ) : (
              <StaggerContainer className="tips-preview">
                {recentTips.map((tip) => (
                  <StaggerItem key={tip.id}>
                    <div className="tip-preview-card">
                      <h4>{tip.title || "Tip"}</h4>
                      <p>{(tip.content || "").substring(0, 100)}...</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

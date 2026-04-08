import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import StudentSidebar from "./components/StudentSidebar";
import InstallBanner from "./components/InstallBanner";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Core pages — loaded eagerly for instant navigation
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Lessons from "./pages/Lessons";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import BookLesson from "./pages/BookLesson";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./components/LandingPage";
import "./App.css";

// Less-used pages — lazy loaded
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AddStudent = lazy(() => import("./pages/AddStudent"));
const EditStudent = lazy(() => import("./pages/EditStudent"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const LessonDetails = lazy(() => import("./pages/LessonDetails"));
const MyLessons = lazy(() => import("./pages/MyLessons"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const Resources = lazy(() => import("./pages/Resources"));
const Tips = lazy(() => import("./pages/Tips"));
const ImportantNotes = lazy(() => import("./pages/ImportantNotes"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const MyMessages = lazy(() => import("./pages/MyMessages"));
const Earnings = lazy(() => import("./pages/Earnings"));
const Calendar = lazy(() => import("./pages/Calendar"));
const WaitingList = lazy(() => import("./pages/WaitingList"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const LessonInvoice = lazy(() => import("./pages/LessonInvoice"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RegisterInstructor = lazy(() => import("./pages/RegisterInstructor"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Support = lazy(() => import("./pages/Support"));

function LoadingScreen() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f9fa" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e0e0e0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function InstructorRoute({ children }) {
  const { isAuthenticated, loading, isInstructor, isStudent, profileReady } = useAuth();
  if (loading || (isAuthenticated && !profileReady)) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isInstructor) {
    return <Navigate to={isStudent ? "/student-dashboard" : "/"} replace />;
  }
  return children;
}

// Premium features — paywall disabled, all instructors get full access
function PremiumRoute({ children }) {
  const { isAuthenticated, loading, isInstructor, isStudent, profileReady } = useAuth();
  if (loading || (isAuthenticated && !profileReady)) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isInstructor) {
    return <Navigate to={isStudent ? "/student-dashboard" : "/"} replace />;
  }
  return children;
}

function StudentRoute({ children }) {
  const { isAuthenticated, loading, isInstructor, isStudent, profileReady } = useAuth();
  if (loading || (isAuthenticated && !profileReady)) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStudent) {
    return <Navigate to={isInstructor ? "/" : "/login"} replace />;
  }
  return children;
}

function RootRoute() {
  const { isAuthenticated, loading, isStudent } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <LandingPage />;
  if (isStudent) return <Navigate to="/student-dashboard" replace />;
  return <Dashboard />;
}


function AppLayout() {
  const { isAuthenticated, isStudent, isInstructor, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const hasSidebar = isAuthenticated;

  return (
    <>
      {isAuthenticated && !isStudent && <Sidebar />}
      {isStudent && <StudentSidebar />}
      <InstallBanner />
      <div className="main-content" style={{ marginLeft: hasSidebar ? "var(--sidebar-offset)" : "0" }}>
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
          />
          <Route
            path="/register-instructor"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterInstructor />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route
            path="/pricing"
            element={
              <InstructorRoute>
                <Pricing />
              </InstructorRoute>
            }
          />
          <Route path="/" element={<RootRoute />} />

          <Route
            path="/students"
            element={
              <InstructorRoute>
                <Students />
              </InstructorRoute>
            }
          />
          <Route
            path="/students/add"
            element={
              <InstructorRoute>
                <AddStudent />
              </InstructorRoute>
            }
          />
          <Route
            path="/students/edit/:id"
            element={
              <InstructorRoute>
                <EditStudent />
              </InstructorRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <InstructorRoute>
                <StudentProfile />
              </InstructorRoute>
            }
          />
          <Route
            path="/lessons"
            element={
              <InstructorRoute>
                <Lessons />
              </InstructorRoute>
            }
          />
          <Route
            path="/lessons/:id"
            element={
              <InstructorRoute>
                <LessonDetails />
              </InstructorRoute>
            }
          />
          <Route
            path="/book-lesson"
            element={
              <PremiumRoute>
                <BookLesson />
              </PremiumRoute>
            }
          />
          <Route
            path="/important-notes"
            element={
              <PremiumRoute>
                <ImportantNotes />
              </PremiumRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PremiumRoute>
                <NotificationCenter />
              </PremiumRoute>
            }
          />
          <Route
            path="/car-details"
            element={
              <InstructorRoute>
                <CarDetails />
              </InstructorRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <InstructorRoute>
                <InstructorProfile />
              </InstructorRoute>
            }
          />
          <Route
            path="/earnings"
            element={
              <PremiumRoute>
                <Earnings />
              </PremiumRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PremiumRoute>
                <Calendar />
              </PremiumRoute>
            }
          />
          <Route
            path="/waiting-list"
            element={
              <PremiumRoute>
                <WaitingList />
              </PremiumRoute>
            }
          />
          <Route
            path="/students/:id/report"
            element={
              <PremiumRoute>
                <StudentReport />
              </PremiumRoute>
            }
          />
          <Route
            path="/lessons/:id/invoice"
            element={
              <PremiumRoute>
                <LessonInvoice />
              </PremiumRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PremiumRoute>
                <Messages />
              </PremiumRoute>
            }
          />
          <Route
            path="/messages/:studentId"
            element={
              <PremiumRoute>
                <Conversation />
              </PremiumRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            }
          />
          <Route
            path="/my-lessons"
            element={
              <StudentRoute>
                <MyLessons />
              </StudentRoute>
            }
          />
          <Route
            path="/my-messages"
            element={
              <StudentRoute>
                <MyMessages />
              </StudentRoute>
            }
          />

          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tips"
            element={
              <ProtectedRoute>
                <Tips />
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={<Support />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

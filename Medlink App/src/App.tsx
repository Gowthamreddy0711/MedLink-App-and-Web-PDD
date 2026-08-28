import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { ROUTES } from './constants';
import { UserRole } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
// Components (To be created)
import SplashScreen from './pages/auth/SplashScreen';
import GetStartedScreen from './pages/auth/GetStartedScreen';
import RoleSelectionScreen from './pages/auth/RoleSelectionScreen';
import LoginScreen from './pages/auth/LoginScreen';
import SignupScreen from './pages/auth/SignupScreen';
import VerifyIDScreen from './pages/auth/VerifyIDScreen';

// Patient Pages
import PatientHome from './pages/patient/PatientHome';
import SearchDoctors from './pages/patient/SearchDoctors';
import DoctorDetails from './pages/patient/DoctorDetails';
import BookAppointment from './pages/patient/BookAppointment';
import RemindersScreen from './pages/patient/RemindersScreen';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorQueue from './pages/doctor/DoctorQueue';
import ApplyLeaveScreen from './pages/doctor/ApplyLeaveScreen';
import AccessRequestsScreen from './pages/doctor/AccessRequestsScreen';
import CoverageRequestsScreen from './pages/doctor/CoverageRequestsScreen';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import WritePrescription from './pages/doctor/WritePrescription';
import PatientHistory from './pages/doctor/PatientHistory';

// Patient History
import HistoryScreen from './pages/patient/HistoryScreen';
import SubmitReview from './pages/patient/SubmitReview';
import DoctorReviews from './pages/patient/DoctorReviews';

// Settings
import SettingsScreen from './pages/SettingsScreen';
import NotificationsScreen from './pages/NotificationsScreen';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import ComplianceConsole from './pages/admin/ComplianceConsole';
import DoctorVerification from './pages/admin/DoctorVerification';
import AdminLeaveRequests from './pages/admin/AdminLeaveRequests';
import AdminActivityLog from './pages/admin/AdminActivityLog';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';

// AI & Other Pages
import AIChatScreen from './pages/ai/AIChatScreen';
import { seedFirestore, db } from './services/db';

const getDefaultRoute = (role: string) => {
  const upperRole = String(role).toUpperCase();
  if (upperRole === 'ADMIN') return ROUTES.ADMIN_DASHBOARD;
  if (upperRole === 'DOCTOR') return ROUTES.DOCTOR_DASHBOARD;
  return ROUTES.PATIENT_HOME;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed default records under the hood
    seedFirestore();

    // Check for stored user session
    const storedUser = localStorage.getItem('medlink_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Background revalidate and keep details perfectly in sync with Firestore on startup
      if (parsedUser?.id) {
        db.getUserById(parsedUser.id).then((freshUser) => {
          if (freshUser) {
            localStorage.setItem('medlink_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        }).catch((err) => {
          console.warn('[REVALIDATE] Failed session re-sync:', err);
        });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Email verification removed - users can access app immediately
    });
    
    // Simulate initial splash/loading briefly
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.SPLASH} element={
          user ? (
            <Navigate to={getDefaultRoute(user.role)} replace />
          ) : (
            <SplashScreen />
          )
        } />
        <Route path={ROUTES.GET_STARTED} element={
          user ? (
            <Navigate to={getDefaultRoute(user.role)} replace />
          ) : (
            <GetStartedScreen />
          )
        } />
        <Route path={ROUTES.ROLE_SELECTION} element={
          user ? (
            <Navigate to={getDefaultRoute(user.role)} replace />
          ) : (
            <RoleSelectionScreen />
          )
        } />
        <Route path={ROUTES.LOGIN} element={
          user ? (
            <Navigate to={getDefaultRoute(user.role)} replace />
          ) : (
            <LoginScreen setUser={setUser} />
          )
        } />
        <Route path={ROUTES.SIGNUP} element={<SignupScreen setUser={setUser} />} />
        <Route path={ROUTES.VERIFY_ID} element={
          user ? (
            <VerifyIDScreen />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        } />

        {/* Protected Routes (Authenticated) */}
        <Route element={
          user ? (
            <MainLayout user={user} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }>
          {/* Patient Routes */}
          <Route path={ROUTES.PATIENT_HOME} element={<PatientHome user={user} />} />
          <Route path={ROUTES.PATIENT_SEARCH} element={<SearchDoctors />} />
          <Route path={ROUTES.PATIENT_DOCTOR_DETAILS} element={<DoctorDetails />} />
          <Route path={ROUTES.PATIENT_BOOK_APPOINTMENT} element={<BookAppointment />} />
          <Route path={ROUTES.PATIENT_REMINDERS} element={<RemindersScreen />} />
          <Route path={ROUTES.PATIENT_HISTORY} element={<HistoryScreen />} />
          <Route path={ROUTES.SUBMIT_REVIEW} element={<SubmitReview />} />
          <Route path={ROUTES.VIEW_REVIEWS} element={<DoctorReviews />} />
          <Route path={ROUTES.AI_CHAT} element={<AIChatScreen />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsScreen user={user} setUser={setUser} />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsScreen />} />

          {/* Doctor Routes */}
          <Route path={ROUTES.DOCTOR_DASHBOARD} element={<DoctorDashboard user={user} />} />
          <Route path={ROUTES.DOCTOR_QUEUE} element={<DoctorQueue />} />
          <Route path={ROUTES.DOCTOR_APPOINTMENTS} element={<DoctorAppointments />} />
          <Route path={ROUTES.DOCTOR_PRESCRIPTION_WRITE} element={<WritePrescription />} />
          <Route path={ROUTES.DOCTOR_PATIENT_HISTORY} element={<PatientHistory />} />
          <Route path={ROUTES.DOCTOR_LEAVE_APPLY} element={<ApplyLeaveScreen />} />
          <Route path={ROUTES.DOCTOR_ACCESS_REQUESTS} element={<AccessRequestsScreen />} />
          <Route path={ROUTES.DOCTOR_COVERAGE_RECEIVED} element={<CoverageRequestsScreen />} />
        </Route>

        {/* Admin Routes */}
        <Route element={
          user ? (
            <AdminLayout user={user} setUser={setUser} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<ComplianceConsole />} />
          <Route path={ROUTES.ADMIN_VERIFICATION} element={<DoctorVerification />} />
          <Route path={ROUTES.ADMIN_LEAVE_REQUESTS} element={<AdminLeaveRequests />} />
          <Route path={ROUTES.ADMIN_ACTIVITY_LOG} element={<AdminActivityLog />} />
          <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<AdminNotifications />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings user={user} setUser={setUser} />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.SPLASH} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

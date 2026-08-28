import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Coverage } from "./pages/Coverage";
import { CoverageCalendar } from "./pages/CoverageCalendar";
import { ClinicalAI } from "./pages/ClinicalAI";
import { DoctorDirectory } from "./pages/DoctorDirectory";
import { DoctorDetails } from "./pages/DoctorDetails";
import { Messages } from "./pages/Messages";
import { HospitalNotices } from "./pages/HospitalNotices";
import { Analytics } from "./pages/Analytics";
import { ProfessionalProfile } from "./pages/ProfessionalProfile";
import { Settings } from "./pages/Settings";
import { UserProfile } from "./types";
import { ShieldCheck } from "lucide-react";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLeaveRequests } from "./pages/admin/AdminLeaveRequests";
import { AdminVerification } from "./pages/admin/AdminVerification";
import { AdminActivityLogs } from "./pages/admin/AdminActivityLogs";
import { AdminNotifications } from "./pages/admin/AdminNotifications";

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { getOrCreateChatRoom } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [selectedDoctor, setSelectedDoctor] = useState<UserProfile | null>(null);

  const isAdmin = user?.role?.trim().toUpperCase() === "ADMIN";

  // Redirect admins to admin dashboard if they try to access standard root
  useEffect(() => {
    if (isAdmin && (location.pathname === "/" || location.pathname === "/dashboard")) {
      navigate("/admin");
    }
  }, [isAdmin, location.pathname, navigate]);

  // DIAGNOSTIC LOGGING FOR ADMIN ROLE DEBUGGING
  useEffect(() => {
    if (!user) return;
    console.log("==================================================");
    console.log("ADMIN DIAGNOSTICS:");
    console.log("Firebase Auth UID:", user.uid);
    console.log(`Firestore document: users/${user.uid}`);
    console.log("role:", user.role);
    console.log("approvalStatus:", user.approvalStatus);
    console.log("Application role after loading:", user.role);
    console.log("Route selected:", location.pathname);
    console.log("Layout selected:", isAdmin ? "AdminLayout" : "MainLayout");
    console.log("==================================================");
  }, [user, location.pathname, isAdmin]);

  const handleNavigate = (tab: string) => {
    navigate(`/${tab === "dashboard" ? "" : tab}`);
  };

  const handleStartChatWithDoctor = async (peerDoctor: UserProfile) => {
    await getOrCreateChatRoom(peerDoctor);
    navigate("/messages");
  };

  const handleSelectDoctorDetails = (doctor: UserProfile) => {
    setSelectedDoctor(doctor);
    navigate(`/doctor/${doctor.id || doctor.uid}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading MedLink Practitioner Network...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (authView === "register") {
      return <Register onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <Login onSwitchToRegister={() => setAuthView("register")} />;
  }

  // Approval Gate
  if (!isAdmin) {
    if (user.approvalStatus === "PENDING") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Waiting for Admin Approval</h1>
            <p className="text-sm text-slate-500">Your doctor account has been registered successfully but is waiting for admin approval before you can access the platform.</p>
            <button onClick={logout} className="mt-4 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer">Sign Out</button>
          </div>
        </div>
      );
    }
    if (user.approvalStatus === "REJECTED") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Registration Not Approved</h1>
            <p className="text-sm text-slate-500">Your doctor registration was not approved. Please contact the administrator for more details.</p>
            <button onClick={logout} className="mt-4 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer">Sign Out</button>
          </div>
        </div>
      );
    }
    
    // Redirect normal doctors away from admin routes
    if (location.pathname.startsWith("/admin")) {
      navigate("/");
      return null;
    }
  }

  // Admin Routing
  if (isAdmin) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/admin/leave-requests" element={<AdminLeaveRequests />} />
          <Route path="/admin/activity" element={<AdminActivityLogs />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<Settings />} />
          {/* Redirect all other paths to admin dashboard */}
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </AdminLayout>
    );
  }

  // Doctor Routing
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
        <Route path="/dashboard" element={<Dashboard onNavigate={handleNavigate} />} />
        <Route path="/coverage" element={<Coverage onSelectDoctorDetails={handleSelectDoctorDetails} />} />
        <Route path="/calendar" element={<CoverageCalendar />} />
        <Route path="/clinical-ai" element={<ClinicalAI />} />
        <Route path="/directory" element={<DoctorDirectory onStartChat={handleStartChatWithDoctor} onSelectDoctorDetails={handleSelectDoctorDetails} />} />
        <Route path="/doctor/:id" element={<DoctorDetails doctor={selectedDoctor} onBack={() => navigate(-1)} onStartChat={handleStartChatWithDoctor} />} />
        <Route path="/messages" element={<Messages onSelectDoctorDetails={handleSelectDoctorDetails} />} />
        <Route path="/notices" element={<HospitalNotices />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<ProfessionalProfile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Prevent doctors from accidentally loading a blank page for admin URLs */}
        <Route path="*" element={<Dashboard onNavigate={handleNavigate} />} />
      </Routes>
    </MainLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  BrainCircuit,
  Users,
  MessageSquare,
  Bell,
  BarChart3,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { ToastContainer } from "../components/Toast";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { formatCloudinaryAvatarUrl } from "../services/cloudinary";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<MainLayoutProps> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Derive active tab from URL path
  const fullPath = location.pathname;
  let activeTab = "admin";
  if (fullPath === "/admin/verification") activeTab = "admin/verification";
  else if (fullPath === "/admin/leave-requests") activeTab = "admin/leave-requests";
  else if (fullPath === "/admin/activity") activeTab = "admin/activity";
  else if (fullPath === "/admin/notifications") activeTab = "admin/notifications";
  else if (fullPath === "/admin/settings") activeTab = "admin/settings";

  const navItems = [
    { id: "admin", label: "Compliance Console", icon: LayoutDashboard },
    { id: "admin/verification", label: "Doctor Verification", icon: ShieldCheck },
    { id: "admin/leave-requests", label: "Leave Requests", icon: FileText },
    { id: "admin/activity", label: "Activity Log", icon: Activity },
    { id: "admin/notifications", label: "Notifications", icon: Bell },
    { id: "admin/settings", label: "Settings", icon: SettingsIcon },
  ];

  const handleNavClick = (tabId: string) => {
    navigate(`/${tabId}`);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased flex flex-col md:flex-row overflow-hidden">
      <ToastContainer />

      {/* Desktop & Tablet Sidebar */}
      <aside className={`hidden md:flex bg-white border-r border-slate-200 flex-col h-full shrink-0 z-30 transition-all duration-300 ${isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"}`}>
        <div className="flex-1 flex flex-col overflow-y-auto no-scroll overflow-x-hidden">
          {/* Brand Header */}
          <div className={`p-6 flex items-center gap-3 ${isSidebarCollapsed ? "justify-center px-0" : ""}`}>
            <img
              src="/medlink-logo.png"
              alt="MedLink Logo"
              className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-xs shrink-0"
            />
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
                  MedLink <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-semibold uppercase">Pro</span>
                </h1>
                <p className="text-[11px] font-medium text-slate-400">Clinical Collaboration</p>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isSidebarCollapsed ? "px-0 justify-center" : "px-4"
                  } ${
                    isActive
                      ? "sidebar-active font-semibold shadow-2xs"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? "justify-center w-full" : "gap-3"}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className={`flex items-center ${isSidebarCollapsed ? "flex-col gap-3" : "justify-end gap-2"}`}>

            <button
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
              title="Logout Session"
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-20">
          {/* Mobile Menu & Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="font-bold text-base text-slate-800">MedLink</span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Simple Profile View */}
            {user && (
              <div className="flex items-center gap-2 pr-2 border border-slate-200 rounded-full py-1 pl-1 bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shadow-sm shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                    alt="Admin"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden sm:block pr-2">
                  <p className="text-xs font-bold text-slate-800 leading-tight">Admin User</p>
                  <p className="text-[10px] text-slate-500 font-medium">MedLink Administrator</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex md:hidden">
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/medlink-logo.png"
                    alt="MedLink Logo"
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                  <span className="font-bold text-lg text-slate-800">MedLink</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login", { replace: true });
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileDrawerOpen(false)} />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#e0f2fe]/95 backdrop-blur-md border-t border-sky-100 z-40 px-4 py-2.5 flex justify-around items-center shadow-lg rounded-t-3xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
                isActive ? "text-sky-700" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-sky-700 stroke-[2.5]" : "text-slate-600"}`} />
              </div>
              <span className={isActive ? "text-sky-800 font-extrabold" : "text-slate-600 font-semibold"}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { ToastContainer } from "../components/Toast";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { formatCloudinaryAvatarUrl } from "../services/cloudinary";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
}) => {
  const { user, logout, toggleAvailability } = useAuth();
  const { notifications, markAsRead } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadNotifs = notifications.filter((n) => !n.read);

  // Derive active tab from URL path
  const currentPath = location.pathname.split('/')[1] || "dashboard";
  const activeTab = currentPath === "" ? "dashboard" : currentPath;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "coverage", label: "Coverage", icon: CalendarCheck2 },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "clinical-ai", label: "Smart Assistant", icon: BrainCircuit, badge: "Smart" },
    { id: "directory", label: "Clinician Directory", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: UserCheck },
    { id: "settings", label: "Settings", icon: SettingsIcon },
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

        {/* License & User Card at Sidebar Bottom */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {user && !isSidebarCollapsed && (
            <div className="bg-slate-900 rounded-xl p-4 text-white space-y-2">
              <p className="text-[11px] opacity-70">Board License Status</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs tracking-wide">{user.licenseNumber}</span>
                <span className="bg-emerald-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  {user.licenseStatus}
                </span>
              </div>
            </div>
          )}

          <div className={`flex items-center ${isSidebarCollapsed ? "flex-col gap-3" : "justify-between gap-2"}`}>
            <button
              onClick={toggleAvailability}
              className={`flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer ${isSidebarCollapsed ? "w-10 h-10 p-0" : "flex-1 px-3 py-2"}`}
              title="Coverage Toggle"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              {!isSidebarCollapsed && <span>Coverage Toggle</span>}
            </button>

            <button
              onClick={logout}
              title="Logout Session"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
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

            {/* Header Search Input */}
            <div className="hidden sm:flex items-center bg-slate-100 px-4 py-2 rounded-full w-64 lg:w-96 text-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:border focus-within:border-blue-200">
              <span className="text-slate-400 mr-2 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records, peers, or policies..."
                className="bg-transparent border-none text-xs outline-none w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Quick Availability Switch */}
            {user && (
              <div className="hidden lg:block">
                <AvailabilityBadge
                  isAvailable={user.isAvailableForCoverage}
                  onToggle={toggleAvailability}
                  showToggleControl
                />
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

              {isNotifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                    <span className="text-[10px] text-slate-500">{notifications.length} Total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.type === "COVERAGE_COMPLETED") {
                              navigate("/coverage");
                              setIsNotifMenuOpen(false);
                            }
                          }}
                          className={`pt-2 first:pt-0 cursor-pointer text-xs ${n.isRead ? "opacity-70" : "font-semibold"}`}
                        >
                          <p className="text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-500 font-normal line-clamp-2">{n.message}</p>
                          <span className="text-[9px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 cursor-pointer group text-right"
                >
                  <div className="hidden sm:block leading-none">
                    <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{user.specialty}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-xs overflow-hidden shrink-0">
                    <img
                      src={formatCloudinaryAvatarUrl(user.avatarUrl || user.photoUrl)}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1 text-xs">
                    <div className="p-2 border-b border-slate-100">
                      <p className="font-bold text-slate-800">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
                    >
                      View Professional Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
                    >
                      Account Settings
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold cursor-pointer"
                    >
                      Logout Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-6 md:px-8 text-[10px] text-slate-400 shrink-0 font-medium tracking-tight">
          <div className="flex gap-4">
            <span>&copy; 2026 MedLink Platforms</span>
            <span>Privacy Policy</span>
            <span>Help Desk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-emerald-500" />
            <span>System Operational</span>
          </div>
        </footer>
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
                onClick={logout}
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
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "1" },
          { id: "coverage", label: "Coverage", icon: Users },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "profile", label: "Profile", icon: UserCheck },
        ].map((item) => {
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
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
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

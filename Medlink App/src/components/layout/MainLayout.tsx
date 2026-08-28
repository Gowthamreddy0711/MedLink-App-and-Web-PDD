import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, Calendar, Bell, Settings, User, Clock, Menu, X, Bot, FileText, CalendarCheck, UserCheck } from 'lucide-react';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';
import Logo from '../Logo';

interface MainLayoutProps {
  user: any;
}

export default function MainLayout({ user }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use user role from props
  const isDoctor = user?.role === UserRole.DOCTOR;

  const patientTabs = [
    { icon: Home, label: 'Home', path: ROUTES.PATIENT_HOME },
    { icon: Search, label: 'Search', path: ROUTES.PATIENT_SEARCH },
    { icon: Bot, label: 'Smart Assistant', path: ROUTES.AI_CHAT },
    { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS },
  ];

  const doctorTabs = [
    { icon: Home, label: 'Dashboard', path: ROUTES.DOCTOR_DASHBOARD },
    { icon: Clock, label: 'Queue', path: ROUTES.DOCTOR_QUEUE },
    { icon: Bell, label: 'Alerts', path: ROUTES.NOTIFICATIONS },
    { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS },
  ];

  // Extended navigation for desktop/drawer sidebar
  const extendedPatientTabs = [
    { icon: Home, label: 'Home', path: ROUTES.PATIENT_HOME },
    { icon: Search, label: 'Find Doctors', path: ROUTES.PATIENT_SEARCH },
    { icon: Clock, label: 'Reminders', path: ROUTES.PATIENT_REMINDERS },
    { icon: FileText, label: 'Medical History', path: ROUTES.PATIENT_HISTORY },
    { icon: Bot, label: 'Smart Assistant', path: ROUTES.AI_CHAT },
    { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS },
  ];

  const extendedDoctorTabs = [
    { icon: Home, label: 'Dashboard', path: ROUTES.DOCTOR_DASHBOARD },
    { icon: Clock, label: 'Live Queue', path: ROUTES.DOCTOR_QUEUE },
    { icon: CalendarCheck, label: 'Appointments', path: ROUTES.DOCTOR_APPOINTMENTS },
    { icon: FileText, label: 'Prescriptions', path: ROUTES.DOCTOR_PRESCRIPTION_WRITE },
    { icon: UserCheck, label: 'Access Requests', path: ROUTES.DOCTOR_ACCESS_REQUESTS },
    { icon: Bell, label: 'Notifications', path: ROUTES.NOTIFICATIONS },
    { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS },
  ];

  const activeTabs = isDoctor ? doctorTabs : patientTabs;
  const desktopNavTabs = isDoctor ? extendedDoctorTabs : extendedPatientTabs;

  // Add role-based route protection and authentication check
  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOGIN, { state: { role: UserRole.PATIENT }, replace: true });
      return;
    }

    const path = location.pathname;
    const isDoctorRoute = path.startsWith('/doctor');
    const isPatientRoute = path.startsWith('/patient');

    if (isDoctor && isPatientRoute) {
      navigate(ROUTES.DOCTOR_DASHBOARD, { replace: true });
    } else if (!isDoctor && isDoctorRoute) {
      navigate(ROUTES.PATIENT_HOME, { replace: true });
    }
  }, [user, location.pathname, isDoctor, navigate]);

  // Handle ESC key to close sidebar on tablet & mobile
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen, handleKeyDown]);

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden">
      {/* Desktop Fixed Sidebar (lg: >=1024px, 260px width) */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 lg:bg-white lg:border-r lg:border-slate-200/80 lg:shadow-xs">
        <div className="flex flex-col h-full p-4">
          {/* Logo - Single Line, No Wrapping */}
          <div className="pb-4 border-b border-slate-100">
            <Logo size="md" showText={true} className="flex-row items-center gap-2.5 whitespace-nowrap shrink-0" />
          </div>

          {/* User Profile Info */}
          <div className="my-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <img
              src={user?.photoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"}
              className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              alt="User Profile"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">{user?.name || (isDoctor ? "Dr. User" : "Patient User")}</h4>
              <p className="text-[11px] text-slate-500 font-medium capitalize truncate">{isDoctor ? "Doctor" : "Patient"}</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {desktopNavTabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => handleNavigation(tab.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-all duration-200 ease-in-out",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  )}
                >
                  <tab.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content & Header Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px] pb-20 lg:pb-8">
        {/* Responsive Header (Height ~72px) */}
        <header className="sticky top-0 z-20 h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 min-w-0">
            {/* Top-Left Hamburger Menu Button (<1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition-all duration-200 shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo on Mobile/Tablet Header (<1024px) */}
            <div className="lg:hidden">
              <Logo size="sm" showText={true} className="flex-row items-center gap-2 whitespace-nowrap shrink-0" />
            </div>

            {/* Desktop Dashboard Title (>=1024px) */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-black tracking-tight text-slate-800 capitalize">
                {isDoctor ? "Doctor Portal" : "Patient Dashboard"}
              </h2>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate(ROUTES.SETTINGS)}
              className="h-10 w-10 rounded-full border-2 border-white shadow-xs overflow-hidden active:scale-90 transition-transform shrink-0"
              aria-label="Open settings"
            >
              <img
                src={user?.photoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"}
                className="h-full w-full object-cover"
                alt="User Profile"
              />
            </button>
          </div>
        </header>

        {/* Tablet & Mobile Slide-Out Drawer Navigation (<1024px) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="lg:hidden relative z-40">
              {/* Semi-transparent Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              />

              {/* Slide-In Sidebar Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="fixed inset-y-0 left-0 w-[270px] max-w-[85vw] bg-white shadow-2xl p-4 flex flex-col justify-between overflow-y-auto"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <Logo size="sm" showText={true} className="flex-row items-center gap-2 whitespace-nowrap shrink-0" />
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="my-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <img
                      src={user?.photoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                      alt="User Profile"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{isDoctor ? "Doctor" : "Patient"}</p>
                    </div>
                  </div>

                  <nav className="space-y-1 mt-3">
                    {desktopNavTabs.map((tab) => {
                      const isActive = location.pathname === tab.path;
                      return (
                        <button
                          key={tab.path}
                          type="button"
                          onClick={() => handleNavigation(tab.path)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-all duration-200 ease-in-out",
                            isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <tab.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Page Content Holder */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile & Tablet: <1024px) */}
      <nav
        aria-label="Bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/70 px-2 sm:px-4 py-2 pb-safe shadow-lg"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {activeTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => handleNavigation(tab.path)}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition-all active:scale-95",
                  isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-500 hover:text-slate-700 font-medium"
                )}
                title={tab.label}
              >
                <tab.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", isActive && "fill-blue-600/10")} />
                <span className="text-[10px] sm:text-xs tracking-tight leading-tight truncate w-full px-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}



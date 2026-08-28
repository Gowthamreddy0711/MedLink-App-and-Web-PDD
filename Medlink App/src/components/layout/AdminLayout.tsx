import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, FileText, Activity, Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

interface AdminLayoutProps {
  user: any;
  setUser: (user: any) => void;
}

export default function AdminLayout({ user, setUser }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = String(user?.role).toUpperCase() === String(UserRole.ADMIN).toUpperCase();

  const adminTabs = [
    { icon: ShieldAlert, label: 'Compliance Console', path: ROUTES.ADMIN_DASHBOARD },
    { icon: ShieldCheck, label: 'Doctor Verification', path: ROUTES.ADMIN_VERIFICATION },
    { icon: FileText, label: 'Leave Requests', path: ROUTES.ADMIN_LEAVE_REQUESTS },
    { icon: Activity, label: 'Activity Log', path: ROUTES.ADMIN_ACTIVITY_LOG },
    { icon: Bell, label: 'Notifications', path: ROUTES.ADMIN_NOTIFICATIONS },
    { icon: Settings, label: 'Settings', path: ROUTES.ADMIN_SETTINGS },
  ];

  // Route protection
  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
    if (!isAdmin) {
      // Redirect to correct dashboard
      navigate(user.role === UserRole.DOCTOR ? ROUTES.DOCTOR_DASHBOARD : ROUTES.PATIENT_HOME, { replace: true });
    }
  }, [user, isAdmin, navigate]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('medlink_user');
      setUser(null);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen w-full bg-slate-900 overflow-x-hidden text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[280px] lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-slate-800 border-r border-slate-700 shadow-2xl">
        <div className="flex flex-col h-full p-4">
          <div className="pb-6 pt-2 px-2 border-b border-slate-700/50 flex items-center gap-3">
             {/* Simple Text Logo instead of full Logo component to match admin vibe */}
             <div className="flex-1 flex flex-col">
               <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                 <ShieldCheck className="h-6 w-6 text-teal-400" /> MedLinkPro
               </h1>
               <span className="text-xs font-semibold text-teal-400 tracking-wider uppercase mt-1">Compliance Console</span>
             </div>
          </div>

          <div className="my-6 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center gap-3 shadow-inner">
            <div className="h-10 w-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
               <ShieldCheck className="h-5 w-5 text-teal-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{user?.name || "Admin User"}</h4>
              <p className="text-xs text-slate-400 font-medium truncate">MedLink Administrator</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2">
            {adminTabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => handleNavigation(tab.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold transition-all duration-200",
                    isActive
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
                  )}
                >
                  <tab.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-teal-400" : "text-slate-500")} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="pt-4 border-t border-slate-700/50 mt-auto">
             <button
               onClick={handleLogout}
               className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
             >
               <LogOut className="h-5 w-5 shrink-0" />
               <span>Logout</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[280px]">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 h-16 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" /> Admin
            </h1>
          </div>
        </header>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="lg:hidden relative z-40">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-slate-800 shadow-2xl p-4 flex flex-col border-r border-slate-700"
              >
                <div className="flex items-center justify-between pb-6 pt-2 px-2 border-b border-slate-700/50">
                   <div className="flex-1 flex flex-col">
                     <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                       <ShieldCheck className="h-6 w-6 text-teal-400" /> MedLinkPro
                     </h1>
                   </div>
                   <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                     <X className="h-6 w-6" />
                   </button>
                </div>
                
                <nav className="mt-6 flex-1 space-y-2">
                  {adminTabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                      <button
                        key={tab.path}
                        onClick={() => handleNavigation(tab.path)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold",
                          isActive ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        )}
                      >
                        <tab.icon className="h-5 w-5" /> {tab.label}
                      </button>
                    );
                  })}
                </nav>
                <button
                   onClick={handleLogout}
                   className="mt-4 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold text-rose-400 hover:bg-rose-500/10"
                 >
                   <LogOut className="h-5 w-5" /> Logout
                 </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

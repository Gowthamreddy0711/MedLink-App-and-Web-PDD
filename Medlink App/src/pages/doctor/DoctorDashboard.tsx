import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Clock, 
  Bell,
  Building, 
  Shield,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  FileText,
  UserCheck,
  History,
  Bot,
  BarChart3,
  LogOut,
  Settings as SettingsIcon,
  Search,
  CheckCircle2,
  XCircle,
  Briefcase
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { db as firestoreDb } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/db';

interface DashboardProps {
  user: any;
}

export default function DoctorDashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Real-time Data State
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [openOpportunitiesCount, setOpportunitiesCount] = useState(0);
  const [myDutiesCount, setMyDutiesCount] = useState(0);
  const [myPendingLeaveCount, setMyPendingLeaveCount] = useState(0);

  const doctorId = user?.id || 'd1';

  // 1. Notification Listener
  useEffect(() => {
    if (!doctorId) return;
    const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', doctorId), where('isRead', '==', false));
    return onSnapshot(q, (snapshot) => setUnreadNotifications(snapshot.size));
  }, [doctorId]);

  // 2. Coverage Opportunities Listener (OPEN requests by others)
  useEffect(() => {
    const q = query(collection(firestoreDb, 'leaveRequests'), where('status', '==', 'OPEN'));
    return onSnapshot(q, (snapshot) => {
      const othersRequests = snapshot.docs.filter(d => d.data().doctorId !== doctorId);
      setOpportunitiesCount(othersRequests.length);
    });
  }, [doctorId]);

  // 3. My Leave Status Listener
  useEffect(() => {
    const q = query(collection(firestoreDb, 'leaveRequests'), where('doctorId', '==', doctorId), where('status', '==', 'OPEN'));
    return onSnapshot(q, (snapshot) => setMyPendingLeaveCount(snapshot.size));
  }, [doctorId]);

  // 4. My Coverage Duties Listener
  useEffect(() => {
    const q = query(collection(firestoreDb, 'leaveRequests'), where('approvedDoctorId', '==', doctorId), where('status', 'in', ['ACCEPTED', 'IN_PROGRESS']));
    return onSnapshot(q, (snapshot) => setMyDutiesCount(snapshot.size));
  }, [doctorId]);

  // 5. Accept Requests Listener (Pending volunteers for MY requests)
  useEffect(() => {
    const q = query(collection(firestoreDb, 'leaveRequests'), where('doctorId', '==', doctorId), where('status', '==', 'OPEN'));
    let totalUnsubscribes: Record<string, () => void> = {};

    const mainUnsubscribe = onSnapshot(q, (snapshot) => {
      // Clear old sub-listeners for requests no longer in 'OPEN' list
      const currentIds = snapshot.docs.map(d => d.id);
      Object.keys(totalUnsubscribes).forEach(id => {
        if (!currentIds.includes(id)) {
          totalUnsubscribes[id]();
          delete totalUnsubscribes[id];
        }
      });

      // Set up listeners for current open requests
      snapshot.docs.forEach(requestDoc => {
        if (!totalUnsubscribes[requestDoc.id]) {
          const vQuery = collection(firestoreDb, 'leaveRequests', requestDoc.id, 'volunteers');
          totalUnsubscribes[requestDoc.id] = onSnapshot(vQuery, (vSnapshot) => {
            const pendingCount = vSnapshot.docs.filter(d => d.data().status === 'WAITING_FOR_APPROVAL').length;
            // Use a functional update with an object to track per-request counts safely
            setPendingVolunteersMap(prev => ({ ...prev, [requestDoc.id]: pendingCount }));
          });
        }
      });
    });

    return () => {
      mainUnsubscribe();
      Object.values(totalUnsubscribes).forEach(u => u());
    };
  }, [doctorId]);

  const [pendingVolunteersMap, setPendingVolunteersMap] = useState<Record<string, number>>({});
  const pendingVolunteersCount = useMemo(() =>
    Object.values(pendingVolunteersMap).reduce((sum, val) => sum + val, 0),
    [pendingVolunteersMap]
  );

  const toggleAvailability = async () => {
    try {
      const newStatus = user?.clinicStatus === 'Available' ? 'Offline' : 'Available';
      await updateDoc(doc(firestoreDb, 'users', doctorId), { clinicStatus: newStatus });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medlink_user');
    window.location.href = ROUTES.LOGIN;
  };

  const actions = [
    { label: 'Request Leave', desc: 'Submit coverage request', icon: Calendar, color: 'bg-emerald-50 text-emerald-600', path: ROUTES.DOCTOR_LEAVE_APPLY },
    { label: 'Coverage Requests', desc: 'Volunteer for shifts', icon: Users, color: 'bg-blue-50 text-blue-600', path: ROUTES.DOCTOR_COVERAGE_RECEIVED, badge: openOpportunitiesCount },
    { label: 'My Leave Status', desc: 'Track your requests', icon: FileText, color: 'bg-amber-50 text-amber-600', path: ROUTES.DOCTOR_LEAVE_STATUS, badge: myPendingLeaveCount },
    { label: 'Coverage Duties', desc: 'Shifts assigned to you', icon: Shield, color: 'bg-violet-50 text-violet-600', path: ROUTES.DOCTOR_COVERAGE_SENT, badge: myDutiesCount },
    { label: 'Coverage Calendar', desc: 'View ops schedule', icon: LayoutGrid, color: 'bg-indigo-50 text-indigo-600', path: '/calendar' },
    { label: 'Clinician Directory', desc: 'Connect with peers', icon: Stethoscope, color: 'bg-rose-50 text-rose-600', path: '/doctor/directory' },
    { label: 'My Analytics', desc: 'Clinical metrics', icon: BarChart3, color: 'bg-slate-50 text-slate-600', path: '/analytics' },
    { label: 'Smart Assistant', desc: 'Operations AI support', icon: Bot, color: 'bg-blue-900 text-white', path: ROUTES.AI_CHAT },
    { label: 'Accept Requests', desc: 'Manage volunteers', icon: UserCheck, color: 'bg-emerald-600 text-white', path: ROUTES.DOCTOR_LEAVE_STATUS, badge: pendingVolunteersCount }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 1. PROFESSIONAL HEADER */}
      <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search operations..."
                className="bg-slate-100/80 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium w-64 focus:outline-none transition-all"
              />
           </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadNotifications > 0 && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>

          {/* Profile Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <img
                src={user?.photoUrl || "https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200"}
                className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                alt="Doctor"
              />
              <div className="text-left hidden md:block pr-2">
                <p className="text-xs font-black text-slate-900 leading-tight">{user?.name || "Dr. User"}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user?.specialty || "MD Practitioner"}</p>
              </div>
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 shadow-2xl rounded-3xl p-3 z-50"
                >
                   <div className="p-4 border-b border-slate-50 mb-2">
                      <p className="text-xs font-black text-slate-900">{user?.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{user?.email}</p>
                   </div>
                   <div className="flex flex-col gap-1">
                      <button onClick={() => navigate(ROUTES.DOCTOR_PROFILE)} className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-colors">
                        <Users className="w-4 h-4 text-blue-600" /> View Profile
                      </button>
                      <button onClick={() => navigate(ROUTES.SETTINGS)} className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-colors">
                        <SettingsIcon className="w-4 h-4 text-slate-400" /> Settings
                      </button>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 hover:bg-rose-50 rounded-xl text-sm font-bold text-rose-600 transition-colors">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* 2. WELCOME & SUBTITLE */}
        <section className="mb-10">
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">
             Welcome, Dr. {user?.name?.split(' ')[1] || user?.name || "Clinician"} 👋
           </h2>
           <p className="text-slate-500 font-bold text-lg mt-2 tracking-tight">
             Your Coverage. Our Continuity. Better Healthcare.
           </p>
        </section>

        {/* 3. CREDENTIALS & STATUS DECK */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* License Card */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <ShieldCheck className="w-24 h-24" />
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Medical License Registration</p>
            <h3 className="text-2xl font-black tracking-widest font-mono mb-2">
              {user?.licenseNumber || "Not available"}
            </h3>
            {user?.verified && (
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Accredited Node
              </div>
            )}
          </div>

          {/* Availability Status Card */}
          <button
            onClick={toggleAvailability}
            className={cn(
              "rounded-[2.5rem] p-8 text-left transition-all duration-300 border-2 flex flex-col justify-between group relative overflow-hidden",
              user?.clinicStatus === 'Available'
                ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-500/10"
                : "bg-white border-slate-100 shadow-sm"
            )}
          >
            <div className="flex items-center justify-between relative z-10">
               <p className={cn(
                 "text-[10px] font-black uppercase tracking-widest",
                 user?.clinicStatus === 'Available' ? "text-emerald-600" : "text-slate-400"
               )}>Operations Status</p>
               <div className={cn(
                 "w-3 h-3 rounded-full animate-pulse",
                 user?.clinicStatus === 'Available' ? "bg-emerald-500" : "bg-slate-300"
               )} />
            </div>
            <div className="relative z-10">
               <h3 className={cn(
                 "text-3xl font-black tracking-tight mb-1 transition-colors",
                 user?.clinicStatus === 'Available' ? "text-emerald-900" : "text-slate-900"
               )}>
                 {user?.clinicStatus || "Offline"}
               </h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Tap to toggle availability</p>
            </div>
          </button>

          {/* Practitioner Summary Card */}
          <button
            onClick={() => navigate(ROUTES.DOCTOR_PROFILE)}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all text-left flex flex-col justify-between"
          >
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Practitioner Summary</p>
             <div className="flex items-center gap-4 my-2">
                <div className="p-3 bg-blue-50 rounded-2xl">
                   <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                   <h4 className="font-black text-slate-900 text-sm leading-tight">{user?.department || "General Ops"}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">{user?.hospitalName || "Partner Facility"}</p>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100">
                  {user?.experience || '0'} Years Experience
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
             </div>
          </button>
        </section>

        {/* 4. QUICK ACTIONS GRID */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Clinical Operations Grid</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-4 py-1.5 rounded-full shadow-sm">
              9 Primary Nodes Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {actions.map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-50 transition-all text-left flex flex-col gap-6 group relative overflow-hidden"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6", action.color)}>
                  <action.icon className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight">{action.label}</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">{action.desc}</p>
                </div>

                {action.badge !== undefined && action.badge > 0 && (
                  <div className="absolute top-7 right-7 px-3 py-1 bg-rose-500 text-white rounded-full text-[10px] font-black shadow-lg animate-in zoom-in duration-300">
                    {action.badge}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

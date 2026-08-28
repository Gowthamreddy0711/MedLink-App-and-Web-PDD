import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Heart, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  ChevronRight, 
  Search, 
  Calendar, 
  Milestone,
  User, 
  MessageSquare,
  Bookmark,
  TrendingUp,
  Award
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { db } from '../../services/db';

export default function PatientHome({ user }: { user: any }) {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prescriptionsCount, setPrescriptionsCount] = useState<number>(0);
  const [upcomingVisit, setUpcomingVisit] = useState<any | null>(null);
  const [visitLoading, setVisitLoading] = useState(true);

  const userId = user?.id || 'anonymous';
  const userName = user?.name || "HealCloud Member";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Load Recommended Doctors
        const allDocs = await db.getDoctors();
        // Take specific high-rated doctors for recommendation
        setDoctors(allDocs.filter(d => d.rating >= 4.8).slice(0, 3));

        // Load Real Prescriptions count
        if (userId !== 'anonymous') {
          const resList = await db.getPrescriptions(userId);
          setPrescriptionsCount(resList.length);
        }
      } catch (err) {
        console.error('Error fetching patient diagnostics telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveAppointments = async () => {
      try {
        setVisitLoading(true);
        if (userId !== 'anonymous') {
          const appts = await db.getAppointmentsByUserId(userId, false);
          // Find first scheduled / upcoming appointment
          const active = appts.find(a => a.status === 'Scheduled' || a.status === 'Waiting' || a.status === 'current');
          setUpcomingVisit(active || null);
        }
      } catch (err) {
        console.error('Failed to load upcoming clinic consultations:', err);
      } finally {
        setVisitLoading(false);
      }
    };

    fetchDashboardData();
    fetchLiveAppointments();
  }, [userId]);

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto overflow-x-hidden bg-slate-50/50 pb-24 px-4 sm:px-6 pt-4 sm:pt-5">
      {/* SaaS Premium Header with User Badge */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div className="min-w-0">
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Patient Portal Console
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mt-2.5 break-words">
            Welcome, {userName}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse flex-shrink-0" />
            <span className="truncate">Active Clinical Cloud-Sync</span>
          </p>
        </div>

        {/* Unified Security ID Tag */}
        <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-slate-800 shadow-xl w-full sm:w-auto sm:max-w-sm flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Global Registry Id</p>
            <p className="font-mono text-xs font-black mt-1 leading-none truncate">ML-{userId.replace('u_', '').substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </section>

      {/* Main Responsive Quadrant Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 items-start">
        
        {/* Left Double Section: Health Console */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          
          {/* Quick Care Action Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button 
              onClick={() => navigate(ROUTES.PATIENT_SEARCH)}
              className="group p-5 sm:p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl text-white shadow-lg shadow-blue-500/10 flex flex-col justify-between text-left active:scale-[0.98] transition-all gap-5 hover:shadow-xl"
            >
              <div className="bg-white/10 group-hover:bg-white/20 p-3 rounded-2xl w-fit transition-all">
                <Plus className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <div>
                <span className="text-blue-200 text-[9px] font-black uppercase tracking-widest block mb-1">
                  Scheduler Desk
                </span>
                <h3 className="font-black text-xl sm:text-2xl leading-snug">Book Visit</h3>
                <p className="text-blue-100/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                  Active Providers <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                </p>
              </div>
            </button>

            <button 
              onClick={() => navigate(ROUTES.PATIENT_HISTORY)}
              className="group p-5 sm:p-6 bg-slate-900 rounded-2xl sm:rounded-3xl text-white shadow-lg shadow-slate-950/20 flex flex-col justify-between text-left active:scale-[0.98] transition-all gap-5 hover:shadow-xl"
            >
              <div className="bg-white/10 group-hover:bg-white/20 p-3 rounded-2xl w-fit transition-all">
                <FileText className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <div>
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block mb-1">
                  Clinical Registries
                </span>
                <h3 className="font-black text-xl sm:text-2xl leading-snug">Archives</h3>
                <p className="text-slate-300 text-[10px] sm:text-xs font-bold uppercase tracking-wide mt-1">
                  {prescriptionsCount} Reports
                </p>
              </div>
            </button>
          </div>

        </div>

        {/* Right Section: Active Clinic Queue Hub & Consultation Deck */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest min-w-0">
                  Live Queue Hub
                </h2>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </div>

              {visitLoading ? (
                <div className="py-8 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : upcomingVisit ? (
                <div className="p-3.5 sm:p-4 bg-blue-50/50 rounded-2xl border border-blue-50 flex flex-col gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0">
                      {upcomingVisit.tokenNumber || '1'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest truncate">Queue Token</p>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">{upcomingVisit.doctorName}</h4>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/40 pt-2.5 flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 gap-2">
                      <span>Status</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0",
                        upcomingVisit.status === 'current' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-blue-100 text-blue-600'
                      )}>
                        {upcomingVisit.status === 'current' ? 'Consulting' : 'Scheduled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 gap-2">
                      <span className="truncate">Date / Time</span>
                      <span className="text-slate-800 font-mono text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">{upcomingVisit.date} @ {upcomingVisit.time}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(ROUTES.PATIENT_REMINDERS)}
                    className="w-full mt-1 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-500/15 active:scale-95 transition-all"
                  >
                    View Queue
                  </button>
                </div>
              ) : (
                <div className="p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col items-center gap-2 justify-center">
                  <Clock className="w-6 h-6 text-slate-300" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Active Visits</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                    Schedule a consultation now.
                  </p>
                </div>
              )}
            </div>

            {/* AI Embedded Assistant Callout */}
            <div 
              onClick={() => navigate(ROUTES.AI_CHAT)}
              className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 text-white rounded-2xl shadow-md relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
            >
              <div className="absolute top-0 right-0 p-2 opacity-15 group-hover:opacity-30 transition-all">
                <Sparkles className="w-12 h-12 text-blue-400" />
              </div>
              <div className="flex items-center gap-3 relative z-10 min-w-0">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs uppercase tracking-widest text-blue-400 leading-none truncate">AI Assistant</h4>
                  <p className="font-bold text-[10px] sm:text-[11px] text-slate-300 mt-1 truncate">Chat secure</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0" />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Floating AI Button */}
      <button 
        onClick={() => navigate(ROUTES.AI_CHAT)}
        className="fixed bottom-20 sm:bottom-24 lg:bottom-8 right-4 sm:right-6 lg:right-8 w-14 sm:w-16 h-14 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 z-40 group hover:scale-110 active:scale-95 transition-all cursor-pointer"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <MessageSquare className="w-7 sm:w-8 h-7 sm:h-8" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
        </div>
      </button>
    </div>
  );
}


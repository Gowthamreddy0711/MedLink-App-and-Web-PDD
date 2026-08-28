import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  ChevronRight,
  Stethoscope,
  HandHeart
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db as firestoreDb } from '../../services/firebase';
import { db } from '../../services/db';
import { LeaveRequest, Volunteer } from '../../types';

export default function CoverageRequestsScreen() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [volunteeredIds, setVolunteeredIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('medlink_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(firestoreDb, 'leaveRequests'),
      where('status', 'in', ['OPEN', 'PENDING']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveRequests = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest))
        .filter(req => req.doctorId !== user.id);
      setRequests(liveRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleVolunteer = async (request: LeaveRequest) => {
    if (!user) return;
    try {
      const volunteerData: Volunteer = {
        doctorId: user.id,
        name: user.name || 'Specialist',
        email: user.email,
        phone: user.phone || 'Private',
        profilePhoto: user.photoUrl,
        experience: user.experience || 5,
        specialization: user.specialty || 'General Practitioner',
        timestamp: Date.now()
      };

      await db.volunteerForLeave(request.id, volunteerData);
      setVolunteeredIds(prev => new Set(prev).add(request.id));
    } catch (err) {
      console.error('Volunteering failed:', err);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-4 pb-24 sm:px-6 sm:py-6">
      <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between sm:mb-8">
        <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tight leading-tight">Coverage Opportunities</h1>
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft className="w-6 h-6 text-blue-900" />
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
              >
                {!volunteeredIds.has(request.id) ? (
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={request.doctorProfilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200'}
                        className="w-16 h-16 rounded-2xl object-cover"
                        alt={request.doctorName}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-blue-950 text-lg">{request.doctorName}</h3>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                            request.priority === 'Urgent' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {request.priority}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{request.specialization}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Period</p>
                          <p className="text-sm font-bold text-blue-900">{request.leaveDuration}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Coverage Type</p>
                          <p className="text-sm font-bold text-blue-900">{request.coverageType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <HandHeart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Reason</p>
                          <p className="text-sm font-bold text-blue-900 truncate max-w-[150px]">{request.reason}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVolunteer(request)}
                        className="flex-1 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Volunteer to Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center mb-4 bg-emerald-50 text-emerald-500">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-blue-950 uppercase tracking-tight">
                      Volunteered Successfully
                    </h4>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                      Dr. {request.doctorName.split(' ')[1] || 'Specialist'} has been notified of your offer.
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6">
              <Stethoscope className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="font-black text-blue-900 uppercase tracking-tight">No Requests</h3>
            <p className="text-sm font-medium text-slate-500 max-w-[200px] mt-2">
              No colleagues are currently looking for coverage help.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

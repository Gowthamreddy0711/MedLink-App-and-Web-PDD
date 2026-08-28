import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../services/db';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '../../services/firebase';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('medlink_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const qAppts = query(collection(firestoreDb, 'appointments'), where('doctorId', '==', user.id));

    const unsubscribe = onSnapshot(qAppts, (snapshot) => {
      const liveAppts = snapshot.docs.map(doc => doc.data());
      // Merge with local storage cache to support offline or local fallback seamlessly
      const localApptsStr = localStorage.getItem('medlink_local_appointments');
      const localAppts = (localApptsStr ? JSON.parse(localApptsStr) : []).filter((a: any) => a.doctorId === user.id);

      const merged = [...liveAppts];
      for (const a of localAppts) {
        if (!merged.some(existing => existing.id === a.id)) {
          merged.push(a);
        }
      }

      const sorted = merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAppointments(sorted);
      setLoading(false);
    }, (error) => {
      console.warn('Real-time appointments load failed in appointments page:', error);
      const localApptsStr = localStorage.getItem('medlink_local_appointments');
      const localAppts = (localApptsStr ? JSON.parse(localApptsStr) : []).filter((a: any) => a.doctorId === user.id);
      const sorted = localAppts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAppointments(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-4 border-b border-white bg-slate-50 z-10 flex items-center gap-4">
        <button onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)} className="p-2 -ml-2 text-slate-600 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">Appointments</h1>
      </header>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-10 h-10 text-blue-200" />
            </div>
            <h3 className="font-bold text-blue-900">No appointments yet</h3>
            <p className="text-slate-500 text-sm mt-1">New requests will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{app.type || 'Consultation'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{app.date}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950">{app.patientName || `Patient ID: ${app.patientId.slice(0, 8)}...`}</h4>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{app.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Accept
                  </button>
                  <button className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

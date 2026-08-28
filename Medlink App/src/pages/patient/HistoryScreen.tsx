import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Download, ChevronRight, Stethoscope, Star } from 'lucide-react';
import { ROUTES } from '../../constants';
import { db } from '../../services/db';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('medlink_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (!user) {
          setLoading(false);
          return;
        }

        const data = await db.getPrescriptions(user.id);
        
        if (data.length === 0) {
          // If no specific prescriptions, pull general seeded prescriptions
          const allPres = await db.getPrescriptions();
          setHistory(allPres);
        } else {
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalMedsCount = history.reduce((acc, visit) => {
    const count = Array.isArray(visit.prescription) ? visit.prescription.length : 0;
    return acc + count;
  }, 0);

  return (
    <div className="px-6 py-6 pb-24 min-h-screen bg-slate-50">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate(ROUTES.PATIENT_HOME);
          }
        }} className="p-2 -ml-2 text-slate-600 bg-white rounded-xl shadow-sm active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-blue-900 tracking-tight">Medical History</h1>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Records...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-100">
               <FileText className="w-6 h-6 mb-2 opacity-80" />
               <div className="text-2xl font-black">{history.length}</div>
               <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Visits</div>
            </div>
            <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
               <Stethoscope className="w-6 h-6 mb-2 text-blue-600" />
               <div className="text-2xl font-black text-blue-900">{totalMedsCount}</div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prescribed Items</div>
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Past Consultations</h2>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-slate-100 p-6">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="font-bold text-blue-900 text-sm">No historical consultations</h3>
              <p className="text-slate-400 text-xs mt-1">Your doctor-approved prescriptions will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {history.map((item, i) => {
                const doctorPhoto = item.doctorPhotoUrl || item.photoUrl || 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200';
                const meds = Array.isArray(item.prescription) ? item.prescription : [];
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative group"
                  >
                    <div className="flex items-start gap-4">
                      <img src={doctorPhoto} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt={item.doctorName} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-blue-900 leading-tight">{item.doctorName || 'Doctor'}</h3>
                          <span className="text-[10px] font-bold text-slate-400">{item.date || 'Today'}</span>
                        </div>
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mt-0.5">{item.specialty || 'General Practitioner'}</p>
                        <p className="mt-2 text-xs text-slate-500 font-medium italic">"{item.reason || 'Routine general checkup'}"</p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-50">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnosis</span>
                             <div className="flex gap-2">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   navigate(ROUTES.SUBMIT_REVIEW.replace(':id', item.doctorId || 'd1'));
                                 }}
                                 className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all"
                               >
                                 <Star className="w-3 h-3 text-amber-500" /> Review
                               </button>
                               <button className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                  <Download className="w-3 h-3" /> Report
                               </button>
                             </div>
                           </div>
                           <p className="text-xs font-bold text-blue-950">{item.diagnosis || 'Healthy sinus rhythm'}</p>
                        </div>

                        {meds.length > 0 && (
                          <div className="mt-4 flex flex-col gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescribed Medicine</span>
                             <div className="flex flex-wrap gap-2">
                                {meds.map((med: any, idx: number) => {
                                  const nameLabel = typeof med === 'object' ? `${med.name} - ${med.dosage || ''}` : med;
                                  return (
                                    <span key={idx} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                                      {nameLabel}
                                    </span>
                                  );
                                })}
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <button className="mt-8 w-full py-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-sm transition-all shadow-sm">
            Export Medical Record (PDF)
          </button>
        </>
      )}
    </div>
  );
}

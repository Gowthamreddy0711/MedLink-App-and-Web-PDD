import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MessageSquare, AlertCircle, ChevronRight, CheckCircle2, Clock, Phone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants';
import { db } from '../../services/db';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb, handleFirestoreError, OperationType } from '../../services/firebase';

export default function DoctorQueue() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [patients, setPatients] = useState<any[]>([]);
  const [isCalling, setIsCalling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Retrieve current logged-in doctor profile
  const storedUser = localStorage.getItem('medlink_user');
  const loggedInDoctor = storedUser ? JSON.parse(storedUser) : null;
  const doctorId = loggedInDoctor?.id || 'd1';

  // Real-time Firestore Queue Sync
  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const pathForOnSnapshot = 'queue';
    const q = query(collection(firestoreDb, pathForOnSnapshot), where('doctorId', '==', doctorId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qItems = snapshot.docs.map(doc => doc.data());
      setPatients(qItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [doctorId]);

  const handleCallPatient = async (id: string) => {
    setIsCalling(id);
    // Simulate audio chime delay briefly for responsiveness feedback
    await new Promise(resolve => setTimeout(resolve, 80));
    try {
      await db.updateQueueStatus(id, 'current');
    } catch (err) {
      console.error('Call update failed:', err);
    }
    setIsCalling(null);
  };

  const handleFinishConsultation = async (id: string) => {
    try {
      await db.updateQueueStatus(id, 'Done');
    } catch (err) {
      console.error('Finish consultation failed:', err);
    }
  };

  const pendingPatients = patients.filter(
    (p: any) => p.status === 'Waiting' || p.status === 'waiting' || p.status === 'current'
  );
  const completedPatients = patients.filter(
    (p: any) => p.status === 'Done' || p.status === 'completed'
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 overflow-x-hidden">
      {/* Calling Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-blue-600 flex flex-col items-center justify-center p-6 text-white"
          >
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
              <Phone className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Calling Patient</h2>
            <p className="text-blue-100 font-bold">{patients.find(p => p.id === isCalling)?.patientName || 'Patient'}</p>
            <div className="mt-12 flex gap-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-3 py-4 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-xl active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">Today's Queue</h1>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 italic flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live Cloud
        </div>
      </header>

      <div className="flex-1 px-3 py-4 sm:px-4 lg:px-6">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('pending')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'pending' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
            )}
          >
            In-Queue ({pendingPatients.length})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'completed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
            )}
          >
            Completed ({completedPatients.length})
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Live Queue...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {activeTab === 'pending' ? (
                <motion.div 
                  key="pending"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col gap-4"
                >
                  {pendingPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-blue-300" />
                      </div>
                      <h3 className="font-bold text-blue-900">Queue is empty</h3>
                      <p className="text-slate-400 text-xs mt-1">No patients currently checked in</p>
                    </div>
                  ) : (
                    pendingPatients.map((patient, i) => (
                      <PatientCard 
                        key={patient.id} 
                        patient={patient} 
                        index={i} 
                        onCall={() => handleCallPatient(patient.id)}
                        onFinish={() => handleFinishConsultation(patient.id)}
                      />
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="completed"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col gap-4"
                >
                  {completedPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                      </div>
                      <h3 className="font-bold text-blue-900">No completed sessions</h3>
                      <p className="text-slate-400 text-xs mt-1">Patients checked check-out will appear here</p>
                    </div>
                  ) : (
                    completedPatients.map((patient, i) => (
                      <PatientCard 
                        key={patient.id} 
                        patient={patient} 
                        index={i} 
                      />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientCard({ patient, index, onCall, onFinish }: any) {
  const navigate = useNavigate();
  const isCurrent = patient.status === 'current';
  const isCompleted = patient.status === 'Done' || patient.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border bg-white p-4 transition-all sm:rounded-[2.5rem] sm:p-5",
        isCurrent ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]" : "border-slate-100 shadow-sm"
      )}
    >
      {isCurrent && (
        <div className="absolute top-4 right-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Now Consulting</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn(
          "flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl border",
          isCurrent ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200" : "bg-slate-50 border-slate-100 text-blue-900"
        )}>
          <span className="text-2xl font-black">{patient.tokenNumber || '1'}</span>
          <span className={cn("text-[8px] font-black uppercase tracking-widest", isCurrent ? "opacity-60" : "text-blue-400")}>Token</span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-black text-blue-950 text-lg leading-tight">{patient.patientName}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Checked-in today</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {isCompleted ? (
          <div className="w-full flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-xs font-black uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Consultation Complete
          </div>
        ) : isCurrent ? (
          <>
            <button 
              onClick={onFinish}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Finish Session
            </button>
            <button 
              onClick={() => navigate(ROUTES.DOCTOR_PRESCRIPTION_WRITE, { state: { patientId: patient.patientId, appointmentId: patient.appointmentId } })}
              className="p-4 bg-blue-50 text-blue-600 rounded-2xl active:scale-95 transition-all flex items-center justify-center"
              title="Write Prescription"
            >
              <Info className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate(ROUTES.PATIENT_HISTORY, { state: { patientId: patient.patientId } })}
              className="p-4 bg-slate-100 text-slate-600 rounded-2xl active:scale-95 transition-all flex items-center justify-center"
              title="Patient History"
            >
              <Clock className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onCall}
              className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Patient
            </button>
            <button 
              onClick={() => navigate(ROUTES.PATIENT_HISTORY, { state: { patientId: patient.patientId } })}
              className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              View History
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

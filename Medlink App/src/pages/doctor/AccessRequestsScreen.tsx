import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

export default function AccessRequestsScreen() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([
    {
      id: 'req1',
      doctorName: 'Dr. James Chen',
      specialty: 'Dermatologist',
      patients: ['Robert Fox', 'Jane Cooper'],
      time: '2 hours ago',
      status: 'pending',
      photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200'
    },
    {
      id: 'req2',
      doctorName: 'Dr. Emily Blunt',
      specialty: 'Neurologist',
      patients: ['Guy Hawkins'],
      time: '5 hours ago',
      status: 'pending',
      photoUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200'
    }
  ]);

  const handleAction = (id: string, newStatus: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ));
    
    // Simulate API call
    setTimeout(() => {
      setRequests(prev => prev.filter(req => req.id !== id));
    }, 100);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-4 pb-24 sm:px-6 sm:py-6">
      <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between sm:mb-8">
        <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tight leading-tight">Access Requests</h1>
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft className="w-6 h-6 text-blue-900" />
        </button>
      </header>

      <div className="mx-auto mb-6 flex w-full max-w-6xl items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:mb-8">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 font-medium">
          Other doctors are requesting temporary access to your patients' records for collaborative care.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
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
              {request.status === 'pending' ? (
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={request.photoUrl} 
                      className="w-16 h-16 rounded-2xl object-cover"
                      alt={request.doctorName}
                    />
                    <div>
                      <h3 className="font-black text-blue-950 text-lg">{request.doctorName}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{request.specialty}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Requested Patients</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {request.patients.map((patient, pIdx) => (
                        <span key={pIdx} className="px-3 py-1 bg-white border border-slate-100 rounded-full text-xs font-bold text-blue-900 shadow-sm">
                          {patient}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAction(request.id, 'approved')}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(request.id, 'rejected')}
                      className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center mb-4",
                    request.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                  )}>
                    {request.status === 'approved' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <h4 className="font-black text-blue-950">
                    Access {request.status === 'approved' ? 'Granted' : 'Denied'}
                  </h4>
                  <p className="text-slate-400 text-xs font-medium mt-1">
                    Updating registry...
                  </p>
                </div>
              )}
              
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{request.time}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Encrypted</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="font-black text-blue-900 uppercase tracking-tight">All Caught Up</h3>
            <p className="text-sm font-medium text-slate-500 max-w-[200px] mt-2">
              No pending access requests at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

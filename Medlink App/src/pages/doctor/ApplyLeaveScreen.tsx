import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  User, 
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { db } from '../../services/db';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  distance: string;
  photo: string;
}

export default function ApplyLeaveScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'search' | 'confirm'>('details');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [nearbyDoctors, setNearbyDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const storedUser = localStorage.getItem('medlink_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const allDocs = await db.getDoctors();
        const filtered = allDocs
          .filter(d => d.id !== currentUser?.id)
          .slice(0, 5)
          .map((doc, idx) => ({
            id: doc.id,
            name: doc.name,
            specialty: doc.specialty || 'General Practitioner',
            rating: doc.rating || 5.0,
            experience: (doc.experience || '8+') + ' years',
            distance: (0.6 + (idx * 0.3)).toFixed(1) + ' km',
            photo: doc.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200'
          }));
        setNearbyDoctors(filtered);
      } catch (err) {
        console.error('Error fetching nearby coverage doctors:', err);
      }
    };
    fetchDocs();
  }, []);

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setStep('search');
    }, 100);
  };

  const handleRequestCoverage = async () => {
    if (!selectedDoctor || !startDate || !endDate) return;
    setSearching(true);

    try {
      const storedUser = localStorage.getItem('medlink_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;

      const leaveRequest = {
        id: `lv_${Date.now()}`,
        doctorId: currentUser?.id || 'd1',
        doctorName: currentUser?.name || 'Dr. Specialist',
        specialization: currentUser?.specialty || 'General Practitioner',
        doctorProfilePhoto: currentUser?.photoUrl,
        leaveStartDate: new Date(startDate).getTime(),
        leaveEndDate: new Date(endDate).getTime(),
        leaveDuration: `${startDate} to ${endDate}`,
        reason: reason || 'Clinical Continuity',
        status: 'OPEN',
        coverageType: 'Full Day', // Default for now
        priority: 'Normal', // Default for now
        createdAt: Date.now()
      };

      await db.submitLeaveRequest(leaveRequest);

      setSearching(false);
      setStep('confirm');
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      setSearching(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8"
        >
          <ShieldCheck className="w-12 h-12 text-emerald-500" />
        </motion.div>
        
        <h2 className="text-2xl font-black text-blue-900 mb-2">Request Sent!</h2>
        <p className="text-slate-500 font-medium mb-8 max-w-[280px]">
          We've sent your clinic coverage request to <span className="text-blue-600 font-bold">{selectedDoctor?.name}</span>. 
          You'll be notified once they accept.
        </p>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm w-full mb-10 text-left">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-xl">
                 <CalendarIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                 <p className="text-sm font-bold text-blue-950">{startDate} to {endDate}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                 <Building className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Site</p>
                 <p className="text-sm font-bold text-blue-950">Primary Health & Diagnostics</p>
              </div>
           </div>
        </div>

        <button 
          onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)}
          className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-50">
      <header className="px-6 py-4 border-b border-white bg-slate-50 z-10 flex items-center gap-4">
        <button onClick={() => step === 'details' ? navigate(ROUTES.DOCTOR_DASHBOARD) : setStep('details')} className="p-2 -ml-2 text-slate-600 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">
          {step === 'details' ? 'Refill Coverage' : 'Find Doctors'}
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 p-4 sm:p-6 pb-24">
        {step === 'details' ? (
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Coverage Period</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</span>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-blue-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</span>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-blue-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Continuity Reason</label>
                <div className="relative">
                  <textarea 
                    placeholder="Briefly describe the need for coverage (e.g., Medical Emergency, External Workshop...)"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-blue-950 focus:outline-none focus:border-blue-500 transition-all text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={searching || !startDate || !endDate}
              className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {searching ? <Search className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search Nearby Doctors
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Nearby ({nearbyDoctors.length})</h2>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Live Registry</span>
            </div>

            <div className="flex flex-col gap-4">
               {nearbyDoctors.map((doc) => (
                 <button 
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={cn(
                    "bg-white p-6 rounded-[2.5rem] border-2 transition-all text-left flex items-center gap-4",
                    selectedDoctor?.id === doc.id ? "border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]" : "border-slate-100 shadow-sm"
                  )}
                 >
                    <img src={doc.photo} className="w-16 h-16 rounded-2xl object-cover" alt={doc.name} />
                    <div className="flex-1">
                      <h3 className="font-black text-blue-950 leading-tight">{doc.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{doc.specialty}</p>
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-900">{doc.experience}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500">{doc.distance}</span>
                         </div>
                      </div>
                    </div>
                    {selectedDoctor?.id === doc.id && (
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-in zoom-in">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                 </button>
               ))}
            </div>

            <AnimatePresence>
              {selectedDoctor && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="fixed bottom-8 left-6 right-6"
                >
                  <button 
                    onClick={handleRequestCoverage}
                    disabled={searching}
                    className="w-full py-5 bg-blue-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    {searching ? <Clock className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    Request Substitution
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

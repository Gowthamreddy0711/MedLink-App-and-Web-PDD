import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Plus, Trash2, Send, Clock, Clipboard, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '../../constants';
import { db } from '../../services/db';

export default function WritePrescription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', instructions: 'After Meal', duration: '5 Days' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load patient list and handle auto-select from router state
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await db.getPatients();
        setPatients(data);
        
        if (location.state?.patientId) {
          const match = data.find(p => p.id === location.state.patientId);
          if (match) {
            setSelectedPatient(match);
          } else {
            // Fetch directly in case they aren't fully indexed in list
            const single = await db.getUserById(location.state.patientId);
            if (single) {
              setSelectedPatient(single);
              // Avoid duplicates
              if (!data.some(p => p.id === single.id)) {
                setPatients(prev => [...prev, single]);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [location.state?.patientId]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', instructions: 'After Meal', duration: '5 Days' }]);
  };

  const removeMedicine = (index: number) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines.length ? newMedicines : [{ name: '', dosage: '', frequency: '', instructions: 'After Meal', duration: '5 Days' }]);
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const newMedicines = [...medicines];
    (newMedicines[index] as any)[field] = value;
    setMedicines(newMedicines);
  };

  const handleSubmit = async () => {
    console.log('Submit clicked', { selectedPatient, diagnosis, medicines });
    
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    
    if (!diagnosis) {
      alert('Please enter a diagnosis summary');
      return;
    }

    const hasEmptyFields = medicines.some(med => !med.name || !med.dosage || !med.frequency);
    if (hasEmptyFields) {
      alert('Please fill in all medicine details (Name, Dosage, Frequency)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const storedUser = localStorage.getItem('medlink_user');
      const doctor = storedUser ? JSON.parse(storedUser) : null;

      await db.createPrescription({
        appointmentId: location.state?.appointmentId || `appt_${Date.now()}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        doctorId: doctor?.id || 'd1',
        doctorName: doctor?.name || 'Dr. Sarah Wilson',
        specialty: doctor?.specialty || 'Cardiologist',
        doctorPhotoUrl: doctor?.photoUrl || 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        reason: 'Clinical diagnosis consultation',
        diagnosis: diagnosis,
        prescription: medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          instructions: m.instructions,
          duration: m.duration
        }))
      });

      // Simulate API call and state transition
      await new Promise(resolve => setTimeout(resolve, 50));
      setIsSuccess(true);
      
      setTimeout(() => {
        navigate(-1);
      }, 800);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to send prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
        >
          <Send className="w-10 h-10" />
        </motion.div>
        <h2 className="text-2xl font-black text-blue-900">Prescription Sent!</h2>
        <p className="text-slate-500 mt-2">The patient has been notified and can view the prescription in their history.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between z-20 font-bold">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-xl active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">Prescription</h1>
        </div>
      </header>

      <div className="flex-1 p-6 pb-40 max-w-full overflow-x-hidden animate-fade-in">
        {/* Patient Selection */}
        <section className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Select Patient</label>
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-xs text-slate-400 font-bold ml-2">Loading patient registry...</p>
            ) : patients.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold ml-2">No patients registered in the database.</p>
            ) : (
              patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  type="button"
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    selectedPatient?.id === p.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border-slate-100 text-slate-600 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-5 h-5 ${selectedPatient?.id === p.id ? 'text-blue-200' : 'text-slate-400'}`} />
                    <span className="font-bold">{p.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedPatient?.id === p.id ? 'text-blue-200' : 'text-slate-400'}`}>
                    {p.age || 25}Y • {p.gender || 'Male'}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Diagnosis */}
        <section className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Diagnosis</label>
          <div className="relative">
            <Clipboard className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <textarea
              placeholder="Enter diagnosis summary..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-3xl p-4 pl-12 h-32 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
        </section>

        {/* Medicines */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Medicines</label>
            <button 
              onClick={addMedicine}
              type="button"
              className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add More
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {medicines.map((med, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-colors"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px]">{i + 1}</div>
                       Medicine Detail
                    </h4>
                    <button 
                      onClick={() => removeMedicine(i)}
                      type="button"
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</span>
                      <input
                        placeholder="e.g. Paracetamol"
                        value={med.name}
                        onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 outline-none animate-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</span>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            placeholder="1-0-1"
                            value={med.frequency}
                            onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage</span>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            placeholder="500mg"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructions</span>
                        <select
                          value={med.instructions}
                          onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        >
                          <option>After Meal</option>
                          <option>Before Meal</option>
                          <option>With Meal</option>
                          <option>Before Sleep</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</span>
                        <input
                          placeholder="e.g. 5 Days"
                          value={med.duration}
                          onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Submit Button Area */}
      <div className="sticky bottom-4 left-0 right-0 px-3 sm:px-6 pb-4 sm:pb-6 pt-2 z-40 max-w-full">
        <button
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          type="button"
          disabled={isSubmitting}
          className="w-full h-14 sm:h-16 bg-blue-600 text-white rounded-2xl sm:rounded-[2rem] font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Prescription
            </>
          )}
        </button>
      </div>
    </div>
  );
}

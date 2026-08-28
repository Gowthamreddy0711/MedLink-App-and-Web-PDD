import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { db } from '../../services/db';

export default function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      setIsLoadingDoctor(true);
      try {
        if (!id) return;
        const data = await db.getDoctorById(id);
        setDoctor(data);

        // Pre-select if state exists
        if (location.state && data?.availability) {
          const { preSelectedDate, preSelectedTime } = location.state;
          if (preSelectedDate) {
            const dateIdx = data.availability.findIndex((a: any) => a.date === preSelectedDate);
            if (dateIdx !== -1) {
              setSelectedDateIndex(dateIdx);
              if (preSelectedTime) {
                setSelectedTime(preSelectedTime);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingDoctor(false);
      }
    };
    fetchDoc();
  }, [id, location.state]);

  const availabilities = doctor?.availability || [];

  const currentAvailableTimes = availabilities[selectedDateIndex]?.times || [];

  useEffect(() => {
    // Only auto-select first time if none is selected
    if (currentAvailableTimes.length > 0 && !selectedTime) {
      setSelectedTime(currentAvailableTimes[0]);
    } else if (currentAvailableTimes.length === 0) {
      setSelectedTime('');
    }
  }, [selectedDateIndex, currentAvailableTimes, selectedTime]);

  const handleBook = async () => {
    if (!selectedTime || !doctor) return;
    
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('medlink_user');
      const user = userStr ? JSON.parse(userStr) : null;

      await db.createAppointment({
        doctorId: doctor.id,
        patientId: user?.id || 'anonymous',
        patientName: user?.name || 'Patient Name',
        patientPhotoUrl: user?.photoUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200',
        date: availabilities[selectedDateIndex].date,
        time: selectedTime,
        type: 'Consultation'
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 10));

      setStep(2);
      setTimeout(() => {
        navigate(ROUTES.PATIENT_HOME);
      }, 300);
    } catch (error) {
      alert('Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-blue-900">Doctor not found</h2>
        <button onClick={() => navigate(ROUTES.PATIENT_HOME)} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-50 pb-28">
      <header className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white bg-slate-50 sticky top-0 z-10 flex items-center gap-3 sm:gap-4">
        <button onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else if (id) {
            navigate(ROUTES.PATIENT_DOCTOR_DETAILS.replace(':id', id));
          } else {
            navigate(ROUTES.PATIENT_HOME);
          }
        }} className="p-2 -ml-2 text-slate-600 active:scale-95 transition-all">
          <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-black text-blue-900 uppercase tracking-tight">Book Slot</h1>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 p-4 sm:p-6 pb-24 sm:pb-28">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 sm:gap-6"
            >
              <div className="bg-white rounded-xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-slate-100 flex flex-col gap-4 sm:gap-8">
                <div className="flex items-center gap-3 sm:gap-6 pb-4 sm:pb-6 border-b border-slate-50">
                   <div className="relative">
                     <img src={doctor.photoUrl} className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl sm:rounded-3xl object-cover flex-shrink-0" />
                     <div className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 bg-emerald-500 text-white p-0.5 sm:p-1 rounded-full border-3 sm:border-4 border-white">
                       <ShieldCheck className="w-3 sm:w-4 h-3 sm:h-4" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-black text-blue-950 text-base sm:text-lg leading-tight truncate">{doctor.name}</h3>
                     <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{doctor.specialty}</p>
                   </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                   <div className="flex items-center justify-between px-1 gap-2">
                     <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Date</label>
                     <span className="text-[9px] sm:text-[10px] font-bold text-blue-500 bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest flex-shrink-0">Oct 2023</span>
                   </div>
                   <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide -mx-1 px-1 sm:-mx-2 sm:px-2">
                      {availabilities.map((avail, i) => {
                        const info = formatDate(avail.date);
                        return (
                          <button 
                            key={avail.date}
                            onClick={() => setSelectedDateIndex(i)}
                            className={cn(
                              "flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px] py-4 sm:py-6 rounded-xl sm:rounded-3xl border-2 transition-all",
                              selectedDateIndex === i 
                                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105" 
                                : "bg-white border-slate-100 text-slate-400"
                            )}
                          >
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-1">{info.weekday}</span>
                            <span className="text-lg sm:text-xl font-black">{info.day}</span>
                          </button>
                        );
                      })}
                   </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                   <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Available Times</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {currentAvailableTimes.map(time => (
                        <button 
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-2.5 sm:py-4 rounded-lg sm:rounded-2xl border-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2",
                            selectedTime === time 
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" 
                              : "bg-slate-50 border-slate-100 text-slate-600"
                          )}
                        >
                          <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                          {time}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="bg-blue-900 rounded-xl sm:rounded-[2.5rem] p-4 sm:p-8 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:scale-110 transition-transform">
                   <CalendarIcon className="w-16 sm:w-24 h-16 sm:h-24" />
                 </div>
                 <h4 className="font-black text-base sm:text-lg mb-1 sm:mb-2 relative z-10">Instant Confirmation</h4>
                 <p className="text-blue-100 text-[9px] sm:text-[10px] font-medium leading-relaxed max-w-[200px] relative z-10">
                   Booking this slot will instantly generate your consultation token and update the doctor's queue.
                 </p>
              </div>

              <button 
                onClick={handleBook}
                disabled={!selectedTime || isLoading}
                className="w-full py-3 sm:py-5 bg-blue-600 text-white font-black text-xs sm:text-sm uppercase tracking-[0.25em] rounded-lg sm:rounded-[2rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3"
              >
                {isLoading && <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isLoading ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center pt-12 sm:pt-20 text-center"
            >
              <div className="w-20 sm:w-24 h-20 sm:h-24 bg-emerald-50 text-emerald-500 rounded-xl sm:rounded-[2.5rem] flex items-center justify-center mb-6 sm:mb-10 shadow-xl shadow-emerald-500/20">
                 <CheckCircle2 className="w-10 sm:w-12 h-10 sm:h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight leading-tight px-4">Booking Successful!</h2>
              <p className="mt-3 sm:mt-4 text-slate-500 font-medium px-6 sm:px-8 leading-relaxed text-xs sm:text-sm">
                Your appointment with <span className="text-blue-600 font-bold">{doctor.name}</span> is confirmed.
              </p>
              
              <div className="mt-8 sm:mt-12 bg-white p-4 sm:p-8 rounded-xl sm:rounded-[3rem] border border-slate-100 shadow-sm w-full">
                 <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                    <div className="text-left flex-1">
                       <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                       <p className="text-xs sm:text-sm font-bold text-blue-950 mt-1">{selectedTime}</p>
                    </div>
                    <div className="text-right flex-1">
                       <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                       <p className="text-xs sm:text-sm font-bold text-blue-950 mt-1">{availabilities[selectedDateIndex].date}</p>
                    </div>
                 </div>
                 <div className="pt-4 sm:pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified Token</p>
                      <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">#12</p>
                    </div>
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-slate-50 rounded-lg sm:rounded-2xl flex items-center justify-center text-slate-300 flex-shrink-0">
                       <Info className="w-6 sm:w-8 h-6 sm:h-8" />
                    </div>
                 </div>
              </div>

              <p className="mt-8 sm:mt-12 text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Returning Home...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

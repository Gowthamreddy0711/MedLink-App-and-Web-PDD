import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight,
  Activity
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { db } from '../../services/db';

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const data = await db.getDoctorById(id);
        if (!data) throw new Error('Doctor not found');
        setDoctor(data);

        const rData = await db.getDoctorReviews(id);
        setReviews(rData);
      } catch (error) {
        console.error('Error fetching doctor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) {
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
        <button onClick={() => navigate(ROUTES.PATIENT_SEARCH)} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-50 pb-24 sm:pb-28">
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        <img 
          src={doctor.photoUrl} 
          alt={doctor.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <button 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate(ROUTES.PATIENT_SEARCH);
            }
          }}
          className="absolute top-3 sm:top-4 left-4 sm:left-6 p-2 bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl text-white z-30 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-900">{doctor.name}</h1>
              <p className="text-blue-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider mt-1">{doctor.specialty}</p>
            </div>
            {doctor.isVerified && (
              <div className="bg-blue-50 text-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-6 flex items-center justify-between border-t border-b border-slate-50 py-3 sm:py-4 gap-2">
             <Stat icon={Star} label="Rating" value={doctor.rating} color="text-amber-400" />
             <Stat 
               icon={MessageSquare} 
               label="Reviews" 
               value={doctor.reviewCount} 
               color="text-blue-400" 
               onClick={() => navigate(ROUTES.VIEW_REVIEWS.replace(':id', doctor.id))}
             />
             <Stat icon={Activity} label="Exp." value="8 yrs" color="text-emerald-400" />
          </div>

          <div className="mt-4 sm:mt-6">
            <h3 className="font-bold text-blue-900 text-sm sm:text-base">About Doctor</h3>
            <p className="mt-2 text-slate-500 text-xs sm:text-sm leading-relaxed">
              Dr. {doctor.name ? (doctor.name.includes('. ') ? doctor.name.split('. ')[1] : doctor.name) : 'Specialist'} is a renowned {(doctor.specialty || 'specialist').toLowerCase()} with over 8 years of experience. She specializes in advanced healthcare services and empathetic support.
            </p>
          </div>
        </motion.div>

        {/* Clinic Location */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4 animate-scaleUp">
           <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl flex-shrink-0">
             <MapPin className="w-5 sm:w-6 h-5 sm:h-6 animate-pulse" />
           </div>
           <div className="flex-1 min-w-0">
             <h4 className="font-bold text-blue-900 text-sm sm:text-base truncate">{doctor.clinicName}</h4>
             <p className="text-slate-500 text-[10px] sm:text-xs truncate">{doctor.clinicLocation || "123 Health Ave, Medical District, NY"}</p>
           </div>
           <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-slate-300 flex-shrink-0" />
        </div>

        {/* Availability Section */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between px-1 mb-3 sm:mb-4 gap-2">
            <h3 className="font-black text-blue-900 uppercase tracking-tight text-xs sm:text-sm">Availability</h3>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Online Now</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-sm border border-slate-100">
            {doctor.availability && doctor.availability.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Date Selector */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {doctor.availability.map((avail: any, idx: number) => {
                    const date = new Date(avail.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const isSelected = selectedDateIdx === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDateIdx(idx)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] h-16 sm:h-[72px] rounded-xl sm:rounded-2xl transition-all border text-center",
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200"
                        )}
                      >
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-1">{dayName}</span>
                        <span className="text-base sm:text-lg font-black">{dayNum}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Slots</h4>
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-600">{doctor.availability[selectedDateIdx].times.length} sessions</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {doctor.availability[selectedDateIdx].times.map((time: string, tidx: number) => (
                      <button
                        key={tidx}
                        onClick={() => navigate(ROUTES.PATIENT_BOOK_APPOINTMENT.replace(':id', doctor.id), { 
                          state: { preSelectedDate: doctor.availability[selectedDateIdx].date, preSelectedTime: time }
                        })}
                        className="py-2 sm:py-3 bg-white border border-slate-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black text-blue-900 shadow-sm active:scale-95 transition-all hover:border-blue-500 hover:text-blue-600"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center opacity-40">
                <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300 mb-2" />
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">No slots available soon</p>
              </div>
            )}

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-50 flex items-start gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg flex-shrink-0">
                 <ShieldCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-600" />
               </div>
               <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-relaxed">
                 Schedule is updated in real-time. Direct booking available for verified slots.
               </p>
            </div>
          </div>
        </div>

          <div className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between px-1 mb-3 sm:mb-4 gap-2 flex-wrap">
              <h3 className="font-black text-blue-900 uppercase tracking-tight text-xs sm:text-sm">Recent Reviews</h3>
              <button 
                onClick={() => navigate(ROUTES.VIEW_REVIEWS.replace(':id', doctor.id))}
                className="text-[9px] sm:text-[10px] font-black text-blue-600 bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest"
              >
                View {doctor.reviewCount || reviews.length} Reviews
              </button>
            </div>
            
            <div className="flex flex-col gap-2 sm:gap-3">
              {reviews.length === 0 ? (
                <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-50 text-slate-400 font-bold text-center text-xs">
                  No verified reviews yet. Complete a consultation to leave a review.
                </div>
              ) : (
                reviews.slice(0, 3).map((review, i) => (
                  <div key={review.id || i} className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-50 shadow-sm">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 sm:w-6 h-5 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-blue-600 flex-shrink-0">
                          {review.name ? review.name[0].toUpperCase() : 'P'}
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-blue-900 truncate">{review.name || 'Anonymous Patient'}</span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] sm:text-xs font-bold text-blue-900">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed italic">"{review.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="font-black text-blue-900 px-1 uppercase tracking-tight text-xs sm:text-sm">Specialization</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4 pb-12">
             {['Cardiology', 'Surgery', 'Patient Care'].map(tag => (
               <span key={tag} className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-white border border-slate-100 text-blue-600 rounded-lg sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm">
                 {tag}
               </span>
             ))}
          </div>
        </div>
      </div>

      {/* Book Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-slate-100">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(ROUTES.PATIENT_BOOK_APPOINTMENT.replace(':id', doctor.id))}
          className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-2xl shadow-lg shadow-blue-200 text-sm sm:text-base"
        >
          Book Appointment
        </motion.button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, onClick }: any) {
  return (
    <div 
      className={cn("flex flex-col items-center gap-0.5 sm:gap-1", onClick && "cursor-pointer active:scale-95 transition-all")}
      onClick={onClick}
    >
      <div className={cn("p-0.5 sm:p-1", color)}>
        <Icon className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
      </div>
      <span className="text-base sm:text-lg font-bold text-blue-900">{value}</span>
      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

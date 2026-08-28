import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, MessageSquare, ShieldCheck, Send, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../services/db';

export default function SubmitReview() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [user, setUser] = useState<any>(null);
  const [hasConsultated, setHasConsultated] = useState<boolean | null>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkConsultationAndLoadDoctor = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('medlink_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(currentUser);

        if (!id) return;
        const currentDoctor = await db.getDoctorById(id);
        setDoctor(currentDoctor);

        if (!currentUser) {
          setHasConsultated(false);
          return;
        }

        // Check if there is a prescription (consultation) record with this doctor
        const prescriptions = await db.getPrescriptions(currentUser.id);
        const didConsultDoctor = prescriptions.some((p: any) => p.doctorId === id);
        
        // Also check general appointments to check if there is a completed appointment status
        const appts = await db.getAppointmentsByUserId(currentUser.id, false);
        const completedAppt = appts.some((a: any) => a.doctorId === id && (a.status === 'Completed' || a.status === 'Scheduled'));

        setHasConsultated(didConsultDoctor || completedAppt);
      } catch (err) {
        console.error('Error verifying consultant eligibility:', err);
        setHasConsultated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkConsultationAndLoadDoctor();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !id || !hasConsultated) return;

    setIsSubmitting(true);
    try {
      await db.submitReview({
        doctorId: id,
        rating: rating,
        comment: comment.trim(),
        name: user?.name || 'Anonymous Patient',
        patientId: user?.id || 'anonymous',
        date: 'Just now'
      });

      setIsSubmitting(false);
      navigate(`/patient/doctor/${id}`);
    } catch (err) {
      console.error('Review submit failed:', err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <h2 className="text-xl font-bold text-blue-900">Doctor Profile Not Found</h2>
        <button onClick={() => navigate('/patient/home')} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-6 bg-white border-b border-slate-50 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate(`/patient/doctor/${id}`);
          }
        }} className="p-2 -ml-2 text-slate-600 active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black text-blue-900 uppercase tracking-tight">Write a Review</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{doctor.name}</p>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center max-w-xl mx-auto w-full">
        {!hasConsultated ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white rounded-[2.5rem] border border-slate-100 p-8 text-center shadow-lg mt-8 flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-950 tracking-tight mb-2">Review Restricted</h2>
              <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-sm">
                To eliminate spam and fake reviews on <span className="text-blue-600 font-bold">MedLink</span>, you are only permitted to leave a rating and review for a medical professional after completing an appointment or prescription session with them.
              </p>
            </div>

            <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left flex gap-4">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-950">Need assistance?</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                  Confirm your consultation has been logged by the clinic, or try booking a new reservation slot.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/patient/doctor/${id}`)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-colors"
            >
              Consult This Doctor
            </button>
            <button
              onClick={() => navigate('/patient/history')}
              className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              View My History Records
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-6 mt-4">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col items-center w-full">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-600 shadow-sm">
                <Star className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-black text-blue-900 text-center mb-2">How was your experience?</h2>
              <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed max-w-xs">Your verified review will be posted with absolute transparency to help other community members choose better care.</p>

              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((index) => (
                  <motion.button
                    key={index}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(index)}
                    onMouseEnter={() => setHover(index)}
                    onMouseLeave={() => setHover(0)}
                    className={cn(
                      "p-1.5 rounded-xl transition-all",
                      (hover || rating) >= index ? "text-amber-400" : "text-slate-200 hover:text-amber-300"
                    )}
                  >
                    <Star className={cn("w-10 h-10 transition-all", (hover || rating) >= index ? "fill-amber-400" : "fill-none")} />
                  </motion.button>
                ))}
              </div>
              
              {rating > 0 && (
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  {rating || hover} Stars Rated
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Share your verified thoughts</label>
              <textarea
                value={comment}
                required
                onChange={(e) => setComment(e.target.value)}
                placeholder="Give details about your prescription, clinic experience, bedside manner, and advice..."
                className="w-full p-6 bg-white border border-slate-100 rounded-[2.5rem] font-medium text-slate-700 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm shadow-sm"
              />
            </div>

            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-700 font-bold leading-relaxed tracking-tight">
                Authenticity Safeguard: Your verified tag will be affixed to this opinion. Post feedback with honesty.
              </p>
            </div>

            <button
              type="submit"
              disabled={rating === 0 || isSubmitting || !comment.trim()}
              className="w-full h-16 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Verified Review
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

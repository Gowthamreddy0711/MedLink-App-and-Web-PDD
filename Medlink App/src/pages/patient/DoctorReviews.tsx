import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { db } from '../../services/db';
import { useState, useEffect } from 'react';
import { ROUTES } from '../../constants';

export default function DoctorReviews() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [doctor, setDoctor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        try {
          const docData = await db.getDoctorById(id);
          setDoctor(docData);

          const rData = await db.getDoctorReviews(id);
          setReviews(rData);
        } catch (err) {
          console.error('Error fetching reviews details:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else if (id) {
              navigate(`/patient/doctor/${id}`);
            } else {
              navigate(ROUTES.PATIENT_HOME);
            }
          }} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-xl active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">Patient Reviews</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doctor.name}</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Rating Summary */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-8 flex flex-col items-center">
          <div className="text-5xl font-black text-blue-900 mb-2">{doctor.rating || '5.0'}</div>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-5 h-5 ${i <= Math.round(doctor.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Based on {reviews.length} reviews</p>
        </div>

        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] text-center text-slate-400 font-bold text-xs shadow-sm">
              No reviews posted yet for this doctor. Leaving real feedback is restricted to validated completed appointments.
            </div>
          ) : (
            reviews.map((review, i) => (
              <motion.div
                key={review.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-105 bg-blue-50 rounded-2xl flex items-center justify-center text-sm font-black text-blue-600 border border-blue-105">
                      {review.name ? review.name[0].toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm">{review.name || 'Anonymous Patient'}</h3>
                      <p className="text-[10px] font-bold text-slate-400">Verified Patient consultation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-black text-amber-600">{review.rating}</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">"{review.comment}"</p>
                
                <div className="flex items-center gap-4">
                  <span className="text-[8px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    ✓ Verified Consultation Feedback
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

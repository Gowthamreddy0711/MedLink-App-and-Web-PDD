import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function VerificationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-50"
      >
        <CheckCircle2 className="w-16 h-16" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-black text-blue-900 leading-tight">Documents Submitted!</h1>
        <p className="mt-4 text-slate-500 font-medium max-w-[280px] mx-auto">
          Our team is now auditing your credentials. You will be notified via email once approved.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 w-full"
      >
        <button 
          onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)}
          className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-100"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Limited access available until fully verified
        </p>
      </motion.div>
    </div>
  );
}

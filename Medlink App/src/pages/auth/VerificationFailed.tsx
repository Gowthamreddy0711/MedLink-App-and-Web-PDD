import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function VerificationFailed() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-32 h-32 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-rose-50"
      >
        <AlertCircle className="w-16 h-16" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-black text-rose-900 leading-tight">Verification Failed</h1>
        <p className="mt-4 text-slate-500 font-medium max-w-[280px] mx-auto">
          We couldn't verify your medical registration ID. Please ensure the document is clear and matches your details.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 w-full flex flex-col gap-4"
      >
        <button 
          onClick={() => navigate(ROUTES.VERIFY_ID)}
          className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-100"
        >
          <RefreshCcw className="w-5 h-5" />
          Try Uploading Again
        </button>
        
        <button 
          onClick={() => navigate(ROUTES.GET_STARTED)}
          className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-sm"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

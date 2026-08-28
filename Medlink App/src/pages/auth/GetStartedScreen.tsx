import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants';
import Logo from '../../components/Logo';

export default function GetStartedScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Logo size="lg" className="mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center sm:mt-10 lg:mt-12"
        >
          <h2 className="text-balance text-[clamp(1.8rem,4vw,3rem)] font-bold leading-tight text-blue-900">
            Healthcare connections made simple.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:mt-4 sm:text-base">
            Connect with top doctors, manage your prescriptions, and never miss a dose with our smart reminder system.
          </p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(ROUTES.ROLE_SELECTION)}
          className="mt-8 flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-10 sm:py-4"
        >
          Get Started
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}

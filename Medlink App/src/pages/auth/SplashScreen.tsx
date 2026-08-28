import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { ROUTES } from '../../constants';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(ROUTES.GET_STARTED);
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Logo size="xl" />
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-blue-500 font-medium"
      >
        Smart Doctor Network
      </motion.div>
    </div>
  );
}

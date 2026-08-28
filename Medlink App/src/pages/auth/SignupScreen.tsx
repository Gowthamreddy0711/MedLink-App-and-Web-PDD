import { useState, FormEvent, KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Loader2, Hospital, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';
import { db } from '../../services/db';

interface SignupScreenProps {
  setUser: (user: any) => void;
}

export default function SignupScreen({ setUser }: SignupScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state?.role as UserRole) || UserRole.PATIENT;
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');
    
    try {
      const newUser = {
        name,
        email,
        phone,
        password,
        role,
        clinicName: role === UserRole.DOCTOR ? clinicName : undefined,
        clinicLocation: role === UserRole.DOCTOR ? clinicLocation : undefined,
        photoUrl: role === UserRole.DOCTOR 
          ? 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200'
          : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200',
      };

      const savedUser = await db.signup(newUser);
      setUser(savedUser);
      localStorage.setItem('medlink_user', JSON.stringify(savedUser));
      
      // Navigate based on role
      if (role === UserRole.DOCTOR) {
        navigate(ROUTES.VERIFY_ID);
      } else {
        navigate(ROUTES.PATIENT_HOME);
      }
    } catch (err: any) {
      setIsLoading(false);
      setFormError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-50 pb-24">
      <div className="px-4 sm:px-6 py-4 sm:py-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => {
          navigate(ROUTES.LOGIN, { state: { role } });
        }} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl transition-all">
          <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
        </button>
        <span className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-widest">
          Create Account
        </span>
      </div>

      <div className="mx-auto w-full max-w-md px-4 sm:px-6 mt-6 sm:mt-8 pb-12 flex-1">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">Create Account</h2>
          <p className="mt-1 sm:mt-2 text-slate-500 font-medium text-sm sm:text-base">
            Join as a <span className="text-blue-600 font-bold capitalize">{role}</span>
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-3 sm:gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <User className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text"
                placeholder="John Doe"
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium text-sm sm:text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="email"
                placeholder="example@medlink.com"
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium text-sm sm:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Phone className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium text-sm sm:text-base"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {role === UserRole.DOCTOR && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Clinic Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Hospital className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    placeholder="City General Hospital"
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium text-sm sm:text-base"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Clinic Location</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    placeholder="123 Medical Drive, New York"
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium text-sm sm:text-base"
                    value={clinicLocation}
                    onChange={(e) => setClinicLocation(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-blue-50/50 rounded-lg sm:rounded-2xl border border-blue-100 flex items-start gap-2 sm:gap-4">
            <div className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
              <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <p className="text-[10px] sm:text-xs text-blue-700 leading-relaxed font-semibold">
              By continuing, you agree to our <button type="button" className="underline hover:text-blue-900">Healthcare Privacy Standards</button>.
            </p>
          </div>
          
          {formError && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg sm:rounded-2xl flex items-center gap-2 sm:gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-red-600">{formError}</p>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 sm:py-5 rounded-lg sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-blue-200 mt-3 sm:mt-4 disabled:opacity-70 text-sm sm:text-base uppercase tracking-widest transition-all"
          >
            {isLoading ? <Loader2 className="w-4 sm:w-6 h-4 sm:h-6 animate-spin" /> : 'Create Account'}
          </motion.button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-slate-500 font-medium text-sm sm:text-base">
            Already a member?{' '}
            <button 
              onClick={() => navigate(ROUTES.LOGIN, { state: { role } })}
              className="text-blue-600 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


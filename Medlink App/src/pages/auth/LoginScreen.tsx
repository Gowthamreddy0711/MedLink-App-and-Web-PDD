import { useState, FormEvent, KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';
import { db } from '../../services/db';

interface LoginScreenProps {
  setUser: (user: any) => void;
}

export default function LoginScreen({ setUser }: LoginScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Business logic state (unchanged) ─────────────────────────────────────
  const role = (location.state?.role as UserRole) || UserRole.PATIENT;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'creds' | 'otp'>('creds');
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [debugOtp, setDebugOtp] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const user = await db.login(email, password, role);
      if (user.role !== role) {
        throw new Error(`This account is registered as a ${user.role}. Please log in via the ${user.role} portal.`);
      }
      setIsLoading(false);
      setUser(user);
      localStorage.setItem('medlink_user', JSON.stringify(user));
      if (user.role === UserRole.DOCTOR) {
        navigate(ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(ROUTES.PATIENT_HOME);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOtp = otpValue.join('');
    if (enteredOtp.length < 6) return;
    setIsLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      db.verifyOtp(loginPhone, enteredOtp);
      setIsLoading(false);
      setUser(tempUser);
      localStorage.setItem('medlink_user', JSON.stringify(tempUser));
      if (tempUser.role === UserRole.DOCTOR) {
        navigate(ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(ROUTES.PATIENT_HOME);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValue];
    newOtp[index] = value;
    setOtpValue(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── OTP step ──────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="auth-page-bg">
        <div className="auth-page-shell">
          {/* Back */}
          <div className="auth-topbar">
            <button onClick={() => setStep('creds')} className="auth-back-btn" aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="auth-topbar-label">Verification</span>
          </div>

          <div className="auth-card">
            {/* Icon */}
            <div className="auth-icon-wrap auth-icon-blue">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>

            <div className="auth-card-header">
              <h1 className="auth-title">Verify Login</h1>
              <p className="auth-subtitle">
                Code sent to{' '}
                <span className="text-blue-600 font-semibold">
                  ···{loginPhone.slice(-4)}
                </span>
              </p>
            </div>

            {/* OTP inputs */}
            <div className="otp-grid">
              {otpValue.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  maxLength={1}
                />
              ))}
            </div>

            {error && <div className="auth-error">{error}</div>}

            {debugOtp && (
              <div className="auth-debug-box">
                <p className="auth-debug-label">Dev Mode OTP</p>
                <p className="auth-debug-value">{debugOtp}</p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleVerifyOTP}
              disabled={otpValue.some(v => !v) || isLoading}
              className="auth-btn-primary"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Login'}
            </motion.button>

            <button className="auth-link-btn mt-4">Resend Code</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Credentials step ──────────────────────────────────────────────────────
  return (
    <div className="auth-page-bg">
      <div className="auth-page-shell">

        {/* Back / portal label */}
        <div className="auth-topbar">
          <button
            onClick={() => navigate(ROUTES.ROLE_SELECTION)}
            className="auth-back-btn"
            aria-label="Back to role selection"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="auth-topbar-label capitalize">{role} Portal</span>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">
              Sign in to your{' '}
              <span className="text-blue-600 font-semibold capitalize">{role}</span>{' '}
              account
            </p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button type="button" className="auth-forgot-btn">
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="auth-btn-primary"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </motion.button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-text">Don&apos;t have an account?</span>
            <button
              onClick={() => navigate(ROUTES.SIGNUP, { state: { role } })}
              className="auth-switch-btn"
            >
              Create account
            </button>
          </div>
        </div>

        {/* Security note */}
        <div className="auth-secure-note">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Secure medical-grade encryption</span>
        </div>
      </div>
    </div>
  );
}

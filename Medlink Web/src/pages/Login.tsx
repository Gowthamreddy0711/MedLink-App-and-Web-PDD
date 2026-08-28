import React, { useState } from "react";
import { Stethoscope, ShieldCheck, Mail, Lock, ArrowRight, UserCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login, loginAsDemoUser } = useAuth();
  const [accountType, setAccountType] = useState<"DOCTOR" | "ADMIN">("DOCTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");
    try {
      await login(email, password, accountType);
    } catch (err: any) {
      setError(err.message || "Login failed. Check credentials or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Branding Panel */}
        <div className="bg-gradient-to-br from-sky-700 via-sky-800 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />

          <div>
            <div className="flex items-center gap-3">
              <img
                src="/medlink-logo.png"
                alt="MedLink Logo"
                className="w-12 h-12 rounded-2xl border border-white/30 shadow-md object-cover bg-white"
              />
              <span className="text-2xl font-black tracking-tight">MedLink</span>
            </div>

            <div className="mt-12 space-y-4">
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                Healthcare Clinical Coverage Platform
              </h1>
              <p className="text-sm text-sky-100 leading-relaxed">
                Seamless shift collaboration, leave requests, peer coverage assignment, and AI-assisted clinical decision support.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-xs text-sky-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Board License Verified Practitioner Access Only</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {accountType === "DOCTOR" ? "Doctor Login" : "Admin Login"}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accountType === "DOCTOR" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}>
                {accountType === "DOCTOR" ? "Practitioner Portal" : "Compliance Console"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {accountType === "DOCTOR" ? "Enter your clinical account credentials" : "Enter your administrator credentials"}
            </p>

            {/* Account Type Selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl mt-6">
              <button
                type="button"
                onClick={() => setAccountType("DOCTOR")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  accountType === "DOCTOR" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setAccountType("ADMIN")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  accountType === "ADMIN" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.name@hospital.org"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  accountType === "DOCTOR" 
                    ? "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20" 
                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                }`}
              >
                <span>{isLoading ? "Authenticating..." : "Sign In to MedLink"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>


            </form>
          </div>

          {accountType === "DOCTOR" && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New practitioner?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-bold text-sky-600 hover:underline cursor-pointer"
                >
                  Register Doctor Account
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

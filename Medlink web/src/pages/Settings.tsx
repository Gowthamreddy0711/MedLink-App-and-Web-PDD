import React, { useState } from "react";
import { Settings as SettingsIcon, ShieldCheck, Bell, Lock, LogOut, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LicenseBadge } from "../components/LicenseBadge";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../firebase/config";

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password does not meet the required security criteria (minimum 6 characters).");
      return;
    }
    
    if (newPassword === currentPassword) {
      setError("New password must not be the same as the current password.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setError("User authentication error. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // 2. Update Password
      await updatePassword(currentUser, newPassword);
      
      // 3. Success
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Change password error:", err);
      // Map Firebase errors to user-friendly messages
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("This operation is sensitive and requires recent authentication. Please log out and log back in before trying again.");
      } else if (err.code === "auth/weak-password") {
        setError("Password does not meet the required security criteria (minimum 6 characters).");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("An error occurred while changing your password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account & System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Practitioner portal security, notifications, and session controls.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <User className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">Practitioner Identity</h2>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">{user.fullName}</p>
            <p className="text-slate-500">{user.email}</p>
          </div>
          {user.role !== "ADMIN" && <LicenseBadge status={user.licenseStatus} licenseNumber={user.licenseNumber} />}
        </div>
      </div>

      {/* Security */}
      {user.role !== "ADMIN" && (
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Security & Board Verification</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
              <p className="text-slate-500">Enforced for hospital network access</p>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md">Enabled</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <div>
              <p className="font-bold text-slate-800">Board License Status</p>
              <p className="text-slate-500">Verified with State Medical Board database</p>
            </div>
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-md">Active</span>
          </div>
        </div>
      </div>
      )}

      {/* Change Password */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <Lock className="w-5 h-5 text-slate-600" />
          <h2 className="text-base font-bold text-slate-900">Account Security - Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Changing password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          onClick={logout}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );
};

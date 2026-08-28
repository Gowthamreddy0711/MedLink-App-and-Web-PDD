import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ROUTES } from '../../constants';

interface AdminSettingsProps {
  user: any;
  setUser: (user: any) => void;
}

export default function AdminSettings({ user, setUser }: AdminSettingsProps) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Not authenticated');

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      
      setMessage({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to update password. Please try again.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect current password.';
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('medlink_user');
      setUser(null);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your administrative account</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-500" /> Account Information
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
            <p className="text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
              {user?.name || 'Admin User'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
            <p className="text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
              {user?.email || auth.currentUser?.email || 'admin@gmail.com'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Role</label>
            <p className="text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 capitalize">
              {user?.role || 'Admin'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-500" /> Change Password
          </h3>
        </div>
        
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-rose-50 rounded-xl border border-rose-100 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-rose-900">Logout</h3>
          <p className="text-rose-700 text-sm mt-1">Securely end your administrative session</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium rounded-lg shadow-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

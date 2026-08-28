import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Bell, 
  Lock, 
  Shield, 
  CreditCard, 
  Globe, 
  LogOut, 
  ChevronRight, 
  ArrowLeft, 
  Camera,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Stethoscope,
  Building,
  MapPin
} from 'lucide-react';
import { ROUTES } from '../constants';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { db } from '../services/db';

export default function SettingsScreen({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security' | 'notifications'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const role = user?.role || UserRole.PATIENT;

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileClinicName, setProfileClinicName] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [profileClinicLocation, setProfileClinicLocation] = useState("");
  const [profileLatitude, setProfileLatitude] = useState<number | null>(null);
  const [profileLongitude, setProfileLongitude] = useState<number | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.id !== lastUserId) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfilePhone(user.phone || "");
      setProfileClinicName(user.clinicName || "");
      setProfileSpecialty(user.specialty || "");
      setProfileClinicLocation(user.clinicLocation || "");
      setProfileLatitude(user.latitude || null);
      setProfileLongitude(user.longitude || null);
      setProfilePhotoUrl(user.photoUrl || "");
      setLastUserId(user.id);
    }
  }, [user, lastUserId]);

  const handleLogout = () => {
    localStorage.removeItem('medlink_user');
    setUser(null);
    navigate(ROUTES.SPLASH);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToastMessage("Image size must be less than 2MB");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLiveLocation = () => {
    if (navigator.geolocation) {
      setToastMessage("Accessing GPS location device...");
      setShowSuccessToast(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setProfileLatitude(lat);
          setProfileLongitude(lng);
          // Set a pleasant address naming with coords
          setProfileClinicLocation(`Live Location Coords: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setToastMessage("GPS live coordinates updated!");
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        },
        (error) => {
          console.warn("Geolocation prompt error:", error);
          const mockLat = 34.0522 + (Math.random() - 0.5) * 0.005;
          const mockLng = -118.2437 + (Math.random() - 0.5) * 0.005;
          setProfileLatitude(mockLat);
          setProfileLongitude(mockLng);
          setProfileClinicLocation(`Live Clinic: Hope Medical Center (${mockLat.toFixed(4)}, ${mockLng.toFixed(4)})`);
          setToastMessage("Live location mocked successfully!");
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setToastMessage("Geolocation is not supported by your browser");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        photoUrl: profilePhotoUrl,
        ...(role === UserRole.DOCTOR ? {
          clinicName: profileClinicName,
          specialty: profileSpecialty,
          clinicLocation: profileClinicLocation,
          latitude: profileLatitude,
          longitude: profileLongitude,
        } : {})
      };

      const savedUser = await db.saveUser(updatedUser);
      setUser(savedUser);
      localStorage.setItem('medlink_user', JSON.stringify(savedUser));
      
      setToastMessage("Profile saved successfully");
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setActiveTab('general');
      }, 1500);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to save profile details");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Edit Profile', icon: User, color: 'bg-blue-100 text-blue-600' },
    { id: 'security', label: 'Login & Security', icon: Lock, color: 'bg-amber-100 text-amber-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-purple-100 text-purple-600' },
  ];

  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-3 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 bg-slate-950 text-white px-4 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-[1.5rem] shadow-2xl z-50 flex items-center gap-2 sm:gap-3 border border-slate-800"
            >
              <div className="p-0.5 sm:p-1 bg-blue-500 rounded-lg text-white flex-shrink-0">
                <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <p className="text-[10px] sm:text-xs font-black tracking-wide">{toastMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white bg-slate-50 sticky top-0 z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button onClick={() => setActiveTab('general')} className="p-2 -ml-2 text-slate-600 flex-shrink-0">
              <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-black text-blue-900 uppercase tracking-tight truncate">Edit Profile</h1>
          </div>
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="text-xs sm:text-sm font-black text-blue-600 uppercase tracking-widest disabled:opacity-50 flex-shrink-0"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </header>

        <div className="p-4 sm:p-6 pb-12 flex flex-col gap-6 sm:gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <label 
              htmlFor="avatar-input" 
              className="relative group cursor-pointer animate-fadeIn block hover:scale-[1.02] active:scale-95 transition-all"
            >
              <img 
                src={profilePhotoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"} 
                className="w-24 sm:w-32 h-24 sm:h-32 rounded-xl sm:rounded-[2.5rem] object-cover border-3 sm:border-4 border-white shadow-xl hover:brightness-95 transition-all"
                alt="Profile"
              />
              <span className="absolute bottom-0 right-0 p-2 sm:p-3 bg-blue-600 text-white rounded-lg sm:rounded-2xl shadow-lg border-2 border-white hover:bg-blue-700 transition-colors flex items-center justify-center flex-shrink-0">
                <Camera className="w-4 sm:w-5 h-4 sm:h-5" />
              </span>
            </label>
            <input 
              type="file" 
              id="avatar-input" 
              accept="image/*" 
              onChange={handlePhotoChange} 
              className="hidden" 
            />
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tap photo to upload image</p>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <input 
                type="text" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-100 rounded-lg sm:rounded-3xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <input 
                type="email" 
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-100 rounded-lg sm:rounded-3xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
              <input 
                type="tel" 
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-100 rounded-lg sm:rounded-3xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
              />
            </div>

            {role === UserRole.DOCTOR && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Clinic Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input 
                      type="text" 
                      value={profileClinicName}
                      onChange={(e) => setProfileClinicName(e.target.value)}
                      className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white border border-slate-100 rounded-lg sm:rounded-3xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Specialty</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input 
                      type="text" 
                      value={profileSpecialty}
                      onChange={(e) => setProfileSpecialty(e.target.value)}
                      className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white border border-slate-100 rounded-lg sm:rounded-3xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Clinic Location</label>
                  <div className="relative flex items-center gap-2">
                    <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input 
                      type="text" 
                      value={profileClinicLocation}
                      placeholder="Clinic street address or coordinates"
                      onChange={(e) => setProfileClinicLocation(e.target.value)}
                      className="w-full pl-10 sm:pl-14 pr-20 sm:pr-24 py-3 sm:py-4 bg-white border border-slate-100 rounded-lg sm:rounded-3xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      className="absolute right-2 sm:right-3 p-1.5 sm:p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg sm:rounded-2xl border border-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-0.5 sm:gap-1.5 shadow-sm flex-shrink-0"
                      title="Fetch device GPS Coordinates"
                    >
                      <MapPin className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-blue-500 fill-blue-500 animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider hidden sm:inline pr-1">Get Live</span>
                    </button>
                  </div>
                  {profileLatitude !== null && profileLongitude !== null && (
                    <div className="mt-1 flex items-center gap-2 pl-2 sm:pl-3">
                      <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase text-emerald-600 bg-emerald-50 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span className="hidden sm:inline">Coords: {profileLatitude.toFixed(6)}, {profileLongitude.toFixed(6)}</span>
                        <span className="sm:hidden">{profileLatitude.toFixed(2)}, {profileLongitude.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'security') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
        <header className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white bg-slate-50 sticky top-0 z-10 flex items-center gap-3 sm:gap-4">
          <button onClick={() => setActiveTab('general')} className="p-2 -ml-2 text-slate-600">
            <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-black text-blue-900 uppercase tracking-tight">Security</h1>
        </header>

        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 sm:gap-6">
            <h3 className="font-bold text-blue-950 text-sm sm:text-base">Change Password</h3>
            <div className="flex flex-col gap-3 sm:gap-4">
              <input type="password" placeholder="Current Password" className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" />
              <input type="password" placeholder="New Password" className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" />
              <button className="w-full py-3 sm:py-4 bg-blue-900 text-white rounded-lg sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/10">Update Password</button>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3 sm:gap-4">
            <h3 className="font-bold text-blue-950 text-sm sm:text-base">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-slate-500">Security enhanced with OTP via {user?.phone ? 'Phone' : 'Email'}</span>
              <div className="w-10 sm:w-12 h-5 sm:h-6 bg-blue-600 rounded-full relative p-0.5 sm:p-1 flex-shrink-0">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 bg-white rounded-full translate-x-4 sm:translate-x-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
        <header className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white bg-slate-50 sticky top-0 z-10 flex items-center gap-3 sm:gap-4">
          <button onClick={() => setActiveTab('general')} className="p-2 -ml-2 text-slate-600">
            <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-black text-blue-900 uppercase tracking-tight">Notifications</h1>
        </header>

        <div className="p-4 sm:p-6 flex flex-col gap-2 sm:gap-4">
          {[
            { id: 'app', label: 'Push Notifications', desc: 'Alerts on your mobile device' },
            { id: 'email', label: 'Email Reports', desc: 'Weekly health summaries' },
            { id: 'sms', label: 'SMS Alerts', desc: 'Critical appointment reminders' },
          ].map((item) => (
            <div key={item.id} className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-blue-950 text-sm sm:text-base">{item.label}</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{item.desc}</p>
              </div>
              <div className="w-10 sm:w-12 h-5 sm:h-6 bg-slate-200 rounded-full relative p-0.5 sm:p-1 cursor-pointer transition-colors hover:bg-blue-600 group flex-shrink-0">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 bg-white rounded-full transition-transform group-hover:translate-x-4 sm:group-hover:translate-x-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-4 sm:py-6 pb-24">
      <header className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-black text-blue-900 uppercase tracking-tight leading-tight">Settings</h1>
        <button onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate(role === UserRole.DOCTOR ? ROUTES.DOCTOR_DASHBOARD : ROUTES.PATIENT_HOME);
          }
        }} className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-2xl shadow-sm active:scale-95 transition-all flex-shrink-0">
          <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-blue-900" />
        </button>
      </header>

      {/* User Card */}
      <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-[2.5rem] border border-slate-100 shadow-sm mb-6 sm:mb-8 flex items-center gap-3 sm:gap-6">
        <img 
          src={user?.photoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"} 
          className="w-16 sm:w-20 h-16 sm:h-20 rounded-lg sm:rounded-[1.8rem] object-cover shadow-lg flex-shrink-0"
          alt="Profile"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-black text-blue-950 truncate">{user?.name || "John Doe"}</h2>
          <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mt-1">{role} Account</p>
        </div>
        <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-500 rounded-lg sm:rounded-2xl flex-shrink-0">
          <Shield className="w-5 sm:w-6 h-5 sm:h-6" />
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 sm:ml-2">Personal Settings</h3>
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 transition-all active:scale-[0.98]"
          >
            <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-2xl flex-shrink-0", item.color)}>
              <item.icon className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <span className="flex-1 text-left font-bold text-blue-950 text-sm sm:text-base">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
          </button>
        ))}

        <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 sm:ml-2 mt-3 sm:mt-4">Account</h3>
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 text-rose-600 transition-all active:scale-[0.98]"
        >
          <div className="p-2 sm:p-3 bg-rose-50 rounded-lg sm:rounded-2xl flex-shrink-0">
            <LogOut className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <span className="flex-1 text-left font-bold text-sm sm:text-base">Sign Out</span>
        </button>
      </div>

      <div className="mt-8 sm:mt-12 text-center">
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">MedLink v1.0.4 Premium</p>
      </div>

      {/* Logout Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 sm:bottom-8 left-4 sm:left-6 right-4 sm:right-6 bg-white rounded-xl sm:rounded-[3rem] p-6 sm:p-8 z-[101] shadow-2xl border border-slate-100"
            >
              <div className="w-14 sm:w-16 h-14 sm:h-16 bg-rose-50 rounded-lg sm:rounded-[2rem] flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <AlertTriangle className="w-7 sm:w-8 h-7 sm:h-8 text-rose-500" />
              </div>
              <h3 className="text-center text-lg sm:text-xl font-black text-blue-950 mb-2">Sign Out?</h3>
              <p className="text-center text-slate-500 text-xs sm:text-sm font-medium mb-6 sm:mb-8">Are you sure you want to log out of your secure MedLink session?</p>
              
              <div className="flex flex-col gap-2 sm:gap-3">
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 sm:py-5 bg-rose-600 text-white rounded-lg sm:rounded-[2rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-[0.98] transition-all"
                >
                  Yes, Sign Out
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 sm:py-5 bg-slate-100 text-slate-600 rounded-lg sm:rounded-[2rem] font-black text-xs sm:text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

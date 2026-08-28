import React, { useState } from "react";
import { 
  Stethoscope, Upload, Camera, ShieldCheck, MapPin, 
  ArrowLeft, ArrowRight, Eye, EyeOff, FileText, 
  CheckCircle2, User, Building, Lock, FileBadge, 
  CheckSquare, Loader2, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { uploadDoctorProfilePhoto, formatCloudinaryAvatarUrl, uploadMedicalCertificate, uploadGovernmentId } from "../services/cloudinary";
import { createAdminNotification } from "../firebase/firestoreService";
import { reverseGeocode } from "../services/location";
import { DoctorProfile, UserAccount } from "../types";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const specialties = [
  "Cardiology", "Neurology", "Pediatrics", "Dermatology", "Orthopedics", 
  "General Medicine", "General Surgery", "Gynecology", "Psychiatry", 
  "Oncology", "Ophthalmology", "ENT", "Radiology", "Anesthesiology", 
  "Emergency Medicine", "Other"
];

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Step 1: Personal
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Step 2: Professional
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [department, setDepartment] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState<number | "">("");

  // Step 3: Facility Address
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pinCode, setPinCode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isLocating, setIsLocating] = useState(false);

  // Step 4: Verification Documents
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [isUploadingGovId, setIsUploadingGovId] = useState(false);
  
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState("");
  const [isUploadingMedCert, setIsUploadingMedCert] = useState(false);
  const [medicalCertificateFileName, setMedicalCertificateFileName] = useState("");

  // Step 5: Security
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Validation Patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const getPasswordStrength = () => {
    if (!password) return "";
    let strength = 0;
    if (password.length > 7) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength < 2) return "Weak";
    if (strength === 2 || strength === 3) return "Medium";
    return "Strong";
  };

  const validateStep1 = () => {
    if (!fullName || !email || !mobileNumber || !gender || !dateOfBirth) return "All fields are required.";
    if (!emailRegex.test(email)) return "Invalid email address.";
    if (!/^\d{10}$/.test(mobileNumber)) return "Mobile number must be exactly 10 digits.";
    const dob = new Date(dateOfBirth);
    if (dob >= new Date()) return "Date of Birth must be in the past.";
    return null;
  };

  const validateStep2 = () => {
    if (!hospitalName || !medicalLicenseNumber || !registrationNumber || !specialization || !department || !qualification || experience === "") {
      return "All required fields must be filled.";
    }
    if (Number(experience) < 0 || Number(experience) > 80) return "Please enter a valid experience duration in years.";
    return null;
  };

  const validateStep3 = () => {
    if (!hospitalAddress || !city || !state || !country || !pinCode) return "All fields are required.";
    if (country === "India" && !/^\d{6}$/.test(pinCode)) return "Indian PIN Code must be exactly 6 digits.";
    return null;
  };

  const validateStep4 = () => {
    if (!photoUrl) return "Profile photo is required.";
    if (!governmentIdFile) return "Government ID document is required.";
    if (!medicalCertificateUrl) return "Medical Certificate is required.";
    return null;
  };

  const validateStep5 = () => {
    if (!passwordRegex.test(password)) return "Password must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!agreeTerms || !agreePrivacy) return "You must agree to the Terms and Privacy Policy.";
    return null;
  };

  const nextStep = () => {
    setErrorMsg("");
    let err = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (step === 3) err = validateStep3();
    if (step === 4) err = validateStep4();

    if (err) {
      setErrorMsg(err);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep((prev) => prev - 1);
  };

  const handleFetchLocation = () => {
    setErrorMsg("");
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const locDetails = await reverseGeocode(lat, lng);
          if (locDetails.hospitalAddress) setHospitalAddress(locDetails.hospitalAddress);
          if (locDetails.city) setCity(locDetails.city);
          if (locDetails.state) setState(locDetails.state);
          if (locDetails.country) setCountry(locDetails.country);
          if (locDetails.pinCode) setPinCode(locDetails.pinCode);
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to reverse geocode location.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Location permission denied. Please enable location services.");
        } else {
          setErrorMsg("Could not retrieve location. Please try again.");
        }
      }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setErrorMsg("");
    try {
      const url = await uploadDoctorProfilePhoto(file);
      setPhotoUrl(url);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleGovIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB limit.");
      return;
    }
    setGovernmentIdFile(file);
  };

  const handleMedCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File size exceeds 15MB limit.");
      return;
    }
    setIsUploadingMedCert(true);
    setErrorMsg("");
    try {
      const url = await uploadMedicalCertificate(file);
      setMedicalCertificateUrl(url);
      setMedicalCertificateFileName(file.name);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload medical certificate.");
    } finally {
      setIsUploadingMedCert(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const finalErr = validateStep5();
    if (finalErr) {
      setErrorMsg(finalErr);
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload Gov ID to Cloudinary securely
      let govIdUrl = "";
      if (governmentIdFile) {
        setIsUploadingGovId(true);
        govIdUrl = await uploadGovernmentId(governmentIdFile);
        setIsUploadingGovId(false);
      }

      const accountData: Omit<UserAccount, "id" | "createdAt" | "verified" | "verificationStatus"> = {
        email,
        role: "DOCTOR"
      };

      const profileData: Omit<DoctorProfile, "userId" | "createdAt"> = {
        fullName,
        mobileNumber,
        gender,
        dateOfBirth,
        hospitalName,
        hospitalId,
        medicalLicenseNumber,
        registrationNumber,
        specialization,
        department,
        qualification,
        experience: Number(experience),
        hospitalAddress,
        city,
        state,
        country,
        pinCode,
        latitude,
        longitude,
        profilePhotoUrl: photoUrl,
        governmentIdUrl: govIdUrl,
        medicalCertificateUrl,
        medicalCertificateStatus: "NOT_REVIEWED"
      };

      await register(accountData, profileData, password);
      
      try {
        await createAdminNotification({
          title: "New Doctor Registration",
          message: `Dr. ${fullName} has submitted a new registration request and is awaiting verification.`,
          timestamp: Date.now(),
          isRead: false,
          type: "NEW_REGISTRATION",
        });
      } catch (notifErr) {
        console.error("Failed to create admin notification:", notifErr);
      }
      
      setRegistrationComplete(true);
    } catch (err: any) {
      setIsUploadingGovId(false);
      setErrorMsg(err.message || "Registration failed. Please check your inputs or try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Account Created & Verified</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your MedLink doctor account has been created and verified instantly. You now have full practitioner access to network coverage, shift collaboration, and AI clinical decision support.
          </p>
          
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor Name</span>
              <span className="text-sm font-bold text-slate-900">{fullName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Email</span>
              <span className="text-sm font-medium text-slate-900">{email}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration Date</span>
              <span className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Status</span>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-left flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-emerald-800 leading-relaxed">
              Practitioner credentials active. You can log in immediately to submit coverage requests or view active shifts across the MedLink network.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              onClick={onSwitchToLogin}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Go to Login
            </button>
            <button className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors cursor-pointer">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepsInfo = [
    { id: 1, title: "Personal", icon: User },
    { id: 2, title: "Professional", icon: Stethoscope },
    { id: 3, title: "Facility", icon: Building },
    { id: 4, title: "Documents", icon: FileBadge },
    { id: 5, title: "Security", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar Progress */}
        <div className="w-full md:w-64 bg-slate-900 p-6 flex flex-col gap-6 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <img
                src="/medlink-logo.png"
                alt="MedLink Logo"
                className="w-9 h-9 rounded-xl border border-white/20 object-cover bg-white"
              />
              <h2 className="text-xl font-bold tracking-tight">MedLink</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Complete your profile to access clinical operations.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto hidden md:block mt-4">
            <ul className="space-y-6">
              {stepsInfo.map((s) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                return (
                  <li key={s.id} className="flex items-center gap-4 relative">
                    {/* Connection Line */}
                    {s.id !== stepsInfo.length && (
                      <div className={`absolute top-8 left-4 w-px h-10 -ml-px ${isCompleted ? 'bg-sky-500' : 'bg-slate-700'}`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-colors ${
                      isActive ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]" : 
                      isCompleted ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : 
                      "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider block ${
                        isActive ? "text-sky-400" : isCompleted ? "text-slate-300" : "text-slate-600"
                      }`}>Step {s.id}</span>
                      <span className={`text-sm font-medium ${isActive || isCompleted ? "text-white" : "text-slate-500"}`}>
                        {s.title}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 p-6 md:p-10 flex flex-col relative h-[80vh] md:h-auto overflow-y-auto">
          
          <button
            onClick={onSwitchToLogin}
            className="absolute top-6 right-6 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            Cancel & Login <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="mb-8 mt-6 md:mt-0">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stepsInfo[step-1].title} Details</h1>
            <p className="text-sm text-slate-500 mt-1">Please provide accurate information for verification.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={step === 5 ? handleSubmit : (e) => e.preventDefault()} className="flex-1 flex flex-col h-full">
            
            {/* --- STEP 1: Personal --- */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Dr. Jane Doe" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="doctor@hospital.org" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number (10 digits) <span className="text-red-500">*</span></label>
                  <input type="tel" value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} placeholder="9876543210" required maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                  <select value={gender} onChange={e=>setGender(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} required max={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
              </div>
            )}

            {/* --- STEP 2: Professional --- */}
            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hospital Name <span className="text-red-500">*</span></label>
                  <input type="text" value={hospitalName} onChange={e=>setHospitalName(e.target.value)} placeholder="City General Hospital" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hospital ID <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                  <input type="text" value={hospitalId} onChange={e=>setHospitalId(e.target.value)} placeholder="HOSP-123"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical License Number <span className="text-red-500">*</span></label>
                  <input type="text" value={medicalLicenseNumber} onChange={e=>setMedicalLicenseNumber(e.target.value)} placeholder="MED-123456" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Registration Number <span className="text-red-500">*</span></label>
                  <input type="text" value={registrationNumber} onChange={e=>setRegistrationNumber(e.target.value)} placeholder="REG-123456" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Specialization <span className="text-red-500">*</span></label>
                  <select value={specialization} onChange={e=>setSpecialization(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all">
                    <option value="">Select Specialization</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department <span className="text-red-500">*</span></label>
                  <input type="text" value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. ICU, Outpatient" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Qualification <span className="text-red-500">*</span></label>
                  <input type="text" value={qualification} onChange={e=>setQualification(e.target.value)} placeholder="e.g. MBBS, MD" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Experience (Years) <span className="text-red-500">*</span></label>
                  <input type="number" value={experience} onChange={e=>setExperience(e.target.value ? Number(e.target.value) : "")} min="0" max="80" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                </div>
              </div>
            )}

            {/* --- STEP 3: Facility Address --- */}
            {step === 3 && (
              <div className="flex-1 flex flex-col gap-5">
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-sky-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-600" /> Auto-fill Address
                    </h3>
                    <p className="text-xs text-sky-700 mt-1">Use device location to fetch facility address.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={isLocating}
                    className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 hover:bg-sky-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    {isLocating ? "Locating..." : "Get Live Location"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Hospital Address <span className="text-red-500">*</span></label>
                    <textarea value={hospitalAddress} onChange={e=>setHospitalAddress(e.target.value)} placeholder="Full street address" rows={2} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">City <span className="text-red-500">*</span></label>
                    <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="City Name" required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">State <span className="text-red-500">*</span></label>
                    <select value={state} onChange={e=>setState(e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all">
                      <option value="">Select State</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Country <span className="text-red-500">*</span></label>
                    <select value={country} onChange={e=>setCountry(e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all">
                      <option value="India">India</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN Code <span className="text-red-500">*</span></label>
                    <input type="text" value={pinCode} onChange={e=>setPinCode(e.target.value)} placeholder="6-digit PIN" required maxLength={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 4: Documents --- */}
            {step === 4 && (
              <div className="flex-1 flex flex-col gap-6">
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Profile Photo <span className="text-red-500">*</span></h3>
                  <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                      <img
                        src={formatCloudinaryAvatarUrl(photoUrl)}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="photo-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                        {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        {isUploadingPhoto ? "Uploading..." : "Select Image"}
                        <input id="photo-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-2">JPG, PNG, WebP up to 5MB. Clear headshot recommended.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Government ID <span className="text-red-500">*</span></h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50/50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="text-xs font-bold text-slate-700 mb-1">
                      {governmentIdFile ? governmentIdFile.name : "Upload Government ID (Aadhaar, PAN, Passport)"}
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">PDF, JPG, PNG up to 5MB</p>
                    <label htmlFor="gov-id-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold hover:bg-sky-100 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" /> Browse File
                      <input id="gov-id-upload" type="file" accept="image/png, image/jpeg, application/pdf" onChange={handleGovIdChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Medical Certificate <span className="text-red-500">*</span></h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50/50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="text-xs font-bold text-slate-700 mb-1">
                      {medicalCertificateFileName ? medicalCertificateFileName : "Upload Medical Certificate"}
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">PDF, JPG, PNG, WEBP up to 15MB</p>
                    {medicalCertificateUrl ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" /> Medical certificate uploaded
                      </div>
                    ) : (
                      <label htmlFor="med-cert-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold hover:bg-sky-100 cursor-pointer transition-colors">
                        {isUploadingMedCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                        {isUploadingMedCert ? "Uploading..." : "Choose File"}
                        <input id="med-cert-upload" type="file" accept="image/png, image/jpeg, image/webp, application/pdf" onChange={handleMedCertUpload} className="hidden" disabled={isUploadingMedCert} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-amber-800 leading-relaxed">
                    <strong>Notice:</strong> Your documents will be reviewed by the MedLink verification team. Your account will remain unverified until the verification process is completed. Documents are stored securely and never exposed publicly.
                  </p>
                </div>
              </div>
            )}

            {/* --- STEP 5: Security & Consent --- */}
            {step === 5 && (
              <div className="flex-1 flex flex-col gap-6">
                
                <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Secure Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">Strength:</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          getPasswordStrength() === "Weak" ? "bg-red-100 text-red-600" :
                          getPasswordStrength() === "Medium" ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        }`}>{getPasswordStrength()}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={e=>setConfirmPassword(e.target.value)} 
                      placeholder="••••••••" 
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                      <input type="checkbox" checked={agreeTerms} onChange={e=>setAgreeTerms(e.target.checked)} className="peer sr-only" />
                      <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-sky-500 peer-checked:border-sky-500 transition-colors"></div>
                      <CheckSquare className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      I agree to the MedLink <a href="#" className="text-sky-600 font-bold hover:underline">Terms and Conditions</a>.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                      <input type="checkbox" checked={agreePrivacy} onChange={e=>setAgreePrivacy(e.target.checked)} className="peer sr-only" />
                      <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-sky-500 peer-checked:border-sky-500 transition-colors"></div>
                      <CheckSquare className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      I agree to the MedLink <a href="#" className="text-sky-600 font-bold hover:underline">Privacy Policy</a> and understand how my information and uploaded documents will be processed securely.
                    </span>
                  </label>
                </div>

              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingGovId || isUploadingPhoto || isUploadingMedCert}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {(isSubmitting || isUploadingGovId) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Creating Account..." : "Create Doctor Account"}
                  {(!isSubmitting && !isUploadingGovId) && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

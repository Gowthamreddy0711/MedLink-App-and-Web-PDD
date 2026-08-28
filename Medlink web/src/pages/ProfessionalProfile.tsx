import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LicenseBadge } from "../components/LicenseBadge";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { uploadDoctorProfilePhoto, formatCloudinaryAvatarUrl } from "../services/cloudinary";
import { Camera, Building2, MapPin, Award, Phone, Mail, Edit3, Save, CheckCircle2, Loader2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { CoverageFeedback } from "../types";
import { CoveragePerformanceSection } from "../components/CoveragePerformanceSection";
import { updateFeedbackSentiment } from "../firebase/firestoreService";
import { analyzeSentiment } from "../utils/geminiSentiment";

export const ProfessionalProfile: React.FC = () => {
  const { user, updateProfile, toggleAvailability } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.name || user?.fullName || "");
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [qualification, setQualification] = useState(user?.qualification || "");
  const [hospital, setHospital] = useState(user?.hospitalName || user?.hospital || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isUploading, setIsUploading] = useState(false);
  const { subscribeDoctorFeedbackList } = useData();
  const [feedbacks, setFeedbacks] = useState<CoverageFeedback[]>([]);

  React.useEffect(() => {
    if (user && user.id) {
      const unsub = subscribeDoctorFeedbackList(user.id, (fbs) => setFeedbacks(fbs));
      return () => unsub();
    }
  }, [user?.id, subscribeDoctorFeedbackList]);

  React.useEffect(() => {
    const processMissing = async () => {
      const missing = feedbacks.filter(fb => (fb.feedback || fb.reviewText) && (!fb.sentiment || fb.sentimentScore == null));
      if (missing.length === 0) return;
      
      for (const fb of missing) {
        try {
          const textToAnalyze = fb.feedback || fb.reviewText;
          if (!textToAnalyze) continue;

          const result = await analyzeSentiment(textToAnalyze);
          
          const fbId = fb.coverageRequestId || fb.requestId || fb.id;
          if (fbId) {
            await updateFeedbackSentiment(fbId, result.sentiment, result.score);
          }
        } catch (err) {
          console.warn("Failed to process missing sentiment", err);
        }
      }
    };
    processMissing();
  }, [feedbacks]);

  if (!user) return null;

  const currentPhoto = user.avatarUrl || user.photoUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
  const isVer = !!user.verified || !!user.isPractitionerVerified;
  const isAvail = user.clinicStatus === "Available" || user.isAvailableForCoverage;

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let totalScore = 0;
  let analyzedCount = 0;

  feedbacks.forEach(fb => {
    if (fb.sentiment === "POSITIVE") {
      positiveCount++;
      totalScore += (fb.sentimentScore ?? 100);
      analyzedCount++;
    }
    else if (fb.sentiment === "NEUTRAL") {
      neutralCount++;
      totalScore += (fb.sentimentScore ?? 50);
      analyzedCount++;
    }
    else if (fb.sentiment === "NEGATIVE") {
      negativeCount++;
      totalScore += (fb.sentimentScore ?? 0);
      analyzedCount++;
    }
  });

  const totalSentimentReviews = positiveCount + neutralCount + negativeCount;
  const positivePercentage = totalSentimentReviews > 0 ? Math.round((positiveCount / totalSentimentReviews) * 100) : 0;
  const neutralPercentage = totalSentimentReviews > 0 ? Math.round((neutralCount / totalSentimentReviews) * 100) : 0;
  const negativePercentage = totalSentimentReviews > 0 ? Math.round((negativeCount / totalSentimentReviews) * 100) : 0;
  const overallSentimentScore = analyzedCount > 0 
    ? Math.round(totalScore / analyzedCount)
    : 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadDoctorProfilePhoto(file);
      await updateProfile({ photoUrl: uploadedUrl, avatarUrl: uploadedUrl });
    } catch (err: any) {
      alert(err.message || "Failed to upload photo to Cloudinary");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: fullName,
      fullName,
      specialty,
      qualification,
      hospitalName: hospital,
      hospital,
      department,
      phoneNumber: phone,
      phone,
      bio,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Professional Clinical Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Board license verification details, department credentials, and coverage status.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer shrink-0"
        >
          {isEditing ? <Save className="w-4 h-4 text-sky-600" /> : <Edit3 className="w-4 h-4 text-slate-500" />}
          <span>{isEditing ? "Editing Profile" : "Edit Details"}</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={formatCloudinaryAvatarUrl(currentPhoto)}
                alt={fullName}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-sky-100 shadow-md"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/60 rounded-3xl flex items-center justify-center text-white backdrop-blur-xs">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              )}
              <label
                htmlFor="profile-photo-change"
                className="absolute -bottom-2 -right-2 p-2 bg-sky-600 text-white rounded-xl shadow-md hover:bg-sky-700 cursor-pointer transition-colors"
                title="Upload Cloudinary Profile Picture"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input
                  id="profile-photo-change"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">{fullName}</h2>
                <LicenseBadge status={isVer ? "Verified" : "Pending"} licenseNumber={user.licenseNumber || ""} />
              </div>

              <p className="text-sm font-bold text-sky-700 mt-1">{user.specialty}</p>
              <p className="text-xs text-slate-500 font-medium">{user.qualification}</p>
              {isUploading && (
                <p className="text-[11px] text-sky-600 font-bold mt-1 animate-pulse">
                  Uploading image to Cloudinary...
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <AvailabilityBadge
              isAvailable={user.isAvailableForCoverage}
              onToggle={toggleAvailability}
              showToggleControl
            />
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Hospital</label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department / Ward</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Bio & Focus</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-md"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hospital</p>
                  <p className="font-bold text-slate-800">{user.hospital}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                  <p className="font-bold text-slate-800">{user.department}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Award className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Experience</p>
                  <p className="font-bold text-slate-800">{user.experienceYears} Years Clinical</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-lg">🤖</span> Coverage Feedback Insights
              </h3>
              {totalSentimentReviews === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                  <p className="text-sm font-bold text-slate-500">No feedback yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Sentiment Score</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{overallSentimentScore} <span className="text-xs text-slate-400">/ 100</span></p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Positive</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">{positivePercentage}%</p>
                  </div>
                  <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Neutral</p>
                    <p className="text-xl font-black text-slate-700 mt-1">{neutralPercentage}%</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-rose-600 uppercase">Negative</p>
                    <p className="text-xl font-black text-rose-700 mt-1">{negativePercentage}%</p>
                  </div>
                </div>
              )}
            </div>

            {user.bio && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Focus & Bio</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-sky-50/50 p-4 rounded-2xl border border-sky-100/80">
                  "{user.bio}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <CoveragePerformanceSection feedbacks={feedbacks} doctorName={user.name || user.fullName || "Doctor"} />
    </div>
  );
};

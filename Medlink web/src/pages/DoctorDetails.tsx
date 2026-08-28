import React from "react";
import { User, CoverageFeedback } from "../types";
import { LicenseBadge } from "../components/LicenseBadge";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { CoveragePerformanceSection } from "../components/CoveragePerformanceSection";
import { analyzeSentiment } from '../utils/geminiSentiment';
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { canViewContactInfo } from "../utils/privacy";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Award,
  Mail,
  MessageSquare,
  Star,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { updateFeedbackSentiment } from "../firebase/firestoreService";

interface DoctorDetailsProps {
  doctor?: User | null;
  onBack: () => void;
  onStartChat: (doctor: User) => void;
}

export const DoctorDetails: React.FC<DoctorDetailsProps> = ({
  doctor,
  onBack,
  onStartChat,
}) => {
  const { user } = useAuth();
  const { leaveRequests, subscribeDoctorFeedbackList } = useData();

  const { id } = useParams();
  const [localDoctor, setLocalDoctor] = React.useState<User | null>(doctor || null);
  const [feedbacks, setFeedbacks] = React.useState<CoverageFeedback[]>([]);
  const [isLoading, setIsLoading] = React.useState(!doctor);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let unsub = () => {};
    if (doctor) {
      setLocalDoctor(doctor);
      setIsLoading(false);
      unsub = subscribeDoctorFeedbackList(doctor.id || doctor.uid || "", (fbs) => setFeedbacks(fbs));
      return () => unsub();
    }
    
    if (!id) {
      setError("Doctor profile not found.");
      setIsLoading(false);
      return;
    }

    const fetchDoctor = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "users", id));
        if (docSnap.exists()) {
          setLocalDoctor({ id: docSnap.id, ...docSnap.data() } as User);
          unsub = subscribeDoctorFeedbackList(id, (fbs) => setFeedbacks(fbs));
        } else {
          setError("Doctor profile not found.");
        }
      } catch (err) {
        console.error("Failed to fetch doctor:", err);
        setError("Unable to load doctor profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();

    return () => unsub();
  }, [id, doctor, subscribeDoctorFeedbackList]);

  React.useEffect(() => {
    // Backfill is now handled globally, removed local script.
  }, [feedbacks]);

  const canViewContact = React.useMemo(() => {
    return user && localDoctor ? canViewContactInfo(user.id, localDoctor.id || localDoctor.uid || "", leaveRequests) : false;
  }, [user?.id, localDoctor?.id, localDoctor?.uid, leaveRequests]);
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> <span>Back</span>
        </button>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-12 text-center text-slate-600 font-bold text-sm">
          Loading doctor profile...
        </div>
      </div>
    );
  }

  if (error || !localDoctor) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> <span>Back</span>
        </button>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-12 text-center text-rose-600 font-bold text-sm">
          {error || "Doctor profile not found."}
        </div>
      </div>
    );
  }

  const docName = localDoctor.name || localDoctor.fullName || "Doctor";
  const photo = localDoctor.avatarUrl || localDoctor.photoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(docName);
  const hosp = localDoctor.hospitalName || localDoctor.hospital || "MedLink Hospital";
  const exp = localDoctor.experience || localDoctor.experienceYears || 0;
  const isAvail = localDoctor.clinicStatus === "Available" || localDoctor.isAvailableForCoverage;
  const isVer = !!localDoctor.verified || !!localDoctor.isPractitionerVerified;
  
  const email = canViewContact ? localDoctor.email : "";

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> <span>Back</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start relative">
        <div className="relative shrink-0">
          <img
            src={photo}
            alt={docName}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-sky-50 shadow-sm"
          />
          {isVer && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-sm ring-4 ring-white" title="Verified Professional">
              <Award className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{docName}</h1>
              <p className="text-sm font-bold text-sky-700">{localDoctor.specialty || "General Medicine"}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <LicenseBadge status={isVer ? "Verified" : "Pending"} licenseNumber={localDoctor.licenseNumber || ""} />
                
                {localDoctor.coverageRatingCount || localDoctor.sentimentScoreCount ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200/60">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {localDoctor.coverageScore ?? 100} / 100
                    <span className="text-amber-700/60 font-medium ml-1">({localDoctor.sentimentScoreCount || localDoctor.coverageRatingCount} Reviews)</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <AvailabilityBadge isAvailable={isAvail} />

              <button
                onClick={() => onStartChat(localDoctor)}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Direct Chat</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Hospital</p>
                <p className="font-bold text-slate-800">{hosp}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                <p className="font-bold text-slate-800">{localDoctor.department || "General Care"}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <Award className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Experience</p>
                <p className="font-bold text-slate-800">{exp} Years Clinical</p>
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

          <div className="pt-4 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-700">
            {!canViewContact ? (
              <div className="text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100 w-full text-center">
                Contact information is restricted. Only visible to assigned coverage partners.
              </div>
            ) : (
              <>
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-sky-600">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>{email}</span>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CoveragePerformanceSection feedbacks={feedbacks} doctorName={docName} />
    </div>
  );
};

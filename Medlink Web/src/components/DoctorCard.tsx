import React from "react";
import { MessageSquare, Mail, MapPin, Award, Building2, Star } from "lucide-react";
import { User } from "../types";
import { LicenseBadge } from "./LicenseBadge";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { canViewContactInfo } from "../utils/privacy";

interface DoctorCardProps {
  doctor: User;
  onContactChat?: (doctor: User) => void;
  onSelectDetails?: (doctor: User) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onContactChat,
  onSelectDetails,
}) => {
  const { user } = useAuth();
  const { leaveRequests } = useData();

  const docName = doctor.name || doctor.fullName || "Doctor";
  const photo = doctor.avatarUrl || doctor.photoUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
  const hosp = doctor.hospitalName || doctor.hospital || "MedLink Hospital";
  const exp = doctor.experience || doctor.experienceYears || 0;
  const isAvail = doctor.clinicStatus === "Available" || doctor.isAvailableForCoverage;
  const isVer = !!doctor.verified || !!doctor.isPractitionerVerified;

  const canViewContact = React.useMemo(() => {
    return user ? canViewContactInfo(user.id, doctor.id || doctor.uid || "", leaveRequests) : false;
  }, [user?.id, doctor.id, doctor.uid, leaveRequests]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={photo}
              alt={docName}
              onClick={() => onSelectDetails && onSelectDetails(doctor)}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-sky-100 shadow-xs group-hover:scale-102 transition-transform cursor-pointer"
            />
            <div>
              <h3
                onClick={() => onSelectDetails && onSelectDetails(doctor)}
                className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors cursor-pointer"
              >
                {docName}
              </h3>
              <p className="text-xs font-semibold text-sky-700 mt-0.5">{doctor.specialty || "General Medicine"}</p>
              <div className="mt-1">
                <LicenseBadge status={isVer ? "Verified" : "Pending"} licenseNumber={doctor.licenseNumber || ""} />
              </div>
              <div className="mt-1.5">
                {doctor.coverageRatingCount ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {doctor.coverageRating?.toFixed(1)} / 5 <span className="font-medium text-slate-500 text-[10px] ml-0.5">({doctor.coverageRatingCount} Reviews)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">No Coverage Ratings Yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Rows */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          {hosp && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{hosp}</span>
            </div>
          )}
          {(doctor.qualification || "MD, Physician") && (
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{doctor.qualification || "MD, Physician"}</span>
            </div>
          )}
        </div>

        {/* Bio preview */}
        {doctor.bio && (
          <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            "{doctor.bio}"
          </p>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <AvailabilityBadge isAvailable={isAvail} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onContactChat && onContactChat(doctor)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
          
          <button
            onClick={() => onSelectDetails && onSelectDetails(doctor)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            View Profile
          </button>

          {canViewContact && doctor.email && (
            <a
              href={`mailto:${doctor.email}`}
              title="Email"
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};


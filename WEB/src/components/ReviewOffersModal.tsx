import React, { useState } from "react";
import { X, User, CheckCircle2, XCircle, MapPin, Building2, Stethoscope, Award, Star } from "lucide-react";
import { LeaveRequest, Volunteer, User as DoctorUser } from "../types";
import { useData } from "../context/DataContext";

interface ReviewOffersModalProps {
  request: LeaveRequest;
  volunteers: Volunteer[];
  onClose: () => void;
  onSelectDoctorDetails?: (doctor: DoctorUser) => void;
}

export const ReviewOffersModal: React.FC<ReviewOffersModalProps> = ({ request, volunteers, onClose, onSelectDoctorDetails }) => {
  const { doctors, approveVolunteerOffer, rejectVolunteerOffer } = useData();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter out rejected and accepted offers from the "pending" view
  const pendingOffers = volunteers.filter(v => v.status !== "REJECTED" && v.status !== "ACCEPTED" && v.status !== "APPROVED" && v.status !== "Approved");

  const handleAccept = async (volId: string) => {
    console.log("ACCEPT CLICKED", {
      offerId: volId,
      leaveId: request.id,
      volunteerDoctorId: volId,
      requesterDoctorId: request.doctorId,
    });
    setProcessingId(volId);
    try {
      await approveVolunteerOffer(request.id, volId);
      onClose();
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  const handleReject = async (volId: string) => {
    console.log("REJECT CLICKED", {
      offerId: volId,
      leaveId: request.id,
      volunteerDoctorId: volId,
      requesterDoctorId: request.doctorId,
    });
    setProcessingId(volId);
    try {
      await rejectVolunteerOffer(request.id, volId);
      // Automatically close if that was the last offer
      if (pendingOffers.length <= 1) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateRange = () => {
    const start = new Date(request.leaveStartDate || request.shiftDate || Date.now());
    const startStr = start.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (!request.leaveEndDate) return startStr;
    
    const end = new Date(request.leaveEndDate);
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    
    if (startDateOnly === endDateOnly) {
      return startStr;
    }
    
    const endStr = end.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} → ${endStr}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review Volunteer Offers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              For: {formatDateRange()} • {request.shiftType} • {request.department || request.specialization}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {pendingOffers.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No pending offers to review.
            </div>
          ) : (
            pendingOffers.map(vol => {
              const realDoctorProfile = doctors.find(d => d.id === vol.doctorId || d.id === vol.volunteerUid || d.id === vol.id);
              
              return (
                <div key={vol.id || vol.volunteerUid} className="border border-slate-200 rounded-xl p-4 shadow-sm bg-slate-50/50">
                  <div className="flex items-start gap-4">
                    <img
                      src={realDoctorProfile?.avatarUrl || realDoctorProfile?.photoUrl || vol.profilePhoto || vol.volunteerPhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"}
                      alt={realDoctorProfile?.name || vol.name || vol.volunteerName}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        Dr. {realDoctorProfile?.name || realDoctorProfile?.fullName || vol.name || vol.volunteerName}
                      </h3>
                      
                      <div className="mt-1 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{realDoctorProfile?.specialty || vol.specialization || vol.volunteerSpecialty || "General Practitioner"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{realDoctorProfile?.hospitalName || realDoctorProfile?.hospital || "MedLink Partner Hospital"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{realDoctorProfile?.experience || vol.experience || 0} years experience • {realDoctorProfile?.qualification || "MD"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm inline-flex">
                          <Star className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400" />
                          <div className="flex flex-col">
                            {realDoctorProfile?.coverageRatingCount ? (
                              <>
                                <span className="font-bold text-slate-800 text-sm">{realDoctorProfile.coverageRating?.toFixed(1)} / 5</span>
                                <span className="text-[10px] font-semibold text-slate-500">{realDoctorProfile.coverageRatingCount} Coverage Reviews</span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500">No Coverage Ratings Yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {vol.notes && (
                    <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-100 text-xs text-slate-600 italic">
                      "{vol.notes}"
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (onSelectDoctorDetails && realDoctorProfile) {
                          onClose();
                          onSelectDoctorDetails(realDoctorProfile);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        disabled={processingId !== null}
                        onClick={() => handleReject(vol.doctorId || vol.volunteerUid || vol.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        disabled={processingId !== null}
                        onClick={() => handleAccept(vol.doctorId || vol.volunteerUid || vol.id)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {processingId === (vol.doctorId || vol.volunteerUid || vol.id) ? "Accepting..." : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

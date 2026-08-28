import React, { useState, useEffect } from "react";
import { Building2, CheckCircle2, MessageSquare, XCircle, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeaveRequest, Volunteer, CoverageFeedback } from "../types";
import { useData } from "../context/DataContext";
import { subscribeVolunteers } from "../firebase/firestoreService";
import { ReviewOffersModal } from "./ReviewOffersModal";
import { CoverageFeedbackModal } from "./CoverageFeedbackModal";
import { SubmitCoverageFeedbackModal } from "./SubmitCoverageFeedbackModal";

interface MyLeaveRequestCardProps {
  req: LeaveRequest;
  onSelectDoctorDetails?: (doctor: any) => void;
}

export const MyLeaveRequestCard: React.FC<MyLeaveRequestCardProps> = ({ req, onSelectDoctorDetails }) => {
  const [vols, setVols] = useState<Volunteer[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<CoverageFeedback | null>(null);
  const { doctors, getOrCreateChatRoom, user, subscribeCoverageFeedback } = useData();
  const navigate = useNavigate();

  const isDutyCompleted = req.status === "COMPLETED";
  const isDutyInProgress = req.status === "IN_PROGRESS";
  const isRequester = user?.id === req.doctorId || user?.id === req.requesterUid || user?.id === (req as any).requestingDoctorId || user?.id === (req as any).createdBy;

  useEffect(() => {
    const unsub = subscribeVolunteers(req.id, (data) => setVols(data));
    return () => unsub();
  }, [req.id]);

  useEffect(() => {
    let unsub = () => {};
    if (isRequester && isDutyCompleted) {
      unsub = subscribeCoverageFeedback(req.id, (data) => {
        setFeedbackData(data);
      });
    }
    return () => unsub();
  }, [isRequester, isDutyCompleted, req.id, subscribeCoverageFeedback]);

  const acceptedVol = vols.find(v => v.status === "ACCEPTED" || v.status === "Approved" || v.status === "APPROVED");
  const rejectedVol = vols.find(v => v.status === "REJECTED");

  const handleStartChat = async (peerId: string) => {
    const peerDoc = doctors.find(d => d.id === peerId);
    if (!peerDoc) return;
    try {
      await getOrCreateChatRoom(peerDoc);
      navigate("/messages");
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  const formatDateRange = () => {
    const start = new Date(req.leaveStartDate || req.shiftDate || Date.now());
    const startStr = start.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (!req.leaveEndDate) return startStr;
    
    const end = new Date(req.leaveEndDate);
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    
    if (startDateOnly === endDateOnly) {
      return startStr;
    }
    
    const endStr = end.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} → ${endStr}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-md">
            {req.coverageType || req.shiftType || "Full Day"}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              req.priority === "Emergency" || req.urgency === "Emergency"
                ? "bg-rose-100 text-rose-800"
                : req.priority === "Urgent" || req.urgency === "Urgent"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {req.priority || req.urgency || "Normal"}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
              req.status === "APPROVED" || req.status === "ACTIVE" || req.status === "Assigned" || req.status === "ACCEPTED" || req.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-800"
                : req.status === "IN_PROGRESS"
                ? "bg-blue-100 text-blue-800"
                : req.status === "OPEN" || req.status === "PENDING" || req.status === "Open"
                ? "bg-amber-100 text-amber-800"
                : "bg-sky-50 text-sky-800 border border-sky-200"
            }`}
          >
            Status: {req.status}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900">
          {formatDateRange()} • {req.specialization || "General Care"}
        </h3>
        <p className="text-xs text-slate-600 italic">"{req.reason}"</p>
        
        {/* Clinic Location Display */}
        <div className="flex items-start gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600">
            <span className="font-bold block">{req.hospital || "Hospital / Clinic"}</span>
            <span className="text-[10px] text-slate-500">
              {req.location || (req.clinicAddress ? `${req.clinicAddress}, ${req.clinicCity || ''} ${req.clinicState || ''} ${req.clinicPin || ''}` : "Location not available")}
            </span>
            <button
              onClick={() => {
                if (req.latitude && req.longitude) {
                  window.open(`https://www.google.com/maps?q=${req.latitude},${req.longitude}`, "_blank");
                } else if (req.location) {
                  window.open(`https://www.google.com/maps?q=${encodeURIComponent(req.location)}`, "_blank");
                } else if (req.clinicAddress) {
                  window.open(`https://www.google.com/maps?q=${encodeURIComponent(req.clinicAddress)}`, "_blank");
                }
              }}
              disabled={!req.location && !req.clinicAddress && !req.latitude}
              className="mt-1 px-3 py-1 rounded-md bg-sky-100 text-sky-700 hover:bg-sky-200 text-[10px] font-bold transition-colors w-fit cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed block"
            >
              View on Map
            </button>
          </div>
        </div>

        {req.notes && (
          <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
            Handover: {req.notes}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {(req.approvedDoctorName || req.assignedVolunteerName) && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
            <p className="font-bold">Assigned Coverage Doctor:</p>
            <p>{req.approvedDoctorName || req.assignedVolunteerName}</p>
          </div>
        )}

        {acceptedVol ? (
          <div className="flex flex-col items-end gap-2 mt-2">
            {req.status === "IN_PROGRESS" ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs border border-blue-200">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Session In Progress
              </span>
            ) : req.status === "COMPLETED" ? (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs border border-indigo-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Coverage Completed
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Coverage Accepted
              </span>
            )}
            
            <p className="text-[10px] text-slate-500 font-medium max-w-[200px] text-right">
              {isDutyInProgress ? "Started by" : "Covered by"} Dr. {acceptedVol.name || acceptedVol.volunteerName || "Doctor"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {onSelectDoctorDetails && (
                <button
                  onClick={() => {
                    const peerDoc = doctors.find(d => d.id === (acceptedVol.doctorId || acceptedVol.id || acceptedVol.volunteerUid));
                    if (peerDoc) onSelectDoctorDetails(peerDoc);
                  }}
                  className="px-3 py-2 rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  View Profile
                </button>
              )}
              <button
                onClick={() => handleStartChat(acceptedVol.doctorId || acceptedVol.id || acceptedVol.volunteerUid!)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
            </div>
          </div>
        ) : rejectedVol && vols.length === 1 ? (
          <div className="flex flex-col items-end gap-2 mt-2">
            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              REJECTED
            </span>
            <p className="text-[10px] text-slate-500 font-medium max-w-[200px] text-right">
              The coverage request was rejected.
            </p>
          </div>
        ) : !acceptedVol && vols.length > 0 ? (
          <div className="flex flex-col items-end gap-2 mt-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Waiting for response
            </span>
            <p className="text-[10px] text-slate-500 font-medium mb-1">
              {vols.filter(v => v.status !== "REJECTED").length} pending offer(s).
            </p>
            {vols.filter(v => v.status !== "REJECTED").length > 0 && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Review Offer(s)
              </button>
            )}
          </div>
        ) : null}
      </div>
      </div>

      {isRequester && isDutyCompleted && (acceptedVol || (req.approvedDoctorId || req.assignedVolunteerUid || (req as any).assignedDoctorId || (req as any).coveringDoctorId)) && (
        <>
          {!req.hasFeedback && !feedbackData ? (
            <div className="mt-2 p-5 rounded-xl border-2 border-amber-200 bg-amber-50/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Coverage Completed ✓
                  </span>
                </div>
                <p className="text-amber-900 text-sm font-medium">
                  Dr. {acceptedVol?.name || acceptedVol?.volunteerName || req.approvedDoctorName || req.assignedVolunteerName || (req as any).assignedDoctor || "Doctor"} completed your coverage duty.
                </p>
                <p className="text-amber-700 text-xs font-bold mt-2 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Rate your coverage experience
                </p>
              </div>
              <button
                onClick={() => {
                  console.log("WEB_FEEDBACK_DEBUG", {
                    requestId: req.id,
                    currentUserId: user?.id,
                    requestingDoctorId: req.doctorId || req.requesterUid || (req as any).requestingDoctorId || (req as any).createdBy,
                    coveringDoctorId: acceptedVol?.doctorId || acceptedVol?.id || acceptedVol?.volunteerUid || req.approvedDoctorId || req.assignedVolunteerUid || (req as any).assignedDoctorId || (req as any).coveringDoctorId,
                    approvedDoctorId: req.approvedDoctorId,
                    status: req.status,
                    feedbackExists: req.hasFeedback || !!feedbackData
                  });
                  setIsFeedbackModalOpen(true);
                }}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95"
              >
                Give Feedback
              </button>
            </div>
          ) : feedbackData ? (
            <div className="mt-2 p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3 animate-in fade-in">
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-800">Your Feedback</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Feedback Submitted
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= feedbackData.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                    />
                  ))}
                  <span className="text-sm font-bold text-amber-600 ml-2">{feedbackData.rating}/5</span>
                </div>
                <p className="text-sm text-slate-700">"{feedbackData.feedback || feedbackData.reviewText}"</p>
              </div>
            </div>
          ) : null}
        </>
      )}

      {isReviewModalOpen && (
        <ReviewOffersModal
          request={req}
          volunteers={vols}
          onClose={() => setIsReviewModalOpen(false)}
          onSelectDoctorDetails={onSelectDoctorDetails}
        />
      )}

      {isFeedbackModalOpen && (
        <SubmitCoverageFeedbackModal
          request={req}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      )}
    </div>
  );
};

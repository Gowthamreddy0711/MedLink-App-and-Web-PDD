import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarCheck2,
  Plus,
  Hand,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Building2,
  XCircle,
  MessageSquare,
  PlayCircle,
  Loader2
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { LeaveRequestModal } from "../components/LeaveRequestModal";
import { VolunteerModal } from "../components/VolunteerModal";
import { MyLeaveRequestCard } from "../components/MyLeaveRequestCard";
import { LeaveRequest } from "../types";

interface CoverageProps {
  onSelectDoctorDetails: (doctor: User) => void;
}

export const Coverage: React.FC<CoverageProps> = ({ onSelectDoctorDetails }) => {
  const { user } = useAuth();
  const { leaveRequests, volunteers, doctors, approveVolunteerOffer, rejectVolunteerOffer, getOrCreateChatRoom, startCoverageSession, completeCoverageSession } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"my-requests" | "opportunities" | "duties" | "approvals" | "my-volunteers">("my-requests");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedVolunteerReq, setSelectedVolunteerReq] = useState<LeaveRequest | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
    if (location.state?.section) {
      setTimeout(() => {
        const el = document.getElementById(location.state.section);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.state]);

  const handleStartSession = async (req: LeaveRequest) => {
    setProcessingAction(`start_${req.id}`);
    try {
      await startCoverageSession(req.id, req.doctorId || req.requesterUid || "");
    } catch (e) {
      console.error(e);
      alert("Failed to start session.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCompleteSession = async (req: LeaveRequest) => {
    if (!window.confirm("Complete Coverage Session?\n\nAre you sure you have completed this coverage duty?")) return;
    setProcessingAction(`complete_${req.id}`);
    try {
      await completeCoverageSession(req.id, req.doctorId || req.requesterUid || "");
    } catch (e) {
      console.error(e);
      alert("Failed to complete session.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleStartChat = async (peerDoctor: User) => {
    try {
      await getOrCreateChatRoom(peerDoctor);
      navigate("/messages");
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  if (!user) return null;

  const myRequests = useMemo(() => leaveRequests.filter((r) => r.doctorId === user.id || r.requesterUid === user.id || (user.email && (r.doctorEmail === user.email || (r as any).email === user.email))), [leaveRequests, user.id, user.email]);
  const openOpportunities = useMemo(() => leaveRequests.filter(
    (r) => {
      if (r.doctorId === user.id || r.requesterUid === user.id) return false;
      if (r.status !== "OPEN" && r.status !== "PENDING" && r.status !== "Open") return false;
      if ((r.rejectedDoctorIds || []).includes(user.id)) return false;
      
      const leaveEndDate = r.leaveEndDate || Date.now() + 24 * 60 * 60 * 1000;
      if (leaveEndDate <= Date.now()) return false;
      
      return true;
    }
  ), [leaveRequests, user.id]);
  const myDuties = useMemo(() => leaveRequests.filter((r) => r.approvedDoctorId === user.id || r.assignedVolunteerUid === user.id || (user.email && (r.approvedDoctorEmail === user.email || (r as any).volunteerEmail === user.email))), [leaveRequests, user.id, user.email]);

  const isHistorical = (r: LeaveRequest) => {
    const terminal = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED", "Completed", "Rejected", "Cancelled", "Expired"];
    if (terminal.includes(r.status)) return true;
    if (r.leaveEndDate && r.leaveEndDate < Date.now()) return true;
    return false;
  };

  const myCurrentRequests = useMemo(() => myRequests.filter(r => !isHistorical(r)).sort((a, b) => (b.leaveEndDate || b.createdAt) - (a.leaveEndDate || a.createdAt)), [myRequests]);
  const myCompletedRequests = useMemo(() => myRequests.filter(r => isHistorical(r)).sort((a, b) => (b.leaveEndDate || b.createdAt) - (a.leaveEndDate || a.createdAt)), [myRequests]);

  const myActiveDuties = useMemo(() => myDuties.filter(r => !isHistorical(r)).sort((a, b) => (b.leaveEndDate || b.createdAt) - (a.leaveEndDate || a.createdAt)), [myDuties]);
  const myCompletedDuties = useMemo(() => myDuties.filter(r => isHistorical(r)).sort((a, b) => (b.leaveEndDate || b.createdAt) - (a.leaveEndDate || a.createdAt)), [myDuties]);

  // Offers for my requests
  const offersForMyRequests = useMemo(() => volunteers.filter((vol) => {
    const parentReq = myRequests.find((r) => r.id === vol.requestId);
    return !!parentReq;
  }), [volunteers, myRequests]);

  // Offers I have made
  const myVolunteeredOffers = useMemo(() => volunteers.filter((vol) => vol.doctorId === user.id || vol.volunteerUid === user.id), [volunteers, user.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <LeaveRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {selectedVolunteerReq && (
        <VolunteerModal
          request={selectedVolunteerReq}
          onClose={() => setSelectedVolunteerReq(null)}
        />
      )}

      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coverage & Shift Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave requests, volunteer for peer coverage, and approve coverage assignments.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Coverage Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: "my-requests", label: `My Leave Requests (${myRequests.length})` },
          { id: "opportunities", label: `Coverage Opportunities (${openOpportunities.length})` },
          { id: "duties", label: `My Coverage Duties (${myDuties.length})` },
          { id: "approvals", label: `Volunteer Approvals (${offersForMyRequests.length})` },
          { id: "my-volunteers", label: `My Offers (${myVolunteeredOffers.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: My Leave Requests */}
      {activeTab === "my-requests" && (
        <div className="space-y-8">
          <div>
            <h2 id="current-requests" className="text-lg font-bold text-slate-800 mb-4">Current Requests</h2>
            <div className="space-y-4">
              {myCurrentRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                  <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Current Leave Requests</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Need to arrange coverage for an upcoming conference, CME exam, or personal leave? Submit a request.
                  </p>
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
                  >
                    Create Request
                  </button>
                </div>
              ) : (
                myCurrentRequests.map((req) => (
                  <MyLeaveRequestCard key={req.id} req={req} onSelectDoctorDetails={onSelectDoctorDetails} />
                ))
              )}
            </div>
          </div>
          
          <div>
            <h2 id="completed-leave-history" className="text-lg font-bold text-slate-800 mb-4">Completed Leave History</h2>
            <div className="space-y-4">
              {myCompletedRequests.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 text-center">
                  <p className="text-xs text-slate-500">No completed leave requests found.</p>
                </div>
              ) : (
                myCompletedRequests.map((req) => (
                  <MyLeaveRequestCard key={req.id} req={req} onSelectDoctorDetails={onSelectDoctorDetails} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Open Opportunities */}
      {activeTab === "opportunities" && (
        <div className="space-y-4">
          {openOpportunities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
              <p className="text-xs text-slate-500">No open shift coverage requests from peers right now.</p>
            </div>
          ) : (
            openOpportunities.slice(0, 50).map((req) => {
              const reqDoc = doctors.find(d => d.id === req.doctorId || d.id === req.requesterUid);
              return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={req.doctorProfilePhoto || req.requesterPhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"}
                    alt={req.doctorName || req.requesterName}
                    onClick={() => reqDoc && onSelectDoctorDetails(reqDoc)}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 
                        onClick={() => reqDoc && onSelectDoctorDetails(reqDoc)}
                        className="text-sm font-bold text-slate-900 cursor-pointer hover:text-sky-700 transition-colors"
                      >
                        {req.doctorName || req.requesterName}
                      </h3>
                      <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        {req.specialization || req.requesterSpecialty}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">
                      {req.coverageType || req.shiftType} on <span className="text-sky-700">{req.shiftDate || new Date(req.leaveStartDate).toLocaleDateString()}</span>
                    </p>
                    <p className="text-xs text-slate-600 italic">"{req.reason}"</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                        <Building2 className="w-3 h-3" />
                        <span>{req.hospital || "Hospital"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                        <MapPin className="w-3 h-3" />
                        <span>{req.location || (req.clinicCity ? req.clinicCity : "Location not available")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (req.latitude && req.longitude) {
                        window.open(`https://www.google.com/maps?q=${req.latitude},${req.longitude}`, "_blank");
                      } else if (req.location) {
                        window.open(`https://www.google.com/maps?q=${encodeURIComponent(req.location)}`, "_blank");
                      } else if (req.clinicCity) {
                        window.open(`https://www.google.com/maps?q=${encodeURIComponent(req.clinicCity)}`, "_blank");
                      }
                    }}
                    disabled={!req.location && !req.clinicCity && !req.latitude}
                    className="px-5 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold transition-colors cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Location
                  </button>
                  <button
                    onClick={() => setSelectedVolunteerReq(req)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Volunteer Offer
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: My Coverage Duties */}
      {activeTab === "duties" && (
        <div className="space-y-8">
          <div>
            <h2 id="active-coverage-duties" className="text-lg font-bold text-slate-800 mb-4">Active Coverage Duties</h2>
            <div className="space-y-4">
              {myActiveDuties.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">You currently have no active assigned coverage duties.</p>
                </div>
              ) : (
                myActiveDuties.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        req.status === "IN_PROGRESS" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {req.status === "IN_PROGRESS" ? "Session In Progress" : "Duty Assigned & Active"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {req.coverageType || req.shiftType} — {req.shiftDate || new Date(req.leaveStartDate).toLocaleDateString()}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Covering for: {req.doctorName || req.requesterName} ({req.specialization || req.requesterSpecialty})
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Specialization: {req.specialization}</p>
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{req.hospital || "Hospital"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{req.location || (req.clinicAddress ? `${req.clinicAddress}, ${req.clinicCity || ''}` : "Location not available")}</span>
                        </div>
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
                          className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition-colors w-fit cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          View on Map
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 w-64 shrink-0">
                        <p className="font-bold text-slate-900 mb-1">Shift Handover Note:</p>
                        <p className="italic">{req.notes || "Standard ward handover protocols apply."}</p>
                      </div>
                      
                      <div className="flex justify-end mt-2">
                        {req.status === "APPROVED" || req.status === "ACTIVE" || req.status === "Assigned" || req.status === "ACCEPTED" ? (
                          <button
                            disabled={processingAction === `start_${req.id}`}
                            onClick={() => handleStartSession(req)}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {processingAction === `start_${req.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            Start Session
                          </button>
                        ) : req.status === "IN_PROGRESS" ? (
                          <button
                            disabled={processingAction === `complete_${req.id}`}
                            onClick={() => handleCompleteSession(req)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {processingAction === `complete_${req.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Complete Session
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 id="completed-coverage-duties" className="text-lg font-bold text-slate-800 mb-4">Completed Coverage Duties</h2>
            <div className="space-y-4">
              {myCompletedDuties.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 text-center">
                  <p className="text-xs text-slate-500">No completed coverage duties found.</p>
                </div>
              ) : (
                myCompletedDuties.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        Session Completed
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {req.coverageType || req.shiftType} — {req.shiftDate || new Date(req.leaveStartDate).toLocaleDateString()}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Covered for: {req.doctorName || req.requesterName} ({req.specialization || req.requesterSpecialty})
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Specialization: {req.specialization}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-end mt-2">
                        <span className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Duty Finished
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Volunteer Approvals */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          {offersForMyRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
              <p className="text-xs text-slate-500">No pending volunteer offers received for your leave requests.</p>
            </div>
          ) : (
            offersForMyRequests.slice(0, 50).map((vol) => {
              const req = myRequests.find((r) => r.id === vol.requestId);
              const volName = vol.name || vol.volunteerName || "Doctor";
              const volSpec = vol.specialization || vol.volunteerSpecialty || "General Care";
              const volPhoto = vol.profilePhoto || vol.volunteerPhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
              const isApproved = req?.approvedDoctorId === vol.doctorId || req?.approvedDoctorId === vol.id || vol.status === "Approved" || vol.status === "ACCEPTED";
              const volDoc = doctors.find(d => d.id === vol.doctorId || d.id === vol.id || d.id === vol.volunteerUid);

              return (
                <div
                  key={vol.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={volPhoto}
                      alt={volName}
                      onClick={() => volDoc && onSelectDoctorDetails(volDoc)}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <div>
                      <h3 
                        onClick={() => volDoc && onSelectDoctorDetails(volDoc)}
                        className="text-sm font-bold text-slate-900 cursor-pointer hover:text-sky-700 transition-colors"
                      >
                        {volName}
                      </h3>
                      <p className="text-xs text-sky-700 font-medium">{volSpec}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Offered to cover: <span className="font-bold text-slate-800">{req?.coverageType || req?.shiftType} on {req?.shiftDate || (req?.leaveStartDate ? new Date(req.leaveStartDate).toLocaleDateString() : "")}</span>
                      </p>
                      {vol.notes && <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">"{vol.notes}"</p>}
                    </div>
                  </div>

                  {isApproved ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                    </span>
                  ) : vol.status === "REJECTED" ? (
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Rejected
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => rejectVolunteerOffer(vol.requestId || req?.id || "", vol.id)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveVolunteerOffer(vol.requestId || req?.id || "", vol.id)}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 5: My Volunteered Offers */}
      {activeTab === "my-volunteers" && (
        <div className="space-y-4">
          {myVolunteeredOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
              <p className="text-xs text-slate-500">You haven't volunteered for any peer coverage requests yet.</p>
            </div>
          ) : (
            myVolunteeredOffers.slice(0, 50).map((vol) => {
              const req = leaveRequests.find((r) => r.id === vol.requestId);
              if (!req) return null;

              const isAccepted = req.approvedDoctorId === user.id || vol.status === "ACCEPTED";
              const isRejected = vol.status === "REJECTED";
              const reqDoc = doctors.find(d => d.id === req.doctorId);

              return (
                <div
                  key={vol.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={req.doctorProfilePhoto || req.requesterPhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"}
                      alt={req.doctorName}
                      onClick={() => reqDoc && onSelectDoctorDetails(reqDoc)}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <div className="space-y-1">
                      <h3
                        onClick={() => reqDoc && onSelectDoctorDetails(reqDoc)}
                        className="text-sm font-bold text-slate-900 cursor-pointer hover:text-sky-700 transition-colors"
                      >
                        Request for {req.doctorName}
                      </h3>
                      <p className="text-xs font-bold text-slate-800">
                        {req.coverageType || req.shiftType} on <span className="text-sky-700">{req.shiftDate || new Date(req.leaveStartDate).toLocaleDateString()}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[10px]">
                        <MapPin className="w-3 h-3" />
                        <span>{req.hospital || "Hospital"} • {req.clinicAddress || "Location attached"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isAccepted ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Coverage Accepted
                        </span>
                        <button
                          onClick={() => reqDoc && handleStartChat(reqDoc)}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message Doctor
                        </button>
                      </div>
                    ) : isRejected ? (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Your coverage request was rejected.
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Waiting for approval
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};


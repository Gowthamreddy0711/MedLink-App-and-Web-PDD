import React, { useState } from "react";
import { User } from "../../types";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileText, CheckSquare, ShieldCheck, Download, Loader2 } from "lucide-react";
import { updateDoctorApprovalStatus } from "../../firebase/firestoreService";
import { useAuth } from "../../context/AuthContext";

interface AdminVerificationProfileProps {
  doctor: User;
  onBack: () => void;
}

export const AdminVerificationProfile: React.FC<AdminVerificationProfileProps> = ({ doctor, onBack }) => {
  const { user: adminUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    url: "",
    title: ""
  });
  const [isDocLoading, setIsDocLoading] = useState(false);

  const isPdf = (url: string) => {
    return url ? url.toLowerCase().includes('.pdf') : false;
  };

  // Checklist states
  const [checklist, setChecklist] = useState({
    identity: false,
    medicalRegistration: false,
    medicalLicense: false,
    qualification: false,
    professionalInfo: false,
    hospitalInfo: false,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const handleUpdateStatus = async (status: "APPROVED" | "REJECTED", reason?: string) => {
    if (!adminUser) return;
    setIsUpdating(true);
    setError("");
    try {
      await updateDoctorApprovalStatus(
        doctor.id, 
        doctor.name || doctor.fullName || "Doctor", 
        status, 
        adminUser.uid || adminUser.id, 
        adminUser.name || adminUser.fullName || "Admin", 
        reason
      );
      onBack(); // Return to dashboard after action
    } catch (err: any) {
      setError("Failed to update status. Please try again.");
      setIsUpdating(false);
    }
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    handleUpdateStatus("REJECTED", rejectionReason);
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12 relative">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/80">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Review Application</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive doctor verification</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl border border-rose-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img 
            src={doctor.photoUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"} 
            alt={doctor.name}
            className="w-20 h-20 rounded-full object-cover border border-slate-200 bg-white"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{doctor.fullName || doctor.name}</h2>
              {doctor.approvalStatus === "PENDING" && <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded-md">Pending</span>}
              {doctor.approvalStatus === "APPROVED" && <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md">Approved</span>}
              {doctor.approvalStatus === "REJECTED" && <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded-md">Rejected</span>}
            </div>
            <p className="text-sky-700 font-semibold text-sm">{doctor.specialty} • {doctor.department}</p>
            <p className="text-slate-500 text-xs mt-1">Applied: {new Date(doctor.joinedDate).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {doctor.approvalStatus === "PENDING" && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 md:flex-none px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className={`flex-1 md:flex-none px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${allChecked ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer" : "bg-emerald-300 cursor-not-allowed"}`}
                title={allChecked ? "Approve Doctor" : "Complete checklist to approve"}
                disabled={!allChecked}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            </>
          )}
          {doctor.approvalStatus === "REJECTED" && (
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
              <p className="text-[10px] font-bold text-rose-800 uppercase mb-1">Rejection Reason</p>
              <p className="text-xs text-rose-700 font-medium">{doctor.rejectionReason || "No reason provided."}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            
            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.fullName || doctor.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.dob ? new Date(doctor.dob).toLocaleDateString() : "Not specified"}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.phone || doctor.phoneNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {[doctor.hospitalAddress, doctor.city, doctor.state, doctor.pinCode, doctor.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                Professional & Medical Registration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical License</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialization</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.specialty}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualification</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.qualification || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.experience || doctor.experienceYears} Years</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                Hospital Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Name</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.hospitalName || doctor.hospital}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital ID</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.hospitalId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.department}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                Documents
              </h3>
              
              <div className="space-y-4">
                {/* Government ID Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Government ID</p>
                      <p className="text-xs text-slate-500">Uploaded on registration</p>
                    </div>
                  </div>
                  {doctor.govIdUrl || doctor.governmentIdUrl ? (
                    <button 
                      onClick={() => {
                        setViewerState({ isOpen: true, url: doctor.govIdUrl || doctor.governmentIdUrl || "", title: "Government ID" });
                        setIsDocLoading(true);
                      }}
                      className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 opacity-70 cursor-not-allowed">Not uploaded</span>
                  )}
                </div>

                {/* Medical Certificate Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Medical Certificate</p>
                      <p className="text-xs text-slate-500">Uploaded on registration</p>
                    </div>
                  </div>
                  {doctor.medicalCertificateUrl ? (
                    <button 
                      onClick={() => {
                        setViewerState({ isOpen: true, url: doctor.medicalCertificateUrl || "", title: "Medical Certificate" });
                        setIsDocLoading(true);
                      }}
                      className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 opacity-70 cursor-not-allowed">Not uploaded</span>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Right Col: Checklist */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs sticky top-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              Verification Checklist
            </h3>
            {doctor.approvalStatus === "PENDING" ? (
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Review all information and mark items as verified before approving the practitioner.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Checklist is read-only for processed applications.
              </p>
            )}

            <div className="space-y-3">
              {[
                { key: "identity", label: "Identity Verified" },
                { key: "medicalRegistration", label: "Medical Registration Verified" },
                { key: "medicalLicense", label: "Medical License Verified" },
                { key: "qualification", label: "Qualification Verified" },
                { key: "professionalInfo", label: "Professional Info Verified" },
                { key: "hospitalInfo", label: "Hospital Info Verified" },
              ].map((item) => {
                const isChecked = checklist[item.key as keyof typeof checklist] || doctor.approvalStatus === "APPROVED";
                const disabled = doctor.approvalStatus !== "PENDING";
                
                return (
                  <label key={item.key} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${disabled ? "" : "cursor-pointer hover:bg-slate-50"}`}>
                    <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => !disabled && toggleChecklist(item.key as keyof typeof checklist)} 
                        className="peer sr-only"
                        disabled={disabled}
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-colors ${
                        isChecked 
                          ? "bg-emerald-500 border-emerald-500" 
                          : "border-slate-300 bg-white"
                      }`}></div>
                      <CheckSquare className={`w-3.5 h-3.5 text-white absolute transition-opacity ${isChecked ? "opacity-100" : "opacity-0"}`} />
                    </div>
                    <span className={`text-sm font-medium ${isChecked ? "text-slate-900" : "text-slate-600"}`}>
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
            
            {doctor.approvalStatus === "PENDING" && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</p>
                <div className={`mt-1 text-center text-xs font-bold py-1.5 rounded-lg ${allChecked ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>
                  {allChecked ? "Ready to Approve" : "Verification Incomplete"}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Reject Doctor?</h2>
              <p className="text-sm text-slate-500 mb-4">
                You are about to reject the registration for <strong>{doctor.fullName || doctor.name}</strong>. This will prevent them from accessing the clinical network.
              </p>
              
              <form onSubmit={handleRejectConfirm}>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Rejection Reason <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This reason will be recorded in the activity log.</p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Reject Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Approve Doctor?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to approve <strong>{doctor.fullName || doctor.name}</strong>? They will gain immediate access to the MedLink Practitioner Network.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus("APPROVED")}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Approve Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

    {/* Document Viewer Modal */}
    {viewerState.isOpen && (
      <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              {viewerState.title}
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setViewerState({ ...viewerState, isOpen: false });
                }}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Viewer Area */}
          <div className="flex-1 bg-slate-100 overflow-hidden relative flex items-center justify-center">
            {isPdf(viewerState.url) ? (
              <iframe 
                src={viewerState.url} 
                className="w-full h-full border-0 relative z-20" 
                title={viewerState.title}
                onLoad={() => setIsDocLoading(false)}
                onError={() => setIsDocLoading(false)}
              />
            ) : (
              <div className="w-full h-full p-4 flex items-center justify-center overflow-auto relative z-20">
                <img 
                  src={viewerState.url} 
                  alt={viewerState.title} 
                  className="max-w-full max-h-full object-contain shadow-sm border border-slate-200 bg-white"
                  onLoad={() => setIsDocLoading(false)}
                  onError={() => setIsDocLoading(false)}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    )}
    </>
  );
};

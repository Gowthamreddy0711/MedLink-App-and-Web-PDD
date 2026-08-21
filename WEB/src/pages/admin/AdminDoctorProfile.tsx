import React, { useState } from "react";
import { User } from "../../types";
import { ArrowLeft, User as UserIcon, ShieldCheck, Phone, Mail, Building2, MapPin, Calendar, Award, AlertCircle, CheckCircle2, XCircle, FileText, ExternalLink, Loader2 } from "lucide-react";
import { updateDoctorApprovalStatus, updateMedicalCertificateStatus } from "../../firebase/firestoreService";
import { auth } from "../../firebase/config";

interface AdminDoctorProfileProps {
  doctor: User;
  onBack: () => void;
}

export const AdminDoctorProfile: React.FC<AdminDoctorProfileProps> = ({ doctor, onBack }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingCert, setIsUpdatingCert] = useState(false);
  const [error, setError] = useState("");
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    url: "",
    title: ""
  });
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");

  const isPdf = (url: string) => {
    return url ? url.toLowerCase().includes('.pdf') : false;
  };

  React.useEffect(() => {
    let objectUrl = "";
    
    if (viewerState.isOpen && isPdf(viewerState.url)) {
      setIsDocLoading(true);
      fetch(viewerState.url)
        .then(res => res.blob())
        .then(blob => {
          // Create a new blob forcing application/pdf to override Cloudinary's attachment disposition
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(pdfBlob);
          setPdfBlobUrl(objectUrl);
          setIsDocLoading(false);
        })
        .catch(err => {
          console.error("Failed to load PDF:", err);
          setIsDocLoading(false);
        });
    } else {
      setPdfBlobUrl("");
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [viewerState.isOpen, viewerState.url]);

  const handleUpdateStatus = async (status: "APPROVED" | "REJECTED") => {
    if (status === "APPROVED" && doctor.medicalCertificateUrl && doctor.medicalCertificateStatus !== "VERIFIED") {
      setError("Cannot approve doctor. The medical certificate must be reviewed and verified first.");
      return;
    }

    setIsUpdating(true);
    setError("");
    try {
      const adminUid = auth.currentUser?.uid || "admin";
      const adminName = auth.currentUser?.displayName || "Admin";
      await updateDoctorApprovalStatus(doctor.id, doctor.fullName || "Doctor", status, adminUid, adminName, "");
      onBack(); // Return to dashboard after action
    } catch (err: any) {
      setError("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCertUpdate = async (status: "VERIFIED" | "INVALID") => {
    let reason = "";
    if (status === "INVALID") {
      const input = prompt("Please provide a reason for marking this certificate as invalid:");
      if (input === null) return;
      reason = input.trim();
      if (!reason) {
        setError("A reason is required to mark the certificate as invalid.");
        return;
      }
    }
    setIsUpdatingCert(true);
    setError("");
    try {
      const adminUid = auth.currentUser?.uid || "admin";
      const adminName = auth.currentUser?.displayName || "Admin";
      await updateMedicalCertificateStatus(doctor.id, doctor.fullName || "Doctor", status, adminUid, adminName, reason);
    } catch (err: any) {
      setError("Failed to update certificate status. Please try again.");
    } finally {
      setIsUpdatingCert(false);
    }
  };

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/80">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Review Application</h1>
          <p className="text-xs text-slate-500 mt-0.5">Approve or reject doctor platform access.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl border border-rose-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {doctor.approvalStatus === "PENDING" && doctor.medicalCertificateUrl && doctor.medicalCertificateStatus !== "VERIFIED" && (
        <div className="p-4 bg-amber-50 text-amber-800 text-sm font-semibold rounded-xl border border-amber-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          ⚠ Medical certificate has not been verified. Please review it before approving.
        </div>
      )}

      {/* Main Profile Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {doctor.photoUrl || doctor.avatarUrl ? (
              <img 
                src={doctor.photoUrl || doctor.avatarUrl} 
                alt={doctor.name}
                className="w-20 h-20 rounded-full object-cover border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border border-slate-200 bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-2xl">
                {doctor.name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "DR"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{doctor.fullName}</h2>
                {doctor.approvalStatus === "PENDING" && <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded-md">Pending</span>}
                {doctor.approvalStatus === "APPROVED" && <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md">Approved</span>}
                {doctor.approvalStatus === "REJECTED" && <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded-md">Rejected</span>}
              </div>
              <p className="text-sky-700 font-semibold text-sm">{doctor.specialty} • {doctor.department}</p>
              <p className="text-slate-500 text-xs mt-1">Joined: {new Date(doctor.joinedDate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {doctor.approvalStatus !== "APPROVED" && (
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus("APPROVED")}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            )}
            {doctor.approvalStatus !== "REJECTED" && (
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus("REJECTED")}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">VERIFICATION DOCUMENTS</h3>
          
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-sky-600 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Government ID</h4>
                  {doctor.govIdUrl || doctor.governmentIdUrl ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">Government ID not uploaded.</p>
                  )}
                </div>
              </div>
              
              {(doctor.govIdUrl || doctor.governmentIdUrl) && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setViewerState({ isOpen: true, url: doctor.govIdUrl || doctor.governmentIdUrl || "", title: "Government ID" });
                      setIsDocLoading(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    View Government ID <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-sky-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Medical Certificate</h4>
                  {doctor.medicalCertificateUrl ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">Status:</span>
                      {doctor.medicalCertificateStatus === "VERIFIED" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                      {doctor.medicalCertificateStatus === "INVALID" && <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded-md flex items-center gap-1"><XCircle className="w-3 h-3" /> Invalid</span>}
                      {(!doctor.medicalCertificateStatus || doctor.medicalCertificateStatus === "NOT_REVIEWED") && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded-md flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Not Reviewed</span>}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">Medical certificate not uploaded.</p>
                  )}
                  {doctor.medicalCertificateReason && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">Reason: {doctor.medicalCertificateReason}</p>
                  )}
                </div>
              </div>
              
              {doctor.medicalCertificateUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setViewerState({ isOpen: true, url: doctor.medicalCertificateUrl || "", title: "Medical Certificate" });
                      setIsDocLoading(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    View Certificate <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {doctor.medicalCertificateStatus !== "VERIFIED" && (
                    <button 
                      onClick={() => handleCertUpdate("VERIFIED")}
                      disabled={isUpdatingCert}
                      className="w-full sm:w-auto px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer shrink-0"
                    >
                      Mark Verified
                    </button>
                  )}
                  {doctor.medicalCertificateStatus !== "INVALID" && (
                    <button 
                      onClick={() => handleCertUpdate("INVALID")}
                      disabled={isUpdatingCert}
                      className="w-full sm:w-auto px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer shrink-0"
                    >
                      Mark Invalid
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{doctor.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{doctor.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">
                  {[doctor.hospitalAddress, doctor.city, doctor.state].filter(Boolean).join(", ") || "No address provided"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Professional Credentials</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold">{doctor.hospitalName || "Independent"}</p>
                  <p className="text-xs text-slate-500">Primary Affiliation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold">{doctor.licenseNumber || "Pending"}</p>
                  <p className="text-xs text-slate-500">Medical License Number</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Award className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold">{doctor.qualification || "Not specified"}</p>
                  <p className="text-xs text-slate-500">Qualifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {doctor.bio && (
          <div className="pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2">Professional Bio</h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
              {doctor.bio}
            </p>
          </div>
        )}
      </div>
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
                  setPdfBlobUrl("");
                }}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Viewer Area */}
          <div className="flex-1 bg-slate-100 overflow-hidden relative flex items-center justify-center">
            {isDocLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-2" />
                <p className="text-sm font-semibold text-slate-600">Loading document...</p>
              </div>
            )}

            {!isDocLoading && isPdf(viewerState.url) && pdfBlobUrl && (
              <iframe 
                src={pdfBlobUrl} 
                className="w-full h-full border-0 relative z-20" 
                title={viewerState.title}
              />
            )}
            
            {!isDocLoading && !isPdf(viewerState.url) && (
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

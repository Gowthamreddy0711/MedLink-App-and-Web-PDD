import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Users, Clock, XCircle, CheckCircle2, FileText } from "lucide-react";
import { User, LeaveRequest } from "../../types";
import { subscribeAllDoctors, subscribeAllLeaveRequests } from "../../firebase/firestoreService";
import { AdminDoctorProfile } from "./AdminDoctorProfile";

export const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubDoc = subscribeAllDoctors((data) => setDoctors(data));
    const unsubReqs = subscribeAllLeaveRequests((data) => setLeaveRequests(data));
    return () => {
      unsubDoc();
      unsubReqs();
    };
  }, []);
  const pendingDoctors = doctors.filter((d) => d.approvalStatus === "PENDING");
  const approvedDoctors = doctors.filter((d) => d.approvalStatus === "APPROVED");
  const rejectedDoctors = doctors.filter((d) => d.approvalStatus === "REJECTED");

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            Compliance Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Doctor Verification & Clinical Oversight</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate("/admin/verification?tab=PENDING")}
          className="p-5 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition-colors bg-white border-slate-200/80 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{pendingDoctors.length}</p>
              <p className="text-xs font-bold text-slate-500">Pending Review</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => navigate("/admin/verification?tab=APPROVED")}
          className="p-5 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition-colors bg-white border-slate-200/80 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{approvedDoctors.length}</p>
              <p className="text-xs font-bold text-slate-500">Approved Doctors</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate("/admin/verification?tab=REJECTED")}
          className="p-5 rounded-2xl border shadow-xs space-y-2 cursor-pointer transition-colors bg-white border-slate-200/80 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{rejectedDoctors.length}</p>
              <p className="text-xs font-bold text-slate-500">Rejected Registrations</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate("/admin/leave-requests")}
          className="p-5 rounded-2xl border shadow-xs space-y-2 bg-white border-slate-200/80 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{leaveRequests.length}</p>
              <p className="text-xs font-bold text-slate-500">Total Leave Requests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

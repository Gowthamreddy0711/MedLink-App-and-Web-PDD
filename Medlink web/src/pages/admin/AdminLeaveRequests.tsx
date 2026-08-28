import React, { useState, useEffect } from "react";
import { FileText, MapPin, Clock, Calendar, ShieldCheck, Building2, User, AlertCircle, Loader2 } from "lucide-react";
import { LeaveRequest } from "../../types";
import { subscribeAllLeaveRequests } from "../../firebase/firestoreService";

export const AdminLeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAllLeaveRequests(
      (data) => {
        setRequests(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (err.message.includes("permission-denied") || err.message.includes("Missing or insufficient permissions")) {
          setError("You don't have permission to view leave requests.");
        } else {
          setError("Unable to load leave requests. Please try again.");
        }
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-300">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading leave requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-300">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-800 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            All Leave Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Organization-wide coverage requests and assignment tracking (Read-Only).</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Active & Historical Requests
          </h3>
          <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">
            Total: {requests.length}
          </span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No leave requests found.
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  
                  {/* Left Side: Doctor Info & Request details */}
                  <div className="flex gap-4">
                    <img 
                      src={req.doctorProfilePhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"} 
                      alt={req.doctorName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{req.doctorName}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                          req.status === "OPEN" || req.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                          req.status === "APPROVED" || req.status === "Assigned" ? "bg-emerald-100 text-emerald-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-sky-600 mt-0.5">{req.specialization || req.requesterSpecialty}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {req.shiftDate}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {req.shiftType}</span>
                        <span className={`flex items-center gap-1.5 font-bold ${req.priority === "High" || req.priority === "Emergency" || req.priority === "Urgent" ? "text-rose-600" : "text-amber-600"}`}>Priority: {req.priority || req.urgency}</span>
                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {req.hospital}</span>
                        {req.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {req.location}</span>}
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-700">Reason:</p>
                        <p className="text-xs text-slate-600 mt-0.5 bg-slate-100 p-2 rounded-lg">{req.reason}</p>
                      </div>
                      
                      {req.notes && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-slate-700">Handover Note:</p>
                          <p className="text-xs text-slate-600 mt-0.5 bg-amber-50 border border-amber-100 p-2 rounded-lg italic">{req.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Coverage Info */}
                  <div className="sm:text-right shrink-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Coverage Status</p>
                    
                    {req.assignedVolunteerName ? (
                      <div className="inline-flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div className="text-left pr-2">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Assigned Cover</p>
                          <p className="text-xs font-bold text-emerald-900">{req.assignedVolunteerName}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="text-left pr-2">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                          <p className="text-xs font-bold text-slate-700">Awaiting Volunteer</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

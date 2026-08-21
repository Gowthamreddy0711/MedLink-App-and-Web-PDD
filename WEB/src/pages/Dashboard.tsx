import React, { useState, useMemo } from "react";
import {
  Calendar,
  Users,
  FileText,
  Shield,
  CalendarDays,
  MessageSquare,
  Megaphone,
  BarChart3,
  Globe,
  Bot,
  RotateCw,
  Bell,
  Check,
  Building2,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import { LeaveRequestModal } from "../components/LeaveRequestModal";
import { VolunteerModal } from "../components/VolunteerModal";
import { LeaveRequest } from "../types";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, toggleAvailability } = useAuth();
  const { notifications, leaveRequests } = useData();
  const navigate = useNavigate();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedVolunteerReq, setSelectedVolunteerReq] = useState<LeaveRequest | null>(null);

  if (!user) return null;

  const myRequests = leaveRequests.filter((r) => r.doctorId === user.id || r.requesterUid === user.id);
  const myPendingRequests = myRequests.filter(r => r.status === "PENDING" || r.status === "OPEN" || r.status === "Open").length;
  const myApprovedRequests = myRequests.filter(r => r.status === "APPROVED" || r.status === "ACCEPTED" || r.status === "Assigned").length;
  const myCompletedRequestsCount = myRequests.filter(r => r.status === "COMPLETED").length;

  const openOpportunitiesCount = leaveRequests.filter(r => {
    if (r.doctorId === user.id || r.requesterUid === user.id) return false;
    if (r.status !== "OPEN" && r.status !== "PENDING" && r.status !== "Open") return false;
    if ((r.rejectedDoctorIds || []).includes(user.id)) return false;
    const leaveEndDate = r.leaveEndDate || Date.now() + 24 * 60 * 60 * 1000;
    if (leaveEndDate <= Date.now()) return false;
    return true;
  }).length;

  const myDuties = leaveRequests.filter((r) => r.approvedDoctorId === user.id || r.assignedVolunteerUid === user.id);
  const myActiveDutiesCount = myDuties.filter(r => r.status !== "COMPLETED").length;
  const myCompletedDutiesCount = myDuties.filter(r => r.status === "COMPLETED").length;

  const rawName = user.name || user.fullName || "Doctor";
  const displayName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
  const unreadNotifsCount = useMemo(() => notifications.filter((n) => !n.isRead && !(n as any).read).length, [notifications]);
  const isAvail = user.clinicStatus === "Available" || user.isAvailableForCoverage;
  const isVerified = !!user.verified || !!user.isPractitionerVerified;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12">
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

      {/* Header Greeting & Notifications */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome, {displayName}</span>
            <span className="text-2xl animate-bounce">👋</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            Your Coverage. Our Continuity. Better Healthcare.
          </p>
        </div>

        <button
          onClick={() => onNavigate("notices")}
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 relative cursor-pointer transition-transform active:scale-95 shrink-0"
          title="View Notifications"
        >
          <Bell className="w-5 h-5 text-slate-800 fill-slate-800" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Top Cards: Medical License & Availability Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Medical License Card */}
        <div className="bg-[#1c2433] text-white rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-5 h-5 rounded-full bg-slate-700/80 flex items-center justify-center">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
              Medical License
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {user.licenseNumber || "Verified"}
            </span>

            <span className={`text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs ${isVerified ? "bg-[#00c853]" : "bg-amber-600"}`}>
              <span>✓</span>
              <span>{isVerified ? "Verified" : "Pending"}</span>
            </span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-[#eaf8f0] border border-emerald-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800">
              Status
            </span>

            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAvail ? "bg-emerald-600 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="text-base md:text-lg font-bold text-emerald-950">
                {isAvail ? "Available" : "Unavailable"}
              </span>
            </div>

            <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">Tap to change</p>
          </div>

          <div className="flex justify-center mt-1">
            <button
              onClick={toggleAvailability}
              className="p-2 bg-emerald-100/90 hover:bg-emerald-200/90 text-emerald-800 rounded-full transition-all cursor-pointer active:scale-90"
              title="Toggle Availability"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Practitioner Summary Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <p className="text-[10px] font-bold tracking-wider uppercase text-sky-800">
          Practitioner Summary
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatarUrl || user.photoUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-2xs shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-slate-900 truncate">
                {displayName}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                {user.specialty || "General Medicine"} • {user.department || "General Care"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end text-xs font-semibold text-slate-700 gap-1 shrink-0">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{user.hospitalName || user.hospital || "MedLink Hospital"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>{(user.experience || user.experienceYears) ? `${user.experience || user.experienceYears}y Exp` : "5y Exp"}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1">
              <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAvail ? "Available" : "Unavailable"}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span className="text-amber-500 font-black">★</span>
              <span>{(user.coverageRating || 5.0).toFixed(1)} ({user.coverageRatingCount || 0} reviews)</span>
            </span>
          </div>
        </div>
      </div>

      {/* QUICK OVERVIEW SECTION */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs md:text-sm font-extrabold text-slate-800 tracking-wider uppercase">
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          
          <div onClick={() => navigate("/coverage", { state: { tab: "my-requests" } })} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-sky-300 transition-all">
            <h3 className="text-xs font-bold text-slate-500 mb-1">My Leave Requests</h3>
            <p className="text-xl font-black text-slate-900 mb-2">Total: {myRequests.length}</p>
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span className="text-amber-600">Pending: {myPendingRequests}</span>
              <span className="text-emerald-600">Approved: {myApprovedRequests}</span>
            </div>
          </div>

          <div onClick={() => navigate("/coverage", { state: { tab: "opportunities" } })} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
            <h3 className="text-xs font-bold text-slate-500 mb-1">Coverage Requests</h3>
            <p className="text-xl font-black text-blue-700">{openOpportunitiesCount} Available</p>
          </div>

          <div onClick={() => navigate("/coverage", { state: { tab: "duties" } })} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all">
            <h3 className="text-xs font-bold text-slate-500 mb-1">My Coverage Duties</h3>
            <p className="text-xl font-black text-slate-900 mb-2">{myDuties.length} Total</p>
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span className="text-indigo-600">Active: {myActiveDutiesCount}</span>
              <span className="text-emerald-600">Completed: {myCompletedDutiesCount}</span>
            </div>
          </div>

          <div onClick={() => navigate("/coverage", { state: { tab: "my-requests", section: "completed-leave-history" } })} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all">
            <h3 className="text-xs font-bold text-slate-500 mb-1">Completed Leave History</h3>
            <p className="text-xl font-black text-emerald-700">{myCompletedRequestsCount} Completed</p>
          </div>

          <div onClick={() => navigate("/coverage", { state: { tab: "duties", section: "completed-coverage-duties" } })} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all">
            <h3 className="text-xs font-bold text-slate-500 mb-1">Completed Coverage Duties</h3>
            <p className="text-xl font-black text-emerald-700">{myCompletedDutiesCount} Completed</p>
          </div>

        </div>
      </div>

      {/* Clinical Operations Heading */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs md:text-sm font-extrabold text-slate-800 tracking-wider uppercase">
          Clinical Operations
        </h2>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* 1. Request Leave */}
          <div
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-emerald-100/70 text-emerald-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Request Leave
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Submit coverage request</p>
            </div>
          </div>

          {/* 2. Coverage Opportunities */}
          <div
            onClick={() => navigate("/coverage", { state: { tab: "opportunities" } })}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-blue-100/70 text-blue-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Coverage Opportunities
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Active requests in network</p>
            </div>
          </div>

          {/* 3. My Leave Status */}
          <div
            onClick={() => navigate("/coverage", { state: { tab: "my-requests" } })}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-amber-100/70 text-amber-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                My Leave Status
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Pending approvals & history</p>
            </div>
          </div>

          {/* 4. Coverage Duties */}
          <div
            onClick={() => navigate("/coverage", { state: { tab: "duties" } })}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-purple-100/70 text-purple-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Coverage Duties
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Current assigned shifts</p>
            </div>
          </div>

          {/* 5. Coverage Calendar */}
          <div
            onClick={() => onNavigate("calendar")}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-indigo-100/70 text-indigo-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Coverage Calendar
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly shift schedule</p>
            </div>
          </div>

          {/* 7. Clinician Directory */}
          <div
            onClick={() => onNavigate("directory")}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-teal-100/70 text-teal-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Clinician Directory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Find doctors in your network</p>
            </div>
          </div>

          {/* 8. My Analytics */}
          <div
            onClick={() => onNavigate("analytics")}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-rose-100/70 text-rose-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                My Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Shift & continuity performance</p>
            </div>
          </div>

          {/* 10. Smart Assistant */}
          <div
            onClick={() => onNavigate("clinical-ai")}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="p-3 bg-blue-100/70 text-blue-700 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Smart Assistant
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Clinical decision support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

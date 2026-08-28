import React, { useState, useMemo } from "react";
import { CalendarView } from "../components/CalendarView";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { LeaveRequest } from "../types";
import { Filter, Calendar as CalendarIcon, Clock, User, ShieldCheck } from "lucide-react";

export const CoverageCalendar: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests } = useData();
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>("All");

  const departments = useMemo(() => ["All", ...Array.from(new Set(leaveRequests.map((r) => r.specialization).filter(Boolean))) as string[]], [leaveRequests]);

  const filteredRequests = useMemo(() => filterDepartment === "All"
    ? leaveRequests
    : leaveRequests.filter((r) => r.specialization === filterDepartment), [leaveRequests, filterDepartment]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coverage & Duty Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive schedule view of hospital shift coverage, requested leaves, and assigned duties.
          </p>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Department:</span>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Calendar View */}
      <CalendarView
        requests={filteredRequests}
        userUid={user?.uid}
        onSelectRequest={(req) => setSelectedReq(req)}
      />

      {/* Selected Shift Detail Drawer / Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md">
                  {selectedReq.shiftType}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedReq.shiftDate}</h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Doctor: <strong className="text-slate-900">{selectedReq.requesterName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span>Department: {selectedReq.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Urgency: {selectedReq.urgency}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 italic">
                "{selectedReq.reason}"
              </div>
              {selectedReq.assignedVolunteerName && (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Covered by: <strong>{selectedReq.assignedVolunteerName}</strong></span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReq(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

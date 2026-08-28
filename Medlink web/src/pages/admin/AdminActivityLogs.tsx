import React, { useState, useEffect } from "react";
import { Activity, Search, Filter, Clock } from "lucide-react";
import { AdminActivityLog } from "../../types";
import { subscribeAdminActivityLogs } from "../../firebase/firestoreService";

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = subscribeAdminActivityLogs(
      (data) => {
        setLogs(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Failed to load activity logs.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.doctorName.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatAction = (action: string) => {
    switch (action) {
      case "DOCTOR_APPROVED": return "approved registration for";
      case "DOCTOR_REJECTED": return "rejected registration for";
      case "DOCTOR_PROFILE_REVIEWED": return "reviewed profile for";
      default: return action.replace(/_/g, " ").toLowerCase();
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "DOCTOR_APPROVED": return "text-emerald-600 bg-emerald-50";
      case "DOCTOR_REJECTED": return "text-rose-600 bg-rose-50";
      default: return "text-sky-600 bg-sky-50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Activity Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Audit trail of administrator actions</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Filters/Search */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by doctor, admin, action, reason..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>
          <button className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 min-h-[300px]">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-600">Loading activity logs...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-500 text-sm font-bold">{error}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">No activity recorded.</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex gap-4">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActionColor(log.action)}`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-bold text-slate-900">{log.adminName}</span>{" "}
                      <span className="text-slate-600">{formatAction(log.action)}</span>{" "}
                      <span className="font-bold text-slate-900">{log.doctorName}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  {log.reason && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Reason: </span> {log.reason}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

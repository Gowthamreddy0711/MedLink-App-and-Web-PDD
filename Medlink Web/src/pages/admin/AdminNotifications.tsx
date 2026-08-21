import React, { useState, useEffect } from "react";
import { Bell, Search, Filter, Clock, CheckCircle2, ChevronRight, UserPlus, FileText } from "lucide-react";
import { AdminNotification } from "../../types";
import { subscribeAdminNotifications, markAdminNotificationRead } from "../../firebase/firestoreService";
import { useNavigate } from "react-router-dom";

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeAdminNotifications(
      (data) => {
        setNotifications(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Failed to load notifications.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleNotificationClick = async (notif: AdminNotification) => {
    if (!notif.isRead) {
      await markAdminNotificationRead(notif.id);
    }
    if (notif.type === "NEW_REGISTRATION" || notif.type === "DOCTOR_REAPPLICATION") {
      navigate("/admin/verification?tab=PENDING");
    } else if (notif.type === "NEW_LEAVE_REQUEST") {
      navigate("/admin/leave-requests");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_REGISTRATION": return <UserPlus className="w-5 h-5 text-indigo-600" />;
      case "DOCTOR_REAPPLICATION": return <UserPlus className="w-5 h-5 text-amber-600" />;
      case "NEW_LEAVE_REQUEST": return <FileText className="w-5 h-5 text-emerald-600" />;
      default: return <Bell className="w-5 h-5 text-sky-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-600" />
            Notifications {unreadCount > 0 && <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">{unreadCount}</span>}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Stay updated on compliance and oversight events</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* List */}
        <div className="divide-y divide-slate-100 min-h-[300px]">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-600">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-500 text-sm font-bold">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-slate-600">You're all caught up.</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications to show.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 transition-colors flex gap-4 cursor-pointer group ${notif.isRead ? "bg-white hover:bg-slate-50" : "bg-sky-50/50 hover:bg-sky-50"}`}
              >
                <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs ${notif.isRead ? "bg-slate-100" : "bg-white border border-sky-100"}`}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h4 className={`text-sm ${notif.isRead ? "font-semibold text-slate-700" : "font-black text-slate-900"}`}>
                      {notif.title}
                    </h4>
                    <div className={`flex items-center gap-1.5 text-[11px] shrink-0 ${notif.isRead ? "text-slate-400 font-medium" : "text-sky-600 font-bold"}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${notif.isRead ? "text-slate-500" : "text-slate-700"}`}>
                    {notif.message}
                  </p>
                </div>
                <div className="flex items-center justify-center shrink-0">
                  <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${notif.isRead ? "text-slate-300" : "text-sky-400"}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

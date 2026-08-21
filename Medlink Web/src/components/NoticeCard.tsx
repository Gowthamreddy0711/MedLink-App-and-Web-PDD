import React from "react";
import { AlertCircle, FileText, Bell, Award, Calendar } from "lucide-react";
import { HospitalNotice } from "../types";

interface NoticeCardProps {
  notice: HospitalNotice;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const getBadgeStyle = () => {
    switch (notice.category) {
      case "Urgent Alert":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Policy Update":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CME Event":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-sky-100 text-sky-800 border-sky-200";
    }
  };

  const getIcon = () => {
    switch (notice.category) {
      case "Urgent Alert":
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case "Policy Update":
        return <FileText className="w-4 h-4 text-amber-600" />;
      case "CME Event":
        return <Award className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border bg-white shadow-xs transition-all hover:shadow-md ${
        notice.isImportant ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
          >
            {notice.category}
          </span>
          {notice.isImportant && (
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-rose-600 text-white rounded-md">
              High Priority
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{notice.date}</span>
        </div>
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">{notice.title}</h3>
      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{notice.content}</p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Issued by: {notice.author}</span>
        <span>{notice.department}</span>
      </div>
    </div>
  );
};

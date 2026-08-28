import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, ShieldCheck } from "lucide-react";
import { LeaveRequest } from "../types";

interface CalendarViewProps {
  requests: LeaveRequest[];
  userUid?: string;
  onSelectRequest?: (req: LeaveRequest) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ requests, userUid, onSelectRequest }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getRequestsForDate = (dayNumber: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    const targetTime = targetDate.getTime();

    return requests.filter((r) => {
      let start = r.leaveStartDate;
      let end = r.leaveEndDate;
      
      if (!start && r.shiftDate) {
        start = new Date(r.shiftDate).getTime();
      }
      if (!end && r.shiftDate) {
        end = new Date(r.shiftDate).getTime();
      }

      if (!start) return false;

      const startObj = new Date(start);
      startObj.setHours(0, 0, 0, 0);
      const startTime = startObj.getTime();

      let endTime = startTime;
      if (end) {
        const endObj = new Date(end);
        endObj.setHours(0, 0, 0, 0);
        endTime = endObj.getTime();
      }

      return targetTime >= startTime && targetTime <= endTime;
    });
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <p className="text-xs text-slate-500">Clinical Coverage Schedule & Duty Roster</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30 text-center text-xs font-semibold text-slate-500 py-2.5">
        {dayLabels.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-100 p-0.5">
        {/* Empty cells before month starts */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="bg-slate-50/40 min-h-[90px] p-2" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dayRequests = getRequestsForDate(dayNum);
          const isToday =
            dayNum === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

          return (
            <div
              key={`day-${dayNum}`}
              className={`bg-white min-h-[95px] p-2 transition-all flex flex-col justify-between hover:bg-sky-50/20 ${
                isToday ? "ring-2 ring-sky-500 ring-inset bg-sky-50/30" : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday ? "bg-sky-600 text-white" : "text-slate-700"
                  }`}
                >
                  {dayNum}
                </span>
                {dayRequests.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {dayRequests.length} {dayRequests.length === 1 ? "shift" : "shifts"}
                  </span>
                )}
              </div>

              <div className="mt-1.5 space-y-1">
                {dayRequests.slice(0, 2).map((req) => {
                  const isMine = req.requesterUid === userUid;
                  const isAssignedToMe = req.assignedVolunteerUid === userUid;

                  return (
                    <button
                      key={req.id}
                      onClick={() => onSelectRequest && onSelectRequest(req)}
                      className={`w-full text-left p-1.5 rounded-md text-[11px] font-medium leading-tight truncate flex items-center gap-1 transition-all cursor-pointer ${
                        req.urgency === "Emergency"
                          ? "bg-rose-100 text-rose-900 border border-rose-200"
                          : isMine
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : isAssignedToMe
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          : "bg-sky-100 text-sky-900 border border-sky-200"
                      }`}
                    >
                      <span className="shrink-0">
                        {req.urgency === "Emergency" ? (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        ) : isAssignedToMe ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-sky-600" />
                        )}
                      </span>
                      <span className="truncate">{req.shiftType}</span>
                    </button>
                  );
                })}

                {dayRequests.length > 2 && (
                  <p className="text-[10px] text-slate-500 font-medium text-center">
                    +{dayRequests.length - 2} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

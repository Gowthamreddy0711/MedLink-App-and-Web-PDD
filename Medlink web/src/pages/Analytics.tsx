import React, { useMemo } from "react";
import { Clock, CheckCircle2, Award, ShieldCheck, BarChart2, Inbox } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, volunteers } = useData();

  if (!user) return null;

  const { myRequests, myDuties, myVolunteerOffers, totalAssigned, specialtyBreakdown } = useMemo(() => {
    const myRequests = leaveRequests.filter((r) => r.doctorId === user.id || r.requesterUid === user.id);
    const myDuties = leaveRequests.filter((r) => r.approvedDoctorId === user.id || r.assignedVolunteerUid === user.id);
    const myVolunteerOffers = volunteers.filter((v) => v.doctorId === user.id || v.volunteerUid === user.id);

    const totalAssigned = leaveRequests.filter((r) => r.status === "APPROVED" || r.status === "ACTIVE" || r.status === "COMPLETED" || r.status === "Assigned").length;

    // Department / Specialty Breakdown calculated dynamically from Firestore data
    const specialtyBreakdown: Record<string, { total: number; assigned: number }> = {};
    leaveRequests.forEach((req) => {
      const spec = req.specialization || req.requesterSpecialty || "General Medicine";
      if (!specialtyBreakdown[spec]) {
        specialtyBreakdown[spec] = { total: 0, assigned: 0 };
      }
      specialtyBreakdown[spec].total += 1;
      if (req.status === "APPROVED" || req.status === "ACTIVE" || req.status === "COMPLETED" || req.status === "Assigned") {
        specialtyBreakdown[spec].assigned += 1;
      }
    });

    return { myRequests, myDuties, myVolunteerOffers, totalAssigned, specialtyBreakdown };
  }, [leaveRequests, volunteers, user.id]);

  const totalRequests = leaveRequests.length;
  const networkCoverageRate = totalRequests > 0 ? Math.round((totalAssigned / totalRequests) * 100) : 0;

  const shiftBalanceScore = myDuties.length - myRequests.length;
  const balanceLabel =
    shiftBalanceScore > 0
      ? `+${shiftBalanceScore} Positive`
      : shiftBalanceScore < 0
      ? `${shiftBalanceScore} Deficit`
      : "Balanced (0)";


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shift Coverage Analytics & Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift balance reports, duty hours tracking, and network coverage metrics calculated live from Firestore.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Shift Balance: {balanceLabel}
        </span>
      </div>

      {leaveRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Analytics Data Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No coverage requests or volunteer logs exist in Firestore yet. Submit a leave request or offer coverage to generate real-time metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-900">{myDuties.length * 12} hrs</p>
              <p className="text-xs font-bold text-slate-500">Volunteered Duty Hours</p>
              <p className="text-[11px] text-sky-600 font-medium">{myDuties.length} assigned shift(s)</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-900">{myVolunteerOffers.length}</p>
              <p className="text-xs font-bold text-slate-500">Total Volunteer Offers Submitted</p>
              <p className="text-[11px] text-emerald-600 font-medium">
                {myDuties.length} approved & assigned
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-900">{networkCoverageRate}%</p>
              <p className="text-xs font-bold text-slate-500">Network Fulfillment Rate</p>
              <p className="text-[11px] text-purple-600 font-medium">
                {totalAssigned} of {totalRequests} requests fulfilled
              </p>
            </div>
          </div>

          {/* Dynamic Specialty Coverage Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Specialty Shift Coverage Breakdown</h3>
            <div className="space-y-4 text-xs">
              {Object.entries(specialtyBreakdown).map(([spec, stat]) => {
                const pct = stat.total > 0 ? Math.round((stat.assigned / stat.total) * 100) : 0;
                return (
                  <div key={spec}>
                    <div className="flex justify-between font-bold text-slate-800 mb-1">
                      <span>{spec}</span>
                      <span>
                        {stat.assigned}/{stat.total} ({pct}% Covered)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { X, Hand, Calendar, Clock, User, FileText, MapPin, Building2 } from "lucide-react";
import { LeaveRequest } from "../types";
import { useData } from "../context/DataContext";

interface VolunteerModalProps {
  request: LeaveRequest | null;
  onClose: () => void;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({ request, onClose }) => {
  const { volunteer } = useData();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await volunteer(request.id, notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateRange = () => {
    const start = new Date(request.leaveStartDate || request.shiftDate || Date.now());
    const startStr = start.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (!request.leaveEndDate) return startStr;
    
    const end = new Date(request.leaveEndDate);
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    
    if (startDateOnly === endDateOnly) {
      return startStr;
    }
    
    const endStr = end.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} → ${endStr}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Volunteer for Shift Coverage</h2>
              <p className="text-xs text-slate-500">Offer to cover shift for peer doctor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift details card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-900">
            <span>{request.shiftType}</span>
            <span className="text-sky-700">{formatDateRange()}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Requesting Doctor: {request.requesterName} ({request.requesterSpecialty})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Department: {request.department}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600 mt-2 bg-white p-2 rounded-lg border border-slate-100">
            <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
            <div>
              <span className="font-bold block">{request.hospital || "Hospital / Clinic"}</span>
              <span className="text-[10px] text-slate-500">
                {request.clinicAddress ? `${request.clinicAddress}, ${request.clinicCity || ''} ${request.clinicState || ''} ${request.clinicPin || ''}` : "Location details will be shared upon acceptance."}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/60 text-slate-700 italic">
            "{request.reason}"
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Optional Message / Handover Notes to {request.requesterName}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I am fully available for this shift. I have MICU credentials and am familiar with Ward 3B protocols..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Submitting Offer..." : "Confirm Volunteer Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

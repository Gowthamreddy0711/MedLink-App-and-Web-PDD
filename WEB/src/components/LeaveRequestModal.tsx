import React, { useState } from "react";
import { X, Calendar, Clock, AlertCircle, FileText, Building2, MapPin, Navigation } from "lucide-react";
import { ShiftType, RequestUrgency } from "../types";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { submitRequest } = useData();

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayString();

  const [shiftDate, setShiftDate] = useState(todayStr);
  const [shiftEndDate, setShiftEndDate] = useState(todayStr);
  
  const isDateInvalid = shiftDate < todayStr;
  const isEndDateInvalid = shiftEndDate < shiftDate;

  const [shiftType, setShiftType] = useState<ShiftType>("Day Shift");
  const [urgency, setUrgency] = useState<RequestUrgency>("Normal");
  const [department, setDepartment] = useState(user?.department || "General Medicine Ward 3B");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [hospital, setHospital] = useState(user?.hospital || "St. Jude Metropolitan Medical Center");
  const [location, setLocation] = useState(
    user?.hospitalAddress
      ? `${user.hospitalAddress}, ${user.city || ""} ${user.state || ""} ${user.pinCode || ""}`.trim()
      : ""
  );
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Failed to get location. Please enter it manually.");
        setIsGettingLocation(false);
      }
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (isDateInvalid) return;
    if (isEndDateInvalid) return;

    setIsSubmitting(true);
    try {
      const startDateObj = new Date(shiftDate);
      startDateObj.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(shiftEndDate);
      endDateObj.setHours(23, 59, 59, 999);
      
      const durationMs = endDateObj.getTime() - startDateObj.getTime();
      const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

      await submitRequest({
        hospital: hospital || user?.hospital || "St. Jude Metropolitan Medical Center",
        location,
        latitude,
        longitude,
        shiftDate,
        leaveStartDate: startDateObj.getTime(),
        leaveEndDate: endDateObj.getTime(),
        leaveDuration: `${durationDays} day${durationDays > 1 ? 's' : ''}`,
        shiftType,
        reason,
        urgency,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Request Shift Coverage</h2>
              <p className="text-xs text-slate-500">Submit leave request for peer coverage assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Shift Date (From & To) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>

              <input
                type="date"
                required
                min={todayStr}
                value={shiftDate}
                onChange={(e) => {
                  setShiftDate(e.target.value);
                  if (e.target.value > shiftEndDate) {
                    setShiftEndDate(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 ${isDateInvalid ? 'border-rose-500 text-rose-500 focus:ring-rose-500' : 'border-slate-200 text-slate-800'}`}
              />
              {isDateInvalid ? (
                <p className="mt-1 text-[10px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Past dates not allowed.
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">
                  Select start date.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                required
                min={shiftDate}
                value={shiftEndDate}
                onChange={(e) => setShiftEndDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 ${isEndDateInvalid ? 'border-rose-500 text-rose-500 focus:ring-rose-500' : 'border-slate-200 text-slate-800'}`}
              />
              {isEndDateInvalid ? (
                <p className="mt-1 text-[10px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  To date cannot be before from date.
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">
                  Select end date (inclusive).
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Type</label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as ShiftType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Day Shift">Day Shift (08:00 - 16:00)</option>
                <option value="Night Shift">Night Shift (19:00 - 07:00)</option>
                <option value="On-Call">On-Call Duty</option>
                <option value="ICU Shift">Medical ICU Shift</option>
                <option value="ER Shift">Trauma / ER Shift</option>
                <option value="24hr Duty">24hr Continuous Duty</option>
              </select>
            </div>
          </div>

          {/* Department & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Unit</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as RequestUrgency)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Normal">Normal Request</option>
                <option value="Urgent">Urgent (Within 48h)</option>
                <option value="Emergency">Emergency (Immediate)</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Absence / Coverage Request <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending cardiology conference, personal medical leave, CME exam..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handover / Clinical Notes for Volunteer Doctor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ward 3B has 12 admitted patients. Patient in Bed 4 needs follow-up ABG at 22:00..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Hospital & Location */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Location / Address <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Navigation className="w-3 h-3" />
                  {isGettingLocation ? "Locating..." : "Use Current Location"}
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Saveetha Hospital, Chennai"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
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
                disabled={isSubmitting || !reason.trim() || isDateInvalid}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Publishing..." : "Submit Coverage Request"}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

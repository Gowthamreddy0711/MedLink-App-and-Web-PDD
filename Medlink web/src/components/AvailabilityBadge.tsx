import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface AvailabilityBadgeProps {
  isAvailable: boolean;
  onToggle?: () => void;
  showToggleControl?: boolean;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  isAvailable,
  onToggle,
  showToggleControl = false,
}) => {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
          isAvailable
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        {isAvailable ? "Available for Coverage" : "Off Coverage Duty"}
      </span>

      {showToggleControl && onToggle && (
        <button
          onClick={onToggle}
          type="button"
          className="text-xs text-sky-600 hover:text-sky-700 font-medium underline underline-offset-2 transition-colors cursor-pointer"
        >
          Toggle
        </button>
      )}
    </div>
  );
};

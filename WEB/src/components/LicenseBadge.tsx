import React from "react";
import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { LicenseStatus } from "../types";

interface LicenseBadgeProps {
  status: LicenseStatus;
  licenseNumber?: string;
}

export const LicenseBadge: React.FC<LicenseBadgeProps> = ({ status, licenseNumber }) => {
  const getStyles = () => {
    switch (status) {
      case "Verified":
        return {
          bg: "bg-sky-50 border-sky-200 text-sky-800",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />,
          label: "Board License Verified",
        };
      case "Pending":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: "Verification Pending",
        };
      case "Expired":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          label: "License Expired",
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${style.bg}`}
      title={licenseNumber ? `License No: ${licenseNumber}` : style.label}
    >
      {style.icon}
      <span>{style.label}</span>
      {licenseNumber && <span className="opacity-75 text-[11px]">({licenseNumber})</span>}
    </div>
  );
};

import React from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { useData } from "../context/DataContext";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case "success":
              return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            case "error":
              return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            case "warning":
              return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-sky-600 shrink-0" />;
          }
        };

        const getBorder = () => {
          switch (toast.type) {
            case "success":
              return "border-emerald-200 bg-emerald-50/95 text-emerald-950";
            case "error":
              return "border-rose-200 bg-rose-50/95 text-rose-950";
            case "warning":
              return "border-amber-200 bg-amber-50/95 text-amber-950";
            default:
              return "border-sky-200 bg-sky-50/95 text-sky-950";
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${getBorder()}`}
          >
            {getIcon()}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

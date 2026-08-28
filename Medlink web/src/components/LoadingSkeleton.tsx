import React from "react";

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-200 rounded-md w-3/4" />
        <div className="h-3 bg-slate-200 rounded-md w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-slate-200 rounded-md w-full" />
    <div className="h-3 bg-slate-200 rounded-md w-5/6" />
    <div className="flex justify-between items-center pt-2">
      <div className="h-8 bg-slate-200 rounded-lg w-24" />
      <div className="h-8 bg-slate-200 rounded-lg w-20" />
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="h-4 bg-slate-200 rounded-md w-24" />
        </div>
        <div className="h-4 bg-slate-200 rounded-md w-20" />
        <div className="h-4 bg-slate-200 rounded-md w-16" />
        <div className="h-6 bg-slate-200 rounded-full w-20" />
      </div>
    ))}
  </div>
);

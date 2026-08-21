import React from 'react';
import { X, Star, Calendar } from 'lucide-react';
import { CoverageFeedback } from '../types';

interface CoverageFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbacks: CoverageFeedback[];
  doctorName: string;
}

export const CoverageFeedbackModal: React.FC<CoverageFeedbackModalProps> = ({ isOpen, onClose, feedbacks, doctorName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Coverage Feedback</h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">{feedbacks.length} Review{feedbacks.length !== 1 ? 's' : ''} for Dr. {doctorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto bg-slate-50 flex-1 space-y-4">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">
              No coverage feedback available.
            </div>
          ) : (
            feedbacks.map((fb, idx) => {
              const dateObj = new Date(fb.createdAt || Date.now());
              const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

              return (
                <div key={fb.id || idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 font-medium italic leading-relaxed">"{fb.feedback}"</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-4 flex items-center gap-1.5 pt-4 border-t border-slate-100">
                    <span className="w-6 h-px bg-slate-300"></span> — Verified Doctor
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

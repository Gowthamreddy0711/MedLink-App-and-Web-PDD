import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { LeaveRequest } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { analyzeSentiment } from '../utils/geminiSentiment';

interface SubmitCoverageFeedbackModalProps {
  request: LeaveRequest;
  onClose: () => void;
}

export const SubmitCoverageFeedbackModal: React.FC<SubmitCoverageFeedbackModalProps> = ({ request, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitFeedback, addToast } = useData();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating < 1) return;
    
    setIsSubmitting(true);
    try {
      const coveringDoctorId = request.approvedDoctorId || request.assignedVolunteerUid || (request as any).assignedDoctorId || (request as any).coveringDoctorId;
      
      let sentiment = null;
      let sentimentScore = null;
      try {
        const result = await analyzeSentiment(feedback);
        sentiment = result.sentiment;
        sentimentScore = result.score;
      } catch (apiErr) {
        console.warn("Sentiment API failed", apiErr);
        addToast("info", "API Unavailable", "Review submitted. Sentiment analysis is temporarily unavailable.");
      }

      const newFeedback = {
        id: request.id,
        coverageRequestId: request.id,
        requestingDoctorId: user.id,
        coveringDoctorId: coveringDoctorId,
        rating,
        feedback,
        sentiment,
        sentimentScore,
        createdAt: Date.now(),
        // Android aliases
        requestId: request.id,
        reviewerId: user.id,
        reviewedDoctorId: coveringDoctorId,
        reviewText: feedback
      };

      console.log("WEB_FEEDBACK_SUBMIT", {
        requestId: request.id,
        rating,
        feedback,
        currentUserId: user.id,
        requestingDoctorId: user.id,
        coveringDoctorId
      });

      await submitFeedback(newFeedback);
      onClose();
    } catch (err: any) {
      console.error("WEB_FEEDBACK_ERROR", {
        requestId: request.id,
        'error.code': err.code || 'UNKNOWN',
        'error.message': err.message
      });
      addToast("error", "Error", "Unable to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Rate this coverage</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-slate-50 flex-1 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors duration-200 ${
                      star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-500">
              {rating === 0 ? "Select a rating" : `${rating} out of 5 stars`}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Feedback text</label>
            <textarea
              className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-none text-sm text-slate-700 font-medium placeholder-slate-400"
              rows={4}
              placeholder="How was the coverage experience?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={rating < 1 || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 disabled:hover:scale-100"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

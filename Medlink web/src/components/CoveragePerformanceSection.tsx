import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { CoverageFeedback } from '../types';
import { CoverageFeedbackModal } from './CoverageFeedbackModal';

interface CoveragePerformanceSectionProps {
  feedbacks: CoverageFeedback[];
  doctorName: string;
}

export const CoveragePerformanceSection: React.FC<CoveragePerformanceSectionProps> = ({ feedbacks, doctorName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const validFeedbacks = feedbacks.filter(fb => typeof fb.rating === 'number' && fb.rating > 0 && fb.rating <= 5);
  const totalReviews = validFeedbacks.length;
  const overallRating = totalReviews > 0 
    ? validFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
    : 0;

  const starCounts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
  validFeedbacks.forEach(fb => {
    if (fb.rating === 5) starCounts[0]++;
    else if (fb.rating === 4) starCounts[1]++;
    else if (fb.rating === 3) starCounts[2]++;
    else if (fb.rating === 2) starCounts[3]++;
    else if (fb.rating === 1) starCounts[4]++;
  });

  const recentFeedbacks = validFeedbacks.slice(0, 3); // Only show top 3 recent feedbacks inline

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6 mt-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          Coverage Performance
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 min-w-[240px]">
            {totalReviews === 0 ? (
              <div className="text-center space-y-2">
                <Star className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">No Coverage Ratings Yet</p>
              </div>
            ) : (
              <>
                <p className="text-5xl font-black text-slate-900 flex items-center gap-1">
                  <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                  {overallRating.toFixed(1)}
                  <span className="text-xl text-slate-400 font-bold ml-1">/ 5</span>
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Based on {totalReviews} Coverage Reviews
                </p>
              </>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Rating Breakdown</h3>
            {[5, 4, 3, 2, 1].map((star, index) => {
              const count = starCounts[index];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 text-slate-600 font-medium">
                    {star} <Star className="w-3 h-3 fill-slate-400 text-slate-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-slate-500 font-medium">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Coverage Feedback</h3>
            {totalReviews > 3 && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer transition-colors"
              >
                View All {totalReviews} Reviews →
              </button>
            )}
          </div>
          
          {validFeedbacks.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl text-center">No recent coverage feedback available.</p>
          ) : (
            <div className="space-y-3">
              {recentFeedbacks.map((fb, idx) => (
                <div key={fb.id || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 font-medium italic">"{fb.feedback || fb.reviewText}"</p>
                  <p className="text-xs text-slate-500 font-bold mt-2 flex items-center gap-1">
                    <span className="w-4 h-px bg-slate-300"></span> Verified Doctor
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {totalReviews > 0 && totalReviews <= 3 && (
            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
              >
                View All Coverage Feedback
              </button>
            </div>
          )}
        </div>
      </div>

      <CoverageFeedbackModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feedbacks={validFeedbacks}
        doctorName={doctorName}
      />
    </>
  );
};

import React, { useState, useMemo } from "react";
import { Megaphone, Plus, X } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { NoticeCard } from "../components/NoticeCard";

export const HospitalNotices: React.FC = () => {
  const { notices, postNotice } = useData();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Urgent Alert" | "Policy Update" | "CME Event" | "Staffing Notice">("Policy Update");
  const [department, setDepartment] = useState(user?.department || "Clinical Administration");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["All", "Urgent Alert", "Policy Update", "CME Event", "Staffing Notice"];

  const filteredNotices = useMemo(() => 
    selectedCategory === "All"
      ? notices
      : notices.filter((n) => n.category === selectedCategory || n.type === selectedCategory),
    [notices, selectedCategory]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await postNotice({
        title: title.trim(),
        category,
        type: category,
        department: department.trim(),
        author: user.name || user.fullName || "Hospital Admin",
        content: content.trim(),
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
        isImportant,
        priority: isImportant ? "HIGH" : "NORMAL",
      });

      // Reset form
      setTitle("");
      setContent("");
      setIsImportant(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error posting notice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Circulars & Notices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official administrative updates, clinical guidelines, and CME announcements stored live in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post Notice Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-2xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Circular</span>
          </button>
        </div>
      </div>

      {/* Notices List / Empty State */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Circulars or Notices</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {notices.length === 0
              ? "No hospital notices have been posted to Firestore yet. Click 'Post Circular' above to broadcast an official announcement."
              : "No notices match the selected category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}

      {/* Post Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Post Hospital Circular</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Circular Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Updated Infection Control Guidelines 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
                  >
                    <option value="Urgent Alert">Urgent Alert</option>
                    <option value="Policy Update">Policy Update</option>
                    <option value="CME Event">CME Event</option>
                    <option value="Staffing Notice">Staffing Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notice Body / Content</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write complete notice details, clinical instructions, or scheduling announcements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="isImportant" className="text-slate-700 font-bold cursor-pointer">
                  Mark as High-Priority / Urgent Alert
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Publishing..." : "Publish to Firestore"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

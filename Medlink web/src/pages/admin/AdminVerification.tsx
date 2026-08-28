import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, Users, Search, Filter } from "lucide-react";
import { User } from "../../types";
import { subscribeAllDoctors } from "../../firebase/firestoreService";
import { AdminVerificationProfile } from "./AdminVerificationProfile";

export const AdminVerification: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<User[]>([]);
  const activeTab = (searchParams.get("tab") as "PENDING" | "APPROVED" | "REJECTED") || "PENDING";
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const setActiveTab = (tab: "PENDING" | "APPROVED" | "REJECTED") => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const unsubDoc = subscribeAllDoctors((data) => setDoctors(data));
    return () => unsubDoc();
  }, []);

  const filteredDoctors = doctors.filter((d) => {
    if (d.approvalStatus !== activeTab) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.fullName && d.fullName.toLowerCase().includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.hospitalName && d.hospitalName.toLowerCase().includes(q)) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.department && d.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (selectedDoctor) {
    return (
      <AdminVerificationProfile 
        doctor={selectedDoctor} 
        onBack={() => setSelectedDoctor(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
            Doctor Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Review and manage practitioner access</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto no-scroll">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`flex-1 min-w-[120px] py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "PENDING" ? "border-amber-500 text-amber-700 bg-amber-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`flex-1 min-w-[120px] py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "APPROVED" ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"}`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`flex-1 min-w-[120px] py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "REJECTED" ? "border-rose-500 text-rose-700 bg-rose-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"}`}
          >
            Rejected
          </button>
        </div>

        {/* Filters/Search */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, email, hospital, specialty..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>
          <button className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 min-h-[300px]">
          {filteredDoctors.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">
                {activeTab === "PENDING" ? "No doctors are currently awaiting verification." : activeTab === "REJECTED" ? "No rejected registrations." : "No doctors found."}
              </p>
            </div>
          ) : (
            filteredDoctors.map(doc => (
              <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full">
                  <img 
                    src={doc.photoUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"} 
                    alt={doc.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.name || doc.fullName}</h4>
                    <p className="text-xs text-slate-500">{doc.email} • {doc.phone || doc.phoneNumber}</p>
                    <p className="text-[11px] font-semibold text-sky-600 mt-0.5">{doc.specialty} • {doc.hospitalName || doc.hospital}</p>
                  </div>
                </div>
                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  <button 
                    onClick={() => setSelectedDoctor(doc)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

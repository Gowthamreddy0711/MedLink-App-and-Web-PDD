import React, { useState, useMemo } from "react";
import { Search, Filter, Users } from "lucide-react";
import { useData } from "../context/DataContext";
import { DoctorCard } from "../components/DoctorCard";
import { User } from "../types";

interface DoctorDirectoryProps {
  onStartChat: (peerDoctor: User) => void;
  onSelectDoctorDetails: (doctor: User) => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({
  onStartChat,
  onSelectDoctorDetails,
}) => {
  const { doctors } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");

  const specialties = useMemo(() => 
    ["All", ...Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean))) as string[]], 
  [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const docName = doc.name || doc.fullName || "";
      const docHosp = doc.hospitalName || doc.hospital || "";
      const docQual = doc.qualification || "";
      const matchesSearch =
        docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.specialty || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        docHosp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        docQual.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty =
        selectedSpecialty === "All" || doc.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinician Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Find and connect with clinicians in your network
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinicians..."
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {doctors.length === 0
              ? "No practitioner profiles exist in the Firestore database yet."
              : "No doctor matching your query was found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onContactChat={(d) => onStartChat(d)}
              onSelectDetails={(d) => onSelectDoctorDetails(d)}
            />
          ))}
        </div>
      )}
    </div>
  );
};


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, ArrowLeft, Star, MapPin, Calendar, Clock, X } from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/db';

export default function SearchDoctors() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [previousDoctorIds, setPreviousDoctorIds] = useState<string[]>([]);

  const specialties = [
    { id: 'all', name: 'All Doctors' },
    ...(previousDoctorIds.length > 0 ? [{ id: 'previous', name: '★ My Previous' }] : []),
    { id: 'Cardiologist', name: 'Cardiology' },
    { id: 'Dentist', name: 'Dentistry' },
    { id: 'Dermatologist', name: 'Dermatology' },
    { id: 'Neurologist', name: 'Neurology' },
    { id: 'Pediatrician', name: 'Pediatrics' },
    { id: 'Orthopedic', name: 'Orthopedics' },
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('medlink_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        let prevDocIds: string[] = [];

        if (currentUser?.id) {
          const [appts, prescriptions] = await Promise.all([
            db.getAppointmentsByUserId(currentUser.id, false),
            db.getPrescriptions(currentUser.id)
          ]);
          const ids = new Set<string>();
          appts.forEach((a: any) => { if (a.doctorId) ids.add(a.doctorId); });
          prescriptions.forEach((p: any) => { if (p.doctorId) ids.add(p.doctorId); });
          prevDocIds = Array.from(ids);
          setPreviousDoctorIds(prevDocIds);
        }

        let allDoctors = await db.getDoctors();
        
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          allDoctors = allDoctors.filter((d: any) => 
            (d.name || '').toLowerCase().includes(lowerQuery) || 
            (d.specialty || '').toLowerCase().includes(lowerQuery)
          );
        }

        if (selectedSpecialty) {
          if (selectedSpecialty === 'previous') {
            allDoctors = allDoctors.filter((d: any) => prevDocIds.includes(d.id));
          } else if (selectedSpecialty !== 'all') {
            allDoctors = allDoctors.filter((d: any) => 
              (d.specialty || '').toLowerCase().includes(selectedSpecialty.toLowerCase())
            );
          }
        }
        
        if (selectedDate) {
          allDoctors = allDoctors.filter((d: any) => 
            d.availability.some((a: any) => a.date === selectedDate)
          );
        }
        
        setDoctors(allDoctors);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedDate, selectedSpecialty]);

  const displayDoctors = doctors.filter(doctor => {
    if (!selectedTime) return true;
    const dayAvailability = doctor.availability?.find((a: any) => a.date === selectedDate);
    return dayAvailability?.times.some((t: string) => t.includes(selectedTime));
  });

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSearchQuery('');
    setSelectedSpecialty('');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-4">
            <button onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate(ROUTES.PATIENT_HOME);
              }
            }} className="-ml-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl p-2 text-slate-600 transition-all active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-black uppercase tracking-tight text-blue-900 sm:text-xl">Find Doctors</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-bold text-blue-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 sm:rounded-2xl sm:py-3.5 sm:pl-11 sm:pr-4 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 sm:h-12 sm:w-12 sm:rounded-2xl",
                showFilters
                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "border-blue-100 bg-blue-50 text-blue-600"
              )}
              title="Filters"
            >
              <Filter className="h-5 w-5" />
              {(selectedDate || selectedTime) && !showFilters && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
              )}
            </button>
          </div>
        </div>

        {/* Specialty Pills */}
        <div className="mx-auto flex w-full max-w-7xl items-center gap-1.5 overflow-x-auto px-4 pb-3 sm:gap-2 sm:px-6 sm:pb-4">
          {(searchQuery || selectedDate || selectedTime || (selectedSpecialty && selectedSpecialty !== 'all')) && (
            <button
              onClick={clearFilters}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border bg-rose-50 border-rose-100 text-rose-500 shadow-sm active:scale-95 flex items-center gap-1 flex-shrink-0"
              title="Reset all filters"
            >
              <X className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              <span className="hidden sm:inline">Reset</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
          {specialties.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0",
                selectedSpecialty === spec.id
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                : "bg-white border-slate-100 text-slate-500 hover:border-blue-500 hover:text-blue-500"
              )}
            >
              {spec.name}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-50"
            >
              <div className="p-4 sm:p-6 pt-2 sm:pt-4 flex flex-col gap-4 sm:gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                      <input 
                        type="date"
                        className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black text-blue-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Time</label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                      <select 
                        className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black text-blue-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        <option value="">Any Time</option>
                        {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {(selectedDate || selectedTime || searchQuery || selectedSpecialty) && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 py-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset All
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-6">
        {/* Previous Doctors Horizontal Carousel Section */}
        {!loading && previousDoctorIds.length > 0 && !searchQuery && !selectedSpecialty && !selectedDate && (
          <div className="mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">My Previous Doctors</h3>
            <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-3 no-scrollbar -mx-1 px-1">
              {doctors.filter(d => previousDoctorIds.includes(d.id)).map((prevDoc) => (
                <motion.div
                  key={prevDoc.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(ROUTES.PATIENT_DOCTOR_DETAILS.replace(':id', prevDoc.id))}
                  className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 sm:gap-3 shrink-0 min-w-[140px] sm:min-w-[160px] cursor-pointer hover:border-blue-200 transition-all"
                >
                  <img src={prevDoc.photoUrl} className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg object-cover flex-shrink-0" alt={prevDoc.name} />
                  <div className="min-w-0">
                    <h4 className="font-bold text-blue-900 text-xs leading-tight truncate">{prevDoc.name}</h4>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider truncate">{prevDoc.specialty}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="text-slate-500 font-bold truncate">{displayDoctors.length} doctors found</span>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Sort:</span>
            <button className="text-blue-600 font-bold text-xs">Rating</button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {displayDoctors.map(doctor => (
              <motion.div 
                layout
                key={doctor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(ROUTES.PATIENT_DOCTOR_DETAILS.replace(':id', doctor.id))}
                className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-start gap-3 sm:gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={doctor.photoUrl || 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200'}
                    className="w-14 sm:w-16 h-14 sm:h-16 rounded-lg sm:rounded-2xl object-cover"
                    alt={doctor.name}
                  />
                  {doctor.isVerified && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-blue-900 text-sm truncate">{doctor.name}</h3>
                      <p className="text-blue-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">{doctor.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                      <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-700 text-[9px] sm:text-[10px] font-black whitespace-nowrap">{doctor.rating}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase">
                      <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 flex-shrink-0" />
                      <span>2.4 km</span>
                    </div>
                    {selectedDate && (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex-shrink-0">
                        <Clock className="w-2 sm:w-2.5 h-2 sm:h-2.5 flex-shrink-0" />
                        <span>Available</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && displayDoctors.length === 0 && (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-slate-100 rounded-xl sm:rounded-[2.5rem] flex items-center justify-center mb-4 sm:mb-6">
              <SearchIcon className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs sm:text-sm">No doctors found</p>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-[200px] mb-6 sm:mb-8">Try adjusting your filters</p>
            <button 
              onClick={clearFilters}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-lg sm:rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

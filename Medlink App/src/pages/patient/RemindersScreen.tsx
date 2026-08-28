import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, Clock, Pill, Trash2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([
    { id: '1', name: 'Amoxicillin', dosage: '500mg', time: '08:00', status: 'taken' },
    { id: '2', name: 'Paracetamol', dosage: '650mg', time: '14:00', status: 'pending' },
    { id: '3', name: 'Cetirizine', dosage: '10mg', time: '21:00', status: 'pending' },
  ]);

  const toggleStatus = (id: string, newStatus: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
  };

  const adherence = Math.round((reminders.filter(r => r.status === 'taken').length / reminders.length) * 100);

  return (
    <div className="px-6 py-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-900">Medicine Reminders</h1>
        <button className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
           <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Stats */}
      <section className="mt-8">
        <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Weekly Adherence</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-900">{adherence}%</span>
              <span className="text-emerald-500 text-sm font-bold">↑ 5%</span>
            </div>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
              <circle 
                cx="32" cy="32" r="28" fill="transparent" stroke="#2563eb" strokeWidth="6" 
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - adherence / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <Pill className="w-5 h-5 text-blue-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Today's Schedule */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-900">Today's Schedule</h2>
          <span className="text-slate-400 text-sm">Oct 24, 2023</span>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {reminders.map((reminder) => (
            <motion.div 
              key={reminder.id}
              layout
              className={cn(
                "p-5 rounded-3xl border transition-all duration-300",
                reminder.status === 'taken' ? "bg-emerald-50 border-emerald-100" :
                reminder.status === 'skipped' ? "bg-rose-50 border-rose-100" :
                "bg-white border-slate-100 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    reminder.status === 'taken' ? "bg-emerald-100 text-emerald-600" :
                    reminder.status === 'skipped' ? "bg-rose-100 text-rose-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-bold text-blue-900 leading-tight",
                      reminder.status === 'taken' && "line-through opacity-50"
                    )}>{reminder.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{reminder.dosage} • Every 8 hours</p>
                    <div className="mt-2 flex items-center gap-1.5 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                       <Clock className="w-3 h-3" />
                       <span>{reminder.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {reminder.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => toggleStatus(reminder.id, 'taken')}
                        className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(reminder.id, 'skipped')}
                        className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => toggleStatus(reminder.id, 'pending')}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* History Button */}
      <motion.button 
        whileTap={{ scale: 0.98 }}
        className="mt-8 w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl text-sm"
      >
        View Full History
      </motion.button>
    </div>
  );
}

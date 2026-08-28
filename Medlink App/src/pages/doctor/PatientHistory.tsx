import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Download, ChevronRight, Stethoscope, User, AlertCircle } from 'lucide-react';
import { db } from '../../services/db';

export default function PatientHistory() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patientData, setPatientData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientDataAndHistory = async () => {
      if (!id) return;
      try {
        const pDoc = await db.getUserById(id);
        if (pDoc) {
          setPatientData({
            name: pDoc.name || 'Anonymous Patient',
            age: pDoc.age || 25,
            gender: pDoc.gender || 'Male',
            bloodGroup: pDoc.bloodGroup || 'O+',
            weight: pDoc.weight || '70kg',
            height: pDoc.height || '175cm',
            allergies: pDoc.allergies || 'Penicillin, Peanuts'
          });
        } else {
          setPatientData({
            name: 'Patient Profile',
            age: 25,
            gender: 'Male',
            bloodGroup: 'O+',
            weight: '70kg',
            height: '175cm',
            allergies: 'None declared'
          });
        }

        const presCollection = await db.getPrescriptions(id);
        const mapped = presCollection.map(p => ({
          id: p.id,
          date: p.date || 'Today',
          doctorName: p.doctorName || 'Consulting Physician',
          diagnosis: p.diagnosis || 'Clinical Diagnosis',
          prescription: (p.prescription || []).map((med: any) => `${med.name} (${med.dosage}) - ${med.frequency}`)
        }));
        setHistory(mapped);
      } catch (err) {
        console.error('Error fetching patient history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDataAndHistory();
  }, [id]);

  if (loading) {
    return (
      <div className="px-6 py-6 min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-sm text-slate-500">
        Loading patient records...
      </div>
    );
  }

  const hasPatient = !!patientData;

  return (
    <div className="px-6 py-6 pb-24 min-h-screen bg-slate-50">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 bg-white rounded-xl shadow-sm">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-blue-900 uppercase tracking-tight">Patient History</h1>
      </header>

      {/* Patient Info Card */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 flex items-center gap-5">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
           <User className="w-10 h-10" />
        </div>
        <div className="flex-1">
           <h2 className="text-2xl font-black text-blue-950">{patientData?.name}</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
             {patientData?.age} Years • {patientData?.gender} • {patientData?.bloodGroup}
           </p>
           <div className="flex gap-4 mt-3">
              <div className="text-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weight</p>
                 <p className="text-xs font-bold text-blue-900">{patientData?.weight}</p>
              </div>
              <div className="text-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Height</p>
                 <p className="text-xs font-bold text-blue-900">{patientData?.height}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-100">
           <FileText className="w-6 h-6 mb-2 opacity-80" />
           <div className="text-2xl font-black">{history.length}</div>
           <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Consults</div>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-center">
           <div className="flex items-center gap-2 mb-2">
             <AlertCircle className="w-5 h-5 text-rose-500" />
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Allergy</span>
           </div>
           <div className="text-sm font-bold text-blue-900">{patientData?.allergies}</div>
        </div>
      </div>

      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Previous Reports</h2>

      <div className="flex flex-col gap-4">
        {history.length === 0 ? (
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] text-center text-slate-400 font-bold text-xs shadow-sm">
            No previous reports or prescriptions found.
          </div>
        ) : (
          history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative group"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                   <h3 className="font-bold text-blue-900">{item.doctorName}</h3>
                 </div>
                 <button className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                   <Download className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                 <p className="text-xs font-bold text-blue-950">{item.diagnosis}</p>
              </div>

              <div className="flex flex-col gap-2">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prescribed</p>
                 <div className="flex flex-wrap gap-2">
                    {item.prescription.map((med: string) => (
                      <span key={med} className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-blue-600">
                        {med}
                      </span>
                    ))}
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

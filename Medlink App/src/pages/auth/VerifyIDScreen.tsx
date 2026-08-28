import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

export default function VerifyIDScreen() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [medicalId, setMedicalId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Simulate verification process
    setTimeout(() => {
      setIsUploading(false);
      // Successful ID verification for streamlined onboarding experience
      navigate(ROUTES.VERIFICATION_SUCCESS);
    }, 150);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-6 bg-white border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-xl">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Step 2 of 2</span>
      </header>

      <div className="px-8 mt-8 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">Identity Verification</h2>
          <p className="mt-2 text-slate-500 font-medium">
            To ensure patient safety, we need to verify your medical credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Medical Registration ID</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text"
                placeholder="REG-12345-MED"
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-blue-950 font-medium uppercase"
                value={medicalId}
                onChange={(e) => setMedicalId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Practice License Document</label>
            <div 
              className={cn(
                "relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all",
                file ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white hover:border-blue-400 py-12"
              )}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{file.name}</span>
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-2 text-xs font-bold text-rose-500 hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-blue-900">Upload License Copy (PDF/JPG)</span>
                  <span className="mt-2 text-xs text-slate-400 font-medium">Max file size: 5MB</span>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                </>
              )}
            </div>
          </div>

          <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-950">Secure Verification</h4>
              <p className="mt-1 text-[11px] text-blue-700 leading-relaxed font-semibold">
                Your documents are encrypted and only accessible by our medical vetting team. Verification usually takes 2-4 hours.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isUploading || !file || !medicalId}
            className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-200 mt-4 disabled:opacity-70 text-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              'Submit for Approval'
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}

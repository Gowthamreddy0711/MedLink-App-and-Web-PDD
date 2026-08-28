import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, Search, AlertCircle, Calendar } from 'lucide-react';
import { db } from '../../services/db';
import { auth } from '../../services/firebase';

export default function DoctorVerification() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'pending';
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>(initialTab as any);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setActiveTab((searchParams.get('tab') as any) || 'pending');
  }, [searchParams]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const allUsers = await db.getUsers();
      const docs = allUsers.filter((u: any) => String(u.role).toUpperCase() === 'DOCTOR');
      setDoctors(docs);
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    // Determine status
    let status = 'pending';
    if (doc.approvalStatus === 'APPROVED') status = 'approved';
    if (doc.approvalStatus === 'REJECTED') status = 'rejected';
    
    if (status !== activeTab) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        doc.name?.toLowerCase().includes(term) ||
        doc.email?.toLowerCase().includes(term) ||
        doc.specialty?.toLowerCase().includes(term) ||
        doc.clinicName?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleApprove = async (doctor: any) => {
    if (!window.confirm(`Approve Doctor ${doctor.name}?`)) return;
    setProcessing(true);
    try {
      const updatedDoc = {
        ...doctor,
        approvalStatus: 'APPROVED',
        verified: true,
        isVerified: true
      };
      await db.saveUser(updatedDoc);
      
      await db.logAdminActivity({
        action: 'DOCTOR_APPROVED',
        adminUid: auth.currentUser?.uid || 'admin',
        adminName: auth.currentUser?.displayName || 'Admin',
        doctorUid: doctor.id,
        doctorName: doctor.name
      });
      
      await loadDoctors();
      setSelectedDoctor(null);
    } catch (err) {
      console.error(err);
      alert("Failed to approve doctor.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    if (!selectedDoctor) return;
    
    setProcessing(true);
    try {
      const updatedDoc = {
        ...selectedDoctor,
        approvalStatus: 'REJECTED',
        verified: false,
        isVerified: false,
        rejectionReason: rejectReason,
        rejectedAt: Date.now(),
        rejectedBy: auth.currentUser?.uid || 'admin'
      };
      await db.saveUser(updatedDoc);
      
      await db.logAdminActivity({
        action: 'DOCTOR_REJECTED',
        adminUid: auth.currentUser?.uid || 'admin',
        adminName: auth.currentUser?.displayName || 'Admin',
        doctorUid: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        reason: rejectReason
      });
      
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedDoctor(null);
      await loadDoctors();
    } catch (err) {
      console.error(err);
      alert("Failed to reject doctor.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Verification</h2>
        <p className="text-slate-500 mt-1">Review and manage doctor registrations</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('pending'); setSearchParams({ tab: 'pending' }); }}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Pending
        </button>
        <button
          onClick={() => { setActiveTab('approved'); setSearchParams({ tab: 'approved' }); }}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'approved' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Approved
        </button>
        <button
          onClick={() => { setActiveTab('rejected'); setSearchParams({ tab: 'rejected' }); }}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rejected' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Rejected
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, specialty..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : filteredDoctors.length === 0 ? (
             <div className="p-12 text-center text-slate-500">No records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Specialty & Clinic</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.photoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{doc.name}</div>
                          <div className="text-xs text-slate-500">Reg: {doc.registrationNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{doc.email}</div>
                      <div className="text-xs text-slate-500">{doc.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{doc.specialty || doc.specialization || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{doc.clinicName || doc.hospital || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                        ${activeTab === 'approved' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${activeTab === 'rejected' ? 'bg-rose-100 text-rose-800' : ''}
                      `}>
                        {activeTab}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Profile Modal */}
      {selectedDoctor && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Doctor Profile Review</h3>
              <button onClick={() => setSelectedDoctor(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-start gap-4">
                <img
                  src={selectedDoctor.photoUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedDoctor.name}</h4>
                  <p className="text-slate-500">{selectedDoctor.specialty || selectedDoctor.specialization}</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedDoctor.email} | {selectedDoctor.phone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Medical Registration</p>
                  <p className="text-slate-900 font-medium">{selectedDoctor.registrationNumber || 'Not provided'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Qualification</p>
                  <p className="text-slate-900 font-medium">{selectedDoctor.qualification || 'Not provided'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hospital/Clinic</p>
                  <p className="text-slate-900 font-medium">{selectedDoctor.clinicName || selectedDoctor.hospital || 'Not provided'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-slate-900 font-medium">{selectedDoctor.experience ? `${selectedDoctor.experience} Years` : 'Not provided'}</p>
                </div>
              </div>

              {selectedDoctor.approvalStatus === 'REJECTED' && selectedDoctor.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-rose-800">Rejection Reason</h5>
                    <p className="text-sm text-rose-700 mt-1">{selectedDoctor.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  db.logAdminActivity({
                    action: 'DOCTOR_PROFILE_REVIEWED',
                    adminUid: auth.currentUser?.uid || 'admin',
                    adminName: auth.currentUser?.displayName || 'Admin',
                    doctorUid: selectedDoctor.id,
                    doctorName: selectedDoctor.name
                  });
                  setSelectedDoctor(null);
                }}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close
              </button>
              
              {activeTab === 'pending' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="px-4 py-2 font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoctor)}
                    disabled={processing}
                    className="px-4 py-2 font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Doctor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" /> Reject Doctor
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Please provide a reason for rejecting Dr. {selectedDoctor?.name}. This will be stored for compliance records.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none h-24"
                  placeholder="E.g., Invalid medical registration document..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                disabled={processing}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processing || !rejectReason.trim()}
                className="px-4 py-2 font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Reject Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

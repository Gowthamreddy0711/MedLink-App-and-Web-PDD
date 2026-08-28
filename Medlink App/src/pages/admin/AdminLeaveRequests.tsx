import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '../../services/firebase';
import { Calendar, Search, Filter } from 'lucide-react';
import { db } from '../../services/db';

export default function AdminLeaveRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    // We use real-time listeners for leave requests as requested
    const q = collection(firestoreDb, 'leaveRequests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending (assuming leaveStartDate is timestamp)
      reqs.sort((a, b) => (b.leaveStartDate || 0) - (a.leaveStartDate || 0));
      setRequests(reqs);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to leave requests:", error);
      setLoading(false);
    });
    
    // Log view action when component mounts
    db.logAdminActivity({
      action: 'LEAVE_REQUEST_VIEWED',
      adminUid: 'admin',
      adminName: 'Admin',
      metadata: { component: 'AdminLeaveRequests' }
    });

    return () => unsubscribe();
  }, []);

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        req.doctorName?.toLowerCase().includes(term) ||
        req.specialization?.toLowerCase().includes(term) ||
        req.reason?.toLowerCase().includes(term) ||
        req.hospital?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const formatDate = (ts: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leave Requests</h2>
        <p className="text-slate-500 mt-1">Monitor all clinical leave requests across the system (Read Only)</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by doctor, department, hospital..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-500">Loading leave requests...</div>
          ) : filteredRequests.length === 0 ? (
             <div className="p-12 text-center text-slate-500">No leave requests found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Shift & Priority</th>
                  <th className="px-6 py-4">Reason & Handover</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.doctorProfilePhoto || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200"}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{req.doctorName || 'Unknown Doctor'}</div>
                          <div className="text-xs text-slate-500">{req.specialization || 'N/A'} • {req.hospital || req.location || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(req.leaveStartDate)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">to {formatDate(req.leaveEndDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 capitalize">{req.shift || 'Full Day'}</div>
                      <div className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                        ${req.priority === 'High' || req.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {req.priority || 'Normal'} Priority
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 line-clamp-1" title={req.reason}>{req.reason || 'No reason provided'}</div>
                      {req.handoverNote && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1" title={req.handoverNote}>Handover: {req.handoverNote}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${req.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : ''}
                        ${req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : ''}
                        ${req.status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' : ''}
                        ${!req.status ? 'bg-slate-100 text-slate-800' : ''}
                      `}>
                        {req.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-sm font-medium text-slate-900">
                         {req.coverageStatus || (req.volunteers && req.volunteers.length > 0 ? 'Coverage Found' : 'Pending Coverage')}
                       </div>
                       {req.coveringDoctorName && (
                         <div className="text-xs text-slate-500 mt-1">By: Dr. {req.coveringDoctorName}</div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

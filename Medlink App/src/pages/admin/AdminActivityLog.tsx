import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db as firestoreDb } from '../../services/firebase';
import { Search, Filter, Clock } from 'lucide-react';
import { db } from '../../services/db';

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    // Real-time updates for Activity Log
    const q = query(collection(firestoreDb, 'adminActivityLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(fetchedLogs);
      setLoading(false);
    }, (error) => {
      console.warn("Error listening to activity logs, falling back to db method:", error);
      // Fallback
      db.getAdminActivityLogs().then(data => {
        setLogs(data);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.adminName?.toLowerCase().includes(term) ||
        log.doctorName?.toLowerCase().includes(term) ||
        log.reason?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED')) return 'text-emerald-700 bg-emerald-100';
    if (action.includes('REJECTED')) return 'text-rose-700 bg-rose-100';
    if (action.includes('VIEWED') || action.includes('REVIEWED')) return 'text-blue-700 bg-blue-100';
    return 'text-slate-700 bg-slate-100';
  };

  const formatDate = (ts: number) => {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Extract unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Activity Log</h2>
        <p className="text-slate-500 mt-1">Audit trail of all administrative actions</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search admin, doctor, or reason..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-slate-700"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{formatAction(action)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-500">Loading activity logs...</div>
          ) : filteredLogs.length === 0 ? (
             <div className="p-12 text-center text-slate-500">No activity logs found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Date/Time</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Details/Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" /> {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium">{log.adminName || 'Unknown Admin'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{log.doctorName ? `Dr. ${log.doctorName}` : '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 line-clamp-2" title={log.reason || ''}>
                        {log.reason || '-'}
                      </div>
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, UserCheck, UserX, Activity } from 'lucide-react';
import { ROUTES } from '../../constants';
import { db } from '../../services/db';

export default function ComplianceConsole() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalLeaveRequests: 0,
    newRegistrationsToday: 0,
    leaveRequestsToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [users, leaveRequests] = await Promise.all([
          db.getUsers(),
          db.getLeaveRequests()
        ]);

        const doctors = users.filter((u: any) => String(u.role).toUpperCase() === 'DOCTOR');

        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let newRegToday = 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        doctors.forEach((doc: any) => {
          if (doc.approvalStatus === 'APPROVED') {
            approved++;
          } else if (doc.approvalStatus === 'REJECTED') {
            rejected++;
          } else {
            pending++; // default is pending if not approved or rejected
          }

          // Check if registered today (Assuming createdAt is available, if not fallback)
          if (doc.createdAt) {
             const createdDate = new Date(doc.createdAt);
             if (createdDate >= todayStart) {
               newRegToday++;
             }
          }
        });

        let leaveReqToday = 0;
        leaveRequests.forEach((req: any) => {
          if (req.createdAt) {
            // req.createdAt could be a timestamp number or string
            const createdDate = new Date(req.createdAt);
            if (createdDate >= todayStart) {
              leaveReqToday++;
            }
          }
        });

        setStats({
          pending,
          approved,
          rejected,
          totalLeaveRequests: leaveRequests.length,
          newRegistrationsToday: newRegToday,
          leaveRequestsToday: leaveReqToday
        });

      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Compliance Console</h2>
        <p className="text-slate-500 mt-1">Doctor Verification & Clinical Oversight</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <span className="ml-3 text-slate-500">Loading statistics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={<Users className="w-6 h-6 text-amber-500" />}
            onClick={() => navigate(`${ROUTES.ADMIN_VERIFICATION}?tab=pending`)}
            accent="amber"
          />
          <StatCard
            title="Approved Doctors"
            value={stats.approved}
            icon={<UserCheck className="w-6 h-6 text-emerald-500" />}
            onClick={() => navigate(`${ROUTES.ADMIN_VERIFICATION}?tab=approved`)}
            accent="emerald"
          />
          <StatCard
            title="Rejected Registrations"
            value={stats.rejected}
            icon={<UserX className="w-6 h-6 text-rose-500" />}
            onClick={() => navigate(`${ROUTES.ADMIN_VERIFICATION}?tab=rejected`)}
            accent="rose"
          />
          <StatCard
            title="Total Leave Requests"
            value={stats.totalLeaveRequests}
            icon={<FileText className="w-6 h-6 text-blue-500" />}
            onClick={() => navigate(ROUTES.ADMIN_LEAVE_REQUESTS)}
            accent="blue"
          />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-500">New Registrations Today</p>
               <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.newRegistrationsToday}</h3>
             </div>
             <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-500" />
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-500">Leave Requests Today</p>
               <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.leaveRequestsToday}</h3>
             </div>
             <div className="h-12 w-12 rounded-full bg-cyan-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-cyan-500" />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, onClick, accent }: { title: string, value: number, icon: React.ReactNode, onClick: () => void, accent: 'amber'|'emerald'|'rose'|'blue' }) {
  const accentClasses = {
    amber: 'hover:border-amber-400 hover:shadow-amber-100/50',
    emerald: 'hover:border-emerald-400 hover:shadow-emerald-100/50',
    rose: 'hover:border-rose-400 hover:shadow-rose-100/50',
    blue: 'hover:border-blue-400 hover:shadow-blue-100/50',
  }[accent];

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 ${accentClasses}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-slate-50">
          {icon}
        </div>
      </div>
    </div>
  );
}

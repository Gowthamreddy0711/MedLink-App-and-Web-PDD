import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../../services/firebase';
import { Bell, FileText, UserPlus, Info, CheckCircle } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for admin notifications. We assume admin notifications have userId: 'admin'
    const q = query(
      collection(firestoreDb, 'notifications'), 
      where('userId', '==', 'admin')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory since firestore requires composite index for where + orderBy
      fetched.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      setNotifications(fetched);
      setLoading(false);
    }, (error) => {
      console.warn("Error listening to admin notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notif: any) => {
    if (notif.read) return;
    try {
      await updateDoc(doc(firestoreDb, 'notifications', notif.id), { read: true });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif);
    
    // Navigate based on type
    if (notif.type === 'NEW_REGISTRATION' || notif.type === 'DOCTOR_REAPPLICATION') {
      navigate(`${ROUTES.ADMIN_VERIFICATION}?tab=pending`);
    } else if (notif.type === 'NEW_LEAVE_REQUEST') {
      navigate(ROUTES.ADMIN_LEAVE_REQUESTS);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      await markAsRead(notif);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'NEW_REGISTRATION') return <UserPlus className="w-5 h-5 text-indigo-500" />;
    if (type === 'NEW_LEAVE_REQUEST') return <FileText className="w-5 h-5 text-blue-500" />;
    return <Info className="w-5 h-5 text-slate-500" />;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h2>
          <p className="text-slate-500 mt-1">Important updates requiring your attention</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
           <div className="p-16 text-center">
             <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
               <Bell className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications</h3>
             <p className="text-slate-500">You're all caught up!</p>
           </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 flex gap-4 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50/30' : 'bg-white'}`}
              >
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border
                  ${!notif.read ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100'}
                `}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notif.title || 'New Notification'}
                    </p>
                    {notif.date && (
                      <span className="text-xs text-slate-400 whitespace-nowrap">{notif.date}</span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${!notif.read ? 'text-slate-700' : 'text-slate-500'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <div className="flex-shrink-0 flex items-center">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm ring-2 ring-white"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

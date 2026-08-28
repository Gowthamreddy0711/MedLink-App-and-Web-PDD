import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, CheckCircle2, Clock, ShieldAlert, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem('medlink_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id || 'anonymous';

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const data = await db.getNotifications(userId);
        if (data.length === 0) {
          // Fallback to generating elegant, dynamic initial notifications based on role
          const initialAlerts = user?.role === 'doctor' ? [
            {
              id: 'n1',
              title: 'High Priority Access Request',
              body: 'Dr. James Chen requested access to Patient #402 records.',
              type: 'alert',
              date: 'Just Now',
              read: false
            },
            {
              id: 'n2',
              title: 'Consultation Check-In',
              body: 'A new patient has checked in and is waiting in your queue.',
              type: 'info',
              date: '10m ago',
              read: false
            }
          ] : [
            {
              id: 'n1',
              title: 'Welcome to MedLink',
              body: `Hello ${user?.name || 'Patient'}, your personal health cloud is securely initialized.`,
              type: 'system',
              date: 'Just Now',
              read: false
            },
            {
              id: 'n2',
              title: 'Identity Verification Checked',
              body: 'Your medical practitioner access status has been verified.',
              type: 'info',
              date: '1h ago',
              read: false
            }
          ];

          // Save fallback notifications inside DB for consistency
          for (const alertInfo of initialAlerts) {
            await db.createNotification({
              ...alertInfo,
              userId
            });
          }
          const savedData = await db.getNotifications(userId);
          setNotifications(savedData);
        } else {
          setNotifications(data);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [userId, user?.role, user?.name]);

  const handleMarkRead = async (id: string) => {
    try {
      // Local view update instantly
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      // Notify database
      const notifItem = notifications.find(n => n.id === id);
      if (notifItem) {
        await db.createNotification({ ...notifItem, id, read: true, userId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIconInfo = (type: string) => {
    switch (type) {
      case 'alert':
        return { icon: ShieldAlert, color: 'text-amber-600 bg-amber-50' };
      case 'system':
        return { icon: Clock, color: 'text-blue-600 bg-blue-50' };
      default:
        return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-50">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 bg-slate-50 rounded-xl">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Notifications</span>
        <div className="w-10" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Retrieving Alerts...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center">
                 <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                 <h4 className="font-bold text-blue-900 text-sm">Inbox has been cleared</h4>
                 <p className="text-xs text-slate-400 mt-1">We will notify you about system alerts</p>
              </div>
            ) : (
              notifications.map((notif, i) => {
                const { icon: IconComponent, color } = getIconInfo(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex gap-4 ${notif.read ? 'opacity-60' : ''}`}
                  >
                    <div className={`p-3 rounded-2xl h-fit ${color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-blue-950 text-sm leading-tight">{notif.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{notif.date || 'Today'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.body}</p>
                      
                      <div className="mt-3 flex gap-2">
                        {!notif.read && (
                          <button 
                            onClick={() => handleMarkRead(notif.id)}
                            className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                          >
                            Mark Read
                          </button>
                        )}
                        <button 
                          onClick={() => handleDismiss(notif.id)}
                          className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        <div className="mt-8 text-center text-slate-400">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">No more notifications</p>
        </div>
      </div>
    </div>
  );
}

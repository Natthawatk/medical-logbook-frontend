import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, Info, Activity, ClipboardCheck, CalendarCheck } from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';
import api from '../services/api';

interface Notification {
  _id: string;
  title?: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  sender_id?: {
    _id: string;
    firstname_lastname: string;
    role: string;
  };
  target_id?: any;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = user?.firstname_lastname || 'นักศึกษา';

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/my');
      if (response.data.success) {
        setNotifications(response.data.data);
        
        const hasUnread = response.data.data.some((n: Notification) => !n.is_read);
        if (hasUnread) {
          await api.put('/notifications/read-all');
          setUnreadCount(0);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotiClick = async (noti: Notification) => {
    if (!noti.is_read) {
      try {
        await api.put(`/notifications/${noti._id}/read`);
        setNotifications(notifications.map(n => 
          n._id === noti._id ? { ...n, is_read: true } : n
        ));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    if (noti.target_id?._id) {
        if (noti.type.includes('shift')) {
            navigate('/check-in');
        } else {
            navigate(`/logbook-cases/${noti.target_id._id}`);
        }
    }
  };

  const getIcon = (type: string, isRead: boolean) => {
    const baseClasses = "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md border-4 border-white transition-all duration-300";
    
    if (type === 'case_evaluated') {
      return (
        <div className={`${baseClasses} ${isRead ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-500 text-white animate-pulse'}`}>
          <ClipboardCheck size={28} strokeWidth={2.5} />
        </div>
      );
    } else if (type === 'case_submitted') {
      return (
        <div className={`${baseClasses} ${isRead ? 'bg-blue-50 text-blue-500' : 'bg-blue-500 text-white animate-pulse'}`}>
          <CheckCircle2 size={28} strokeWidth={2.5} />
        </div>
      );
    } else if (type.includes('shift')) {
       return (
        <div className={`${baseClasses} ${isRead ? 'bg-amber-50 text-amber-500' : 'bg-amber-500 text-white animate-pulse'}`}>
          <CalendarCheck size={28} strokeWidth={2.5} />
        </div>
      );
    } else {
      return (
        <div className={`${baseClasses} ${isRead ? 'bg-slate-50 text-slate-400' : 'bg-slate-400 text-white animate-pulse'}`}>
          <Info size={28} strokeWidth={2.5} />
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
        <DashboardHeader 
          studentName={studentName} 
          profileImage={user?.profile_image}
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          onBack={() => navigate(-1)}
          showTitle={true}
          title="การแจ้งเตือน"
          subtitle="ประวัติการแจ้งเตือนและสถานะการดำเนินการของคุณ"
        />

        <div className="max-w-4xl mx-auto space-y-8 mt-6">
          <div className="flex items-center justify-end text-right">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">รายการทั้งหมด</span>
                    <p className="text-2xl font-black text-slate-800 leading-none">{notifications.length}</p>
                </div>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-5 pb-20">
              {notifications.map((noti) => (
                <div 
                  key={noti._id}
                  onClick={() => handleNotiClick(noti)}
                  className={`group bg-white p-7 rounded-[32px] border-2 transition-all cursor-pointer flex gap-6 items-start hover:scale-[1.01] active:scale-[0.99] ${
                    !noti.is_read 
                      ? 'border-blue-200 shadow-xl ring-4 ring-blue-500/5' 
                      : 'border-white shadow-md opacity-80'
                  }`}
                >
                  {getIcon(noti.type, noti.is_read)}

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-black text-lg leading-tight transition-colors ${!noti.is_read ? 'text-slate-900 group-hover:text-blue-700' : 'text-slate-600'}`}>
                        {noti.title || (
                          noti.type === 'case_evaluated' ? 'ผลการประเมินหัตถการ' : 
                          noti.type === 'case_submitted' ? 'บันทึกข้อมูลสำเร็จ' : 
                          noti.type === 'shift_checkin' ? 'ลงเวลาเข้าเวรสำเร็จ' :
                          noti.type === 'shift_verified' ? 'ผลการยืนยันเข้าเวร' :
                          'แจ้งเตือนระบบ'
                        )}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {!noti.is_read && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></span>}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {new Date(noti.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm font-bold leading-relaxed ${!noti.is_read ? 'text-slate-700' : 'text-slate-500'}`}>
                      {noti.message}
                    </p>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border ${
                            !noti.is_read ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                            {noti.type.split('_').join(' ')}
                        </span>
                        {noti.target_id && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Activity size={10} /> View details
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                    <Bell size={48} strokeWidth={1.5} />
                </div>
                <p className="text-slate-900 text-xl font-black">ไม่มีการแจ้งเตือนในขณะนี้</p>
                <p className="text-slate-500 font-bold mt-1">ประวัติการแจ้งเตือนของคุณจะแสดงขึ้นเมื่อมีการเคลื่อนไหวในระบบ</p>
            </div>
          )}
        </div>
    </>
  );
};

export default Notifications;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardHeader from '../components/DashboardHeader';
import { MapPin, User, Calendar, Clock, ChevronDown, Send } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

interface Location {
  _id: string;
  Location_name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface Preceptor {
  _id: string;
  firstname_lastname: string;
  workplace?: string;
}

const CheckInForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [preceptors, setPreceptors] = useState<Preceptor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreceptorLoading, setIsPreceptorLoading] = useState(false);
  const [studentName, setStudentName] = useState('นักศึกษา');
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentSemester, setCurrentSemester] = useState('');
  
  const [formData, setFormData] = useState({
    location_id: '',
    preceptor_id: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' })
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, unreadRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/notifications/unread-count')
        ]);

        let semester = '';
        if (profileRes.data.success) {
          const profile = profileRes.data.data;
          setStudentName(profile.firstname_lastname);
          semester = profile.semester;
          setCurrentSemester(semester);
        }

        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }

        const locRes = await api.get('/locations', { params: { semester: semester } });
        if (locRes.data.success) {
          setLocations(locRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching check-in data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.location_id && currentSemester) {
      const fetchPreceptors = async () => {
        setIsPreceptorLoading(true);
        setPreceptors([]);
        setFormData(fd => ({ ...fd, preceptor_id: '' }));
        try {
          const res = await api.get('/users/preceptors-by-location', {
            params: {
              locationId: formData.location_id,
              semester: currentSemester } });
          if (res.data.success) {
            setPreceptors(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch preceptors for location", error);
        } finally {
          setIsPreceptorLoading(false);
        }
      };
      fetchPreceptors();
    } else {
        setPreceptors([]);
        setFormData(fd => ({ ...fd, preceptor_id: '' }));
    }
  }, [formData.location_id, currentSemester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location_id || !formData.preceptor_id) {
        showToast('กรุณาเลือกสถานที่และผู้ประเมิน', 'error');
        return;
    }

    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        showToast('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', 'error');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await api.post('/shifts/check-in', {
            location_id: formData.location_id,
            preceptor_id: formData.preceptor_id, 
            latitude,
            longitude
          });

          if (response.data.success) {
            showToast('ลงเวลาเข้าเวรเรียบร้อยแล้ว', 'success');
            navigate('/check-in');
          }
        } catch (err: any) {
          console.error('Check-in error:', err);
          showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลงเวลา', 'error');
        } finally {
          setIsLoading(false);
        }
      }, (error) => {
        console.error('Geolocation error:', error);
        showToast('กรุณาอนุญาตให้เข้าถึงตำแหน่งเพื่อทำการลงเวลา', 'error');
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      showToast('เกิดข้อผิดพลาดที่ไม่คาดคิด', 'error');
      setIsLoading(false);
    }
  };

  return (
    <>
        <DashboardHeader 
          studentName={studentName} 
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          onBack={() => navigate('/check-in')}
          showTitle={true}
          title="ลงเวลาเข้าฝึกปฏิบัติงาน"
          subtitle="บันทึกข้อมูลการเข้าปฏิบัติงานตามสถานที่และผู้ประเมินที่กำหนด"
        />

        <div className="max-w-2xl mx-auto mt-6 pb-20">
            {/* Form Card */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl">
                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <MapPin size={12} strokeWidth={3} className="text-blue-500" />
                            สถานที่ปฏิบัติงาน
                        </label>
                        <div className="relative">
                            <select 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none"
                                value={formData.location_id}
                                onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                                required
                            >
                                <option value="">เลือกสถานที่ปฏิบัติงาน</option>
                                {locations.map(loc => (
                                    <option key={loc._id} value={loc._id}>{loc.Location_name}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={18} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <User size={12} strokeWidth={3} className="text-blue-500" />
                            อาจารย์พี่เลี้ยง / ผู้ประเมิน
                        </label>
                        <div className="relative">
                            <select 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none disabled:bg-slate-50/50 disabled:text-slate-300 disabled:cursor-not-allowed"
                                value={formData.preceptor_id}
                                onChange={(e) => setFormData({...formData, preceptor_id: e.target.value})}
                                disabled={!formData.location_id || isPreceptorLoading}
                                required
                            >
                                <option value="">{isPreceptorLoading ? 'กำลังโหลดรายชื่อ...' : !formData.location_id ? 'กรุณาเลือกสถานที่ก่อน' : 'เลือกผู้ประเมิน'}</option>
                                {preceptors.map(p => (
                                    <option key={p._id} value={p._id}>{p.firstname_lastname}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={18} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-50">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Calendar size={12} strokeWidth={3} className="text-blue-500" />
                                วันที่เข้าเวร
                            </label>
                            <input 
                                type="date" 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800" 
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={12} strokeWidth={3} className="text-blue-500" />
                                เวลาที่เข้า
                            </label>
                            <input 
                                type="time" 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800" 
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-8">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:bg-blue-300 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-sm"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>ยืนยันการเช็คอิน <Send size={20} strokeWidth={3} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </>
  );
};

export default CheckInForm;

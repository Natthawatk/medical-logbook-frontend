import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { Search, ChevronDown, User, MapPin, Plus, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import api from '../services/api';

interface Shift {
  _id: string;
  location_id: {
    Location_name: string;
  };
  preceptor_id?: {
    firstname_lastname: string;
    profile_image?: string;
  };
  shift_date: string;
  shift_status: 'normal' | 'late' | 'absent' | 'leave';
  verify_status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

const CheckIn = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = user?.firstname_lastname || 'นักศึกษา';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shiftsRes, unreadRes] = await Promise.all([
          api.get('/shifts/my'),
          api.get('/notifications/unread-count')
        ]);

        if (shiftsRes.data.success) {
          const sortedShifts = (shiftsRes.data.data || []).sort((a: Shift, b: Shift) => 
            new Date(b.shift_date).getTime() - new Date(a.shift_date).getTime()
          );
          setShifts(sortedShifts);
          setFilteredShifts(sortedShifts);
        }

        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = shifts.filter(item => 
      item.location_id?.Location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.preceptor_id?.firstname_lastname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.verify_status === statusFilter);
    }

    setFilteredShifts(filtered);
  }, [searchTerm, statusFilter, shifts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('th-TH', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShiftStatusPill = (status: string) => {
    switch (status) {
      case 'normal': return <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-emerald-100">ปกติ</span>;
      case 'late': return <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-amber-100">สาย</span>;
      case 'absent': return <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-rose-100">ขาด</span>;
      case 'leave': return <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-blue-100">ลา</span>;
      default: return null;
    }
  };

  const getVerifyStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return "ยืนยันแล้ว";
      case 'rejected': return "ปฏิเสธ";
      case 'pending': return "รอดำเนินการ";
      default: return status;
    }
  };

  const getVerifyStatusPill = (status: string) => {
    switch (status) {
      case 'verified': return <span className="flex items-center gap-1.5 text-xs font-black text-green-600 justify-center"><CheckCircle size={14} /> ยืนยันแล้ว</span>;
      case 'rejected': return <span className="flex items-center gap-1.5 text-xs font-black text-red-600 justify-center"><AlertTriangle size={14} /> ปฏิเสธ</span>;
      case 'pending': return <span className="flex items-center gap-1.5 text-xs font-black text-orange-600 justify-center"><Clock size={14} /> รอดำเนินการ</span>;
      default: return null;
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
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="ประวัติการเข้าเวร"
          subtitle="ตรวจสอบและติดตามประวัติการลงเวลาเข้าเวรของคุณ"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6">
          {/* Action Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตามสถานที่หรือผู้ประเมิน..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 text-slate-800 font-bold px-6 py-3.5 bg-white border-2 border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  {statusFilter === 'all' ? 'ทุกสถานะ' : getVerifyStatusLabel(statusFilter)} 
                  <ChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-slate-100 rounded-2xl shadow-lg z-10 overflow-hidden">
                    {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setIsFilterOpen(false); }}
                        className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${statusFilter === s ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                      >
                        {s === 'all' ? 'สถานะทั้งหมด' : getVerifyStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => navigate('/check-in/new')}
                className="flex-grow md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap text-sm uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} />
                ลงเวลาเข้าเวร
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100">
                <h3 className="text-xl font-black text-slate-800">รายการลงเวลาทั้งหมด</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">ผู้ประเมิน</th>
                    <th className="py-6 px-8">สถานที่ปฏิบัติงาน</th>
                    <th className="py-6 px-8">วันที่ / เวลา</th>
                    <th className="py-6 px-8 text-center">สถานะเข้าเวร</th>
                    <th className="py-6 px-8 text-center">การยืนยัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShifts.length > 0 ? (
                    filteredShifts.map((item) => (
                      <tr key={item._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                {item.preceptor_id?.profile_image ? (
                                    <img src={item.preceptor_id.profile_image} alt="Preceptor" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={22} className="text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-black text-sm text-slate-800">{item.preceptor_id?.firstname_lastname || 'ไม่ระบุ'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Preceptor</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                            <p className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                {item.location_id?.Location_name || 'ไม่ระบุ'}
                            </p>
                        </td>
                        <td className="py-6 px-8">
                            <p className="font-bold text-sm text-slate-700">{formatDate(item.shift_date)}</p>
                            <p className="font-semibold text-xs text-slate-500">{formatTime(item.shift_date)} น.</p>
                        </td>
                        <td className="py-6 px-8 text-center">
                          {getShiftStatusPill(item.shift_status)}
                        </td>
                        <td className="py-6 px-8 text-center">
                          {getVerifyStatusPill(item.verify_status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                            <Calendar size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลการลงเวลา</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือลงเวลาเข้าเวรใหม่</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </>
  );
};

export default CheckIn;

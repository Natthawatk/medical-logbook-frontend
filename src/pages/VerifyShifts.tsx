import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  HiMagnifyingGlass, 
  HiChevronDown, 
  HiUserCircle, 
  HiCheckCircle, 
  HiXCircle, 
  HiClock, 
  HiMapPin, 
  HiCalendarDays 
} from 'react-icons/hi2';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

const VerifyShifts = () => {
  const { showToast } = useToast();
  const [shifts, setShifts] = useState<any[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [preceptorName, setPreceptorName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
        api.get('/shifts/preceptor/shifts'),
        api.get('/users/me'),
        api.get('/notifications/unread-count')
      ]);

      if (results[0].status === 'fulfilled' && results[0].value?.data?.success) {
        setShifts(results[0].value.data.data || []);
      }
      if (results[1].status === 'fulfilled' && results[1].value?.data?.success) {
        setPreceptorName(results[1].value.data.data?.firstname_lastname || '');
      }
      if (results[2].status === 'fulfilled' && results[2].value?.data?.success) {
        setUnreadCount(results[2].value.data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown on click outside, scroll, or resize
  useEffect(() => {
    const handleClose = () => setOpenDropdownId(null);
    if (openDropdownId) {
      window.addEventListener('click', handleClose);
      window.addEventListener('scroll', handleClose);
      window.addEventListener('resize', handleClose);
    }
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose);
      window.removeEventListener('resize', handleClose);
    };
  }, [openDropdownId]);

  useEffect(() => {
    let filtered = [...shifts];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.student_id?.firstname_lastname?.toLowerCase()?.includes(search) ||
        item.location_id?.Location_name?.toLowerCase()?.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.verify_status === statusFilter);
    }

    setFilteredShifts(filtered);
  }, [searchTerm, statusFilter, shifts]);

  const handleVerify = async (id: string, verifyStatus: string, shiftStatus?: string) => {
    setIsProcessing(id);
    setOpenDropdownId(null);
    try {
      const payload: any = { verify_status: verifyStatus };
      if (shiftStatus) payload.shift_status = shiftStatus;

      const res = await api.put(`/shifts/${id}/verify`, payload);
      if (res.data.success) {
        setShifts(prev => prev.map(s => {
          if (s._id === id) {
            const updated = res.data.data;
            return {
              ...s,
              ...updated,
              student_id: typeof updated.student_id === 'object' ? updated.student_id : s.student_id,
              location_id: typeof updated.location_id === 'object' ? updated.location_id : s.location_id
            };
          }
          return s;
        }));
        showToast('ดำเนินการเรียบร้อยแล้ว', 'success');
      }
    } catch (err) {
      console.error('Error verifying shift:', err);
      showToast('เกิดข้อผิดพลาดในการดำเนินการ', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

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

  const getVerifyStatusStyles = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 justify-center"><HiCheckCircle size={14} /> ยืนยันแล้ว</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 text-xs font-black text-rose-600 justify-center"><HiXCircle size={14} /> ปฏิเสธ</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 text-xs font-black text-orange-600 justify-center"><HiClock size={14} /> รอการยืนยัน</span>;
      default:
        return null;
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
          studentName={preceptorName} 
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="ยืนยันการเข้าเวร"
          subtitle="ตรวจสอบและยืนยันการลงเวลาปฏิบัติงานของนักศึกษาในความดูแล"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6 pb-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อนักศึกษา หรือสถานที่..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-auto">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between gap-2 text-slate-800 font-bold px-6 py-3.5 bg-white border-2 border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all min-w-[160px]"
              >
                <span className="text-xs uppercase tracking-widest">{statusFilter === 'all' ? 'ทุกสถานะ' : statusFilter === 'verified' ? 'ยืนยันแล้ว' : statusFilter === 'rejected' ? 'ปฏิเสธ' : 'รอการยืนยัน'}</span>
                <HiChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-full md:w-56 bg-white border-2 border-slate-100 rounded-2xl shadow-lg z-10 overflow-hidden">
                  {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setIsFilterOpen(false); }}
                      className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${statusFilter === s ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      {s === 'all' ? 'สถานะทั้งหมด' : s === 'verified' ? 'ยืนยันแล้ว' : s === 'rejected' ? 'ปฏิเสธ' : 'รอการยืนยัน'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden min-h-[500px]">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">รายการลงเวลาปฏิบัติงาน</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    รวม {filteredShifts.length} รายการ
                </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-6">นักศึกษา</th>
                    <th className="py-6 px-6">สถานที่</th>
                    <th className="py-6 px-6">วันที่ / เวลา</th>
                    <th className="py-6 px-6 text-center">ประเภทการเข้าเวร</th>
                    <th className="py-6 px-6 text-center w-[220px]">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShifts.length > 0 ? (
                    filteredShifts.map((s) => (
                      <tr key={s._id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                {s.student_id?.profile_image ? (
                                    <img src={s.student_id.profile_image} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <HiUserCircle size={22} className="text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-black text-sm text-slate-800">{s.student_id?.firstname_lastname || 'ไม่ระบุ'}</p>
                                <div className="flex flex-col mt-0.5">
                                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-tight">ชั้นปี {s.student_id?.year || '-'}</span>
                                    <span className="text-[9px] text-slate-400 font-bold tracking-widest">{s.student_id?.student_id || '-'}</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                            <p className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                <HiMapPin size={14} className="text-slate-400 shrink-0" />
                                {s.location_id?.Location_name || '-'}
                            </p>
                        </td>
                        <td className="py-6 px-6 text-sm">
                            <p className="font-bold text-slate-700">{formatDate(s.shift_date)}</p>
                            <p className="font-semibold text-slate-500 text-xs">{formatTime(s.shift_date)} น.</p>
                        </td>
                        <td className="py-6 px-6 text-center">
                            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border shadow-sm ${
                                s.shift_status === 'normal' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' :
                                'border-amber-100 text-amber-600 bg-amber-50'
                            }`}>
                                {s.shift_status === 'normal' ? 'ปกติ' : 'มาสาย'}
                            </span>
                        </td>
                        <td className="py-6 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center min-h-[44px]">
                            {s.verify_status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleVerify(s._id, 'verified')}
                                        disabled={isProcessing === s._id}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all text-xs font-black group shadow-lg shadow-slate-100 active:scale-95"
                                    >
                                        <HiCheckCircle size={16} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                        ยืนยันเวร
                                    </button>

                                    <div className="relative">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDropdownPosition({
                                              top: rect.bottom + window.scrollY + 8,
                                              left: rect.right + window.scrollX - 176,
                                            });
                                            setOpenDropdownId(openDropdownId === s._id ? null : s._id);
                                          }}
                                          className={`w-10 h-10 flex items-center justify-center rounded-2xl border-2 transition-all ${openDropdownId === s._id ? 'bg-white border-blue-500 text-blue-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-white shadow-sm hover:bg-white hover:text-blue-600'}`}
                                        >
                                            <HiChevronDown size={18} strokeWidth={3} className={`transition-transform duration-300 ${openDropdownId === s._id ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {openDropdownId === s._id && createPortal(
                                          <div 
                                            style={{ 
                                              position: 'absolute', 
                                              top: dropdownPosition.top, 
                                              left: dropdownPosition.left,
                                              zIndex: 9999 
                                            }}
                                            className="w-44 bg-white border-2 border-slate-50 rounded-[24px] shadow-2xl p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                          >
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 mb-1">ปรับสถานะและบันทึก</p>
                                              {[
                                                  { val: 'normal', label: 'ปกติ (Normal)', color: 'text-emerald-500', bg: 'hover:bg-emerald-50' },
                                                  { val: 'late', label: 'สาย (Late)', color: 'text-amber-500', bg: 'hover:bg-amber-50' }
                                              ].map(opt => (
                                                  <button
                                                      key={opt.val}
                                                      onClick={() => handleVerify(s._id, 'pending', opt.val)}
                                                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-black transition-all ${opt.bg} ${s.shift_status === opt.val ? 'bg-slate-50' : ''}`}
                                                  >
                                                      <span className={s.shift_status === opt.val ? opt.color : 'text-slate-600'}>{opt.label}</span>
                                                      {s.shift_status === opt.val && <div className={`w-1.5 h-1.5 rounded-full ${opt.color.replace('text', 'bg')}`}></div>}
                                                  </button>
                                              ))}
                                          </div>,
                                          document.body
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="min-w-[120px]">
                                    {getVerifyStatusStyles(s.verify_status)}
                                </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                            <HiCalendarDays size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลการเข้าเวร</p>
                            <p className="text-slate-500 font-bold">ยังไม่มีรายการลงเวลาที่ต้องตรวจสอบในขณะนี้</p>
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

export default VerifyShifts;

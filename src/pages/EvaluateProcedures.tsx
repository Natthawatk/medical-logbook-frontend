import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { Search, ChevronDown, User, MapPin, CheckCircle2, Clock, XCircle, ClipboardList } from 'lucide-react';
import api from '../services/api';

const EvaluateProcedures = () => {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [preceptorName, setPreceptorName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [casesRes, userRes, unreadRes] = await Promise.allSettled([
          api.get('/logbook-cases/my-preceptorship'),
          api.get('/users/me'),
          api.get('/notifications/unread-count')
        ]);
        
        if (casesRes.status === 'fulfilled' && casesRes.value.data.success) {
          const data = casesRes.value.data.data;
          setProcedures(Array.isArray(data) ? data : []);
        }
        
        if (userRes.status === 'fulfilled' && userRes.value.data.success) {
          setPreceptorName(userRes.value.data.data.firstname_lastname);
        }
        
        if (unreadRes.status === 'fulfilled' && unreadRes.value.data.success) {
          setUnreadCount(unreadRes.value.data.count);
        }
      } catch (err) {
        console.error('Error fetching procedures:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...procedures];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.student_id?.firstname_lastname?.toLowerCase()?.includes(search) ||
        item.procedure_id?.procedure_name?.toLowerCase()?.includes(search) ||
        item.location_id?.Location_name?.toLowerCase()?.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.evaluation_status === statusFilter);
    }

    setFilteredProcedures(filtered);
  }, [searchTerm, statusFilter, procedures]);

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

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 justify-center"><CheckCircle2 size={14} /> ประเมินแล้ว</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 text-xs font-black text-red-600 justify-center"><XCircle size={14} /> ไม่ผ่าน</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 text-xs font-black text-orange-600 justify-center"><Clock size={14} /> รอประเมิน</span>;
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
          profileImage={user?.profile_image}
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="การประเมินหัตถการ"
          subtitle="จัดการและตรวจสอบบันทึกหัตถการของนักศึกษาในความดูแล"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อนักศึกษา, หัตถการ, หรือสถานที่..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-auto">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between gap-2 text-slate-800 font-bold px-6 py-3.5 bg-white border-2 border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all"
              >
                <span>{statusFilter === 'all' ? 'ทุกสถานะ' : statusFilter === 'approved' ? 'ประเมินแล้ว' : statusFilter === 'rejected' ? 'ไม่ผ่าน' : 'รอการประเมิน'}</span>
                <ChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-full md:w-56 bg-white border-2 border-slate-100 rounded-2xl shadow-lg z-10 overflow-hidden">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setIsFilterOpen(false); }}
                      className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${statusFilter === s ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      {s === 'all' ? 'สถานะทั้งหมด' : s === 'approved' ? 'ประเมินแล้ว' : s === 'rejected' ? 'ไม่ผ่าน' : 'รอการประเมิน'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">รายการหัตถการรอตรวจสอบ</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    รวม {filteredProcedures.length} รายการ
                </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">นักศึกษา</th>
                    <th className="py-6 px-8">หัตถการ / ลำดับ</th>
                    <th className="py-6 px-8">สถานที่</th>
                    <th className="py-6 px-8">วันที่ / เวลา</th>
                    <th className="py-6 px-8 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcedures.length > 0 ? (
                    filteredProcedures.map((p, i) => (
                      <tr 
                        key={i} 
                        className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/logbook-cases/${p._id}`)}
                      >
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                {p.student_id?.profile_image ? (
                                    <img src={p.student_id.profile_image} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={22} className="text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-black text-sm text-slate-800">{p.student_id?.firstname_lastname || 'ไม่ระบุ'}</p>
                                <div className="flex flex-col mt-0.5">
                                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-tight">ชั้นปี {p.student_id?.year || '-'}</span>
                                    <span className="text-[9px] text-slate-400 font-bold tracking-widest">{p.student_id?.student_id || '-'}</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8 min-w-[280px]">
                          <div className="flex flex-col gap-2">
                            <p className="font-black text-sm text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">
                              {p.procedure_id?.procedure_name || '-'}
                            </p>
                            {(() => {
                                const studentProcedureCases = procedures
                                  .filter(c => 
                                    c.procedure_id?._id === p.procedure_id?._id && 
                                    c.student_id?._id === p.student_id?._id
                                  )
                                  .sort((a, b) => new Date(a.case_date).getTime() - new Date(b.case_date).getTime());
                                
                                const currentSequence = studentProcedureCases.findIndex(c => c._id === p._id) + 1;
                                const targetCount = p.procedure_id?.required_cases || p.procedure_id?.target_score || 1;
                                const progressPercent = Math.min((currentSequence / targetCount) * 100, 100);

                                let barColor = 'bg-blue-600';
                                if (progressPercent < 30) barColor = 'bg-red-500';
                                else if (progressPercent < 60) barColor = 'bg-amber-500';
                                else if (progressPercent < 100) barColor = 'bg-blue-600';
                                else barColor = 'bg-emerald-600';

                                return (
                                    <div className="flex items-center gap-4">
                                        <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">
                                            {currentSequence}/{targetCount}
                                        </span>
                                    </div>
                                );
                            })()}
                          </div>
                        </td>
                        <td className="py-6 px-8">
                            <p className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                {p.location_id?.Location_name || '-'}
                            </p>
                        </td>
                        <td className="py-6 px-8 text-sm">
                            <p className="font-bold text-slate-700">{formatDate(p.case_date)}</p>
                            <p className="font-semibold text-slate-500 text-xs">{formatTime(p.case_date)} น.</p>
                        </td>
                        <td className="py-6 px-8 text-center">{getStatusPill(p.evaluation_status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                            <ClipboardList size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลรายการประเมิน</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือเลือกสถานะอื่น</p>
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

export default EvaluateProcedures;

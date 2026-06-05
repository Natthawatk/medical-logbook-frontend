import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  ClipboardList, 
  Edit2, 
  Trash2,
  Filter,
  BookOpen,
  Target,
  Layers
} from 'lucide-react';
import api from '../services/api';

interface ProcedureData {
  _id: string;
  procedure_name: string;
  course_id: {
    _id: string;
    course_name: string;
    course_code: string;
  };
  required_cases: number;
  target_score: number;
}

const ProcedureManagement = () => {
  const [procedures, setProcedures] = useState<ProcedureData[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<ProcedureData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('ทั้งหมด');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [procRes, unreadRes] = await Promise.all([
          api.get('/procedures'),
          api.get('/notifications/unread-count')
        ]);
        
        if (procRes.data.success) {
          setProcedures(procRes.data.data);
          setFilteredProcedures(procRes.data.data);
        }
        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }
      } catch (err) {
        console.error('Error fetching procedures data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = procedures.filter(p => 
      p.procedure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.course_id?.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.course_id?.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterCourse !== 'ทั้งหมด') {
      filtered = filtered.filter(p => p.course_id?.course_name === filterCourse);
    }

    setFilteredProcedures(filtered);
  }, [searchTerm, procedures, filterCourse]);

  const handleAddProcedure = () => {
    navigate('/admin/procedures/new');
  };

  const handleEditProcedure = (id: string) => {
    navigate(`/admin/procedures/${id}/edit`);
  };

  const courses = ['ทั้งหมด', ...Array.from(new Set(procedures.map(p => p.course_id?.course_name).filter(Boolean)))];

  const stats = {
    total: procedures.length,
    courses: courses.length - 1,
    avgRequired: Math.round(procedures.reduce((sum, p) => sum + (p.required_cases || 0), 0) / (procedures.length || 1))
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
          studentName={adminName} 
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="การจัดการหัตถการ"
          subtitle="จัดการข้อมูลหัตถการ เกณฑ์การประเมิน และความเชื่อมโยงกับรายวิชา"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6">
          {/* 1. Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">หัตถการทั้งหมด</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">จำนวนรายวิชา</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.courses}</p>
              </div>
            </div>
          </div>

          {/* 2. Actions & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตามชื่อหัตถการ หรือชื่อวิชา..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 text-slate-800 font-bold px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <Filter size={18} />
                  {filterCourse === 'ทั้งหมด' ? 'ทุกรายวิชา' : filterCourse} 
                  <ChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-slate-50 rounded-2xl shadow-xl z-10 overflow-hidden">
                    {courses.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setFilterCourse(c || ''); setIsFilterOpen(false); }}
                        className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${filterCourse === c ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleAddProcedure}
                className="flex-grow md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap text-sm uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} />
                เพิ่มหัตถการ
              </button>
            </div>
          </div>

          {/* 3. Procedures Table */}
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">ชื่อหัตถการ</th>
                    <th className="py-6 px-8">รายวิชาที่เกี่ยวข้อง</th>
                    <th className="py-6 px-8 text-center">จำนวนเคส</th>
                    <th className="py-6 px-8 text-center">คะแนน</th>
                    <th className="py-6 px-8 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcedures.length > 0 ? (
                    filteredProcedures.map((p) => (
                      <tr key={p._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center shrink-0 group-hover:rotate-2 transition-transform">
                                <Layers size={24} className="text-slate-400" />
                            </div>
                            <p className="font-black text-[15px] text-slate-800 leading-tight">{p.procedure_name}</p>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">{p.course_id?.course_code}</span>
                            <p className="text-xs font-bold text-slate-500">{p.course_id?.course_name}</p>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-700 text-sm shadow-inner">
                            {p.required_cases}
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl font-black text-blue-600 text-sm shadow-inner">
                            {p.target_score}
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEditProcedure(p._id)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-blue-100"
                            >
                              <Edit2 size={18} strokeWidth={2.5} />
                            </button>
                            <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-rose-100">
                              <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
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
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลหัตถการ</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือเพิ่มหัตถการใหม่เข้าสู่ระบบ</p>
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

export default ProcedureManagement;

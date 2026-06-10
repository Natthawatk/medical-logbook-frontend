import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2,
  Filter,
  Users,
  ClipboardList,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';
import { useModal } from '../components/ModalContext';

interface CourseData {
  _id: string;
  course_name: string;
  course_code: string;
  semester: string;
  year: string;
  evaluation_type: 'Pass/Fail' | '0-4';
  enrolled_student_count?: number;
  enrolled_locations?: string[];
  procedure_count?: number;
}

const CourseManagement = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('ทั้งหมด');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showToast } = useToast();
  const { confirm } = useModal();
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [courseRes, unreadRes, procedureRes] = await Promise.all([
        api.get('/courses'),
        api.get('/notifications/unread-count'),
        api.get('/procedures')
      ]);
      
      if (courseRes.data.success) {
        const coursesWithCount = courseRes.data.data.map((course: any) => {
          const count = procedureRes.data.data.filter((p: any) => p.course_id === course._id || p.course_id?._id === course._id).length;
          return { ...course, procedure_count: count };
        });
        setCourses(coursesWithCount);
        setFilteredCourses(coursesWithCount);
      }
      if (unreadRes.data.success) {
        setUnreadCount(unreadRes.data.count);
      }
    } catch (err) {
      console.error('Error fetching courses data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = courses.filter(course => 
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterSemester !== 'ทั้งหมด') {
      filtered = filtered.filter(course => course.semester === filterSemester);
    }

    setFilteredCourses(filtered);
  }, [searchTerm, courses, filterSemester]);

  const handleAddCourse = () => {
    navigate('/admin/courses/new');
  };

  const handleEditCourse = (id: string) => {
    navigate(`/admin/courses/${id}/edit`);
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบรายวิชา',
      message: `คุณต้องการลบรายวิชา "${name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบรายวิชา',
      cancelText: 'ยกเลิก'
    });

    if (isConfirmed) {
      try {
        const response = await api.delete(`/courses/${id}`);
        if (response.data.success) {
          showToast('ลบรายวิชาสำเร็จ', 'success');
          fetchData();
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'ไม่สามารถลบรายวิชาได้', 'error');
      }
    }
  };

  const semesters = ['ทั้งหมด', ...Array.from(new Set(courses.map(c => c.semester).filter(Boolean)))];

  const stats = {
    total: courses.length,
    totalStudents: courses.reduce((sum, c) => sum + (c.enrolled_student_count || 0), 0),
    totalProcedures: courses.reduce((sum, c) => sum + (c.procedure_count || 0), 0)
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
          profileImage={user?.profile_image}
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="การจัดการรายวิชา"
          subtitle="จัดการข้อมูลรายวิชา หัตถการที่เกี่ยวข้อง และการลงทะเบียนของนิสิต"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6">
          {/* 1. Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><BookOpen size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">รายวิชาทั้งหมด</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">นิสิตลงทะเบียน</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.totalStudents}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">หัตถการรวม</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.totalProcedures}</p>
              </div>
            </div>
          </div>

          {/* 2. Actions & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตามรหัส หรือชื่อวิชา..." 
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
                  เทอม {filterSemester} 
                  <ChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-50 rounded-2xl shadow-xl z-10 overflow-hidden">
                    {semesters.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setFilterSemester(s); setIsFilterOpen(false); }}
                        className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${filterSemester === s ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                      >
                        {s === 'ทั้งหมด' ? 'ทุกเทอม' : `เทอม ${s}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleAddCourse}
                className="flex-grow md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap text-sm uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} />
                เพิ่มรายวิชา
              </button>
            </div>
          </div>

          {/* 3. Courses Table */}
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">ข้อมูลรายวิชา</th>
                    <th className="py-6 px-8 text-center">ภาคเรียน</th>
                    <th className="py-6 px-8 text-center">ชั้นปี</th>
                    <th className="py-6 px-8 text-center">ประเภทการประเมิน</th>
                    <th className="py-6 px-8 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((c) => (
                      <tr key={c._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center shrink-0 group-hover:rotate-2 transition-transform">
                                <BookOpen size={24} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="font-black text-[15px] text-slate-800 leading-tight">{c.course_name}</p>
                                <p className="text-xs font-black text-blue-600 mt-1 uppercase tracking-tighter">{c.course_code}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Users size={10} /> {c.enrolled_student_count || 0} นิสิต</span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><MapPin size={10} /> {c.enrolled_locations?.length || 0} สถานที่</span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><ClipboardList size={10} /> {c.procedure_count || 0} หัตถการ</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100">เทอม {c.semester}</span>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200">ชั้นปีที่ {c.year}</span>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${c.evaluation_type === 'Pass/Fail' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {c.evaluation_type}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEditCourse(c._id)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-blue-100"
                            >
                              <Edit2 size={18} strokeWidth={2.5} />
                            </button>
                            <button 
                                onClick={() => handleDeleteCourse(c._id, c.course_name)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-rose-100"
                            >
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
                            <BookOpen size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลรายวิชา</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือเพิ่มรายวิชาใหม่</p>
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

export default CourseManagement;

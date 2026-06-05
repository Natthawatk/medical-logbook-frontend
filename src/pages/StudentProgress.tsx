import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Search, 
  ChevronDown, 
  User, 
  Filter, 
  ArrowRight, 
  Download,
  ClipboardCheck,
  GraduationCap,
  X,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

interface StudentProgressData {
  _id: string;
  firstname_lastname: string;
  student_id: string;
  year: string;
  semester: string;
  overallProgress: number;
  approvedCases: number;
  targetCases: number;
  attendance_pct: number;
  avg_score_pct: number;
  profile_image?: string;
}

const StudentProgress = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentProgressData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgressData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('ทั้งหมด');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [progressRes, unreadRes] = await Promise.all([
        api.get('/dashboard/admin/student-progress'),
        api.get('/notifications/unread-count')
      ]);
      
      if (progressRes.data.success) {
        setStudents(progressRes.data.data);
        setFilteredStudents(progressRes.data.data);
      }
      if (unreadRes.data.success) {
        setUnreadCount(unreadRes.data.count);
      }
    } catch (err) {
      console.error('Error fetching students progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = students.filter(s => 
      s.firstname_lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterYear !== 'ทั้งหมด') {
      filtered = filtered.filter(s => String(s.year) === filterYear);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, students, filterYear]);

  const years = ['ทั้งหมด', ...Array.from(new Set(students.map(s => String(s.year)).filter(Boolean))).sort()];

  const handleExportYearlyCSV = async (type: 'attendance' | 'procedures') => {
    if (filteredStudents.length === 0) {
      showToast('ไม่มีข้อมูลนักศึกษาในรายการที่เลือก', 'error');
      return;
    }
    
    setIsExporting(true);
    setShowExportModal(false);
    
    try {
      let csvContent = '';
      let rows: any[] = [];
      let headers: string[] = [];

      if (type === 'attendance') {
        headers = ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'ชั้นปีที่', 'วันที่', 'สถานที่', 'สถานะ', 'เวลาเข้า', 'เวลาออก'];
        
        for (const student of filteredStudents) {
          const res = await api.get(`/shifts/user/${student._id}`);
          const shifts = res.data.success ? res.data.data : [];
          shifts.forEach((s: any) => {
            rows.push([
              student.student_id,
              student.firstname_lastname,
              student.year,
              new Date(s.shift_date).toLocaleDateString('th-TH'),
              s.location_id?.Location_name || '-',
              s.status === 'verified' ? 'ปกติ' : s.status === 'late' ? 'สาย' : s.status === 'absent' ? 'ขาด' : 'รอยืนยัน',
              s.check_in_time || '-',
              s.check_out_time || '-'
            ]);
          });
        }
      } else {
        headers = ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'ชั้นปีที่', 'รหัสวิชา', 'ชื่อวิชา', 'ชื่อหัตถการ', 'จำนวนเคสที่ผ่าน', 'จำนวนเคสทั้งหมด', 'คะแนนที่ได้', 'คะแนนเต็ม'];
        
        let allProcedures: any[] = [];
        
        // 1. Collect all data from all students
        for (const student of filteredStudents) {
          const statsRes = await api.get(`/dashboard/admin/student/${student._id}`);
          if (statsRes.data.success) {
            const courseProgress = statsRes.data.data.courseProgress || [];
            
            for (const course of courseProgress) {
              const procRes = await api.get(`/dashboard/admin/student/${student._id}/course/${course._id}`);
              const procedures = procRes.data.success ? procRes.data.data : [];
              
              procedures.forEach((p: any) => {
                allProcedures.push({
                  student_id: student.student_id,
                  student_name: student.firstname_lastname,
                  year: student.year,
                  course_code: course.course_code,
                  course_name: course.course_name,
                  procedure_name: p.procedure_name,
                  approvedCount: p.approvedCount,
                  targetCount: p.targetCount,
                  obtainedScore: p.obtainedScore,
                  targetScore: p.targetScore
                });
              });
            }
          }
        }

        // 2. Sort: Course Code -> Procedure Name -> Year -> Student ID
        allProcedures.sort((a, b) => {
          if (a.course_code !== b.course_code) return a.course_code.localeCompare(b.course_code);
          if (a.procedure_name !== b.procedure_name) return a.procedure_name.localeCompare(b.procedure_name);
          if (a.year !== b.year) return Number(a.year) - Number(b.year);
          return a.student_id.localeCompare(b.student_id);
        });

        // 3. Build rows with separators between courses
        let lastCourse = '';
        allProcedures.forEach((item) => {
          if (lastCourse && item.course_code !== lastCourse) {
            rows.push(['', '', '', '', '', '', '', '', '', '']); // Separator line
          }
          
          rows.push([
            item.student_id,
            item.student_name,
            item.year,
            item.course_code,
            item.course_name,
            item.procedure_name,
            item.approvedCount,
            item.targetCount,
            item.obtainedScore?.toFixed(2) || '0.00',
            item.targetScore || '0'
          ]);
          
          lastCourse = item.course_code;
        });
      }

      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yearly_report_${filterYear}_${type}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('ส่งออกข้อมูลสำเร็จ', 'success');
    } catch (err) {
      console.error('Bulk export error:', err);
      showToast('เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'error');
    } finally {
      setIsExporting(false);
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
          studentName={adminName} 
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="ติดตามความคืบหน้านักศึกษา"
          subtitle="ภาพรวมสถานะการเก็บเคสและการปฏิบัติงานของนักศึกษารายบุคคล"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6 pb-20">
          
          {/* Header Action Row */}
          <div className="flex justify-end items-center">
             <div className="flex gap-3">
                <button 
                  onClick={() => setShowExportModal(true)}
                  disabled={isExporting}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200 uppercase tracking-widest text-[10px] disabled:bg-blue-300"
                >
                  {isExporting ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Download size={18} strokeWidth={2.5} />
                  )}
                  {isExporting ? 'กำลังส่งออก...' : 'ส่งออกข้อมูลชั้นปี (CSV)'}
                </button>
             </div>
          </div>

          {/* Export Options Modal */}
          {showExportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowExportModal(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border-4 border-white animate-in zoom-in-95">
                <div className="p-8 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">ส่งออกข้อมูลชั้นปี</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ชั้นปีที่กำลังเลือก: {filterYear}</p>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>
                <div className="p-8 space-y-4">
                  <button 
                    onClick={() => handleExportYearlyCSV('attendance')}
                    className="w-full p-6 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 rounded-[24px] transition-all group text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <UserCheck size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-blue-700 transition-colors">ข้อมูลการเข้าเวร</p>
                      <p className="text-xs font-bold text-slate-400">เช็คอินเช็คเอาท์ทั้งหมดของชั้นปีนี้</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleExportYearlyCSV('procedures')}
                    className="w-full p-6 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 rounded-[24px] transition-all group text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">ข้อมูลความคืบหน้าหัตถการ</p>
                      <p className="text-xs font-bold text-slate-400">รายละเอียดเคสและคะแนนทุกวิชา</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto shadow-sm rounded-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ, รหัสนิสิต หรืออีเมล..." 
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-white rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-48 shadow-sm rounded-2xl">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between text-slate-800 font-bold px-6 py-4 bg-white border-2 border-white rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <Filter size={18} className="text-slate-400" />
                {filterYear === 'ทั้งหมด' ? 'ชั้นปีทั้งหมด' : `ชั้นปีที่ ${filterYear}`}
                <ChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white border-2 border-slate-50 rounded-2xl shadow-2xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => { setFilterYear(y); setIsFilterOpen(false); }}
                      className={`w-full text-left px-5 py-3.5 font-bold transition-colors hover:bg-slate-50 ${filterYear === y ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      {y === 'ทั้งหมด' ? 'ชั้นปีทั้งหมด' : `ชั้นปีที่ ${y}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full-width Bordered Table */}
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-7 px-10">ข้อมูลนักศึกษา</th>
                    <th className="py-7 px-8 text-center">ความคืบหน้าเคส</th>
                    <th className="py-7 px-8 text-center">การเข้าเวร</th>
                    <th className="py-7 px-8 text-center">การประเมิน</th>
                    <th className="py-7 px-8 text-center">คะแนนเฉลี่ย</th>
                    <th className="py-7 px-8 text-right">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr key={s._id} className="hover:bg-blue-50/20 transition-all group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:rotate-2 transition-transform">
                              {s.profile_image ? (
                                <img src={s.profile_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={24} className="text-slate-300" />
                              )}
                            </div>
                            <div>
                                <p className="font-black text-[15px] text-slate-800 leading-tight">{s.firstname_lastname}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">ID: {s.student_id}</p>
                                <p className="text-[10px] font-black text-blue-600 mt-0.5 uppercase tracking-tighter">ชั้นปีที่ {s.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-7 px-8 text-center">
                            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-700 text-sm shadow-inner group-hover:bg-white transition-colors">
                                {s.approvedCases}/{s.targetCases}
                            </div>
                        </td>
                        <td className="py-7 px-8 text-center">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full font-black text-sm shadow-sm border-4 ${
                              s.attendance_pct >= 80 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
                              s.attendance_pct >= 50 ? 'border-amber-500 text-amber-600 bg-amber-50' : 
                              'border-rose-500 text-rose-600 bg-rose-50'
                            }`}>
                                {Math.round(s.attendance_pct)}%
                            </div>
                        </td>
                        <td className="py-7 px-8 text-center">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full font-black text-sm shadow-sm border-4 ${
                              s.overallProgress >= 80 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
                              s.overallProgress >= 50 ? 'border-amber-500 text-amber-600 bg-amber-50' : 
                              'border-rose-500 text-rose-600 bg-rose-50'
                            }`}>
                                {Math.round(s.overallProgress)}%
                            </div>
                        </td>
                        <td className="py-7 px-8 text-center">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full font-black text-sm shadow-sm border-4 ${
                              s.avg_score_pct >= 80 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
                              s.avg_score_pct >= 50 ? 'border-amber-500 text-amber-600 bg-amber-50' : 
                              'border-rose-500 text-rose-600 bg-rose-50'
                            }`}>
                                {Math.round(s.avg_score_pct)}%
                            </div>
                        </td>
                        <td className="py-7 px-8 text-right">
                          <button 
                            onClick={() => navigate(`/admin/students/${s._id}`)}
                            className="w-12 h-12 inline-flex items-center justify-center bg-white text-slate-400 hover:text-blue-600 hover:shadow-xl hover:border-blue-100 rounded-2xl transition-all border-2 border-slate-100 active:scale-90 shadow-sm"
                          >
                            <ArrowRight size={24} strokeWidth={3} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 shadow-inner">
                            <GraduationCap size={48} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลความคืบหน้านิสิต</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือตรวจสอบข้อมูลการลงทะเบียน</p>
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

export default StudentProgress;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressGraph from '../components/ProgressGraph';
import AdminCourseCard from '../components/AdminCourseCard';
import DashboardHeader from '../components/DashboardHeader';
import AdminStatCard from '../components/AdminStatCard';
import api from '../services/api';
import { 
  HiUserCircle, 
  HiClock, 
  HiClipboardDocumentList, 
  HiCheckCircle, 
  HiExclamationTriangle, 
  HiXCircle, 
  HiInformationCircle,
  HiArrowDownTray,
  HiXMark,
  HiAcademicCap,
  HiCalendarDays
} from 'react-icons/hi2';
import ProcedureStats from '../components/ProcedureStats';
import { useToast } from '../components/ToastContext';

const AdminStudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [procedureStats, setProcedureStats] = useState<any[]>([]);
  const [isProceduresLoading, setIsProceduresLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, unreadRes] = await Promise.all([
          api.get(`/dashboard/admin/student/${id}`),
          api.get('/notifications/unread-count')
        ]);
        
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
          if (statsRes.data.data.courseProgress?.length > 0) {
            setSelectedCourseId(statsRes.data.data.courseProgress[0]._id);
          }
        }
        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }
      } catch (err) {
        console.error('Error fetching student stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchProcedures = async () => {
      if (!selectedCourseId) return;
      try {
        setIsProceduresLoading(true);
        const res = await api.get(`/dashboard/admin/student/${id}/course/${selectedCourseId}`);
        if (res.data.success) {
          setProcedureStats(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching procedure stats:', err);
      } finally {
        setIsProceduresLoading(false);
      }
    };
    fetchProcedures();
  }, [id, selectedCourseId]);

  const handleExportCSV = async (type: 'attendance' | 'procedures') => {
    if (!stats) return;
    setIsExporting(true);
    setShowExportModal(false);
    
    try {
      let csvContent = '';
      let filename = '';

      if (type === 'attendance') {
        // 1. Export Attendance Data
        const res = await api.get(`/shifts/user/${id}`);
        const shifts = res.data.success ? res.data.data : [];
        
        const headers = ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'วันที่', 'สถานที่', 'สถานะ', 'เวลาเข้า', 'เวลาออก'];
        const rows = shifts.map((s: any) => [
          stats.studentInfo?.student_id,
          stats.studentInfo?.firstname_lastname,
          new Date(s.shift_date).toLocaleDateString('th-TH'),
          s.location_id?.Location_name || '-',
          s.status === 'verified' ? 'ปกติ' : s.status === 'late' ? 'สาย' : s.status === 'absent' ? 'ขาด' : 'รอยืนยัน',
          s.check_in_time || '-',
          s.check_out_time || '-'
        ]);
        
        csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
        filename = `attendance_${stats.studentInfo?.student_id}.csv`;
      } else {
        // 2. Export Procedure Data
        const allProcedurePromises = stats.courseProgress.map((course: any) => 
          api.get(`/dashboard/admin/student/${id}/course/${course._id}`)
        );
        const responses = await Promise.all(allProcedurePromises);
        
        const headers = ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'ชั้นปีที่', 'รหัสวิชา', 'ชื่อวิชา', 'ชื่อหัตถการ', 'จำนวนเคสที่ผ่าน', 'จำนวนเคสทั้งหมด', 'คะแนนที่ได้', 'คะแนนเต็ม'];
        const rows: any[] = [];
        
        responses.forEach((res, index) => {
          const course = stats.courseProgress[index];
          const procedures = res.data.data || [];
          
          // Add a separator row for each course (visual highlight simulation)
          if (index > 0) rows.push(['', '', '', '', '', '', '', '', '', '']); 
          
          procedures.forEach((p: any) => {
            rows.push([
              stats.studentInfo?.student_id,
              stats.studentInfo?.firstname_lastname,
              stats.studentInfo?.year,
              course.course_code,
              course.course_name,
              p.procedure_name,
              p.approvedCount,
              p.targetCount,
              p.obtainedScore?.toFixed(2) || '0.00',
              p.targetScore || '0'
            ]);
          });
        });
        
        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename = `procedures_${stats.studentInfo?.student_id}.csv`;
      }

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('ส่งออกข้อมูลสำเร็จ', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const adminName = JSON.parse(localStorage.getItem('user') || '{}').firstname_lastname || 'ผู้ดูแลระบบ';

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
          onBack={() => navigate('/admin/progress')}
          showTitle={true}
          title="รายละเอียดความคืบหน้าของนักศึกษา"
          subtitle={`กำลังดูข้อมูลของ: ${stats?.studentInfo?.firstname_lastname}`}
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6 pb-20">
          
          {/* Action Row */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-3 transition shadow-lg shadow-blue-200 active:scale-95 uppercase tracking-widest text-xs"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <HiArrowDownTray size={18} />
              )}
              {isExporting ? 'กำลังส่งออก...' : 'ส่งออกข้อมูล (CSV)'}
            </button>
          </div>

          {/* Export Options Modal */}
          {showExportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowExportModal(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border-4 border-white animate-in zoom-in-95">
                <div className="p-8 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-xl font-black text-slate-800">เลือกประเภทการส่งออก</h3>
                  <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                    <HiXMark size={20} />
                  </button>
                </div>
                <div className="p-8 space-y-4">
                  <button 
                    onClick={() => handleExportCSV('attendance')}
                    className="w-full p-6 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 rounded-[24px] transition-all group text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <HiUserCircle size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-blue-700 transition-colors">ข้อมูลการเข้าเวร</p>
                      <p className="text-xs font-bold text-slate-400">วันเวลา สถานที่ และสถานะการเช็คอิน</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleExportCSV('procedures')}
                    className="w-full p-6 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 rounded-[24px] transition-all group text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <HiClipboardDocumentList size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">ข้อมูลความคืบหน้าหัตถการ</p>
                      <p className="text-xs font-bold text-slate-400">จำนวนเคสที่ทำและเป้าหมายรายวิชา</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Student Identity Card */}
          <div className="bg-white p-8 rounded-[48px] border-2 border-white shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-[40px] bg-slate-100 overflow-hidden border-4 border-white shadow-lg shrink-0">
              {stats?.studentInfo?.profile_image ? (
                <img src={stats.studentInfo.profile_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <HiUserCircle size={64} />
                </div>
              )}
            </div>
            <div className="text-center md:text-left flex-grow">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-3xl font-black text-slate-900">{stats?.studentInfo?.firstname_lastname}</h2>
                <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">นักศึกษา</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500">
                <div className="flex items-center gap-2">
                  <HiAcademicCap size={18} className="text-blue-500" />
                  <span className="font-black text-xs uppercase tracking-widest">ID: {stats?.studentInfo?.student_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiCalendarDays size={18} className="text-emerald-500" />
                  <span className="font-black text-xs uppercase tracking-widest">ชั้นปีที่ {stats?.studentInfo?.year}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center md:items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ความคืบหน้ารวม</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 leading-none">{stats?.overallProgress}%</span>
                </div>
            </div>
          </div>

          {/* 2. Stats Summary (Same as StudentDashboard) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminStatCard 
              title="สถานะการเข้าเวร"
              value={stats?.verifiedShifts || 0}
              unit="ครั้ง"
              icon={<HiUserCircle size={28} />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              details={[
                { label: "ปกติ", value: stats?.normalShifts || 0, color: "text-emerald-600", icon: <HiCheckCircle size={14} className="text-emerald-500" /> },
                { label: "สาย", value: stats?.lateShifts || 0, color: "text-amber-600", icon: <HiExclamationTriangle size={14} className="text-amber-500" /> }
              ]}
            />
            
            <AdminStatCard 
              title="รอยืนยัน/ตรวจสอบ"
              value={(stats?.pendingShifts || 0) + (stats?.pendingCases || 0)}
              unit="รายการ"
              icon={<HiClock size={28} />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              details={[
                { label: "รอยืนยันเวร", value: stats?.pendingShifts || 0, color: "text-amber-600", icon: <HiClock size={14} className="text-amber-500" /> },
                { label: "รอประเมินเคส", value: stats?.pendingCases || 0, color: "text-amber-600", icon: <HiInformationCircle size={14} className="text-amber-500" /> }
              ]}
            />

            <AdminStatCard 
              title="สถานะการประเมิน"
              value={(stats?.approvedCases || 0) + (stats?.rejectedCases || 0)}
              unit="เคส"
              icon={<HiClipboardDocumentList size={28} />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              details={[
                { label: "ผ่านการประเมิน", value: stats?.approvedCases || 0, color: "text-blue-600", icon: <HiCheckCircle size={14} className="text-blue-500" /> },
                { label: "ต้องแก้ไข", value: stats?.rejectedCases || 0, color: "text-red-600", icon: <HiXCircle size={14} className="text-red-500" /> }
              ]}
            />
          </div>

          {/* 3. Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats?.courseProgress?.map((course: any) => (
              <AdminCourseCard key={course._id} course={course} />
            ))}
          </div>

          {/* 4. Overall Progress Graph */}
          <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl h-[400px]">
            <ProgressGraph 
              data={stats?.graphData || []} 
              overallProgress={stats?.overallProgress || 0} 
              totalApproved={stats?.totalProceduresDone || 0} 
              totalTarget={stats?.totalProceduresCount || 0}
              averageScore={stats?.averageScore || 0}
            />
          </div>

          {/* 5. Procedure Stats */}
          <ProcedureStats 
            procedureStats={procedureStats}
            courses={stats?.courseProgress || []}
            selectedCourseId={selectedCourseId}
            onCourseChange={setSelectedCourseId}
            isLoading={isProceduresLoading}
          />
        </div>
    </>
  );
};

export default AdminStudentDetail;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressGraph from '../components/ProgressGraph';
import AdminCourseCard from '../components/AdminCourseCard';
import DashboardHeader from '../components/DashboardHeader';
import AdminStatCard from '../components/AdminStatCard';
import ProcedureStats from '../components/ProcedureStats';
import api from '../services/api';
import { 
  HiUserCircle, 
  HiClock, 
  HiClipboardDocumentList, 
  HiCheckCircle, 
  HiExclamationTriangle, 
  HiXCircle, 
  HiInformationCircle 
} from 'react-icons/hi2';

interface CourseProgress {
  _id: string;
  course_name: string;
  course_code: string;
  approvedCases: number;
  targetCases: number;
  totalTypes: number;
  progressPercent: number;
  averageScore: number;
  semester?: string | number;
  year?: string | number;
}

interface ProcedureStat {
  _id: string;
  procedure_name: string;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  targetCount: number;
  progressPercent: number;
}

interface GraphItem {
  name: string;
  cases: number;
}

interface DashboardStats {
  totalCases: number;
  approvedCases: number;
  pendingCases: number;
  rejectedCases: number;
  verifiedShifts: number;
  pendingShifts: number;
  normalShifts: number;
  lateShifts: number;
  absentShifts: number;
  leaveShifts?: number;
  courseProgress: CourseProgress[];
  graphData: GraphItem[];
  unreadNotificationsCount: number;
  overallProgress?: number;
  averageScore?: number;
  totalProceduresDone?: number;
  totalProceduresCount?: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [procedureStats, setProcedureStats] = useState<ProcedureStat[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProceduresLoading, setIsProceduresLoading] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = user?.firstname_lastname || 'นักศึกษา';

  useEffect(() => {
    if (user.role === 'preceptor') {
      navigate('/preceptor/dashboard', { replace: true });
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate, user.role]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/student');
        if (response.data.success && response.data.data) {
          setStats(response.data.data);
          if (response.data.data.courseProgress && response.data.data.courseProgress.length > 0) {
            setSelectedCourseId(response.data.data.courseProgress[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchProcedures = async () => {
      if (!selectedCourseId) return;
      setIsProceduresLoading(true);
      try {
        const response = await api.get(`/dashboard/student/course/${selectedCourseId}`);
        if (response.data.success && response.data.data) {
          setProcedureStats(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching procedure stats:', err);
      } finally {
        setIsProceduresLoading(false);
      }
    };
    fetchProcedures();
  }, [selectedCourseId]);

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
          unreadCount={stats?.unreadNotificationsCount || 0}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="ภาพรวมความคืบหน้าการฝึกปฏิบัติ"
          subtitle="ติดตามสถิติและสถานะการเรียนของคุณทั้งหมด"
        />

        <div className="max-w-6xl mx-auto space-y-8 mt-6">
          {/* 1. Stats Summary */}
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

          {/* 2. Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats?.courseProgress?.map((course) => (
              <AdminCourseCard key={course._id} course={course} />
            ))}
          </div>

          {/* 3. Overall Progress Graph */}
          <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl h-[400px]">
            <ProgressGraph 
              data={stats?.graphData || []} 
              overallProgress={stats?.overallProgress || 0} 
              totalApproved={stats?.totalProceduresDone || 0} 
              totalTarget={stats?.totalProceduresCount || 0}
              averageScore={stats?.averageScore || 0}
            />
          </div>

          {/* 4. Procedure Stats (Table Style) */}
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

export default StudentDashboard;

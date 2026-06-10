import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import ProgressGraph from '../components/ProgressGraph';
import api from '../services/api';
import { Users, ClipboardList, MapPin, BookOpen, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [skillsStats, setSkillsStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkillsLoading, setIsSkillsLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setStats(res.data.data);
          if (res.data.data.courseProgress && res.data.data.courseProgress.length > 0) {
            setSelectedCourseId(res.data.data.courseProgress[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  useEffect(() => {
    const fetchSkillsStats = async () => {
      if (!selectedCourseId) return;
      setIsSkillsLoading(true);
      try {
        const res = await api.get(`/dashboard/admin/course-skills/${selectedCourseId}`);
        if (res.data.success) {
          setSkillsStats(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching course skills stats:', err);
      } finally {
        setIsSkillsLoading(false);
      }
    };
    fetchSkillsStats();
  }, [selectedCourseId]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user.firstname_lastname || 'ผู้ดูแลระบบ';

  const selectedCourse = stats?.courseProgress?.find((c: any) => c._id === selectedCourseId);

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
          unreadCount={stats?.unreadNotificationsCount || 0}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="แดชบอร์ดผู้ดูแลระบบ"
          subtitle="ภาพรวมระบบและข้อมูลสถิติทั่วไป"
        />

        <div className="max-w-6xl mx-auto space-y-8 mt-6">
          {/* 1. Quick Actions */}

          {/* 2. Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl"><Users size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ผู้ใช้งานทั้งหมด</p>
                <p className="text-3xl font-black text-slate-900 leading-tight">{stats?.totalUsers || 0}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight">นักศึกษา {stats?.usersByRole?.student || 0}</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight">อาจารย์พี่เลี้ยง {stats?.usersByRole?.preceptor || 0}</span>
                  <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight">แอดมิน {stats?.usersByRole?.admin || 0}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-700 rounded-2xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">หัตถการทั้งหมด</p>
                <p className="text-3xl font-black text-slate-900 leading-tight">{stats?.totalProcedures || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-2xl"><MapPin size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">สถานที่ฝึกงาน</p>
                <p className="text-3xl font-black text-slate-900 leading-tight">{stats?.totalLocations || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl"><BookOpen size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">รายวิชาทั้งหมด</p>
                <p className="text-3xl font-black text-slate-900 leading-tight">{stats?.totalCourses || 0}</p>
              </div>
            </div>
          </div>

          {/* 2. Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats?.courseProgress?.map((course: any) => (
              <div key={course._id} className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <BookOpen size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 leading-tight">{course.progressPercent}%</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ความคืบหน้ารวม</p>
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-[15px] leading-tight group-hover:text-blue-700 transition-colors mb-1 line-clamp-1">{course.course_name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-mono font-black uppercase tracking-tight border border-blue-200">{course.course_code}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-slate-200">เทอม {course.semester}</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ชั้นปี {course.year}</span>
                </div>
                
                <div className="space-y-3 mt-5">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-slate-500">เป้าหมายเคส:</span>
                    <span className="text-slate-900">{course.approvedCases} / {course.targetCases}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    {(() => {
                      const progress = Math.round(course.progressPercent);
                      let barColor = 'bg-blue-600';
                      if (progress < 30) barColor = 'bg-red-500';
                      else if (progress < 60) barColor = 'bg-amber-500';
                      else if (progress < 100) barColor = 'bg-blue-600';
                      else barColor = 'bg-emerald-600';
                      
                      return (
                        <div 
                          className={`h-full transition-all duration-1000 ${barColor}`} 
                          style={{ width: `${progress}%` }}
                        ></div>
                      );
                    })()}
                  </div>
                  <div className="pt-3 border-t-2 border-slate-50 flex flex-wrap gap-2 justify-end">
                    {Object.entries(course.studentsByYear || {}).map(([year, count]: any) => (
                      <span key={year} className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md border border-slate-200">
                        ชั้นปี {year}: {count} คน
                      </span>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 border-2 border-blue-600 text-white hover:bg-blue-700 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-90"
                >
                  ดูรายละเอียด <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>

          {/* 3. Overall Progress Graph */}
          <div className="bg-white p-8 rounded-[32px] border-2 border-white shadow-md h-[400px]">
            <ProgressGraph 
              data={stats?.graphData || []} 
              overallProgress={stats?.overallProgress || 0} 
              totalApproved={stats?.totalApprovedCases || 0} 
              totalTarget={stats?.totalTargetCases || 0}
              averageScore={Number(stats?.averageScore) || 0}
            />
          </div>
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
                  สถิติการทำหัตถการรายวิชา
                </h3>
                <p className="text-sm font-black text-slate-500 mt-2 ml-12">รายวิชา {selectedCourse?.course_code || '-'} ({skillsStats.length} หัตถการ)</p>
              </div>
              
              <div className="relative min-w-[240px]">
                <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full pl-6 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-black text-slate-800 text-sm appearance-none"
                >
                  {stats?.courseProgress?.map((course: any) => (
                    <option key={course._id} value={course._id}>
                      {course.course_code}: {course.course_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <BookOpen size={20} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">ชื่อหัตถการ</th>
                    <th className="py-6 px-8 text-center">ความคืบหน้า</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isSkillsLoading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-6 px-8"><div className="h-5 w-48 bg-slate-100 rounded"></div></td>
                        <td className="py-6 px-8"><div className="h-5 w-full bg-slate-100 rounded"></div></td>
                      </tr>
                    ))
                  ) : skillsStats.length > 0 ? (
                    skillsStats.map((skill: any, idx: number) => (
                      <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 border-4 border-white shadow-md flex items-center justify-center shrink-0 group-hover:rotate-2 transition-transform duration-300">
                              <ClipboardList size={22} strokeWidth={1.5} />
                            </div>
                            <span className="font-black text-[15px] text-slate-900 group-hover:text-blue-700 transition-colors">{skill.procedure_name}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <div className="flex items-center gap-6 max-w-sm mx-auto">
                            <div className="flex-grow h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full transition-all duration-1000 ${skill.percent === 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                style={{ width: `${skill.percent}%` }}
                              ></div>
                            </div>
                            <span className="min-w-[120px] text-right text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">
                              {skill.completedStudents} / {skill.totalStudents} คน ({skill.percent}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                            <ClipboardList size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลสถิติ</p>
                            <p className="text-slate-500 font-bold">กรุณาเลือกรายวิชาอื่นเพื่อดูสถิติหัตถการ</p>
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

export default AdminDashboard;

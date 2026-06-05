import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  HiCheckCircle, 
  HiClock, 
  HiCalendarDays, 
  HiExclamationCircle 
} from 'react-icons/hi2';
import DashboardHeader from '../components/DashboardHeader';
import AdminStatCard from '../components/AdminStatCard';
import api from '../services/api';

const PreceptorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preceptorName, setPreceptorName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          api.get('/dashboard/preceptor'),
          api.get('/users/me')
        ]);
        
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        
        if (userRes.data.success) {
          setPreceptorName(userRes.data.data.firstname_lastname);
          setProfileImage(userRes.data.data.profile_image);
          
          // Update localStorage as well to keep it in sync
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...localUser, ...userRes.data.data }));
        }
      } catch (err) {
        console.error('Error fetching preceptor stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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
          profileImage={profileImage}
          unreadCount={stats?.unreadNotificationsCount || 0}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="Preceptor Dashboard"
          subtitle="ภาพรวมการประเมินและการตรวจสอบการเข้าเวร"
        />

        <div className="max-w-6xl mx-auto space-y-8 mt-6">
          
          {/* 1. KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <AdminStatCard 
              title="ประเมินสำเร็จ"
              value={stats?.evaluatedCases || 0}
              unit="รายการ"
              icon={<HiCheckCircle size={24} />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-700"
            />
            <AdminStatCard 
              title="รอการผ่านการประเมิน"
              value={stats?.pendingCases || 0}
              unit="รายการ"
              icon={<HiClock size={24} />}
              iconBg="bg-amber-100"
              iconColor="text-amber-700"
            />
            <AdminStatCard 
              title="ยืนยันเวรแล้ว"
              value={stats?.verifiedShifts || 0}
              unit="ครั้ง"
              icon={<HiCalendarDays size={24} />}
              iconBg="bg-blue-100"
              iconColor="text-blue-700"
            />
            <AdminStatCard 
              title="รอการยืนยันเวร"
              value={stats?.pendingShifts || 0}
              unit="ครั้ง"
              icon={<HiExclamationCircle size={24} />}
              iconBg="bg-rose-100"
              iconColor="text-rose-700"
            />
          </div>

          {/* 3. Performance Graph */}
          <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b-2 border-slate-50">
              <div className="flex items-center gap-5">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">เปอร์เซ็นการผ่านการประเมิน</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-4xl font-black text-slate-800 leading-none">{stats?.passingRate || 0}%</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${stats?.performanceGrowth >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {stats?.performanceGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats?.performanceGrowth || 0)}% ล่าสุด 30 วัน
                        </div>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={stats?.graphData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 11, fontWeight: '900'}} 
                    dy={15}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                    itemStyle={{ fontWeight: '900', color: '#1E293B' }}
                    labelStyle={{ fontWeight: '900', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cases" 
                    stroke="#2563EB" 
                    strokeWidth={5} 
                    dot={{ r: 7, fill: '#2563EB', strokeWidth: 4, stroke: '#fff' }}
                    activeDot={{ r: 10, strokeWidth: 0, fill: '#1E40AF' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
    </>
  );
};

export default PreceptorDashboard;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  MapPin, 
  Edit2,
  Trash2,
  Filter,
  Navigation,
  CheckCircle2,
  User
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';
import { useModal } from '../components/ModalContext';

interface LocationData {
  _id: string;
  Location_name: string;
  latitude: number;
  longitude: number;
  radius: number;
  semester?: string;
  preceptor_count?: number;
}

const LocationManagement = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
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
      const [locationRes, unreadRes, preceptorRes] = await Promise.all([
        api.get('/locations'),
        api.get('/notifications/unread-count'),
        api.get('/users/preceptors')
      ]);
      
      if (locationRes.data.success) {
        const locsWithCount = locationRes.data.data.map((loc: LocationData) => {
          const count = preceptorRes.data.data.filter((p: any) => p.workplace?._id === loc._id || p.workplace === loc._id).length;
          return { ...loc, preceptor_count: count };
        });
        setLocations(locsWithCount);
        setFilteredLocations(locsWithCount);
      }
      if (unreadRes.data.success) {
        setUnreadCount(unreadRes.data.count);
      }
    } catch (err) {
      console.error('Error fetching locations data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = locations.filter(loc => 
      loc.Location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterSemester !== 'ทั้งหมด') {
      filtered = filtered.filter(loc => loc.semester === filterSemester);
    }

    setFilteredLocations(filtered);
  }, [searchTerm, locations, filterSemester]);

  const handleAddLocation = () => {
    navigate('/admin/locations/new');
  };

  const handleEditLocation = (id: string) => {
    navigate(`/admin/locations/${id}/edit`);
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบสถานที่',
      message: `คุณต้องการลบสถานที่ "${name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmText: 'ลบข้อมูล',
      cancelText: 'ยกเลิก'
    });

    if (isConfirmed) {
      try {
        const response = await api.delete(`/locations/${id}`);
        if (response.data.success) {
          showToast('ลบสถานที่สำเร็จ', 'success');
          fetchData();
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'ไม่สามารถลบสถานที่ได้', 'error');
      }
    }
  };

  const semesters = ['ทั้งหมด', ...Array.from(new Set(locations.map(c => c.semester).filter(Boolean)))];

  const stats = {
    total: locations.length,
    totalPreceptors: locations.reduce((sum, loc) => sum + (loc.preceptor_count || 0), 0)
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
          title="การจัดการสถานที่"
          subtitle="จัดการข้อมูลสถานที่ฝึกปฏิบัติงานและการเข้าถึง"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6">
          {/* 1. Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><MapPin size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">สถานที่ทั้งหมด</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><User size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">พี่เลี้ยงที่ดูแล</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.totalPreceptors}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><CheckCircle2 size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">สถานะปกติ</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* 2. Actions & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตามชื่อสถานที่..." 
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
                        onClick={() => { setFilterSemester(s || "ทั้งหมด"); setIsFilterOpen(false); }}
                        className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${filterSemester === s ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                      >
                        {s === 'ทั้งหมด' ? 'ทุกเทอม' : `เทอม ${s}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleAddLocation}
                className="flex-grow md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap text-sm uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} />
                เพิ่มสถานที่
              </button>
            </div>
          </div>

          {/* 3. Locations Table */}
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">ข้อมูลสถานที่</th>
                    <th className="py-6 px-8">เทอม</th>
                    <th className="py-6 px-8 text-center">พี่เลี้ยง</th>
                    <th className="py-6 px-8 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <tr key={loc._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Navigation size={24} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="font-black text-[15px] text-slate-800 leading-tight">{loc.Location_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    <p className="text-xs font-bold text-slate-400">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded font-black">R: {loc.radius}m</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100">เทอม {loc.semester || '-'}</span>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <User size={14} className="text-emerald-500" />
                            <span className="font-black text-slate-700">{loc.preceptor_count || 0} คน</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEditLocation(loc._id)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-blue-100"
                            >
                              <Edit2 size={18} strokeWidth={2.5} />
                            </button>
                            <button 
                              onClick={() => handleDeleteLocation(loc._id, loc.Location_name)}
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
                      <td colSpan={4} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                            <MapPin size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลสถานที่</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือเพิ่มสถานที่ใหม่</p>
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

export default LocationManagement;

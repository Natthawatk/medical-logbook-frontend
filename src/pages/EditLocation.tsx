import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import DashboardHeader from '../components/DashboardHeader';
import { MapPin, Navigation, User, Save, Trash2, CheckCircle2, Search, AlertCircle, Copy, Clock } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';
import { useModal } from '../components/ModalContext';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const EditLocation = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { confirm } = useModal();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Location_name: '',
    latitude: 13.7563,
    longitude: 100.5018,
    radius: 100,
    semester: '',
  });

  const [preceptors, setPreceptors] = useState<any[]>([]);
  const [assignedPreceptors, setAssignedPreceptors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Component to handle map clicks
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setFormData(prev => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      },
    });
    return null;
  };

  // Component to recenter map when coords change
  const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, preceptorRes, unreadRes] = await Promise.all([
          api.get(`/locations/${id}`),
          api.get('/users/preceptors'),
          api.get('/notifications/unread-count')
        ]);
        
        if (locRes.data.success) {
          const l = locRes.data.data;
          setFormData({
            Location_name: l.Location_name,
            latitude: l.latitude,
            longitude: l.longitude,
            radius: l.radius,
            semester: l.semester || '',
          });
          setAssignedPreceptors(l.assigned_preceptors?.map((p: any) => p._id || p) || []);
        }
        
        if (preceptorRes.data.success) setPreceptors(preceptorRes.data.data);
        if (unreadRes.data.success) setUnreadCount(unreadRes.data.count);
      } catch (err) {
        console.error('Error fetching data:', err);
        showToast('ไม่สามารถโหลดข้อมูลสถานที่ได้', 'error');
        navigate('/admin/locations');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'latitude' || name === 'longitude' || name === 'radius' ? Number(value) : value 
    }));
  };

  const handleTogglePreceptor = (pId: string) => {
    setAssignedPreceptors(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.put(`/locations/${id}`, {
        ...formData,
        assigned_preceptors: assignedPreceptors
      });
      if (response.data.success) {
        showToast('อัปเดตสถานที่สำเร็จ', 'success');
        navigate('/admin/locations');
      }
    } catch (err: any) {
      console.error('Update location error:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigate('/admin/locations/new', { 
      state: { 
        copyData: {
          ...formData,
          Location_name: `${formData.Location_name} (คัดลอก)`,
          semester: '', // Force pick new
          assigned_preceptors: [], // Preceptors are semester-bound
          originalSemester: formData.semester // Pass original to prevent duplicate semester choice
        } 
      } 
    });
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบสถานที่นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      type: 'danger'
    });

    if (isConfirmed) {
      setIsDeleting(true);
      try {
        const response = await api.delete(`/locations/${id}`);
        if (response.data.success) {
          showToast('ลบสถานที่เรียบร้อยแล้ว', 'success');
          navigate('/admin/locations');
        }
      } catch (err: any) {
        console.error('Delete location error:', err);
        showToast(err.response?.data?.message || 'ไม่สามารถลบสถานที่ได้', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        showToast('ดึงตำแหน่งปัจจุบันสำเร็จ', 'success');
      }, (error) => {
        showToast('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + error.message, 'error');
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }));
        showToast('ค้นหาสถานที่สำเร็จ', 'success');
      } else {
        showToast('ไม่พบสถานที่ที่ระบุ', 'error');
      }
    } catch (err) {
      console.error('Search error:', err);
      showToast('เกิดข้อผิดพลาดในการค้นหา', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Rule: Same semester AND (No workplace OR already assigned here)
  const filteredPreceptors = preceptors.filter(p => 
    (!formData.semester || p.semester === formData.semester) && 
    (!p.workplace || assignedPreceptors.includes(p._id))
  );

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
          onBack={() => navigate('/admin/locations')}
          showTitle={true}
          title="แก้ไขข้อมูลสถานที่"
          subtitle={`จัดการข้อมูลของ: ${formData.Location_name}`}
        />

        <div className="max-w-5xl mx-auto space-y-8 mt-6 pb-20">
          <div className="flex justify-between items-center px-2">
            <button 
                onClick={handleCopy}
                className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition active:scale-95 border border-blue-100 hover:bg-blue-100 text-[10px] uppercase tracking-widest shadow-sm"
            >
              <Copy size={16} strokeWidth={2.5} />
              คัดลอกสถานที่ไปเทอมอื่น
            </button>

            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition active:scale-95 border border-rose-100 hover:bg-rose-100 disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-sm"
            >
              <Trash2 size={16} strokeWidth={2.5} />
              {isDeleting ? 'กำลังลบ...' : 'ลบสถานที่นี้'}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            {/* Section 1: Basic Info & Map */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-10">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Navigation size={24} strokeWidth={2.5} /></div>
                ข้อมูลสถานที่และพิกัด
              </h3>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อสถานที่ / วอร์ด</label>
                <input 
                  type="text" 
                  name="Location_name"
                  value={formData.Location_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                  <div className="flex-grow w-full">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">ค้นหาสถานที่ หรือ เลือกบนแผนที่</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="ค้นหาที่อยู่, อาคาร หรือโรงพยาบาล..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <button 
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                      >
                        {isSearching ? '...' : 'ค้นหา'}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all border-2 border-emerald-100 shrink-0 h-[60px]"
                  >
                    <MapPin size={20} strokeWidth={2.5} />
                    ใช้ตำแหน่งปัจจุบัน
                  </button>
                </div>

                <div className="h-[400px] w-full rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-inner z-0">
                  <MapContainer 
                    center={[formData.latitude, formData.longitude]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents />
                    <RecenterMap lat={formData.latitude} lng={formData.longitude} />
                    <Marker position={[formData.latitude, formData.longitude]} />
                    <Circle 
                      center={[formData.latitude, formData.longitude]} 
                      radius={formData.radius}
                      pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.2 }}
                    />
                  </MapContainer>
                </div>
                <p className="text-[10px] text-slate-400 font-bold italic">* คลิกที่แผนที่เพื่อเปลี่ยนพิกัด</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ละติจูด (Latitude)</label>
                  <input 
                    type="number" 
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ลองจิจูด (Longitude)</label>
                  <input 
                    type="number" 
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รัศมีการเช็คอิน (เมตร)</label>
                  <input 
                    type="number" 
                    name="radius"
                    value={formData.radius}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <div className="space-y-2 w-full max-w-xs text-right">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-right text-amber-600">เทอม (ล็อกไว้)</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      name="semester"
                      value={formData.semester}
                      disabled
                      className="w-full pl-12 pr-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none transition-all font-bold text-slate-400 appearance-none shadow-inner cursor-not-allowed" 
                    />
                  </div>
                  <p className="text-[9px] font-bold text-amber-500 mt-1">* ไม่สามารถเปลี่ยนเทอมได้ หากต้องการใช้ในเทอมอื่นกรุณาใช้ปุ่มคัดลอก</p>
                </div>
              </div>
            </div>

            {/* Section 2: Preceptors */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><User size={24} strokeWidth={2.5} /></div>
                  อาจารย์พี่เลี้ยงที่มอบหมาย
                </h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 shadow-sm uppercase tracking-widest">
                  ASSIGNED: {assignedPreceptors.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto p-4 bg-slate-50/50 rounded-[40px] border-2 border-white shadow-inner scrollbar-hide">
                {filteredPreceptors.length > 0 ? (
                  filteredPreceptors.map(p => (
                    <div 
                      key={p._id}
                      onClick={() => handleTogglePreceptor(p._id)}
                      className={`p-5 rounded-[24px] border-4 cursor-pointer transition-all flex items-center gap-4 group ${assignedPreceptors.includes(p._id) ? 'border-blue-500 bg-white shadow-lg scale-[1.02]' : 'border-transparent bg-white/60 hover:bg-white hover:shadow-md'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${assignedPreceptors.includes(p._id) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        <User size={20} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${assignedPreceptors.includes(p._id) ? 'text-slate-900' : 'text-slate-600'}`}>{p.firstname_lastname}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded uppercase border border-blue-100">เทอม {p.semester || '-'}</span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{p.email}</p>
                        </div>
                      </div>
                      {assignedPreceptors.includes(p._id) && (
                        <div className="ml-auto w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-10 text-center">
                    <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-slate-400 font-bold text-sm">ไม่พบข้อมูลพี่เลี้ยงที่ว่างในเทอม {formData.semester || '-'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-10">
              <button 
                type="button"
                onClick={() => navigate('/admin/locations')}
                className="flex-1 px-8 py-5 bg-slate-100 text-slate-400 rounded-[28px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 text-xs shadow-md border-2 border-white"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex-[2] px-8 py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-4 border-white/30 border-t-white"></div>
                ) : (
                  <Save size={20} strokeWidth={3} />
                )}
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </form>
        </div>
    </>
  );
};

export default EditLocation;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, GraduationCap, MapPin, Briefcase, Clock } from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

const Profile = () => {
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone_number: '',
    workplace: '',
    newPassword: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, unreadRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/notifications/unread-count')
        ]);
        
        if (profileRes.data.success) {
          const data = profileRes.data.data;
          setProfileData(data);
          const [fname, lname] = (data.firstname_lastname || ' ').split(' ');
          setFormData({
            firstname: fname || '',
            lastname: lname || '',
            phone_number: data.phone_number || '',
            workplace: data.workplace?._id || data.workplace || '',
            newPassword: ''
          });
          if (data.profile_image) {
            setProfileImage(data.profile_image);
          }
        }
        
        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        firstname_lastname: `${formData.firstname} ${formData.lastname}`,
        phone_number: formData.phone_number,
      };
      
      if (formData.newPassword) {
        payload.password = formData.newPassword;
      }

      const response = await api.put('/users/profile', payload);
      if (response.data.success) {
        setProfileData(response.data.data);
        setIsEditing(false);
        showToast('อัปเดตข้อมูลสำเร็จ', 'success');
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
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
          studentName={profileData?.firstname_lastname || 'User'} 
          profileImage={user?.profile_image}
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="ข้อมูลส่วนตัว"
          subtitle="จัดการข้อมูลบัญชีและตรวจสอบสถานะการเรียนของคุณ"
        />

        <div className="max-w-4xl mx-auto mt-8 bg-white p-10 rounded-[40px] border-2 border-white shadow-xl">
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row items-center gap-10 pb-10 border-b-2 border-slate-50">
              <div className="relative">
                <div 
                  className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg transition-all"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-slate-300" />
                  )}
                </div>
              </div>

              <div className="text-center md:text-left space-y-2">
                <h3 className="text-2xl font-black text-slate-800">{profileData?.firstname_lastname}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black border border-blue-100 uppercase tracking-widest">
                    {profileData?.role === 'student' ? 'นักศึกษา' : profileData?.role === 'preceptor' ? 'อาจารย์พี่เลี้ยง' : 'ผู้ดูแลระบบ'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-widest ${
                    profileData?.academic_status === 'active' || !profileData?.academic_status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    profileData?.academic_status === 'graduated' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {profileData?.role === 'student' 
                      ? (profileData?.academic_status === 'active' || !profileData?.academic_status ? 'กำลังศึกษา' : profileData?.academic_status === 'graduated' ? 'สำเร็จการศึกษา' : 'พ้นสภาพ')
                      : (profileData?.academic_status === 'active' || !profileData?.academic_status ? 'ใช้งานอยู่' : 'ระงับใช้งาน')
                    }
                  </span>
                </div>
              </div>
              
              {!isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="md:ml-auto px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  แก้ไขข้อมูล
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pb-10">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">ชื่อจริง</label>
                <input 
                  type="text" 
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  className={`w-full px-5 py-3.5 rounded-2xl font-bold transition-all outline-none border-2 ${isEditing ? 'bg-white border-blue-100 focus:ring-4 focus:ring-blue-50' : 'bg-slate-50 border-transparent text-slate-500 cursor-not-allowed'}`} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">นามสกุล</label>
                <input 
                  type="text" 
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  className={`w-full px-5 py-3.5 rounded-2xl font-bold transition-all outline-none border-2 ${isEditing ? 'bg-white border-blue-100 focus:ring-4 focus:ring-blue-50' : 'bg-slate-50 border-transparent text-slate-500 cursor-not-allowed'}`} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">อีเมลแอดเดรส</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={profileData?.email} 
                    readOnly 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="tel" 
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-5 py-3.5 rounded-2xl font-bold transition-all outline-none border-2 ${isEditing ? 'bg-white border-blue-100 focus:ring-4 focus:ring-blue-50' : 'bg-slate-50 border-transparent text-slate-500 cursor-not-allowed'}`} 
                  />
                </div>
              </div>

              {profileData?.role === 'student' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">รหัสนักศึกษา</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={profileData?.student_id || '-'} 
                        readOnly 
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">ชั้นปี</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={profileData?.year ? `ปี ${profileData.year}` : '-'} 
                        readOnly 
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </>
              )}

              {profileData?.role === 'preceptor' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">สถานที่ปฏิบัติงาน</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={profileData?.workplace?.Location_name || '-'} 
                        readOnly 
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] ml-1">เทอมที่ดูแล</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={profileData?.semester ? `เทอม ${profileData.semester}` : '-'} 
                        readOnly 
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="md:col-span-2 p-8 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 space-y-4 shadow-inner">
                  <h4 className="font-black text-blue-700 text-sm flex items-center gap-2 uppercase tracking-widest">
                    <Clock size={16} strokeWidth={2.5} /> เปลี่ยนรหัสผ่านใหม่
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.1em] ml-1">รหัสผ่านใหม่ (ระบุเมื่อต้องการเปลี่ยนเท่านั้น)</label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="กรอกรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)" 
                      className="w-full px-5 py-3.5 bg-white border-2 border-white rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" 
                    />
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="md:col-span-2 flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      const [fname, lname] = (profileData?.firstname_lastname || ' ').split(' ');
                      setFormData({
                        firstname: fname || '',
                        lastname: lname || '',
                        phone_number: profileData?.phone_number || '',
                        workplace: profileData?.workplace?._id || profileData?.workplace || '',
                        newPassword: ''
                      });
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
    </>
  );
};

export default Profile;

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  MapPin, 
  ShieldCheck, 
  Save, 
  Trash2, 
  Camera, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

import DashboardHeader from '../components/DashboardHeader';
import api from '../services/api';
import { useModal } from '../components/ModalContext';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useModal();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  // State for form fields
  const [formData, setFormData] = useState({
    firstname_lastname: '',
    email: '',
    role: 'student',
    phone_number: '',
    student_id: '',
    year: '',
    workplace: '',
    semester: '',
    academic_status: 'active',
    password: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = currentUser?.firstname_lastname || 'ผู้ดูแลระบบ';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [userRes, locRes, courseRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/locations'),
          api.get('/courses')
        ]);
        
        if (userRes.data.success) {
          const u = userRes.data.data;
          setFormData({
            firstname_lastname: u.firstname_lastname || '',
            email: u.email || '',
            role: u.role || 'student',
            phone_number: u.phone_number || '',
            student_id: u.student_id || '',
            year: u.year || '',
            workplace: u.workplace?._id || u.workplace || '',
            semester: u.semester || '',
            academic_status: u.academic_status || 'active',
            password: ''
          });
          setEnrolledCourses(u.enrolled_courses || []);
          if (u.profile_image) {
            setProfileImage(u.profile_image);
          }
        }
        
        if (locRes.data.success) {
          setLocations(locRes.data.data);
        }
        if (courseRes.data.success) {
          setCourses(courseRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        alert('ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
        navigate('/admin/accounts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const toggleCourse = (courseId: string) => {
    if (enrolledCourses.includes(courseId)) {
      setEnrolledCourses(enrolledCourses.filter(cid => cid !== courseId));
    } else {
      setEnrolledCourses([...enrolledCourses, courseId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { 
        ...formData,
        enrolled_courses: formData.role === 'student' ? enrolledCourses : []
      };
      
      // Clean up fields that might not be needed for specific roles
      if (payload.role !== 'student') {
        delete (payload as any).student_id;
        delete (payload as any).year;
      }
      if (payload.role !== 'preceptor') {
        delete (payload as any).workplace;
      }
      if (!payload.password) {
        delete (payload as any).password;
      }

      const response = await api.put(`/users/${id}`, payload);
      if (response.data.success) {
        alert('อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
        navigate('/admin/accounts');
      }
    } catch (err: any) {
      console.error('Update user error:', err);
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบบัญชีผู้ใช้นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      type: 'danger'
    });

    if (isConfirmed) {
      setIsDeleting(true);
      try {
        const response = await api.delete(`/users/${id}`);
        if (response.data.success) {
          navigate('/admin/accounts');
        }
      } catch (err: any) {
        console.error('Delete user error:', err);
        alert(err.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้');
      } finally {
        setIsDeleting(false);
      }
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
          unreadCount={0}
          onBack={() => navigate('/admin/accounts')}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="แก้ไขข้อมูลบัญชีผู้ใช้"
          subtitle={`จัดการข้อมูลของ: ${formData.firstname_lastname}`}
        />

        <div className="max-w-3xl mx-auto mb-20">
          <div className="flex justify-end mb-6">
            <button 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition active:scale-95 border border-rose-100 hover:bg-rose-100 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              <Trash2 size={18} strokeWidth={2.5} />
              {isDeleting ? 'กำลังลบ...' : 'ลบบัญชีผู้ใช้นี้'}
            </button>
          </div>

          <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl relative overflow-hidden">
            {/* ส่วนรูปโปรไฟล์และบทบาท */}
            <div className="flex flex-col items-center mb-12">
              <div className="relative">
                <div 
                  className="w-36 h-36 rounded-[40px] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={72} strokeWidth={1.5} className="text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {formData.firstname_lastname || 'ระบุชื่อ-นามสกุล'}
                </h3>
                <div className="mt-4 flex justify-center gap-3">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    formData.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                    formData.role === 'preceptor' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    'bg-blue-50 border-blue-200 text-blue-600'
                  }`}>
                    {formData.role}
                  </span>
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    formData.academic_status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                    'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {formData.academic_status}
                  </span>
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            {/* ฟอร์มแก้ไขข้อมูล */}
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Section 1: Identity */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-3">ข้อมูลระบุตัวตน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        name="firstname_lastname"
                        value={formData.firstname_lastname}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">อีเมล</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Role & Status */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-3">บทบาทและสถานะ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">บทบาท (Role)</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option value="student">Student (นักศึกษา)</option>
                        <option value="preceptor">Preceptor (อาจารย์พี่เลี้ยง)</option>
                        <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">สถานะทางบัญชี</label>
                    <select 
                      name="academic_status"
                      value={formData.academic_status}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    >
                      <option value="active">Active (ปกติ)</option>
                      {formData.role === 'student' && <option value="graduated">Graduated (สำเร็จการศึกษา)</option>}
                      <option value="inactive">Inactive (พ้นสภาพ/ระงับการใช้งาน)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Role Specific Info */}
              {formData.role === 'student' && (
                <>
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-3">ข้อมูลนักศึกษา</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">รหัสนักศึกษา</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            name="student_id"
                            value={formData.student_id}
                            onChange={handleInputChange}
                            required={formData.role === 'student'}
                            className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ชั้นปี (Academic Year)</label>
                        <input 
                          type="number" 
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          min="1"
                          max="6"
                          className="w-full px-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Course Enrollment Section */}
                  <div className="space-y-6 mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center border-b-2 border-slate-50 pb-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">การลงทะเบียนรายวิชา</h4>
                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border-2 border-white shadow-sm">
                        SELECTED: {enrolledCourses.length} COURSES
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2 bg-slate-50/50 rounded-[32px] border-2 border-white shadow-inner">
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <div 
                            key={course._id}
                            onClick={() => toggleCourse(course._id)}
                            className={`p-5 rounded-[24px] border-4 transition-all cursor-pointer flex items-center justify-between group ${
                              enrolledCourses.includes(course._id)
                                ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                                : 'border-white bg-white hover:border-slate-100 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-xl transition-all ${
                                enrolledCourses.includes(course._id) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                              }`}>
                                <BookOpen size={18} strokeWidth={2.5} />
                              </div>
                              <div className="overflow-hidden">
                                <p className={`text-sm font-black truncate leading-tight ${enrolledCourses.includes(course._id) ? 'text-slate-900' : 'text-slate-600'}`}>
                                  {course.course_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{course.course_code}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Y{course.year} • S{course.semester}</span>
                                </div>
                              </div>
                            </div>
                            {enrolledCourses.includes(course._id) && (
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-300">
                                <CheckCircle2 size={14} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-16 text-center">
                          <AlertCircle className="mx-auto text-slate-200 mb-4" size={56} strokeWidth={1.5} />
                          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ไม่พบข้อมูลรายวิชา</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'preceptor' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-3">ข้อมูลอาจารย์พี่เลี้ยง</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">สถานที่ปฏิบัติงาน / วอร์ด</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select 
                          name="workplace"
                          value={formData.workplace}
                          onChange={handleInputChange}
                          required={formData.role === 'preceptor'}
                          className="w-full pl-12 pr-10 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                          <option value="">เลือกสถานที่</option>
                          {locations.map(loc => (
                            <option key={loc._id} value={loc._id}>{loc.Location_name} (เทอม {loc.semester})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">เทอมที่ดูแล (Semester)</label>
                      <input 
                        type="text" 
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        placeholder="เช่น 1/2569"
                        required={formData.role === 'preceptor'}
                        className="w-full px-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Contact & Security */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-3">ความปลอดภัยและการติดต่อ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="tel" 
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)</label>
                    <input 
                      type="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 border-2 border-blue-100 bg-white rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700 shadow-xl shadow-blue-50/50" 
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-12 border-t-2 border-slate-50">
                <button 
                  type="button"
                  onClick={() => navigate('/admin/accounts')}
                  className="flex-1 px-8 py-5 bg-slate-100 text-slate-400 rounded-[28px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 text-xs"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] px-8 py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-4 border-white/30 border-t-white"></div>
                  ) : (
                    <Save size={20} strokeWidth={3} />
                  )}
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </>
  );
};

export default EditUser;

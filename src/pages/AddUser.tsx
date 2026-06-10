
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Clock 
} from 'lucide-react';

import DashboardHeader from '../components/DashboardHeader';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

const AddUser = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    password: '' // Initial password
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = currentUser?.firstname_lastname || 'ผู้ดูแลระบบ';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, courseRes] = await Promise.all([
          api.get('/locations'),
          api.get('/courses')
        ]);

        if (locRes.data.success) {
          setLocations(locRes.data.data);
        }
        if (courseRes.data.success) {
          setCourses(courseRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchData();
  }, []);

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
      setEnrolledCourses(enrolledCourses.filter(id => id !== courseId));
    } else {
      setEnrolledCourses([...enrolledCourses, courseId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password) {
      showToast('กรุณาระบุรหัสผ่านเริ่มต้น', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { 
        ...formData,
        enrolled_courses: formData.role === 'student' ? enrolledCourses : []
      };
      
      // Clean up fields based on role
      if (payload.role !== 'student') {
        delete (payload as any).student_id;
        delete (payload as any).year;
      }
      if (payload.role !== 'preceptor') {
        delete (payload as any).workplace;
      }

      const response = await api.post('/users', payload);
      if (response.data.success) {
        showToast('สร้างผู้ใช้งานเรียบร้อยแล้ว', 'success');
        navigate('/admin/accounts');
      }
      } catch (err: any) {
      console.error('Create user error:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้', 'error');
      } finally {

      setIsSaving(false);
    }
  };

  return (
    <>
        <DashboardHeader 
          studentName={adminName} 
          profileImage={currentUser?.profile_image}
          unreadCount={0}
          onBack={() => navigate('/admin/accounts')}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="เพิ่มผู้ใช้ใหม่"
          subtitle="สร้างบัญชีผู้ใช้งานใหม่เข้าสู่ระบบ"
          
        />

        <div className="max-w-3xl mx-auto mb-20 mt-6">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
            {/* ส่วนรูปโปรไฟล์และบทบาท */}
            <div className="flex flex-col items-center mb-12">
              <div className="relative">
                <div 
                  className="w-36 h-36 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={72} strokeWidth={1.5} className="text-slate-300" />
                  )}
                </div>
              </div>
              
              <div className="text-center mt-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {formData.firstname_lastname || 'ระบุชื่อ-นามสกุล'}
                </h3>
                <div className="mt-3 flex justify-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    formData.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                    formData.role === 'preceptor' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    'bg-blue-50 border-blue-200 text-blue-600'
                  }`}>
                    {formData.role}
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

            {/* ฟอร์มสร้างผู้ใช้ */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Identity */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">ข้อมูลระบุตัวตน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        name="firstname_lastname"
                        value={formData.firstname_lastname}
                        onChange={handleInputChange}
                        required
                        placeholder="เช่น นายสมชาย ใจดี"
                        className="w-full pl-12 pr-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">อีเมล</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="example@university.edu"
                        className="w-full pl-12 pr-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Role & Status */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">บทบาทและสถานะ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">บทบาท (Role)</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option value="student">Student (นักศึกษา)</option>
                        <option value="preceptor">Preceptor (อาจารย์พี่เลี้ยง)</option>
                        <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">สถานะทางบัญชี</label>
                    <select 
                      name="academic_status"
                      value={formData.academic_status}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
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
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">ข้อมูลนักศึกษา</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">รหัสนักศึกษา</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            name="student_id"
                            value={formData.student_id}
                            onChange={handleInputChange}
                            required={formData.role === 'student'}
                            placeholder="660100XXX"
                            className="w-full pl-12 pr-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ชั้นปี (Academic Year)</label>
                        <input 
                          type="number" 
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          min="1"
                          max="6"
                          placeholder="1-6"
                          className="w-full px-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">เทอม (Semester)</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            name="semester"
                            value={formData.semester}
                            onChange={handleInputChange}
                            placeholder="เช่น 1/2569"
                            required={formData.role === 'student'}
                            className="w-full pl-12 pr-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Enrollment Section */}
                  <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">การลงทะเบียนรายวิชา</h4>
                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                        เลือกแล้ว {enrolledCourses.length} วิชา
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 bg-slate-50/30 rounded-2xl border border-slate-100 shadow-inner">
                      {(() => {
                        const filteredCourses = courses.filter(c => 
                          (!formData.semester || String(c.semester) === String(formData.semester))
                        );

                        return filteredCourses.length > 0 ? (
                          filteredCourses.map((course) => (
                            <div 
                              key={course._id}
                              onClick={() => toggleCourse(course._id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                enrolledCourses.includes(course._id)
                                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                  : 'border-white bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${
                                  enrolledCourses.includes(course._id) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                                }`}>
                                  <BookOpen size={16} />
                                </div>
                                <div className="overflow-hidden">
                                  <p className={`text-xs font-bold truncate ${enrolledCourses.includes(course._id) ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {course.course_name}
                                  </p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">
                                    {course.course_code} • ชั้นปี {course.year} • เทอม {course.semester}
                                  </p>
                                </div>
                              </div>
                              {enrolledCourses.includes(course._id) && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                  <CheckCircle2 size={12} />
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-10 text-center">
                            <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-400 font-bold text-sm">ไม่พบรายวิชาที่ตรงกับ เทอม {formData.semester || '-'}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'preceptor' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">ข้อมูลอาจารย์พี่เลี้ยง</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">สถานที่ปฏิบัติงาน / วอร์ด</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select 
                          name="workplace"
                          value={formData.workplace}
                          onChange={handleInputChange}
                          required={false}
                          className="w-full pl-12 pr-10 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                          <option value="">เลือกสถานที่ (ไม่บังคับ)</option>
                          {locations
                            .filter(loc => !formData.semester || String(loc.semester) === String(formData.semester))
                            .map(loc => (
                              <option key={loc._id} value={loc._id}>{loc.Location_name} (เทอม {loc.semester})</option>
                            ))
                          }
                        </select>

                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">เทอมที่ดูแล (Semester)</label>
                      <input 
                        type="text" 
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        placeholder="เช่น 1/2569"
                        required={formData.role === 'preceptor'}
                        className="w-full px-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Contact & Password */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">การติดต่อและรหัสผ่านเริ่มต้น</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="tel" 
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        placeholder="08XXXXXXXX"
                        className="w-full pl-12 pr-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">รหัสผ่านสำหรับเข้าใช้งานครั้งแรก</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="ระบุรหัสผ่านเริ่มต้น"
                        className="w-full pl-12 pr-5 py-4 border border-blue-100 bg-white rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700 shadow-sm shadow-blue-50" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-10 border-t border-slate-50">
                <button 
                  type="button"
                  onClick={() => navigate('/admin/accounts')}
                  className="flex-1 px-8 py-4 bg-slate-50 text-slate-400 rounded-[20px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-[20px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Plus size={20} />
                  )}
                  {isSaving ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
  );
};

export default AddUser;

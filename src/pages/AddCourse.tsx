import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { Save, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle, Award, MapPin, Users, User, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

const AddCourse = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    semester: '',
    year: '',
    evaluation_type: 'Pass/Fail' as 'Pass/Fail' | '0-4',
    enrolled_locations: [] as string[],
    enrolled_students: [] as string[]
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, unreadRes, userRes] = await Promise.all([
          api.get('/locations'),
          api.get('/notifications/unread-count'),
          api.get('/users?role=student')
        ]);
        if (locRes.data.success) setLocations(locRes.data.data);
        if (unreadRes.data.success) setUnreadCount(unreadRes.data.count);
        if (userRes.data.success) setStudents(userRes.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // If semester changes, clear enrolled students and locations to avoid cross-semester selection
      if (name === 'semester' && value !== prev.semester) {
        return { ...prev, [name]: value, enrolled_students: [], enrolled_locations: [] };
      }
      return { ...prev, [name]: value };
    });
  };


  const handleLocationToggle = (id: string) => {
    setFormData(prev => {
      const exists = prev.enrolled_locations.includes(id);
      return {
        ...prev,
        enrolled_locations: exists 
          ? prev.enrolled_locations.filter(locId => locId !== id)
          : [...prev.enrolled_locations, id]
      };
    });
  };

  const handleStudentToggle = (id: string) => {
    setFormData(prev => {
      const exists = prev.enrolled_students.includes(id);
      return {
        ...prev,
        enrolled_students: exists 
          ? prev.enrolled_students.filter(sId => sId !== id)
          : [...prev.enrolled_students, id]
      };
    });
  };

  const handleYearToggle = (year: number) => {
    const yearStudents = students.filter(s => s.year === year && (!formData.semester || s.semester === formData.semester));
    const yearStudentIds = yearStudents.map(s => s._id);
    const allSelected = yearStudentIds.length > 0 && yearStudentIds.every(id => formData.enrolled_students.includes(id));

    setFormData(prev => {
      if (allSelected) {
        return {
          ...prev,
          enrolled_students: prev.enrolled_students.filter(id => !yearStudentIds.includes(id))
        };
      } else {
        const newIds = [...new Set([...prev.enrolled_students, ...yearStudentIds])];
        return { ...prev, enrolled_students: newIds };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.post('/courses', formData);
      if (response.data.success) {
        showToast('เพิ่มรายวิชาสำเร็จ', 'success');
        navigate('/admin/courses');
      }
    } catch (err: any) {
      console.error('Add course error:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const studentsByYear = students
    .filter(s => !formData.semester || s.semester === formData.semester)
    .reduce((acc: any, s) => {
      const year = s.year || 0;
      if (!acc[year]) acc[year] = [];
      acc[year].push(s);
      return acc;
    }, {});

  const availableYears = Object.keys(studentsByYear).map(Number).sort();

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
          onBack={() => navigate('/admin/courses')}
          showTitle={true}
          title="เพิ่มรายวิชาใหม่"
          subtitle="ระบุข้อมูลวิชา เกณฑ์การประเมิน และสถานที่ฝึกปฏิบัติงาน"
        />

        <div className="max-w-4xl mx-auto space-y-8 mt-6 pb-20">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section 1: Basic Info */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BookOpen size={24} strokeWidth={2.5} /></div>
                ข้อมูลรายวิชาเบื้องต้น
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อรายวิชา</label>
                  <input 
                    type="text" 
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleInputChange}
                    required
                    placeholder="ระบุชื่อวิชาเต็ม"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสวิชา</label>
                  <input 
                    type="text" 
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleInputChange}
                    required
                    placeholder="เช่น MED101"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เทอม (Semester)</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                      placeholder="เช่น 1/2569"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชั้นปี (Year)</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="6"
                      placeholder="ชั้นปีที่สอน"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Evaluation Type */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><Award size={24} strokeWidth={2.5} /></div>
                เกณฑ์การประเมินผล
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setFormData({...formData, evaluation_type: 'Pass/Fail'})}
                  className={`p-6 rounded-[32px] border-4 cursor-pointer transition-all ${formData.evaluation_type === 'Pass/Fail' ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-slate-50 bg-slate-50/30 hover:border-slate-100'}`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${formData.evaluation_type === 'Pass/Fail' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  </div>
                  <h4 className={`font-black text-lg ${formData.evaluation_type === 'Pass/Fail' ? 'text-blue-700' : 'text-slate-500'}`}>Pass / Fail</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">ประเมินแบบผ่านหรือไม่ผ่าน</p>
                </div>

                <div 
                  onClick={() => setFormData({...formData, evaluation_type: '0-4'})}
                  className={`p-6 rounded-[32px] border-4 cursor-pointer transition-all ${formData.evaluation_type === '0-4' ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-slate-50 bg-slate-50/30 hover:border-slate-100'}`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${formData.evaluation_type === '0-4' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                    <span className="font-black text-sm italic">0-4</span>
                  </div>
                  <h4 className={`font-black text-lg ${formData.evaluation_type === '0-4' ? 'text-blue-700' : 'text-slate-500'}`}>Score 0-4</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">ประเมินเป็นคะแนนความถูกต้อง</p>
                </div>
              </div>
            </div>

            {/* Section 3: Student Enrollment (Select by Year) */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} strokeWidth={2.5} /></div>
                  ลงทะเบียนนักศึกษา
                </h3>
                <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black shadow-lg shadow-blue-100 uppercase tracking-widest">
                  ENROLLED: {formData.enrolled_students.length}
                </span>
              </div>

              <div className="space-y-4">
                {availableYears.map(year => {
                  const yearStudents = studentsByYear[year];
                  const yearSelectedCount = yearStudents.filter((s: any) => formData.enrolled_students.includes(s._id)).length;
                  const isAllYearSelected = yearSelectedCount === yearStudents.length;

                  return (
                    <div key={year} className="border-2 border-slate-50 rounded-[32px] overflow-hidden bg-slate-50/30 transition-all hover:bg-slate-50/50">
                      <div className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => setExpandedYear(expandedYear === year ? null : year)}>
                          <div className={`p-2 rounded-xl ${yearSelectedCount > 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">นักศึกษาชั้นปีที่ {year}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">เลือกแล้ว {yearSelectedCount} / {yearStudents.length} คน</p>
                          </div>
                          <ChevronDown size={20} className={`ml-auto text-slate-400 transition-transform ${expandedYear === year ? 'rotate-180' : ''}`} />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleYearToggle(year)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAllYearSelected ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-lg'}`}
                        >
                          {isAllYearSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {expandedYear === year && (
                        <div className="px-5 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                          {yearStudents.map((s: any) => (
                            <div 
                              key={s._id}
                              onClick={() => handleStudentToggle(s._id)}
                              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${formData.enrolled_students.includes(s._id) ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-500/5' : 'bg-white/50 border-slate-100 hover:border-blue-200 hover:bg-white'}`}
                            >
                              <div className={`w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center ${formData.enrolled_students.includes(s._id) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                {s.profile_image ? <img src={s.profile_image} className="w-full h-full object-cover" /> : <User size={14} />}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[12px] font-black truncate ${formData.enrolled_students.includes(s._id) ? 'text-slate-900' : 'text-slate-600'}`}>{s.firstname_lastname}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {s.student_id}</p>
                              </div>
                              {formData.enrolled_students.includes(s._id) && (
                                <CheckCircle2 size={16} className="ml-auto text-blue-500" strokeWidth={3} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Locations */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><MapPin size={24} strokeWidth={2.5} /></div>
                  สถานที่ฝึกปฏิบัติงาน
                </h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 shadow-sm uppercase tracking-widest">
                  SELECTED: {formData.enrolled_locations.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-4 bg-slate-50/50 rounded-[40px] border-2 border-white shadow-inner scrollbar-hide">
                {(() => {
                  const filteredLocs = locations.filter(loc => !formData.semester || loc.semester === formData.semester);
                  return filteredLocs.length > 0 ? (
                    filteredLocs.map(loc => (
                      <div 
                        key={loc._id}
                        onClick={() => handleLocationToggle(loc._id)}
                        className={`p-5 rounded-[24px] border-4 cursor-pointer transition-all flex flex-col gap-3 group ${formData.enrolled_locations.includes(loc._id) ? 'border-blue-500 bg-white shadow-lg scale-[1.02]' : 'border-transparent bg-white/60 hover:bg-white hover:shadow-md'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`p-2 rounded-xl ${formData.enrolled_locations.includes(loc._id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                            <MapPin size={18} strokeWidth={2.5} />
                          </div>
                          {formData.enrolled_locations.includes(loc._id) && (
                            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle2 size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-black leading-tight ${formData.enrolled_locations.includes(loc._id) ? 'text-slate-900' : 'text-slate-600'}`}>{loc.Location_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">เทอม {loc.semester || '-'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center">
                      <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-slate-400 font-bold text-sm">ไม่พบสถานที่ที่อยู่ในเทอม {formData.semester || '-'}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-10">
              <button 
                type="button"
                onClick={() => navigate('/admin/courses')}
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
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกรายวิชาใหม่'}
              </button>
            </div>
          </form>
        </div>
    </>
  );
};

export default AddCourse;

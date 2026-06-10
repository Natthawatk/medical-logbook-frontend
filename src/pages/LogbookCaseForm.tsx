import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { ArrowRight, BookOpen, Activity, MapPin, User, Send, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

interface Location {
  _id: string;
  Location_name: string;
}

interface Course {
  _id: string;
  course_name: string;
  course_code: string;
  enrolled_locations?: Location[];
}

interface FormField {
  field_name: string;
  field_type: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  is_required: boolean;
}

interface Procedure {
  _id: string;
  procedure_name: string;
  targetCount?: number;
  approvedCount?: number;
  pendingCount?: number;
  form_structure?: FormField[];
}

interface Preceptor {
  _id: string;
  firstname_lastname: string;
}

const LogbookCaseForm = () => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [preceptors, setPreceptors] = useState<Preceptor[]>([]);
  const [isPreceptorLoading, setIsPreceptorLoading] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [currentSemester, setCurrentSemester] = useState('');
  
  const [formData, setFormData] = useState<any>({
    procedure_id: '',
    preceptor_id: '',
    location_id: '',
    case_date: new Date().toISOString().split('T')[0],
    case_time: new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    case_data: {
      remarks: ''
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, unreadRes, dashRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/notifications/unread-count'),
          api.get('/dashboard/student'),
        ]);

        if (profileRes.data.success) {
          const profile = profileRes.data.data;
          setCurrentSemester(profile.semester);
        }
        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }
        if (dashRes.data.success && dashRes.data.data) {
          setCourses(dashRes.data.data.courseProgress || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const selectedCourse = courses.find(c => c._id === selectedCourseId);
    setFilteredLocations(selectedCourse?.enrolled_locations || []);
    setFormData((fd: any) => ({ ...fd, location_id: '', preceptor_id: '' }));
  }, [selectedCourseId, courses]);

  useEffect(() => {
    if (!selectedCourseId) {
      setProcedures([]);
      setFormData((fd: any) => ({ ...fd, procedure_id: '' }));
      return;
    }
    const fetchProcedures = async () => {
      try {
        const response = await api.get(`/dashboard/student/course/${selectedCourseId}`);
        if (response.data.success && response.data.data) {
          setProcedures(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching procedures:', err);
      }
    };
    fetchProcedures();
  }, [selectedCourseId]);
  
  useEffect(() => {
    if (formData.location_id && currentSemester) {
      const fetchPreceptors = async () => {
        setIsPreceptorLoading(true);
        setPreceptors([]);
        setFormData((fd: any) => ({ ...fd, preceptor_id: '' }));
        try {
          const res = await api.get('/users/preceptors-by-location', {
            params: {
              locationId: formData.location_id,
              semester: currentSemester } });
          if (res.data.success) {
            setPreceptors(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch preceptors for location", error);
        } finally {
          setIsPreceptorLoading(false);
        }
      };
      fetchPreceptors();
    } else {
        setPreceptors([]);
        setFormData((fd: any) => ({ ...fd, preceptor_id: '' }));
    }
  }, [formData.location_id, currentSemester]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = user?.firstname_lastname || 'นักศึกษา';

  const handleNextStep = () => {
    if (!formData.procedure_id || !formData.preceptor_id || !formData.location_id || !formData.case_date || !formData.case_time) {
      showToast('กรุณากรอกข้อมูลพื้นฐาน สถานที่ และเวลาให้ครบถ้วน', 'error');
      return;
    }
    
    const proc = procedures.find(p => p._id === formData.procedure_id);
    if (proc) {
      setSelectedProcedure(proc);
      const initialCaseData = { ...formData.case_data };
      proc.form_structure?.forEach(field => {
        if (initialCaseData[field.field_name] === undefined) {
          initialCaseData[field.field_name] = '';
        }
      });
      setFormData({ ...formData, case_data: initialCaseData });
    }
    setStep(2);
  };

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      case_data: { ...formData.case_data, [fieldName]: value }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const combinedDateTime = new Date(`${formData.case_date}T${formData.case_time}:00`);
      const payload = {
        procedure_id: formData.procedure_id,
        preceptor_id: formData.preceptor_id,
        location_id: formData.location_id,
        case_date: combinedDateTime.toISOString(),
        case_data: formData.case_data
      };

      const response = await api.post('/logbook-cases', payload);
      if (response.data.success) {
        showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
        navigate('/logbook-cases');
      }
      } catch (err: any) {
      console.error('Error submitting case:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      } finally {
      setIsSubmitting(false);
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
          studentName={studentName} 
          profileImage={user?.profile_image}
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          onBack={() => step === 2 ? setStep(1) : navigate('/logbook-cases')}
          showTitle={true}
          title="บันทึกข้อมูลหัตถการใหม่"
          subtitle={step === 1 ? "ขั้นตอนที่ 1: ระบุข้อมูลพื้นฐานและผู้ประเมิน" : `ขั้นตอนที่ 2: รายละเอียดของหัตถการ (${selectedProcedure?.procedure_name})`}
        />

        <div className="max-w-3xl mx-auto mt-6 pb-20">
          <div className="flex items-center justify-end mb-8">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>1</div>
                <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>2</div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl">
              <form className="space-y-8" onSubmit={handleSubmit}>
                        {step === 1 ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <BookOpen size={12} strokeWidth={3} className="text-blue-500" />
                                        รายวิชาที่ทำหัตถการ
                                    </label>
                                    <div className="relative">
                                        <select 
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none"
                                            value={selectedCourseId}
                                            onChange={(e) => setSelectedCourseId(e.target.value)}
                                            required
                                        >
                                            <option value="">เลือกรายวิชา</option>
                                            {courses.map(course => (
                                                <option key={course._id} value={course._id}>[{course.course_code}] {course.course_name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Activity size={12} strokeWidth={3} className="text-blue-500" />
                                        รายการหัตถการ
                                    </label>
                                    <div className="relative">
                                        <select 
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none disabled:bg-slate-50/50 disabled:text-slate-300"
                                            disabled={!selectedCourseId}
                                            value={formData.procedure_id}
                                            onChange={(e) => setFormData({...formData, procedure_id: e.target.value})}
                                            required
                                        >
                                            <option value="">เลือกรายการหัตถการ</option>
                                            {procedures.map(proc => {
                                                const currentTotal = (proc.approvedCount || 0) + (proc.pendingCount || 0);
                                                const isCompleted = !!(proc.targetCount && currentTotal >= proc.targetCount);
                                                return (
                                                    <option key={proc._id} value={proc._id} disabled={isCompleted}>
                                                        {proc.procedure_name} {isCompleted ? '(ครบแล้ว)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <MapPin size={12} strokeWidth={3} className="text-blue-500" />
                                            สถานที่
                                        </label>
                                        <div className="relative">
                                            <select 
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none disabled:bg-slate-50/50"
                                                value={formData.location_id}
                                                onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                                                disabled={!selectedCourseId}
                                                required
                                            >
                                                <option value="">เลือกสถานที่</option>
                                                {filteredLocations.map(loc => (
                                                    <option key={loc._id} value={loc._id}>{loc.Location_name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronDown size={18} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <User size={12} strokeWidth={3} className="text-blue-500" />
                                            ผู้ประเมิน
                                        </label>
                                        <div className="relative">
                                            <select 
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 appearance-none disabled:bg-slate-50/50"
                                                value={formData.preceptor_id}
                                                onChange={(e) => setFormData({...formData, preceptor_id: e.target.value})}
                                                disabled={!formData.location_id || isPreceptorLoading}
                                                required
                                            >
                                                <option value="">{isPreceptorLoading ? 'กำลังโหลด...' : 'เลือกผู้ประเมิน'}</option>
                                                {preceptors.map(p => (
                                                    <option key={p._id} value={p._id}>{p.firstname_lastname}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronDown size={18} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">วันที่ทำหัตถการ</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800" 
                                            value={formData.case_date}
                                            onChange={(e) => setFormData({...formData, case_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">เวลา</label>
                                        <input 
                                            type="time" 
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800" 
                                            value={formData.case_time}
                                            onChange={(e) => setFormData({...formData, case_time: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button 
                                        type="button" 
                                        onClick={handleNextStep}
                                        className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm"
                                    >
                                        ขั้นตอนถัดไป <ArrowRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                {selectedProcedure?.form_structure && selectedProcedure.form_structure.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-8">
                                        {selectedProcedure.form_structure.map((field, idx) => (
                                            <div key={idx}>
                                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">
                                                    {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
                                                </label>
                                                
                                                {field.field_type === 'select' ? (
                                                    <div className="relative">
                                                        <select
                                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none"
                                                            value={formData.case_data[field.field_name] || ''}
                                                            onChange={(e) => handleDynamicFieldChange(field.field_name, e.target.value)}
                                                            required={field.is_required}
                                                        >
                                                            <option value="">เลือก{field.field_name}</option>
                                                            {field.options?.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ChevronDown size={18} strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                                        placeholder={`ระบุ${field.field_name}...`}
                                                        value={formData.case_data[field.field_name] || ''}
                                                        onChange={(e) => handleDynamicFieldChange(field.field_name, e.target.value)}
                                                        required={field.is_required}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="pt-4 border-t-2 border-slate-50">
                                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">หมายเหตุเพิ่มเติม</label>
                                    <textarea 
                                        rows={4} 
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[32px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none font-bold text-slate-800 shadow-inner"
                                        placeholder="ระบุรายละเอียดหรือปัญหาที่พบขณะปฏิบัติงาน (ถ้ามี)..."
                                        value={formData.case_data.remarks}
                                        onChange={(e) => setFormData((fd: any) => ({...fd, case_data: {...fd.case_data, remarks: e.target.value}}))}
                                    ></textarea>
                                </div>

                                <div className="pt-8">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:bg-blue-300 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-sm"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>ส่งข้อมูลบันทึกหัตถการ <Send size={20} strokeWidth={3} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
        </div>
    </>
  );
};

export default LogbookCaseForm;

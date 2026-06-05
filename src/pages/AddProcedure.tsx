import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { ClipboardList, Plus, Trash2, Save, Target, Settings, ChevronDown, Award } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

interface FormField {
  field_name: string;
  field_type: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  is_required: boolean;
}

const AddProcedure = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [formData, setFormData] = useState({
    procedure_name: '',
    course_id: '',
    required_cases: 1,
    target_score: 4,
    form_structure: [] as FormField[]
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, unreadRes] = await Promise.all([
          api.get('/courses'),
          api.get('/notifications/unread-count')
        ]);
        if (courseRes.data.success) setCourses(courseRes.data.data);
        if (unreadRes.data.success) setUnreadCount(unreadRes.data.count);
        
        // Handle Copy Data if present in state
        if (location.state?.copyData) {
          const { copyData } = location.state;
          setFormData({
            procedure_name: copyData.procedure_name || '',
            course_id: copyData.course_id || '',
            required_cases: copyData.required_cases || 1,
            target_score: copyData.target_score || 4,
            form_structure: copyData.form_structure || []
          });
          showToast('โหลดข้อมูลหัตถการต้นฉบับเรียบร้อย กรุณาเลือกรายวิชาใหม่', 'success');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location.state]);

  const handleAddField = () => {
    setFormData({
      ...formData,
      form_structure: [
        ...formData.form_structure,
        { field_name: '', field_type: 'text', is_required: true }
      ]
    });
  };

  const handleRemoveField = (index: number) => {
    const newStructure = [...formData.form_structure];
    newStructure.splice(index, 1);
    setFormData({ ...formData, form_structure: newStructure });
  };

  const handleFieldChange = (index: number, key: keyof FormField, value: any) => {
    const newStructure = [...formData.form_structure];
    newStructure[index] = { ...newStructure[index], [key]: value };
    setFormData({ ...formData, form_structure: newStructure });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id) {
        showToast('กรุณาเลือกรายวิชา', 'error');
        return;
    }
    setIsSaving(true);
    try {
      const response = await api.post('/procedures', formData);
      if (response.data.success) {
        showToast('เพิ่มหัตถการสำเร็จ', 'success');
        navigate('/admin/procedures');
      }
    } catch (err: any) {
      console.error('Save procedure error:', err);
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
          studentName={adminName} 
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          onBack={() => navigate('/admin/procedures')}
          showTitle={true}
          title="เพิ่มหัตถการใหม่"
          subtitle="กำหนดชื่อหัตถการ เกณฑ์การเก็บเคส และแบบฟอร์มบันทึกข้อมูล"
        />

        <div className="max-w-5xl mx-auto space-y-8 mt-6 pb-32">
          <form onSubmit={handleSave} className="space-y-12">
            {/* Section 1: Basic Config */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-10">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
                ข้อมูลหัตถการพื้นฐาน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อหัตถการ (Procedure Name)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ระบุชื่อหัตถการ"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                    value={formData.procedure_name}
                    onChange={(e) => setFormData({...formData, procedure_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รายวิชาที่เกี่ยวข้อง</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none shadow-inner"
                      value={formData.course_id}
                      onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                    >
                      <option value="">เลือกรายวิชา</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>[{course.course_code}] {course.course_name}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={20} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เป้าหมายจำนวนเคส (Required Cases)</label>
                  <div className="relative">
                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                      value={formData.required_cases}
                      onChange={(e) => setFormData({...formData, required_cases: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คะแนนเป้าหมาย (Target Score)</label>
                  <div className="relative">
                    <Award className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                      value={formData.target_score}
                      onChange={(e) => setFormData({...formData, target_score: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Form Builder */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-10">
              <div className="flex justify-between items-center border-b-2 border-slate-50 pb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Settings size={24} strokeWidth={2.5} /></div>
                  โครงสร้างฟอร์มบันทึกข้อมูล (Custom Fields)
                </h3>
                <button 
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} /> เพิ่มฟิลด์ข้อมูล
                </button>
              </div>

              <div className="space-y-4">
                {formData.form_structure.length > 0 ? (
                  formData.form_structure.map((field, idx) => (
                    <div key={idx} className="p-8 bg-slate-50/50 border-2 border-white rounded-[32px] shadow-sm relative group animate-in slide-in-from-left-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-5 space-y-2">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อฟิลด์ (เช่น ชื่อผู้ป่วย, HN)</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                            value={field.field_name}
                            onChange={(e) => handleFieldChange(idx, 'field_name', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ประเภทข้อมูล</label>
                          <div className="relative">
                            <select 
                              className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none"
                              value={field.field_type}
                              onChange={(e) => handleFieldChange(idx, 'field_type', e.target.value)}
                            >
                              <option value="text">ข้อความ (Text)</option>
                              <option value="number">ตัวเลข (Number)</option>
                              <option value="date">วันที่ (Date)</option>
                              <option value="select">ตัวเลือก (Select)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={16} strokeWidth={3} />
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2 pb-4">
                            <input 
                                type="checkbox" 
                                id={`req-${idx}`}
                                className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                checked={field.is_required}
                                onChange={(e) => handleFieldChange(idx, 'is_required', e.target.checked)}
                            />
                            <label htmlFor={`req-${idx}`} className="text-[10px] font-black text-slate-500 uppercase cursor-pointer">จำเป็น</label>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <button 
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {field.field_type === 'select' && (
                        <div className="mt-6 p-6 bg-white rounded-2xl border-2 border-blue-50 space-y-3">
                          <label className="block text-[9px] font-black text-blue-600 uppercase tracking-widest ml-1">ตัวเลือก (คั่นด้วยเครื่องหมายคอมม่า ,)</label>
                          <input 
                            type="text" 
                            placeholder="ตัวเลือก1, ตัวเลือก2, ตัวเลือก3"
                            className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:border-blue-200 transition-all font-bold text-slate-700"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => handleFieldChange(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Settings size={40} />
                    </div>
                    <p className="text-slate-400 font-bold">ยังไม่ได้เพิ่มฟิลด์ข้อมูลเพิ่มเติมสำหรับหัตถการนี้</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-10">
              <button 
                type="button"
                onClick={() => navigate('/admin/procedures')}
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
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกหัตถการใหม่'}
              </button>
            </div>
          </form>
        </div>
    </>
  );
};

export default AddProcedure;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { ClipboardList, Plus, Trash2, Save, Target, Settings, ChevronDown, Award, AlertCircle, Copy } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';
import { useModal } from '../components/ModalContext';

interface FormField {
  field_name: string;
  field_type: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  is_required: boolean;
}

const EditProcedure = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { confirm } = useModal();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [originalFormStructure, setOriginalFormStructure] = useState<FormField[]>([]);
  const [maxStudentProgress, setMaxStudentProgress] = useState(0);

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
        const [procRes, courseRes, unreadRes] = await Promise.all([
          api.get(`/procedures/${id}`),
          api.get('/courses'),
          api.get('/notifications/unread-count')
        ]);
        
        if (procRes.data.success) {
          const p = procRes.data.data;
          const structure = p.form_structure || [];
          setFormData({
            procedure_name: p.procedure_name,
            course_id: p.course_id?._id || p.course_id || '',
            required_cases: p.required_cases,
            target_score: p.target_score,
            form_structure: structure
          });
          setOriginalFormStructure(JSON.parse(JSON.stringify(structure)));
          setMaxStudentProgress(p.max_student_progress || 0);
        }
        
        if (courseRes.data.success) setCourses(courseRes.data.data);
        if (unreadRes.data.success) setUnreadCount(unreadRes.data.count);
      } catch (err) {
        console.error('Error fetching data:', err);
        showToast('ไม่สามารถโหลดข้อมูลหัตถการได้', 'error');
        navigate('/admin/procedures');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, showToast]);

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
    
    // Validate required cases against existing student progress
    if (formData.required_cases < maxStudentProgress) {
        showToast(`ไม่สามารถกำหนดจำนวนเคสน้อยกว่า ${maxStudentProgress} ได้ เนื่องจากมีนักศึกษาทำเคสถึงจำนวนนี้แล้ว`, 'error');
        return;
    }

    // Check if form structure has changed to warn about migration
    const isStructureChanged = JSON.stringify(formData.form_structure) !== JSON.stringify(originalFormStructure);
    if (isStructureChanged) {
      const confirmMigration = await confirm({
        title: 'ยืนยันการแก้ไขโครงสร้าง',
        message: 'คุณมีการแก้ไขโครงสร้างฟอร์ม ระบบจะทำการอัปเดตข้อมูลเก่าให้รองรับฟิลด์ใหม่โดยอัตโนมัติ คุณต้องการดำเนินการต่อใช่หรือไม่?',
        type: 'warning'
      });
      if (!confirmMigration) return;
    }

    setIsSaving(true);
    try {
      const response = await api.put(`/procedures/${id}`, formData);
      if (response.data.success) {
        showToast('อัปเดตหัตถการและเตรียมข้อมูลเก่าสำเร็จ', 'success');
        navigate('/admin/procedures');
      }
    } catch (err: any) {
      console.error('Update procedure error:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    // Navigate to AddProcedure with current form data in state
    navigate('/admin/procedures/new', { 
      state: { 
        copyData: {
          ...formData,
          procedure_name: `${formData.procedure_name} (คัดลอก)`,
          course_id: '' // Force user to pick a new course
        } 
      } 
    });
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบหัตถการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      type: 'danger'
    });

    if (isConfirmed) {
      setIsDeleting(true);
      try {
        const response = await api.delete(`/procedures/${id}`);
        if (response.data.success) {
          showToast('ลบหัตถการเรียบร้อยแล้ว', 'success');
          navigate('/admin/procedures');
        }
      } catch (err: any) {
        console.error('Delete procedure error:', err);
        showToast(err.response?.data?.message || 'ไม่สามารถลบหัตถการได้', 'error');
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
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          onBack={() => navigate('/admin/procedures')}
          showTitle={true}
          title="แก้ไขข้อมูลหัตถการ"
          subtitle={`จัดการข้อมูลของ: ${formData.procedure_name}`}
        />

        <div className="max-w-5xl mx-auto space-y-8 mt-6 pb-32">
          <div className="flex justify-between items-center px-2">
            <button 
                onClick={handleCopy}
                className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition active:scale-95 border border-blue-100 hover:bg-blue-100 text-[10px] uppercase tracking-widest shadow-sm"
            >
              <Copy size={16} strokeWidth={2.5} />
              คัดลอกหัตถการนี้ไปวิชาอื่น
            </button>

            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition active:scale-95 border border-rose-100 hover:bg-rose-100 disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-sm"
            >
              <Trash2 size={16} strokeWidth={2.5} />
              {isDeleting ? 'กำลังลบ...' : 'ลบหัตถการนี้'}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-12">
            {/* Data Migration Info */}
            <div className="bg-amber-50 p-8 rounded-[48px] border-2 border-amber-100 flex flex-col md:flex-row items-center md:items-start gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-4 bg-white rounded-[24px] text-amber-500 shadow-sm shrink-0 border border-amber-50">
                    <AlertCircle size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-xl font-black text-amber-900 leading-none">การจัดการข้อมูลเก่า (Data Migration)</h4>
                    <p className="text-sm font-bold text-amber-700/80 leading-relaxed">
                        หากคุณทำการ "เพิ่มฟิลด์ใหม่" ระบบจะทำการเติมฟิลด์นั้นให้กับข้อมูลเก่าที่บันทึกมาแล้วโดยอัตโนมัติ (Default: "") เพื่อให้โครงสร้างฟอร์มของนักศึกษาทุกคนเป็นมาตรฐานเดียวกันและป้องกันข้อผิดพลาดในการแสดงผล
                    </p>
                </div>
            </div>

            {/* Section 1: Basic Config */}
            <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-10">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
                ข้อมูลหัตถการ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อหัตถการ</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                    value={formData.procedure_name}
                    onChange={(e) => setFormData({...formData, procedure_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-amber-600">รายวิชาที่เกี่ยวข้อง (ล็อกไว้)</label>
                  <div className="relative">
                    <select 
                      disabled
                      className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none transition-all font-bold text-slate-400 appearance-none shadow-inner cursor-not-allowed"
                      value={formData.course_id || ""}
                    >
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          [{course.course_code}] {course.course_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                        <ChevronDown size={20} strokeWidth={3} />
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-amber-500 mt-1">* ไม่สามารถเปลี่ยนวิชาได้เพื่อรักษาความถูกต้องของข้อมูลเคสเดิม</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เป้าหมายจำนวนเคส</label>
                  <div className="relative">
                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      required
                      min={maxStudentProgress || 1}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                      value={formData.required_cases}
                      onChange={(e) => setFormData({...formData, required_cases: Number(e.target.value)})}
                    />
                  </div>
                  {maxStudentProgress > 0 && (
                    <p className="text-[9px] font-bold text-blue-500 mt-1">* มีนักศึกษาทำเคสไปแล้วสูงสุด {maxStudentProgress} เคส (ห้ามลดต่ำกว่านี้)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คะแนนเป้าหมาย</label>
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
                  ปรับแต่งฟอร์มบันทึกข้อมูล
                </h3>
                <button 
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} /> เพิ่มฟิลด์
                </button>
              </div>

              <div className="space-y-4">
                {formData.form_structure.map((field, idx) => (
                  <div key={idx} className="p-8 bg-slate-50/50 border-2 border-white rounded-[32px] shadow-sm relative group animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-5 space-y-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อฟิลด์</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                          value={field.field_name}
                          onChange={(e) => handleFieldChange(idx, 'field_name', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ประเภท</label>
                        <div className="relative">
                          <select 
                            className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none"
                            value={field.field_type}
                            onChange={(e) => handleFieldChange(idx, 'field_type', e.target.value)}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="select">Select</option>
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
                        <label className="block text-[9px] font-black text-blue-600 uppercase tracking-widest ml-1">ตัวเลือก (คั่นด้วย ,)</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:border-blue-200 transition-all font-bold text-slate-700"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => handleFieldChange(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                        />
                      </div>
                    )}
                  </div>
                ))}
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
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </form>
        </div>
    </>
  );
};

export default EditProcedure;

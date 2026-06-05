import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  HiUser, 
  HiClipboardDocumentList, 
  HiCalendarDays, 
  HiClock, 
  HiMapPin, 
  HiCheckCircle, 
  HiXCircle, 
  HiChatBubbleLeftRight, 
  HiPaperAirplane, 
  HiCheckBadge, 
  HiDocumentText,
  HiArrowRight,
  HiArrowLeft,
  HiAcademicCap
} from 'react-icons/hi2';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

interface LogbookCaseDetail {
  _id: string;
  student_id: {
    firstname_lastname: string;
    student_id: string;
    profile_image?: string;
    year?: string | number;
  };
  procedure_id: {
    _id: string;
    procedure_name: string;
    required_cases: number;
    target_score: number;
    form_structure?: any[];
    course_id: {
        _id: string;
        course_name: string;
        course_code: string;
        evaluation_type: 'Pass/Fail' | '0-4';
        year?: number;
    }
  };
  preceptor_id: {
    _id: string;
    firstname_lastname: string;
    workplace?: string;
    profile_image?: string;
  };
  location_id?: {
    _id: string;
    Location_name: string;
  };
  case_date: string;
  case_data: any;
  evaluation_status: 'pending' | 'approved' | 'rejected';
  evaluation_result?: number;
  feedback?: string;
  evaluated_at?: string;
  createdAt: string;
}

const LogbookCaseDetail = () => {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseDetail, setCaseDetail] = useState<LogbookCaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [step, setStep] = useState(1);

  const [evaluationData, setEvaluationData] = useState({
    evaluation_status: '',
    evaluation_result: '',
    feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [caseRes, unreadRes] = await Promise.all([
          api.get(`/logbook-cases/${id}`),
          api.get('/notifications/unread-count')
        ]);

        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.count);
        }

        if (caseRes.data.success) {
          const current = caseRes.data.data;
          setCaseDetail(current);
          if (current.evaluation_status !== 'pending') {
            setEvaluationData({
              evaluation_status: current.evaluation_status,
              evaluation_result: String(current.evaluation_result || ''),
              feedback: current.feedback || ''
            });
          }
        }
      } catch (err) {
        console.error('Error fetching case detail:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;
  const userName = user?.firstname_lastname || 'ผู้ใช้งาน';

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluationData.evaluation_status || evaluationData.evaluation_result === '') {
      showToast('กรุณาเลือกผลการประเมินให้ครบถ้วน', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(`/logbook-cases/${id}/evaluate`, {
        evaluation_status: evaluationData.evaluation_status,
        evaluation_result: Number(evaluationData.evaluation_result),
        feedback: evaluationData.feedback
      });

      if (response.data.success) {
        showToast('บันทึกการประเมินเรียบร้อยแล้ว', 'success');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err: any) {
      console.error('Error evaluating case:', err);
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกการประเมิน', 'error');
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

  if (!caseDetail) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-20">
        <div className="w-24 h-24 bg-white rounded-[32px] shadow-md flex items-center justify-center text-slate-300 border-2 border-white">
          <HiClipboardDocumentList size={48} />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest">ไม่พบข้อมูลบันทึกหัตถการ</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">กลับไปก่อนหน้า</button>
      </div>
    );
  }

  const evaluationType = caseDetail.procedure_id?.course_id?.evaluation_type;

  return (
    <>
      <DashboardHeader 
        studentName={userName} 
        unreadCount={unreadCount}
        onProfileClick={() => navigate('/profile')}
        onNotificationClick={() => navigate('/notifications')}
        onBack={() => {
          if (step === 2) setStep(1);
          else navigate(-1);
        }}
        showTitle={true}
        title="รายละเอียดการบันทึกหัตถการ"
        subtitle={role === 'preceptor' && caseDetail.evaluation_status === 'pending' ? "แบบฟอร์มประเมินสำหรับการปฏิบัติงาน" : "ข้อมูลบันทึกและสรุปผลการประเมิน"}
      />

      <div className="max-w-4xl mx-auto space-y-8 mt-6 pb-20">
        {/* Step Indicator */}
        <div className="flex items-center justify-end px-2 gap-8">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>1</div>
                <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>2</div>
            </div>
            
            <div className="flex items-center gap-4 bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${caseDetail.evaluation_status === 'approved' ? 'bg-emerald-500 animate-pulse' : caseDetail.evaluation_status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                สถานะ: {caseDetail.evaluation_status === 'approved' ? 'ประเมินแล้ว' : caseDetail.evaluation_status === 'rejected' ? 'ต้องแก้ไข' : 'รอดำเนินการ'}
                </span>
            </div>
        </div>

        {/* 1. Main Case Information Card */}
        <div className="bg-white p-10 rounded-[48px] border-2 border-white shadow-xl space-y-10">
          {step === 1 ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <HiUser size={28} />
                    </div>
                    <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">ข้อมูลนักศึกษาและรายวิชา</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">รายละเอียดผู้ส่งและวิชาที่เกี่ยวข้อง</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รายละเอียดนักศึกษา</label>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-blue-100 transition-all space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                                    {caseDetail.student_id?.profile_image ? (
                                        <img src={caseDetail.student_id.profile_image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <HiUser size={32} className="text-slate-200" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 leading-tight">{caseDetail.student_id?.firstname_lastname}</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">ID: {caseDetail.student_id?.student_id}</p>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                        <HiAcademicCap size={12} /> ชั้นปีที่ {caseDetail.student_id?.year}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ข้อมูลรายวิชา</label>
                        <div className="p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 transition-all space-y-2">
                            <div className="flex items-center gap-3">
                                <HiClipboardDocumentList className="text-blue-600" size={20} />
                                <span className="font-black text-blue-700">{caseDetail.procedure_id?.course_id?.course_name}</span>
                            </div>
                            <p className="text-xs font-bold text-blue-500/70 ml-8 uppercase tracking-widest">[{caseDetail.procedure_id?.course_id?.course_code}]</p>
                            <p className="text-[10px] font-black text-slate-400 ml-8 uppercase tracking-widest">เกณฑ์ประเมิน: {caseDetail.procedure_id?.course_id?.evaluation_type}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่ปฏิบัติงาน</label>
                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl">
                        <HiCalendarDays size={20} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{new Date(caseDetail.case_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เวลา</label>
                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl">
                        <HiClock size={20} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{new Date(caseDetail.case_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">สถานที่</label>
                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl">
                        <HiMapPin size={20} className="text-slate-400" />
                        <span className="font-bold text-slate-700 truncate">{caseDetail.location_id?.Location_name || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-10 flex justify-end">
                    <button onClick={() => setStep(2)} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all active:scale-95 shadow-2xl shadow-slate-200">
                        ขั้นตอนถัดไป <HiArrowRight size={18} strokeWidth={3} />
                    </button>
                </div>
              </div>
          ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setStep(1)}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                    >
                        <HiArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{caseDetail.procedure_id?.procedure_name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">รายละเอียดหัตถการที่บันทึก</p>
                    </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {caseDetail.procedure_id?.form_structure && caseDetail.procedure_id.form_structure.length > 0 ? (
                        caseDetail.procedure_id.form_structure.map((field: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.field_name}</label>
                            <div className="px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 shadow-inner">
                            {caseDetail.case_data[field.field_name] || '-'}
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold italic">ไม่มีข้อมูลฟอร์มรายละเอียดเพิ่มเติม</p>
                        </div>
                    )}
                    </div>

                    <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หมายเหตุจากนักศึกษา</label>
                    <div className="px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[32px] font-bold text-slate-700 italic min-h-[120px] leading-relaxed shadow-inner">
                        {caseDetail.case_data?.remarks || 'ไม่มีหมายเหตุเพิ่มเติม'}
                    </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                    <div className="p-6 bg-emerald-50/30 rounded-[32px] border border-emerald-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <HiUser size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">อาจารย์ผู้ประเมิน</p>
                            <p className="text-sm font-black text-emerald-900">{caseDetail.preceptor_id?.firstname_lastname}</p>
                        </div>
                    </div>
                </div>
              </div>
          )}
        </div>

        {/* 2. Evaluation Section Card */}
        {step === 2 && (
            <div className={`bg-white p-10 rounded-[48px] border-4 transition-all shadow-2xl animate-in slide-in-from-bottom-6 duration-700 ${
            caseDetail.evaluation_status === 'pending' ? 'border-blue-100' : 
            caseDetail.evaluation_status === 'approved' ? 'border-emerald-500 shadow-emerald-50' : 
            'border-red-500 shadow-red-50'
            }`}>
            <div className="flex items-center gap-4 mb-10 pb-8 border-b-2 border-slate-50">
                <div className={`p-3 rounded-2xl shadow-lg ${
                caseDetail.evaluation_status === 'approved' ? 'bg-emerald-500 text-white' : 
                caseDetail.evaluation_status === 'rejected' ? 'bg-red-500 text-white' : 
                'bg-blue-600 text-white shadow-blue-200'
                }`}>
                <HiCheckBadge size={24} />
                </div>
                <div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                    {role === 'preceptor' && caseDetail.evaluation_status === 'pending' ? 'ประเมินการปฏิบัติงาน' : 'ผลการสรุปการประเมิน'}
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">เกณฑ์ {evaluationType} (ชั้นปี {caseDetail.procedure_id?.course_id?.year || '-'})</p>
                </div>
            </div>

            {role === 'preceptor' && caseDetail.evaluation_status === 'pending' ? (
                <form onSubmit={handleEvaluate} className="space-y-10">
                <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[40px] border-2 border-white shadow-inner">
                    <label className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">ระบุผลการประเมินตามเกณฑ์วิชา</label>
                    
                    {evaluationType === 'Pass/Fail' ? (
                    <div className="flex gap-6 w-full max-w-md">
                        <button
                        type="button"
                        onClick={() => setEvaluationData({...evaluationData, evaluation_status: 'approved', evaluation_result: '1'})}
                        className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[32px] border-4 transition-all active:scale-95 ${evaluationData.evaluation_result === '1' ? 'bg-emerald-500 border-white text-white shadow-2xl ring-4 ring-emerald-500/20 scale-105' : 'bg-white border-slate-100 text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200'}`}
                        >
                        <HiCheckCircle size={40} />
                        <span className="font-black text-lg">PASS (ผ่าน)</span>
                        </button>
                        <button
                        type="button"
                        onClick={() => setEvaluationData({...evaluationData, evaluation_status: 'rejected', evaluation_result: '0'})}
                        className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[32px] border-4 transition-all active:scale-95 ${evaluationData.evaluation_result === '0' ? 'bg-red-500 border-white text-white shadow-2xl ring-4 ring-red-500/20 scale-105' : 'bg-white border-slate-100 text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}
                        >
                        <HiXCircle size={40} />
                        <span className="font-black text-lg">FAIL (ไม่ผ่าน)</span>
                        </button>
                    </div>
                    ) : (
                    <div className="flex flex-wrap justify-center gap-4">
                        {[0, 1, 2, 3, 4].map(val => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => setEvaluationData({
                            ...evaluationData, 
                            evaluation_result: String(val),
                            evaluation_status: val > 0 ? 'approved' : 'rejected' 
                            })}
                            className={`w-16 h-16 rounded-[24px] font-black text-2xl border-4 transition-all active:scale-90 flex flex-col items-center justify-center ${evaluationData.evaluation_result === String(val) ? (val > 0 ? 'bg-blue-600' : 'bg-red-600') + ' border-white text-white shadow-2xl scale-110 ring-4 ring-blue-500/10' : 'bg-white border-slate-100 text-slate-300 hover:bg-slate-50 hover:text-blue-500'}`}
                        >
                            {val}
                            <span className="text-[8px] opacity-60">PTS</span>
                        </button>
                        ))}
                    </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <HiChatBubbleLeftRight size={14} /> ข้อเสนอแนะเพิ่มเติม (Feedback)
                    </label>
                    <textarea
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[32px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none font-bold text-slate-800 shadow-inner"
                    rows={4}
                    placeholder="ระบุข้อแนะนำเพื่อให้นักศึกษาพัฒนาหัตถการนี้..."
                    value={evaluationData.feedback}
                    onChange={(e) => setEvaluationData({...evaluationData, feedback: e.target.value})}
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !evaluationData.evaluation_result}
                    className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black hover:bg-blue-600 shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-sm"
                >
                    {isSubmitting ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                    <>บันทึกผลการประเมิน <HiPaperAirplane size={20} /></>
                    )}
                </button>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[40px] border-2 border-white shadow-inner text-center min-h-[180px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">สรุปผลประเมิน</p>
                    <div className={`w-32 h-32 rounded-[40px] flex flex-col items-center justify-center border-4 bg-white shadow-xl ${
                    caseDetail.evaluation_status === 'approved' ? 'border-emerald-500 text-emerald-600' : 
                    caseDetail.evaluation_status === 'rejected' ? 'border-red-500 text-red-600' : 
                    'border-amber-500 text-amber-600'
                    }`}>
                    <span className={`font-black ${evaluationType === 'Pass/Fail' ? 'text-2xl' : 'text-5xl'}`}>
                        {caseDetail.evaluation_status === 'pending' ? '-' : 
                        evaluationType === 'Pass/Fail' ? (caseDetail.evaluation_result === 1 ? 'PASS' : 'FAIL') : 
                        caseDetail.evaluation_result}
                    </span>
                    {caseDetail.evaluation_status !== 'pending' && <p className="text-[9px] font-black uppercase mt-1">{evaluationType === 'Pass/Fail' ? 'RESULT' : 'POINTS'}</p>}
                    </div>
                </div>

                <div className="md:col-span-8 flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2.5 flex items-center gap-2">
                    <HiChatBubbleLeftRight size={14} /> ความคิดเห็นจากผู้ประเมิน
                    </p>
                    <div className="flex-grow p-8 bg-slate-50 border-2 border-white rounded-[32px] text-slate-700 font-bold leading-relaxed shadow-inner min-h-[120px]">
                    {caseDetail.feedback || (caseDetail.evaluation_status === 'pending' ? 'รอดำเนินการประเมินจากอาจารย์พี่เลี้ยง' : 'ไม่มีข้อเสนอแนะเพิ่มเติม')}
                    </div>
                </div>
                </div>
            )}
            </div>
        )}
      </div>
    </>
  );
};

export default LogbookCaseDetail;

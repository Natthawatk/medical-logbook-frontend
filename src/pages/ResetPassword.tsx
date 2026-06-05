import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';
import logo from '../assets/logo.png';

const ResetPassword = () => {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/reset-password', { 
        email, 
        otp,
        new_password: password
      });

      if (response.data.success) {
        showToast('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่');
      } else {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !otp) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[48px] shadow-2xl text-center max-w-sm w-full border-2 border-white">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">ไม่สามารถดำเนินการได้</h2>
          <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest leading-relaxed">เซสชันหมดอายุหรือข้อมูลไม่ถูกต้อง</p>
          <button 
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all uppercase tracking-widest text-xs shadow-lg"
          >
            กลับไปหน้าลืมรหัสผ่าน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Card */}
      <div className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl border-2 border-white animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-32 h-auto mx-auto mb-2 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Medical Logbook</h1>
          <h2 className="text-xl font-black text-slate-700 tracking-tight">ตั้งรหัสผ่านใหม่</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">ระบุรหัสผ่านใหม่ที่ต้องการใช้งาน</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-100 text-rose-600 text-xs font-black rounded-2xl text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">รหัสผ่านใหม่</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                placeholder="ระบุรหัสผ่านใหม่"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">ยืนยันรหัสผ่านอีกครั้ง</label>
            <div className="relative">
              <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                placeholder="ระบุรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 shadow-inner"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>เปลี่ยนรหัสผ่าน <ArrowRight size={18} strokeWidth={3} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

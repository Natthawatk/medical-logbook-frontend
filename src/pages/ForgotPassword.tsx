import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/otp/send', { 
        email: email.trim().toLowerCase() 
      });

      if (response.data.success) {
        navigate('/verify-code', { state: { email: email.trim().toLowerCase() } });
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'เกิดข้อผิดพลาดในการส่งรหัสยืนยัน');
      } else {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Card */}
      <div className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl border-2 border-white animate-in zoom-in-95 duration-500 relative">
        <button 
          onClick={() => navigate('/login')}
          className="absolute top-8 left-8 p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all z-10"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>

        <div className="text-center mb-8">
          <div className="w-32 h-auto mx-auto mb-2 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Medical Logbook</h1>
          <h2 className="text-xl font-black text-slate-700 tracking-tight">ลืมรหัสผ่าน</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">กู้คืนรหัสผ่านด้วยอีเมลเพื่อดำเนินการต่อ</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-100 text-rose-600 text-xs font-black rounded-2xl text-center uppercase tracking-widest">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">อีเมลแอดเดรส</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ระบุอีเมลที่ลงทะเบียนไว้"
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>ส่งรหัสยืนยัน (OTP) <ArrowRight size={18} strokeWidth={3} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (user.role === 'preceptor') {
          window.location.href = '/preceptor/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(response.data.message || 'ข้อมูลผู้ใช้ไม่ถูกต้อง');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login API Error:", err); 
      setError(err.response?.data?.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl border-2 border-white animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-32 h-auto mx-auto mb-2 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Medical Logbook</h1>
          <h2 className="text-xl font-black text-slate-700 tracking-tight">เข้าสู่ระบบ</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">ลงชื่อเข้าใช้งานระบบเพื่อดำเนินการต่อ</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-100 text-rose-600 text-xs font-black rounded-2xl text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                placeholder="ระบุอีเมลของคุณ"
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
              <Link to="/forgot-password" university-title="" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                placeholder="ระบุรหัสผ่านของคุณ"
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                <>เข้าสู่ระบบ <ArrowRight size={18} strokeWidth={3} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

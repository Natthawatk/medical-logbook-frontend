import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSuccess = (user: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    if (user.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else if (user.role === 'preceptor') {
      window.location.href = '/preceptor/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        handleLoginSuccess(response.data.data.user, response.data.data.token);
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/google-login', { 
        idToken: credentialResponse.credential 
      });

      if (response.data.success && response.data.data) {
        handleLoginSuccess(response.data.data.user, response.data.data.token);
      } else {
        setError(response.data.message || 'การเข้าสู่ระบบด้วย Google ล้มเหลว');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Google Login API Error:", err);
      setError(err.response?.data?.message || 'ไม่สามารถเชื่อมต่อกับ Google ได้');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans overflow-y-auto">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-[32px] shadow-2xl border-2 border-white my-4 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-6">
          <div className="w-24 h-auto mx-auto mb-2 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Medical Logbook</h1>
          <h2 className="text-lg font-black text-slate-700 tracking-tight">เข้าสู่ระบบ</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">ลงชื่อเข้าใช้งานระบบเพื่อดำเนินการต่อ</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-100 text-rose-600 text-[10px] font-black rounded-xl text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest ml-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                placeholder="ระบุอีเมลของคุณ"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
              <Link to="/forgot-password" university-title="" className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                placeholder="ระบุรหัสผ่านของคุณ"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-[18px] font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>เข้าสู่ระบบ <ArrowRight size={16} strokeWidth={3} /></>
              )}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-black">
              <span className="bg-white px-3 text-slate-400">หรือเข้าสู่ระบบด้วย</span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('การเข้าสู่ระบบด้วย Google ล้มเหลว');
              }}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              width="320px"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

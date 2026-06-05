import React from 'react';
import { Bell, User, ChevronLeft } from 'lucide-react';

interface DashboardHeaderProps {
  studentName: string;
  unreadCount?: number;
  onProfileClick?: () => void;
  onNotificationClick?: () => void;
  onBack?: () => void;
  profileImage?: string;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  darkMode?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  unreadCount = 0, 
  onProfileClick, 
  onNotificationClick,
  onBack,
  profileImage,
  studentName,
  showTitle = false,
  title,
  subtitle,
  darkMode = false
}) => {
  return (
    <header className="flex justify-between items-center mb-6 relative z-10">
      {/* Title section - Conditional */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className={`p-2.5 rounded-2xl shadow-sm transition-all active:scale-95 group ${
              darkMode 
                ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' 
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ChevronLeft size={24} className={`transition-colors ${darkMode ? 'group-hover:text-blue-200' : 'group-hover:text-blue-600'}`} />
          </button>
        )}
        {showTitle && (
          <div>
            <h2 className={`text-3xl font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {title}
            </h2>
            {subtitle && (
              <p className={`font-medium mt-2 text-sm ${darkMode ? 'text-blue-100/70' : 'text-slate-600'}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action section */}
      <div className="flex items-center gap-3">
        {/* กระดิ่งแจ้งเตือน */}
        <button 
          onClick={onNotificationClick}
          className={`relative p-2.5 rounded-2xl transition-all duration-300 group border ${
            darkMode
              ? 'text-white/70 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10 hover:shadow-lg'
              : 'text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border-transparent hover:border-slate-100'
          }`}
        >
          <Bell size={22} className="group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className={`absolute top-1 right-1 min-w-[16px] h-[16px] px-1 text-[8px] font-black rounded-full border-2 flex items-center justify-center animate-bounce ${
              darkMode ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/50' : 'bg-red-500 text-white border-white shadow-sm'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* รูปโปรไฟล์สไตล์ IG */}
        <button 
          onClick={onProfileClick}
          className={`w-10 h-10 rounded-full overflow-hidden border p-0.5 transition-all duration-300 group ${
            darkMode 
              ? 'bg-white/10 border-white/20 hover:border-white/40 hover:shadow-lg shadow-black/20' 
              : 'bg-white border-slate-100 hover:shadow-md hover:border-blue-100'
          }`}
        >
          <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 ${
            darkMode ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            {profileImage ? (
              <img src={profileImage} alt={studentName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={20} strokeWidth={2.5} />
              </div>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;

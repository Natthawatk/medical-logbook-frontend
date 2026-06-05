import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  details?: { label: string; value: number | string; color: string; icon?: React.ReactNode }[];
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({ title, value, unit, icon, iconBg, iconColor, details }) => {
  return (
    <div className="bg-white p-7 rounded-[40px] border-2 border-white shadow-md flex flex-col transition-all hover:shadow-xl group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{value}</p>
            {unit && <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
          </div>
        </div>
        <div className={`p-4 ${iconBg} ${iconColor} rounded-3xl shadow-sm transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      
      {details && details.length > 0 && (
        <div className="space-y-2 mt-auto">
          {details.map((detail, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors duration-300">
              <div className="flex items-center gap-3">
                {detail.icon && <div className="shrink-0">{detail.icon}</div>}
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{detail.label}</p>
              </div>
              <p className={`text-base font-black ${detail.color}`}>{detail.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStatCard;

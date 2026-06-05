import React from 'react';

interface Detail {
  label: string;
  value: number;
  valueColorClass: string;
  bgClass: string;
}

interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  colorClass: string;
  details: Detail[];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, colorClass, details }) => {
  return (
    <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className={`text-4xl font-black ${colorClass}`}>
          {value}
        </p>
        <span className="text-lg font-bold text-slate-400">{unit}</span>
      </div>
      <div className="mt-4 space-y-2">
        {details.map((detail) => (
          <div key={detail.label} className={`flex justify-between items-center p-3 rounded-xl ${detail.bgClass}`}>
            <p className="text-xs font-bold text-slate-600">{detail.label}</p>
            <p className={`text-sm font-black ${detail.valueColorClass}`}>
              {detail.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatCard;

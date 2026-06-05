import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface GraphData {
  name: string;
  cases: number;
}

interface ProgressGraphProps {
  data: GraphData[];
  overallProgress: number;
  totalApproved: number;
  totalTarget: number;
  averageScore?: number;
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({ 
  data, 
  overallProgress, 
  totalApproved, 
  totalTarget, 
  averageScore = 4.00 
}) => {
  const hasData = data && data.length > 0;

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800">กราฟแสดงความคืบหน้ารวม</h3>
      
      <div className="my-4">
        <p className="text-4xl font-black text-blue-600 tracking-tight">
          {overallProgress.toFixed(2)}%
        </p>
        <p className="text-sm text-gray-400 font-bold mt-1">
          ทำไปแล้ว {totalApproved} / {totalTarget} เคส 
          <span className="ml-3 px-2 py-0.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase">
            คะแนนเฉลี่ย {averageScore.toFixed(2)}
          </span>
        </p>
      </div>

      <div className="flex-grow w-full mt-4 bg-slate-50/30 rounded-2xl p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={hasData ? data : []} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} 
              dy={5}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip 
              cursor={{ stroke: '#2563eb', strokeWidth: 1 }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontFamily: 'inherit',
                fontSize: '11px',
                fontWeight: '800'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="cases" 
              stroke="#2563eb" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
              isAnimationActive={true}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressGraph;

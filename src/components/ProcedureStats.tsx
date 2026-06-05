import React from 'react';
import { Clock } from 'lucide-react';

interface ProcedureStat {
  _id: string;
  procedure_name: string;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  targetCount: number;
  progressPercent: number;
}

interface Course {
  _id: string;
  course_name: string;
  course_code: string;
}

interface ProcedureStatsProps {
  procedureStats: ProcedureStat[];
  courses: Course[];
  selectedCourseId: string;
  onCourseChange: (courseId: string) => void;
  isLoading: boolean;
}

const ProcedureStats: React.FC<ProcedureStatsProps> = ({
  procedureStats,
  courses,
  selectedCourseId,
  onCourseChange,
  isLoading
}) => {
  return (
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-none">สถิติการเก็บเคสนักศึกษา</h3>
          <p className="text-slate-600 font-bold text-sm mt-2">แสดงสถิติความคืบหน้าของหัตถการรายบุคคล</p>
        </div>
        <div className="w-full md:w-80">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">กรองรายวิชา</label>
          <select 
            value={selectedCourseId}
            onChange={(e) => onCourseChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id} className="font-bold">{course.course_code} - {course.course_name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-slate-100 rounded-full w-full"></div>)}
        </div>
      ) : procedureStats.length > 0 ? (
        <div className="space-y-10">
          {procedureStats.map((skill) => {
            return (
              <div key={skill._id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 group">
                <div className="md:col-span-4 lg:col-span-5 pt-1">
                  <span className="font-black text-slate-700 group-hover:text-blue-600 transition-colors text-sm leading-tight block">{skill.procedure_name}</span>
                </div>
                <div className="md:col-span-8 lg:col-span-7">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ความคืบหน้า (เคส)</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex-grow bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100/50 shadow-inner">
                      {(() => {
                        const progress = Math.round(skill.progressPercent);
                        let barColor = 'bg-blue-600';
                        let shadowColor = 'rgba(37,99,235,0.2)';
                        
                        if (progress < 30) {
                          barColor = 'bg-red-500';
                          shadowColor = 'rgba(239,68,68,0.2)';
                        } else if (progress < 60) {
                          barColor = 'bg-amber-500';
                          shadowColor = 'rgba(245,158,11,0.2)';
                        } else if (progress < 100) {
                          barColor = 'bg-blue-600';
                          shadowColor = 'rgba(37,99,235,0.2)';
                        } else {
                          barColor = 'bg-emerald-600';
                          shadowColor = 'rgba(16,185,129,0.2)';
                        }

                        return (
                          <div 
                            className={`${barColor} h-full rounded-full transition-all duration-1000 ease-out`} 
                            style={{width: `${skill.progressPercent}%`, boxShadow: `0 0 15px ${shadowColor}`}}
                          ></div>
                        );
                      })()}
                    </div>
                    <div className="min-w-[130px] text-right">
                      {(() => {
                        const progress = Math.round(skill.progressPercent);
                        let textColor = 'text-blue-600';
                        if (progress < 30) textColor = 'text-red-600';
                        else if (progress < 60) textColor = 'text-amber-600';
                        else if (progress < 100) textColor = 'text-blue-600';
                        else textColor = 'text-emerald-600';

                        return (
                          <span className={`${textColor} font-black text-lg tracking-tighter`}>
                            {skill.approvedCount}/{skill.targetCount}
                          </span>
                        );
                      })()}
                      <span className="text-slate-500 font-black text-[9px] ml-2 uppercase">({Math.round(skill.progressPercent)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold italic">ไม่มีข้อมูลหัตถการในวิชานี้</p>
        </div>
      )}
    </div>
  );
};

export default ProcedureStats;

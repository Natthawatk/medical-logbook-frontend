import React from 'react';
import { BookOpen } from 'lucide-react';
import { HiClipboardDocumentList } from 'react-icons/hi2';

interface AdminCourseCardProps {
  course: {
    _id: string;
    course_name: string;
    course_code: string;
    semester?: string | number;
    year?: string | number;
    progressPercent: number;
    approvedCases: number;
    targetCases: number;
    totalTypes: number;
  };
}

const AdminCourseCard: React.FC<AdminCourseCardProps> = ({ course }) => {
  const progress = Math.round(course.progressPercent || 0);

  return (
    <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <BookOpen size={24} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-slate-900 leading-tight">{progress}%</span>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ความคืบหน้ารวม</p>
        </div>
      </div>
      
      <h3 className="font-black text-slate-900 text-[15px] leading-tight mb-1 line-clamp-1">{course.course_name}</h3>
      
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-mono font-black uppercase tracking-tight border border-blue-200">{course.course_code}</span>
        {course.semester && (
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-slate-200">
            เทอม {course.semester}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-slate-400">
            <HiClipboardDocumentList size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">{course.totalTypes} หัตถการ</span>
        </div>
      </div>
      
      <div className="space-y-3 mt-5">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
          <span className="text-slate-500">เป้าหมายเคส:</span>
          <span className="text-slate-900">{course.approvedCases} / {course.targetCases}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          {(() => {
            let barColor = 'bg-blue-600';
            if (progress < 30) barColor = 'bg-red-500';
            else if (progress < 60) barColor = 'bg-amber-500';
            else if (progress < 100) barColor = 'bg-blue-600';
            else barColor = 'bg-emerald-600';
            
            return (
              <div 
                className={`h-full transition-all duration-1000 ${barColor}`} 
                style={{ width: `${progress}%` }}
              ></div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default AdminCourseCard;

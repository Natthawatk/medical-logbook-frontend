
import { BookOpen } from 'lucide-react';

const SubjectCard = ({ subject }: { subject: any }) => {
  const progress = Math.round(subject.progressPercent || 0);

  return (
    <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <BookOpen size={24} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-slate-900 leading-tight">{progress}%</span>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ความคืบหน้ารวม</p>
        </div>
      </div>
      
      <h3 className="font-black text-slate-900 text-[15px] leading-tight mb-1 line-clamp-1">{subject.course_name}</h3>
      
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-mono font-black uppercase tracking-tight border border-blue-200">{subject.course_code}</span>
        {subject.semester && (
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black uppercase tracking-tight border border-slate-200">
            เทอม {subject.semester}
          </span>
        )}
        {subject.year && <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ชั้นปี {subject.year}</span>}
      </div>
      
      <div className="space-y-3 mt-5">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
          <span className="text-slate-500">เป้าหมายเคส:</span>
          <span className="text-slate-900">{subject.approvedCases} / {subject.targetCases}</span>
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

export default SubjectCard;

import React from 'react';
import { History, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import ExamCard from './ExamCard';

export default function HistoryView({ exams, loading, onReview, onDelete }) {
  const completedExams = exams.filter(e => e.status === 'completed');
  
  const avgScore = completedExams.length > 0 
    ? Math.round(completedExams.reduce((acc, curr) => acc + curr.total_score, 0) / completedExams.length) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Past Results</h1>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest border-2 border-emerald-200 flex items-center gap-1.5"><CheckCircle2 size={12}/> Completed</span>
          </div>
          <p className="text-slate-500 text-base font-medium leading-relaxed max-w-lg">
            A permanent record of your completed exams and AI strategic insights.
          </p>
        </div>
      </header>

      {/* Stats row can be expanded here nicely since we have room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Missions Passed</p>
              <p className="text-3xl font-black text-slate-900">{completedExams.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Award size={20} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Projected Score</p>
              <p className="text-3xl font-black text-emerald-500">{avgScore}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
         </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <History size={16} className="text-emerald-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed Exams</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {completedExams.map(exam => (
            <ExamCard 
              key={exam.id} 
              exam={exam} 
               variant="history"
              onPlay={() => {}} // Won't be used since they are completed, but valid for typing
              onReview={onReview} 
              onDelete={onDelete} 
            />
          ))}

          {completedExams.length === 0 && !loading && (
            <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center group opacity-80 backdrop-blur-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-all duration-700 shadow-inner">
                <Award size={32} className="text-emerald-200" />
              </div>
              <h3 className="text-slate-900 font-black text-2xl mb-2 tracking-tighter italic">No Past Results</h3>
              <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed px-6">
                Your archive is awaiting its first entry. Complete an active mission to see it here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

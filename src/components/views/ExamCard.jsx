import React from 'react';
import { PlayCircle, Trash, History, BarChart3, Loader2, Target } from 'lucide-react';

export default function ExamCard({ exam, onPlay, onReview, onDelete, variant = 'hub' }) {
  const isCompleted = exam.status === 'completed';
  const isReady = exam.status === 'ready';
  const isGenerating = exam.status && exam.status.toString().toLowerCase().startsWith('generating');
  const progressPercent = Math.min(Math.round((exam.progress / 66) * 100) || 0, 100);
  const formattedDate = exam.created_at?.toDate ? exam.created_at.toDate().toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="group bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
        <Target size={80} />
      </div>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-5 w-full lg:w-auto">
          {/* Score/Status Circle - Only show in history */}
          {variant === 'history' && (
            <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-black shadow-inner transition-all transform group-hover:scale-105 ${
              isCompleted ? 'bg-blue-600 text-white shadow-blue-200' : 
              isReady ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
              'bg-slate-50 text-slate-300'
            }`}>
              <span className="text-[8px] uppercase tracking-widest mb-0.5 opacity-60 font-bold">Score</span>
              <span className="text-2xl leading-none italic">{isCompleted ? exam.total_score : '--'}</span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{exam.title}</h3>
              {(!isCompleted || variant === 'history') && (
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  isCompleted ? 'bg-blue-50 text-blue-600' : 
                  isReady ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-amber-50 text-amber-600 animate-pulse'
                }`}>
                  {exam.status}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
              {exam.exam_type === 'full' && (
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={14} /> 66 Qs
                </span>
              )}
              {exam.exam_type === 'module' && (
                <span className="flex items-center gap-1.5 text-purple-500">
                  <Target size={14} /> Targeted
                </span>
              )}
              <span className="flex items-center gap-1.5">
                 <History size={14} /> {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          {isGenerating && (
            <div className="w-full lg:w-56 flex flex-col gap-2 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 animate-pulse flex items-center gap-1.5">
                   <Loader2 size={10} className="animate-spin" />
                   {exam.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-black text-blue-700 tabular-nums">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgb(59,130,246,0.4)]" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {(isReady || isCompleted) && (
            <button 
              onClick={() => {
                if (variant === 'history' && isCompleted) onReview(exam.id);
                else onPlay(exam.id);
              }}
              className={`group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                (variant === 'history' && isCompleted)
                  ? 'bg-slate-900 text-white hover:bg-black shadow-md shadow-slate-200' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100'
              }`}
            >
              {(variant === 'history' && isCompleted) ? (
                <>
                  <BarChart3 size={16} className="group-hover/btn:scale-110 transition-transform" />
                  View Analysis
                </>
              ) : (
                <>
                  <PlayCircle size={16} className="group-hover/btn:scale-110 transition-transform" />
                  Start Exam
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

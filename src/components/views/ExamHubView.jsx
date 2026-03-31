import React from 'react';
import { History, PlusCircle, Sparkles, BookOpen, Target } from 'lucide-react';
import ExamCard from './ExamCard';

export default function ExamHubView({ exams, loading, onPlay, onReview, onDelete, onCreateFull }) {
  const fullExams = exams.filter(e => e.exam_type === 'full');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900 leading-none">SAT Full Exams</h1>
          <p className="text-slate-500 text-base font-medium leading-relaxed max-w-lg">
            Deploy full-scale 66-question SAT Reading & Writing diagnostic exams.
          </p>
        </div>
        <button 
          onClick={onCreateFull}
          className="group relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-3 active:scale-95 min-w-[200px] justify-center"
        >
          <PlusCircle className="group-hover:rotate-90 transition-transform duration-300" size={18} />
          <span className="text-sm">New SAT Exam</span>
        </button>
      </header>

      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <History size={16} className="text-slate-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">All Full Exams</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {fullExams.map(exam => (
            <ExamCard 
              key={exam.id} 
              exam={exam} 
              variant={exam.status === 'completed' ? 'history' : 'hub'}
              onPlay={onPlay} 
              onReview={onReview} 
              onDelete={onDelete} 
            />
          ))}

          {fullExams.length === 0 && !loading && (
            <div className="py-24 text-center bg-white rounded-[56px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center group opacity-80 backdrop-blur-sm">
              <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-all duration-700 shadow-inner">
                <BookOpen size={64} className="text-slate-200" />
              </div>
              <h3 className="text-slate-900 font-black text-4xl mb-4 tracking-tighter italic">Your Registry is Empty</h3>
              <p className="text-slate-400 text-lg font-medium max-w-sm mx-auto leading-relaxed px-8">
                No diagnostic data found. Forge your first exam to initialize your tracker.
              </p>
              <div className="mt-10 animate-bounce">
                 <Target size={32} className="text-blue-100" />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

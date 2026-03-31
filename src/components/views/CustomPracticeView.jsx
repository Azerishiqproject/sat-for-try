import React from 'react';
import { Target, Zap, Activity } from 'lucide-react';
import ExamCard from './ExamCard';

export default function CustomPracticeView({ exams, loading, onPlay, onReview, onDelete }) {
  const moduleExams = exams.filter(e => e.exam_type === 'module');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Custom Practice</h1>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest border-2 border-purple-200">Focused</span>
          </div>
          <p className="text-slate-500 text-base font-medium leading-relaxed max-w-lg">
            Custom-forged remediation missions based on your AI Tutor's analysis.
          </p>
        </div>
      </header>

      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Activity size={16} className="text-purple-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Practice Modules</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {moduleExams.map(exam => (
            <ExamCard 
              key={exam._id} 
              exam={exam} 
              onPlay={onPlay} 
              onReview={onReview} 
              onDelete={onDelete} 
            />
          ))}

          {moduleExams.length === 0 && !loading && (
            <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center group opacity-80 backdrop-blur-sm">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-all duration-700 shadow-inner">
                <Target size={32} className="text-purple-200" />
              </div>
              <h3 className="text-slate-900 font-black text-2xl mb-2 tracking-tighter italic">No Active Targets</h3>
              <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed px-6">
                Complete a Full Exam and use the AI Coach to generate your first targeted practice.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

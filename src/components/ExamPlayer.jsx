import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Send, CheckCircle2, History, BarChart3, Loader2 } from 'lucide-react';
import { examService } from '../services/examService';

function ExamPlayer({ examId, onExit }) {
  const [exam, setExam] = useState(null);
  const [currentModule, setCurrentModule] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(32 * 60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadExamData = async () => {
      try {
        const examData = await examService.getExam(examId);
        if (!examData) return;

        // Fetch questions for both modules
        const m1Qs = await examService.getQuestions(examData.module1_questions || []);
        const m2Qs = await examService.getQuestions(examData.module2_questions || []);

        setExam({
          ...examData,
          module1_questions: m1Qs,
          module2_questions: m2Qs
        });
      } catch (err) {
        console.error("Load Exam Error:", err);
      }
    };

    loadExamData();

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [examId]);

  const handleSelect = (option) => {
    const questions = exam[`module${currentModule}_questions`];
    const qId = questions[currentIndex].id;
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Are you ready to submit your exam?')) return;
    setSubmitting(true);
    try {
      // 1. Calculate Score Client-side
      const m1Answers = (exam.module1_questions || []).map(q => ({
        question_id: q.id,
        selected_option: answers[q.id] || null,
        is_correct: answers[q.id] === q.correct_answer
      }));

      const m2Answers = (exam.module2_questions || []).map(q => ({
        question_id: q.id,
        selected_option: answers[q.id] || null,
        is_correct: answers[q.id] === q.correct_answer
      }));

      const m1Correct = m1Answers.filter(a => a.is_correct).length;
      const m2Correct = m2Answers.filter(a => a.is_correct).length;

      // Basic SAT Scoring simulation (Same as old backend logic)
      const m1Score = 200 + Math.round((m1Correct / 33) * 300);
      const m2Score = Math.round((m2Correct / 33) * 300);
      const totalScore = m1Score + m2Score;

      // 2. Update Firestore
      await examService.updateExam(examId, {
        status: 'completed',
        module1_answers: m1Answers,
        module2_answers: m2Answers,
        module1_score: m1Score,
        module2_score: m2Score,
        total_score: totalScore,
        completed_at: new Date().toISOString()
      });
      
      onExit(true, examId);
    } catch (e) {
      console.error('Submission Error:', e);
      alert(`Submission Failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const questions = exam[`module${currentModule}_questions`];
  if (!questions || questions.length === 0) return <div className="p-20 text-center">Questions loading or error...</div>;

  const currentQuestion = questions[currentIndex];
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;



  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Interactive Header */}
      <header className="px-8 py-4 border-b border-slate-200 flex flex-col bg-white sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase">Module {currentModule}</div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">{exam.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 mr-2">
              <Clock size={14} className="text-slate-400" />
              <span className="font-mono font-medium text-sm text-slate-700">{formatTime(timeLeft)}</span>
            </div>
            <button 
              onClick={handleSubmitExam} 
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 text-sm"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
              Submit Exam
            </button>
          </div>
        </div>

        {/* Question Ribbons (Stacked) */}
        <div className="flex flex-col gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
          {/* Module 1 Ribbon */}
          {exam.module1_questions && exam.module1_questions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 w-10 shrink-0 tracking-widest">Mod 1</span>
              <div className="flex items-center gap-1 flex-nowrap">
                {exam.module1_questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentModule === 1 && currentIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentModule(1); setCurrentIndex(idx); }}
                      className={`flex-shrink-0 w-7 h-7 rounded text-[10px] font-semibold transition-all border flex items-center justify-center relative ${
                        isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 
                        isAnswered ? 'bg-slate-200 border-slate-200 text-slate-600' : 
                        'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {idx + 1}
                      {isAnswered && !isCurrent && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Module 2 Ribbon */}
          {exam.module2_questions && exam.module2_questions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 w-10 shrink-0 tracking-widest">Mod 2</span>
              <div className="flex items-center gap-1 flex-nowrap">
                {exam.module2_questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentModule === 2 && currentIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentModule(2); setCurrentIndex(idx); }}
                      className={`flex-shrink-0 w-7 h-7 rounded text-[10px] font-semibold transition-all border flex items-center justify-center relative ${
                        isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 
                        isAnswered ? 'bg-slate-200 border-slate-200 text-slate-600' : 
                        'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {idx + 1}
                      {isAnswered && !isCurrent && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Passage */}
        <section className="flex-1 overflow-y-auto p-8 bg-slate-50/50 flex">
          <div className="max-w-3xl w-full mx-auto text-slate-900 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
                {currentQuestion.passage_type === 'notes' ? 'Research Notes' : 'Reading Passage'}
              </div>
              <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                {currentQuestion.topic}
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentQuestion.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 
                currentQuestion.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {currentQuestion.difficulty}
              </div>
            </div>

            <div className="p-6 md:p-8 flex-1 overflow-y-auto w-full">
              {currentQuestion.passage_type === 'dual' ? (
                <div className="space-y-8 w-full">
                  {currentQuestion.passage_text.split('\n\n').map((text, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-lg border border-slate-100 w-full">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Text {idx + 1}</div>
                      <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">{text}</div>
                    </div>
                  ))}
                </div>
              ) : currentQuestion.passage_type === 'notes' ? (
                <div className="pl-6 border-l-4 border-blue-200 w-full">
                  <ul className="space-y-4">
                    {currentQuestion.passage_text.split('\n').map((note, idx) => (
                      <li key={idx} className="flex gap-3 text-base leading-relaxed text-slate-800">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{note.replace(/^[•-]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap w-full">
                  {currentQuestion.passage_text}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Question */}
        <section className="w-[450px] border-l border-slate-200 bg-white flex flex-col">
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Question {currentIndex + 1}</div>
            <p className="text-base font-semibold text-slate-800 mb-8 leading-relaxed">
              {currentQuestion.question_stem}
            </p>

            <div className="space-y-2.5">
              {['A', 'B', 'C', 'D'].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full group p-3.5 rounded-xl border transition-all flex items-center gap-3 text-left ${
                    answers[currentQuestion._id] === opt 
                    ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                    answers[currentQuestion._id] === opt 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    {opt}
                  </div>
                  <span className={`text-sm leading-snug flex-1 ${
                    answers[currentQuestion.id] === opt 
                    ? 'font-semibold text-blue-900' 
                    : 'text-slate-700'
                  }`}>{currentQuestion.options[opt]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button 
              disabled={currentModule === 1 && currentIndex === 0}
              onClick={() => {
                if (currentIndex === 0 && currentModule === 2) {
                  setCurrentModule(1);
                  setCurrentIndex(exam.module1_questions.length - 1);
                } else {
                  setCurrentIndex(prev => prev - 1);
                }
              }}
              className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button 
              disabled={currentModule === 2 && currentIndex === questions.length - 1}
              onClick={() => {
                if (currentIndex === questions.length - 1 && currentModule === 1 && exam.module2_questions && exam.module2_questions.length > 0) {
                  setCurrentModule(2);
                  setCurrentIndex(0);
                } else {
                  setCurrentIndex(prev => prev + 1);
                }
              }}
              className="flex-1 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-black shadow-sm transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 text-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ExamPlayer;

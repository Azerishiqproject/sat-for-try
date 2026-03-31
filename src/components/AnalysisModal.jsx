import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, BarChart3, Zap, Loader2, PlayCircle, Plus, LayoutGrid, Sparkles, Target, Trophy, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { examService } from '../services/examService';
import { callGPT } from '../services/aiService';

function QuestionDetailOverlay({ question, userAnswer, onClose }) {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
        
        <header className="px-8 py-5 flex justify-between items-center bg-white sticky top-0 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${userAnswer?.is_correct ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {userAnswer?.is_correct ? 'Correct' : 'Incorrect'}
            </div>
            <span className="text-slate-500 font-medium text-xs">{question.topic}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#fafbfc]">
          
          {/* Left: Passage Column */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 border-r border-slate-100">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reading Passage</div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 text-base leading-relaxed text-slate-800 shadow-sm whitespace-pre-wrap">
                {question.passage_text}
              </div>
            </div>
          </div>

          {/* Right: Question & Options Column */}
          <div className="w-full md:w-[450px] overflow-y-auto p-6 md:p-8 bg-white">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Question</div>
            <p className="text-base font-semibold text-slate-800 leading-relaxed mb-6">
               {question.question_stem}
            </p>
            
            <div className="space-y-2.5">
              {Object.entries(question.options).map(([key, val]) => {
                const isCorrect = key === question.correct_answer;
                const isUserSelection = key === userAnswer?.selected_option;
                
                let bgColor = 'bg-white border-slate-200';
                let textColor = 'text-slate-700 font-medium';
                let icon = null;

                if (isCorrect) {
                   bgColor = 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400';
                   textColor = 'text-emerald-900 font-semibold';
                   icon = <CheckCircle2 size={16} className="text-emerald-600" />;
                } else if (isUserSelection && !isCorrect) {
                   bgColor = 'bg-rose-50 border-rose-400 ring-1 ring-rose-400';
                   textColor = 'text-rose-900 font-semibold';
                   icon = <X size={16} className="text-rose-600" />;
                }

                return (
                  <div key={key} className={`p-3.5 rounded-xl border transition-all flex items-center gap-3 text-left ${bgColor}`}>
                    <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                        isCorrect ? 'bg-emerald-600 text-white' : 
                        isUserSelection ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {key}
                    </div>
                    <span className={`text-sm leading-snug flex-1 ${textColor}`}>{val}</span>
                    {icon}
                  </div>
                );
              })}
            </div>

            {/* AI Explanation */}
            <div className="mt-8 bg-blue-50/50 p-6 rounded-xl border border-blue-100/50">
              <div className="flex items-center gap-2 mb-3 text-blue-600">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Expert Explanation</span>
              </div>
              <p className="text-[13px] text-blue-900/80 leading-relaxed font-medium">
                 {question.correct_answer_explanation || "No explanation provided for this variant."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function AnalysisModal({ examId, onClose, onStartRemediation }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remedyCount, setRemedyCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState({});
  const [reviewQuestion, setReviewQuestion] = useState(null);
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const examData = await examService.getExam(examId);
        if (!examData) return;

        const allAnswers = [...(examData.module1_answers || []), ...(examData.module2_answers || [])];
        const questionIds = allAnswers.map(a => a.question_id);
        const questions = await examService.getQuestions(questionIds);

        // Merge questions with answers for review
        const fullAnswers = allAnswers.map(ans => {
          const q = questions.find(q => q.id === ans.question_id);
          return { ...ans, question_id: q };
        });

        // Compute topic analysis
        const stats = {};
        fullAnswers.forEach(ans => {
          if (!ans.question_id) return;
          const topic = ans.question_id.topic || 'General';
          if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
          stats[topic].total++;
          if (ans.is_correct) stats[topic].correct++;
        });

        const topicAnalysis = Object.keys(stats).map(topic => ({
          topic,
          accuracy: Math.round((stats[topic].correct / stats[topic].total) * 100),
          correct: stats[topic].correct,
          total: stats[topic].total
        }));

        const raw_score = fullAnswers.filter(a => a.is_correct).length;

        setAnalysis({
          ...examData,
          answers: fullAnswers,
          topicAnalysis,
          raw_score: raw_score || 0
        });

        if (examData.deep_analysis) {
          setDeepAnalysis(examData.deep_analysis);
        }

        const initialSelected = {};
        topicAnalysis.forEach(t => {
          if (t.accuracy < 70) initialSelected[t.topic] = true;
        });
        setSelectedTopics(initialSelected);
        setLoading(false);
      } catch (err) {
        console.error("Analysis Load Error:", err);
      }
    };

    loadAnalysis();
  }, [examId]);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  const handleGenerateDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const domainsText = analysis.topicAnalysis.map(t => 
        `- ${t.topic}: ${t.correct}/${t.total} (${t.accuracy}%)`
      ).join('\n');

      const promptText = `
        You are an elite SAT Private Tutor (1600 scorer). Analyze this student's diagnostic exam results.
        
        STUDENT PROFILE:
        - Exam Title: ${analysis.title}
        - Estimated Score: ${analysis.total_score}
        - Raw Score: ${analysis.module1_score + analysis.module2_score} / 66
        
        DOMAIN PERFORMANCE:
        ${domainsText}

        INSTRUCTIONS:
        Provide a personalized, professional 3-paragraph strategy coach report in English.
        Tone: Encouraging, deeply analytical, authoritative, and strategic.
      `;

      const finalPrompt = `
        Generate the tutor analysis requested above, but return it in this JSON format:
        { "feedback": "<The 3-paragraph report here, using newline characters for formatting>" }
        
        PROMPT:
        ${promptText}
      `;

      const { data } = await callGPT(finalPrompt, { model: 'gpt-4o-mini' });
      const feedback = data.feedback;

      await examService.updateExam(examId, { deep_analysis: feedback });
      setDeepAnalysis(feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartRemediation = async () => {
    const topicsToPractice = Object.keys(selectedTopics).filter(t => selectedTopics[t]);
    if (topicsToPractice.length === 0) return alert('Please select at least one topic to practice.');

    setSubmitting(true);
    try {
      // In a real serverless app, we'd start generating questions here but for now 
      // we'll simulate the "Launch Practice" by creating a new module exam shell
      const newPractice = await examService.createExam({
        title: `Practice: ${topicsToPractice.join(', ')}`,
        exam_type: 'module',
        status: 'generating',
        topics: topicsToPractice,
        remedyCount
      });

      // We'd ideally have a function for targeted generation too
      // For now, onStartRemediation will handle UI transition
      onClose();
      onStartRemediation();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-3xl p-16 text-center shadow-xl">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Analyzing...</p>
      </div>
    </div>
  );

  const weakTopics = analysis.topicAnalysis.filter(t => t.accuracy < 70);
  const strongTopics = analysis.topicAnalysis.filter(t => t.accuracy >= 70);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-end gap-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Diagnostic Result Analysis</h2>
            <span className="text-slate-400 font-bold text-sm leading-none border-l pl-4 border-slate-200">{analysis.title}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 lg:p-6 bg-[#fafbfc] custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto">
            
            {/* Left Col: Analytics & Grid */}
            <div className="lg:col-span-7 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-900 flex flex-col items-center justify-center relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-slate-200 to-slate-300"></div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5 text-center">Overall Accuracy</p>
                  <p className="text-4xl font-black tabular-nums tracking-tighter text-slate-800">{Math.round((analysis.raw_score / 66) * 100)}%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{analysis.raw_score} / 66 Correct</p>
                </div>
                <div className="bg-white p-5 rounded-[24px] border border-blue-100/60 shadow-[0_8px_30px_rgb(59,130,246,0.06)] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)]">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-1.5 text-center">Projected Score</p>
                  <p className="text-4xl font-black text-blue-600 tabular-nums tracking-tighter">{analysis.total_score}</p>
                  <p className="text-[9px] font-bold text-blue-400/70 uppercase tracking-widest mt-1.5">SAT Scaled</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                    <Sparkles size={12} className="text-amber-500" /> Executive Analysis
                  </h3>
                  {!deepAnalysis && !isAnalyzing && (
                    <button 
                      onClick={handleGenerateDeepAnalysis}
                      className="text-[9px] items-center gap-1.5 font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 flex"
                    >
                      <Zap size={10} className="text-amber-400" /> Deep Insight
                    </button>
                  )}
                </div>

                {isAnalyzing ? (
                  <div className="py-8 flex flex-col items-center justify-center animate-pulse">
                    <Loader2 className="animate-spin text-slate-400 mb-3" size={20} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">AI Tutor is processing...</p>
                  </div>
                ) : deepAnalysis ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-[#fafbfc] p-5 rounded-2xl border border-slate-100">
                       <p className="text-[12px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {deepAnalysis}
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-5 text-center">
                    <p className="text-[11px] text-slate-400 font-medium">Click "Deep Insight" to unlock a personalized 1600-scorer strategy analysis.</p>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                      <LayoutGrid size={12} className="text-indigo-500" /> Question Map
                   </h3>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Click to Review</span>
                </div>
                <div className="grid grid-cols-10 sm:grid-cols-11 gap-2">
                  {analysis.answers.map((ans, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setReviewQuestion(ans)}
                      className={`aspect-square w-7 h-7 sm:w-auto sm:h-auto rounded-full flex items-center justify-center mx-auto w-full font-bold text-[10px] transition-all relative hover:scale-[1.15] active:scale-95 shadow-sm border border-transparent ${
                        ans.is_correct ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-400' : 
                        ans.selected_option ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/20 hover:bg-rose-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Topic Selection & Remediation */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 mb-5 flex items-center gap-2">
                  <Target size={12} className="text-blue-500"/> Domain Mastery
                </h3>
                
                <div className="space-y-5">
                  {/* Focus areas list */}
                  {weakTopics.length > 0 && (
                     <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Opportunities
                        </p>
                        {weakTopics.map(t => (
                           <div key={t.topic} onClick={() => toggleTopic(t.topic)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedTopics[t.topic] ? 'border-blue-500 bg-blue-50/40 shadow-[0_4px_12px_rgb(59,130,246,0.08)]' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                              <div className="flex items-center gap-3">
                                 <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${selectedTopics[t.topic] ? 'bg-blue-500' : 'bg-slate-200'}`}>
                                    {selectedTopics[t.topic] && <CheckCircle2 size={10} className="text-white"/>}
                                 </div>
                                 <span className="text-[11px] font-bold text-slate-800 leading-tight">{t.topic}</span>
                              </div>
                              <span className="text-[11px] font-black text-rose-500 tabular-nums">{t.accuracy}%</span>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Mastered topics list */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-2 mt-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Mastered
                    </p>
                    {strongTopics.map(t => (
                      <div key={t.topic} onClick={() => toggleTopic(t.topic)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedTopics[t.topic] ? 'border-blue-500 bg-blue-50/40 shadow-[0_4px_12px_rgb(59,130,246,0.08)]' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${selectedTopics[t.topic] ? 'bg-blue-500' : 'bg-slate-200'}`}>
                              {selectedTopics[t.topic] && <CheckCircle2 size={10} className="text-white"/>}
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 leading-tight">{t.topic}</span>
                        </div>
                        <span className="text-[11px] font-black text-emerald-500 tabular-nums">{t.accuracy}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative bg-slate-900 p-6 rounded-[32px] text-white overflow-hidden shadow-[0_20px_40px_rgb(15,23,42,0.2)]">
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                      <Zap size={14} className="text-blue-400" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Targeted Practice</h3>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 font-medium mb-5 leading-relaxed max-w-[90%]">
                    Deploy an adaptive module focused entirely on your selected domains.
                  </p>
                  
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Q-Count</span>
                    <span className="text-2xl font-black text-white tabular-nums">{remedyCount}</span>
                  </div>
                  
                  <input 
                    type="range" min="5" max="30" step="5" 
                    value={remedyCount} 
                    onChange={(e) => setRemedyCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 mb-6"
                  />

                  <button 
                    onClick={handleStartRemediation}
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-95 shadow-[0_0_15px_rgb(59,130,246,0.3)] disabled:opacity-50 tracking-wide"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                    Launch Practice
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {reviewQuestion && (
        <QuestionDetailOverlay 
          question={reviewQuestion.question_id} 
          userAnswer={reviewQuestion}
          onClose={() => setReviewQuestion(null)}
        />
      )}
    </div>
  );
}

export default AnalysisModal;

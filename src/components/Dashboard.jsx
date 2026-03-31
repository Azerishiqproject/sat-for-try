import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Target, History, Sparkles, Zap, Award, TrendingUp, Calendar } from 'lucide-react';
import ExamPlayer from './ExamPlayer';
import AnalysisModal from './AnalysisModal';
import ExamHubView from './views/ExamHubView';
import CustomPracticeView from './views/CustomPracticeView';
import HistoryView from './views/HistoryView';
import { examService } from '../services/examService';


function Dashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExamId, setActiveExamId] = useState(null);
  
  // Tab Routing State
  const [activeTab, setActiveTab] = useState('hub'); // 'hub', 'custom', 'history'

  const [showOverlay, setShowOverlay] = useState(false);
  const [showAnalysisId, setShowAnalysisId] = useState(null);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Real-time subscription to exam list
    const unsubscribeExams = examService.subscribeToExams(setExams);
    
    // Real-time subscription to global stats (Cost tracking)
    const unsubscribeStats = examService.getGlobalStats((stats) => {
      setTotalCost(stats.total_cost || 0);
    });
    
    return () => {
      unsubscribeExams();
      unsubscribeStats();
    };
  }, []);


  const handleCreateFullExam = async () => {
    const pw = prompt("Please enter the launch code to start AI generation:");
    if (pw !== "11111") {
      alert("Invalid code. Access denied.");
      return;
    }
    
    try {
      const newExam = await examService.createExam({
        title: `Full SAT Diagnostic #${exams.length + 1}`,
        exam_type: 'full',
        status: 'generating'
      });
      
      // Start generating in background (client-side)
      examService.generateFullExam(newExam.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExam = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this exam?')) return;
    try {
      await examService.deleteExam(id);
    } catch (err) { console.error('Delete error:', err); }
  };

  const handlePlayExam = async (id) => {
    try {
      const exam = await examService.getExam(id);
      if (!exam) return;

      // If it's a master exam (not an attempt), start a fresh attempt
      if (!exam.is_attempt) {
        const attempt = await examService.startAttempt(id);
        setActiveExamId(attempt.id);
      } else {
        // If it's already an attempt (e.g. continuing a paused one), just play
        setActiveExamId(id);
      }
    } catch (err) {
      console.error("Launch Error:", err);
    }
  };

  // Stats calculation
  const completedExams = exams.filter(e => e.status === 'completed');
  const avgScore = completedExams.length > 0 
    ? Math.round(completedExams.reduce((acc, curr) => acc + curr.total_score, 0) / completedExams.length) 
    : 0;

  // Master Exams (templates) go to the hub
  const hubExams = exams.filter(e => !e.is_attempt && e.exam_type === 'full' && e.status !== 'completed');
  // Custom Practice Master Exams
  const practiceExams = exams.filter(e => !e.is_attempt && e.exam_type === 'module' && e.status !== 'completed');
  
  // All finished attempts (Full or Custom) go to history
  const historyExams = exams.filter(e => e.is_attempt && e.status === 'completed');

  const generatingExam = exams.find(e => e.status && e.status.toString().startsWith('generating'));
  const progressPercent = generatingExam ? Math.min(Math.round((generatingExam.progress / 66) * 100), 100) : 0;

  if (activeExamId) {
    return (
      <ExamPlayer 
        examId={activeExamId} 
        onExit={(openAnalysis, id) => { 
          setActiveExamId(null); 
          if (openAnalysis) {
            setActiveTab('history');
            setShowAnalysisId(id);
          }
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f8fafc] text-slate-900 relative selection:bg-blue-100">
      
      {/* MICRO COST TRACKER (FIXED) */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none sm:pointer-events-auto flex flex-col gap-2 items-end">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 transition-all hover:bg-white">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-[10px]">$</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Spent</span>
            <span className="text-xs font-black text-slate-900 tabular-nums">${totalCost.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col p-5 lg:p-6 bg-opacity-70 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2 mb-6 lg:mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap className="text-white" size={16} />
          </div>
          <h2 className="text-xl font-black tracking-tighter italic">SAT HUB</h2>
        </div>

        <nav className="space-y-1.5 flex-1 flex flex-row lg:flex-col overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          <button 
            onClick={() => setActiveTab('hub')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all shrink-0 lg:w-full text-left ${
              activeTab === 'hub' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-sm">Full Exams</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('custom')}
             className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all shrink-0 lg:w-full text-left ${
              activeTab === 'custom' ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Target size={18} />
            <span className="text-sm">Custom Practice</span>
          </button>

          <button 
             onClick={() => setActiveTab('history')}
             className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all shrink-0 lg:w-full text-left ${
              activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <History size={18} />
            <span className="text-sm">Past Results</span>
          </button>
        </nav>

        {/* Global Stats Mini Card */}
        <div className="hidden lg:block mt-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <Award size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Global Stats</span>
          </div>
          <div className="space-y-3">
             <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase">Exams Completed</p>
               <p className="text-xl font-black text-slate-900">{completedExams.length}</p>
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase">Avg. Score</p>
               <p className="text-xl font-black text-emerald-500">{avgScore}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* DYNAMIC MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-5 lg:p-10 custom-scrollbar">
        {activeTab === 'hub' && (
          <ExamHubView 
            exams={hubExams} 
            loading={loading} 
            onCreateFull={handleCreateFullExam}
            onPlay={handlePlayExam}
            onReview={setShowAnalysisId}
            onDelete={handleDeleteExam}
          />
        )}

        {activeTab === 'custom' && (
          <CustomPracticeView 
            exams={practiceExams} 
            loading={loading} 
            onPlay={handlePlayExam}
            onReview={setShowAnalysisId}
            onDelete={handleDeleteExam}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView 
            exams={historyExams} 
            loading={loading} 
            onReview={setShowAnalysisId}
            onDelete={handleDeleteExam}
          />
        )}
      </main>

      {/* ANALYSIS MODAL */}
      {showAnalysisId && (
        <AnalysisModal 
          examId={showAnalysisId} 
          onClose={() => { setShowAnalysisId(null); }} 
          onStartRemediation={() => { 
            setShowAnalysisId(null); 
            setActiveTab('custom'); // Automatically switch to custom practice tab after generating one
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;

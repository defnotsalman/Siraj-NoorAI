import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Trophy, Calendar, ChevronRight, BookOpen } from 'lucide-react';

export default function QuizHistory() {
  const [records, setRecords] = useState([]);
  const [pendingStories, setPendingStories] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState(null);

  useEffect(() => {
    const savedRecords = JSON.parse(localStorage.getItem('quizRecords') || '[]');
    setRecords(savedRecords);

    async function loadPending() {
      const completedStories = JSON.parse(localStorage.getItem('completedStories') || '[]');
      const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
      const pendingIds = completedStories.filter(id => !completedQuizzes.includes(id));
      
      if (pendingIds.length > 0) {
        try {
          const res = await fetch('http://192.168.1.69:5000/api/stories');
          if (res.ok) {
            const allStories = await res.json();
            const pending = allStories.filter(s => pendingIds.includes(s.id));
            setPendingStories(pending);
          }
        } catch (e) {
          console.error("Failed to load pending story titles");
        }
      }
    }
    loadPending();
  }, []);

  // Group records by storyId
  const groupedRecords = records.reduce((acc, curr) => {
    if (!acc[curr.storyId]) {
      acc[curr.storyId] = [];
    }
    acc[curr.storyId].push(curr);
    return acc;
  }, {});

  const selectedAttempts = selectedStoryId ? groupedRecords[selectedStoryId] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Brain className="text-amber-500" />
          Quiz Records
        </h1>
        <p className="text-slate-400">View your past quiz scores and progress.</p>
      </div>

      {pendingStories.length > 0 && (
        <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse border border-amber-200"></span>
            Action Required: Pending Quizzes
          </h2>
          <div className="grid gap-3">
            {pendingStories.map(story => (
              <div key={story.id} className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{story.title}</h3>
                  <p className="text-sm text-amber-200/70 font-medium">You finished reading this story. Test your knowledge to earn XP!</p>
                </div>
                <Link 
                  to={`/quiz/${story.id}`}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-2.5 rounded-full font-bold shadow-lg transition-all hover:scale-105 shrink-0 text-center"
                >
                  Start Quiz
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && pendingStories.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-12 text-center flex flex-col items-center border border-white/5">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-amber-500 opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Quizzes Taken Yet</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Read a story and take the quiz at the end to earn XP and see your scores here!
          </p>
          <Link 
            to="/stories"
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-8 py-3 rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2"
          >
            <BookOpen size={18} /> Browse Stories
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(groupedRecords).map(([storyId, attempts]) => {
            const record = attempts[0]; // Most recent attempt
            const date = new Date(record.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            });
            
            const percent = Math.round((record.score / record.total) * 100);
            
            let gradeColor = "text-emerald-400";
            let bgGradient = "from-emerald-500/20 to-emerald-500/5";
            let borderColor = "border-emerald-500/20";
            
            if (percent < 50) {
              gradeColor = "text-rose-400";
              bgGradient = "from-rose-500/20 to-rose-500/5";
              borderColor = "border-rose-500/20";
            } else if (percent < 80) {
              gradeColor = "text-amber-400";
              bgGradient = "from-amber-500/20 to-amber-500/5";
              borderColor = "border-amber-500/20";
            }

            return (
              <div 
                key={storyId} 
                className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border transition-all ${borderColor} hover:bg-white/5 cursor-pointer`}
                onClick={() => setSelectedStoryId(storyId)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${bgGradient} border ${borderColor} flex items-center justify-center shrink-0`}>
                    <Trophy className={gradeColor} size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{record.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> Latest: {date}</span>
                      {attempts.length > 1 && (
                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold text-slate-300">
                          {attempts.length} Attempts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="text-center md:text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Latest Score</div>
                    <div className={`text-2xl font-black ${gradeColor}`}>
                      {record.score} <span className="text-slate-500 text-lg">/ {record.total}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStoryId(storyId);
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors border border-white/10"
                    title="View Details"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedStoryId && selectedAttempts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-bold text-white mb-1">{selectedAttempts[0].title}</h2>
            <p className="text-slate-400 mb-6">Quiz Attempt History</p>
            
            <div className="space-y-3 mb-8 overflow-y-auto pr-2 hide-scrollbar">
              {selectedAttempts.map((attempt, index) => {
                const tryNumber = selectedAttempts.length - index;
                const date = new Date(attempt.date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const percent = Math.round((attempt.score / attempt.total) * 100);
                let gradeColor = "text-emerald-400";
                if (percent < 50) gradeColor = "text-rose-400";
                else if (percent < 80) gradeColor = "text-amber-400";

                return (
                  <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200 mb-1">Try #{tryNumber}</div>
                      <div className="text-xs text-slate-500">{date}</div>
                    </div>
                    <div className={`text-xl font-black ${gradeColor}`}>
                      {attempt.score} <span className="text-slate-500 text-sm">/ {attempt.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-auto">
              <button 
                onClick={() => setSelectedStoryId(null)} 
                className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 px-4 py-3 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
              <Link 
                to={`/quiz/${selectedStoryId}`} 
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 text-slate-900 px-4 py-3 rounded-xl font-bold transition-all text-center shadow-lg"
              >
                Start Try #{selectedAttempts.length + 1}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

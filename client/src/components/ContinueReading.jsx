import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

function ContinueReading() {
  const { user } = useContext(AuthContext);
  const [lastOpened, setLastOpened] = useState(null);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`lastOpenedStory_${user.id}`);
      if (saved) {
        try {
          setLastOpened(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse last opened story");
        }
      }
    }
  }, [user]);

  if (!lastOpened) {
    return null; // Don't show if there's no story in progress
  }

  return (
    <div className="max-w-7xl mx-auto px-4 mt-12">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-400/20 p-2 rounded-xl text-amber-400">
          <BookOpen size={24} />
        </div>
        <h2 className="text-2xl text-white font-bold tracking-wide">
          Continue Reading
        </h2>
      </div>

      <div className="glass-panel hover:bg-white/10 transition-colors duration-300 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 group">
        
        {/* Book Cover Placeholder */}
        <div className="w-full md:w-32 h-40 bg-indigo-900/50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white/10">
          🕌
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl md:text-3xl text-amber-300 font-bold mb-2">
            {lastOpened.title}
          </h3>
          <p className="text-slate-300 font-medium mb-2">
            You have an unfinished adventure waiting for you!
          </p>
          
          <div className="inline-block bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-amber-400/30">
            In Progress
          </div>
        </div>

        <Link
          to={`/story/${lastOpened.id}`}
          className="w-full md:w-auto mt-4 md:mt-0 flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-amber-400 px-8 py-4 rounded-full font-bold transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
        >
          Continue <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}

export default ContinueReading;
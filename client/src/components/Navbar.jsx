import { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import UserMenu from "./Auth/UserMenu";
import { BookOpen, Sparkles, Brain, Home, BookHeart, Bookmark } from 'lucide-react';

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingQuizCount, setPendingQuizCount] = useState(0);

  useEffect(() => {
    const checkPending = () => {
      const completedStories = JSON.parse(localStorage.getItem('completedStories') || '[]');
      const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
      const pending = completedStories.filter(id => !completedQuizzes.includes(id));
      setPendingQuizCount(pending.length);
    };

    checkPending();
    window.addEventListener('focus', checkPending);
    // Also listen to local storage changes from other tabs/components
    window.addEventListener('storage', checkPending);
    return () => {
      window.removeEventListener('focus', checkPending);
      window.removeEventListener('storage', checkPending);
    };
  }, []);

  const navLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
      isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;
  };

  return (
    <nav className="sticky top-4 z-50 max-w-7xl mx-auto mt-4 px-4">
      <div className="glass-panel rounded-full px-6 py-4 flex justify-between items-center">
        
        <Link
          to="/"
          className="flex items-center gap-3 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 hover:scale-105 transition-transform duration-300"
        >
          <img 
            src="/logo.jpg" 
            alt="NoorKids" 
            className="w-10 h-10 rounded-[12px] shadow-lg object-cover"
          />
          NoorKids
        </Link>

        <div className="hidden md:flex gap-2 text-white items-center">
          {user ? (
            <>
              <Link to="/" className={navLinkClass("/")}>
                <Home size={18} /> Home
              </Link>
              <Link to="/stories" className={navLinkClass("/stories")}>
                <BookOpen size={18} /> Stories
              </Link>
              <Link to="/quran" className={navLinkClass("/quran")}>
                <BookHeart size={18} /> Quran
              </Link>
              <Link to="/bookmarks" className={navLinkClass("/bookmarks")}>
                <Bookmark size={18} /> Bookmarks
              </Link>
              <Link to="/quiz" className={`relative ${navLinkClass("/quiz")}`}>
                <Brain size={18} /> Quiz
                {pendingQuizCount > 0 && (
                  <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900 animate-pulse"></span>
                )}
              </Link>
              <div className="ml-4 pl-4 border-l border-white/10">
                <UserMenu />
              </div>
            </>
          ) : (
            <div className="flex gap-4 items-center">
              <Link to="/login" className="text-slate-300 hover:text-white px-4 py-2 transition font-bold">Log in</Link>
              <Link to="/register" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-6 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all font-bold">Sign up</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
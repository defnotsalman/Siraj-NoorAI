import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { logoutUser } from '../../services/auth';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';

export default function UserMenu() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-2 py-1.5 rounded-full transition-all duration-300 border-2 ${isOpen ? 'bg-white/10 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-transparent border-transparent hover:bg-white/5'}`}
      >
        <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-xl shadow-inner border border-white/10">
          {profile?.avatar || "👤"}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-200 font-bold hidden sm:block text-sm uppercase tracking-wide">{profile?.displayName || 'User'}</span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 hidden sm:block ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 z-50 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 mb-2 bg-white/5">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Signed in as</p>
            <p className="text-sm text-white font-bold truncate">{profile?.displayName || 'Hero'}</p>
          </div>
          
          <Link 
            to="/profile" 
            className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors group"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-900 transition-all">
              <User size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">My Profile</span>
          </Link>
          
          <div className="h-px bg-white/10 my-2 mx-4" />
          
          <button 
            onClick={handleLogout}
            className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-rose-400/10 text-rose-400 group-hover:scale-110 transition-all">
              <LogOut size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

import { Trophy, Medal, Flame, BookHeart, MoonStar, Lock } from "lucide-react";
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Achievements() {
  const { profile } = useContext(AuthContext);
  
  const stats = {
    stories: profile?.storiesRead || 0,
    streak: profile?.streak || 0
  };

  const badges = [
    { 
      text: "First Story", 
      icon: Medal, 
      color: "from-blue-500 to-indigo-500",
      unlocked: stats.stories >= 1,
      description: "Read 1 story"
    },
    { 
      text: "5 Day Streak", 
      icon: Flame, 
      color: "from-orange-400 to-red-500",
      unlocked: stats.streak >= 5,
      description: "5 day streak"
    },
    { 
      text: "Book Lover", 
      icon: BookHeart, 
      color: "from-pink-500 to-rose-500",
      unlocked: stats.stories >= 5,
      description: "Read 5 stories"
    },
    { 
      text: "Super Reader", 
      icon: MoonStar, 
      color: "from-amber-400 to-yellow-500",
      unlocked: stats.stories >= 10,
      description: "Read 10 stories"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-400/20 p-2 rounded-xl text-amber-400">
          <Trophy size={24} />
        </div>
        <h2 className="text-2xl text-white font-bold tracking-wide">
          Achievements
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className={`relative rounded-[2rem] p-6 pb-8 text-center transition-all duration-300 group flex flex-col items-center ${
                badge.unlocked 
                  ? "glass-card text-white hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(255,255,255,0.1)] cursor-pointer" 
                  : "bg-white/5 border border-white/10 text-slate-500 opacity-70 grayscale-[50%]"
              }`}
            >
              {!badge.unlocked && (
                <div className="absolute top-4 right-4 text-slate-500">
                  <Lock size={16} />
                </div>
              )}
              
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ${badge.unlocked ? "group-hover:scale-110 transition-transform duration-300" : "opacity-60"}`}>
                <Icon size={32} className="text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
              
              <h3 className={`font-bold tracking-wide text-sm md:text-base ${badge.unlocked ? "text-slate-200" : "text-slate-400"}`}>
                {badge.text}
              </h3>
              
              <div className="absolute bottom-3 left-0 w-full px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className={`text-[11px] font-medium ${badge.unlocked ? "text-emerald-400" : "text-rose-400"}`}>
                  {badge.unlocked ? "Unlocked!" : badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Achievements;
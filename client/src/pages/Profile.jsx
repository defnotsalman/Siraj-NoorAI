import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { logoutUser } from '../services/auth';
import { updateUserProfile } from '../services/profile';
import { User, LogOut, Edit3, Loader2, AlertCircle, Calendar, Globe, Save, X } from 'lucide-react';

const AVATARS = ["👦", "👧", "🦁", "🐢", "🐦", "🌙", "⭐", "🚀"];

function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [age, setAge] = useState(profile?.age || '');
  const [avatar, setAvatar] = useState(profile?.avatar || AVATARS[0]);
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || 'en');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!profile) {
    return (
      <div className="pt-32 px-4 pb-32 min-h-screen text-center text-white flex flex-col items-center justify-center">
        <Loader2 size={64} className="text-amber-400 animate-spin mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 animate-pulse">Loading Profile...</h2>
      </div>
    );
  }

  const validate = () => {
    const newErrors = {};
    if (!displayName.trim()) newErrors.displayName = "Name is required.";
    
    if (!age) newErrors.age = "Age is required.";
    else if (isNaN(age) || age < 3 || age > 18) newErrors.age = "Age must be between 3 and 18.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      await updateUserProfile(user.id, {
        displayName,
        age: Number(age),
        avatar,
        preferredLanguage
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setErrors({ global: "Failed to update profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 mt-6 md:mt-8 w-full max-w-2xl mx-auto flex flex-col justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="bg-slate-900/95 backdrop-blur-none rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative overflow-hidden group/card transition-all duration-500 hover:border-white/20 my-auto">
        
        {/* Modern Background Decor */}
        <div className="absolute top-0 right-0 -mt-32 -mr-32 w-96 h-96 rounded-full pointer-events-none transition-transform duration-1000 group-hover/card:scale-110" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0) 70%)' }} />
        <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-96 h-96 rounded-full pointer-events-none transition-transform duration-1000 group-hover/card:scale-110" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0) 70%)' }} />

        {/* Header Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <User size={20} className="text-amber-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight drop-shadow-sm">
              My Profile
            </h1>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-200 px-5 py-2.5 rounded-full hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300 font-bold text-sm shadow-lg group hover:scale-105"
            >
              <Edit3 size={16} className="group-hover:rotate-12 transition-transform duration-300" /> Edit Profile
            </button>
          )}
        </div>
        
        {errors.global && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl mb-6 text-sm flex items-start gap-3 relative z-10 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="font-medium">{errors.global}</p>
          </div>
        )}

        {!isEditing ? (
          <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Avatar Profile Section */}
            <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-28 h-28 md:w-32 md:h-32 mb-4 bg-slate-900/50 border-2 border-white/10 rounded-full shadow-2xl flex items-center justify-center text-5xl md:text-6xl group-hover:scale-105 group-hover:border-amber-400/50 transition-all duration-500 relative z-10">
                <span className="transform group-hover:-rotate-12 transition-transform duration-500 inline-block">{profile.avatar}</span>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-1.5 rounded-full border-[3px] border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                  <Edit3 size={14} className="font-bold" />
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-white tracking-tight drop-shadow-md text-center">{profile.displayName}</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-5 w-full max-w-xl">
              <div className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-[1.5rem] text-center shadow-xl hover:bg-white/10 hover:border-amber-400/30 transition-colors duration-300 group flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Age</span>
                  <span className="text-2xl font-black text-white">{profile.age}</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-[1.5rem] text-center shadow-xl hover:bg-white/10 hover:border-amber-400/30 transition-colors duration-300 group flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Globe size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Language</span>
                  <span className="text-2xl font-black text-white">{profile.preferredLanguage === 'ur' ? 'Urdu' : 'English'}</span>
                </div>
              </div>
            </div>
            
            {/* Logout Button */}
            <div className="w-full max-w-xl mt-8 pt-6 border-t border-white/10">
              <button 
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 py-3 md:py-4 rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300 font-bold text-base shadow-lg group hover:shadow-[0_0_20px_rgba(243,24,96,0.4)]"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign Out from Account
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Avatar Selector */}
            <div className="bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-[2rem] mb-2 shadow-inner">
              <label className="flex items-center gap-2 text-sm font-bold mb-6 text-slate-300 uppercase tracking-widest">
                <User size={16} className="text-amber-400" /> Choose Your Avatar
              </label>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-3 sm:gap-4 justify-center">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-3xl sm:text-4xl aspect-square sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                      avatar === emoji 
                        ? 'bg-amber-400 border-2 border-amber-400 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.5)] transform -translate-y-1' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Input */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide group-focus-within:text-amber-400 transition-colors">Hero Name</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.displayName ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-amber-400'}`}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full pl-11 pr-4 py-4 rounded-2xl bg-white/5 border ${errors.displayName ? 'border-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.2)]' : 'border-white/10'} focus:outline-none focus:border-amber-400 focus:bg-white/10 text-white placeholder-slate-500 transition-all duration-300 shadow-inner text-lg font-medium`}
                  />
                </div>
                {errors.displayName && <p className="text-rose-400 text-sm mt-2 font-bold ml-2 animate-in fade-in slide-in-from-top-1">{errors.displayName}</p>}
              </div>
              
              {/* Age Input */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide group-focus-within:text-amber-400 transition-colors">Your Age</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.age ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-amber-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="E.g., 7"
                    className={`w-full pl-11 pr-4 py-4 rounded-2xl bg-white/5 border ${errors.age ? 'border-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.2)]' : 'border-white/10'} focus:outline-none focus:border-amber-400 focus:bg-white/10 text-white placeholder-slate-500 transition-all duration-300 shadow-inner text-lg font-medium`}
                  />
                </div>
                {errors.age && <p className="text-rose-400 text-sm mt-2 font-bold ml-2 animate-in fade-in slide-in-from-top-1">{errors.age}</p>}
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-[2rem] mt-2 shadow-inner">
              <label className="flex items-center gap-2 text-sm font-bold mb-6 text-slate-300 uppercase tracking-widest">
                <Globe size={16} className="text-emerald-400" /> Story Language
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* English Option */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${preferredLanguage === 'en' ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${preferredLanguage === 'en' ? 'border-amber-400' : 'border-slate-500'}`}>
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${preferredLanguage === 'en' ? 'bg-amber-400 scale-100' : 'bg-transparent scale-0'}`} />
                    </div>
                    <span className="font-bold text-lg text-white">English</span>
                  </div>
                  <span className="text-2xl">🇬🇧</span>
                  <input 
                    type="radio" 
                    name="language" 
                    value="en" 
                    checked={preferredLanguage === 'en'}
                    onChange={() => setPreferredLanguage('en')}
                    className="hidden"
                  />
                </label>
                
                {/* Urdu Option */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${preferredLanguage === 'ur' ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${preferredLanguage === 'ur' ? 'border-emerald-400' : 'border-slate-500'}`}>
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${preferredLanguage === 'ur' ? 'bg-emerald-400 scale-100' : 'bg-transparent scale-0'}`} />
                    </div>
                    <span className="font-bold text-lg text-white font-nastaliq">Urdu (اردو)</span>
                  </div>
                  <span className="text-2xl">🇵🇰</span>
                  <input 
                    type="radio" 
                    name="language" 
                    value="ur" 
                    checked={preferredLanguage === 'ur'}
                    onChange={() => setPreferredLanguage('ur')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse md:flex-row gap-4 mt-6 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setDisplayName(profile.displayName);
                  setAge(profile.age);
                  setAvatar(profile.avatar);
                  setPreferredLanguage(profile.preferredLanguage);
                  setErrors({});
                  setIsEditing(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 py-4 rounded-2xl hover:bg-slate-700 hover:text-white transition-all font-bold text-lg group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 py-4 rounded-2xl hover:scale-[1.02] transition-transform font-bold text-lg shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Saving Hero Profile...</>
                ) : (
                  <><Save size={20} /> Save Hero Profile</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
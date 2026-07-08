import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { logoutUser } from '../services/auth';
import { updateUserProfile } from '../services/profile';
import { User, LogOut, Edit3, Loader2, AlertCircle } from 'lucide-react';

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
      <div className="pt-32 px-4 pb-32 text-center text-white flex flex-col items-center justify-center">
        <Loader2 size={64} className="text-amber-400 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-amber-300">Profile loading...</h2>
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
    <div className="pt-10 md:pt-16 px-4 pb-32 max-w-3xl mx-auto">
      <div className="glass-panel rounded-[3rem] p-8 md:p-12 text-white border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-amber-400/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex justify-between items-center mb-10 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-tight">
            My Profile
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-slate-200 px-5 py-2.5 rounded-full hover:bg-white/20 transition-all font-bold text-sm shadow-md"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          )}
        </div>
        
        {errors.global && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-8 text-sm flex items-start gap-3 relative z-10">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{errors.global}</p>
          </div>
        )}

        {!isEditing ? (
          <div className="flex flex-col items-center relative z-10">
            <div className="w-40 h-40 mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-inner flex items-center justify-center text-7xl hover:scale-105 transition-transform duration-500">
              {profile.avatar}
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-8 text-white">{profile.displayName}</h2>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-2 w-full max-w-lg">
              <div className="flex-1 min-w-[120px] bg-white/5 border border-white/10 p-6 rounded-3xl text-center shadow-lg">
                <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Age</span>
                <span className="text-3xl font-black text-amber-300">{profile.age}</span>
              </div>
              <div className="flex-1 min-w-[120px] bg-white/5 border border-white/10 p-6 rounded-3xl text-center shadow-lg">
                <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Language</span>
                <span className="text-3xl font-black text-amber-300">{profile.preferredLanguage === 'ur' ? 'Urdu' : 'English'}</span>
              </div>
            </div>
            
            <div className="w-full max-w-lg mt-12 pt-8 border-t border-white/10">
              <button 
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 py-4 rounded-full hover:bg-rose-500/20 transition-all font-bold text-lg"
              >
                <LogOut size={20} /> Log Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6 relative z-10">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-4">
              <label className="block text-sm font-bold mb-4 text-center text-slate-300 uppercase tracking-widest">Choose Avatar</label>
              <div className="flex flex-wrap gap-3 justify-center">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-4xl w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                      avatar === emoji 
                        ? 'bg-amber-400/20 border-2 border-amber-400 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-transparent border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border ${errors.displayName ? 'border-rose-400' : 'border-white/10'} focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300`}
                  />
                </div>
                {errors.displayName && <p className="text-rose-400 text-xs mt-2 font-bold ml-1">{errors.displayName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-full px-5 py-3.5 rounded-2xl bg-white/5 border ${errors.age ? 'border-rose-400' : 'border-white/10'} focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300`}
                />
                {errors.age && <p className="text-rose-400 text-xs mt-2 font-bold ml-1">{errors.age}</p>}
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mt-2">
              <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Language</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${preferredLanguage === 'en' ? 'border-amber-400' : 'border-slate-500 group-hover:border-slate-400'}`}>
                    <div className={`w-3 h-3 rounded-full transition-colors ${preferredLanguage === 'en' ? 'bg-amber-400' : 'bg-transparent'}`} />
                  </div>
                  <input 
                    type="radio" 
                    name="language" 
                    value="en" 
                    checked={preferredLanguage === 'en'}
                    onChange={() => setPreferredLanguage('en')}
                    className="hidden"
                  />
                  <span className="font-bold text-lg text-white">English</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${preferredLanguage === 'ur' ? 'border-amber-400' : 'border-slate-500 group-hover:border-slate-400'}`}>
                    <div className={`w-3 h-3 rounded-full transition-colors ${preferredLanguage === 'ur' ? 'bg-amber-400' : 'bg-transparent'}`} />
                  </div>
                  <input 
                    type="radio" 
                    name="language" 
                    value="ur" 
                    checked={preferredLanguage === 'ur'}
                    onChange={() => setPreferredLanguage('ur')}
                    className="hidden"
                  />
                  <span className="font-bold text-lg text-white font-nastaliq">Urdu (اردو)</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-4 mt-8 pt-8 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-white/5 border border-white/20 text-white py-4 rounded-full hover:bg-white/10 transition-colors font-bold text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 py-4 rounded-full hover:scale-[1.02] transition-transform font-bold text-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
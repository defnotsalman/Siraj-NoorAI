import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Bot, Trophy, ArrowRight, ShieldCheck, Heart, Star, MessageSquare, HelpCircle, ChevronDown, X } from 'lucide-react';

export default function Landing() {
  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 5, text: '' });
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          console.error("Reviews API did not return an array:", data);
        }
      })
      .catch(err => console.error("Error fetching reviews:", err));
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitStatus('submitting');
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      if (res.ok) {
        setReviewSubmitStatus('success');
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSubmitStatus(null);
          setReviewForm({ name: '', email: '', rating: 5, text: '' });
        }, 2000);
      } else {
        setReviewSubmitStatus('error');
      }
    } catch (err) {
      setReviewSubmitStatus('error');
    }
  };
  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200 animate-in fade-in duration-500">
      
      {/* Background Magic Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
      </div>

      {/* Full-width Sticky Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-1000 ease-out">
        <nav className="flex items-center justify-between w-full px-6 md:px-10 lg:px-16 py-3 sm:py-4">
          
          {/* Logo Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.jpg" 
              alt="NoorKids Logo" 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-white/20 hover:scale-105 transition-transform"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md hidden sm:block">NoorKids</span>
          </div>

          {/* Center Links (Desktop only) */}
          <div className="hidden md:flex items-center gap-8 text-sm sm:text-base font-medium text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How it Works</a>
            <a href="#mission" className="hover:text-amber-400 transition-colors">Our Mission</a>
            <a href="mailto:support@noorkids.com" className="hover:text-amber-400 transition-colors">Contact Us</a>
          </div>

          {/* Auth Side */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors text-sm sm:text-base px-2">Log In</Link>
            <Link to="/register" className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] text-sm sm:text-base hover:scale-105 whitespace-nowrap">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-32 overflow-x-hidden">
        
        {/* HERO SECTION */}
        <div className="pt-28 pb-16 sm:pt-36 sm:pb-24 md:pt-44 md:pb-36 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-xs sm:text-sm mb-6 sm:mb-8 shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-in slide-in-from-bottom-4 fade-in duration-700 ease-out fill-mode-both delay-100">
            <Sparkles size={14} className="animate-pulse sm:w-4 sm:h-4" /> A New Way to Learn
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500 tracking-tight leading-[1.15] md:leading-[1.1] mb-6 sm:mb-8 drop-shadow-2xl max-w-5xl animate-in slide-in-from-bottom-6 fade-in duration-700 ease-out fill-mode-both delay-300">
            A Magical Journey Through Islamic Stories.
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl text-slate-400 max-w-2xl mb-8 sm:mb-12 leading-relaxed font-medium px-2 animate-in slide-in-from-bottom-6 fade-in duration-700 ease-out fill-mode-both delay-500">
            Immerse your children in beautifully written tales, interactive quizzes, and a safe AI companion that makes learning about Islam an unforgettable adventure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both delay-700 px-4 sm:px-0">
            <Link 
              to="/register" 
              className="group relative flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full font-black text-base sm:text-lg md:text-xl shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] transition-all hover:-translate-y-1 w-full sm:w-auto"
            >
              Start Reading for Free 
              <ArrowRight className="group-hover:translate-x-1 transition-transform w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          </div>
          
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-500 animate-in fade-in duration-1000 ease-out fill-mode-both delay-1000">
            <div className="flex items-center gap-1.5 sm:gap-2"><ShieldCheck size={16} className="text-emerald-400 sm:w-[18px] sm:h-[18px]" /> 100% Kid Safe</div>
            <div className="flex items-center gap-1.5 sm:gap-2"><Heart size={16} className="text-rose-400 sm:w-[18px] sm:h-[18px]" /> Loved by Parents</div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-20 sm:mb-32 relative">
          
          {/* Card 1 */}
          <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl hover:bg-white/[0.05] hover:-translate-y-2 group transition-all duration-500 animate-in slide-in-from-bottom-12 fade-in duration-1000 ease-out delay-[1000ms] fill-mode-both flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform">
              <BookOpen size={28} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Captivating Stories</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
              A growing library of beautifully written, age-appropriate stories covering Prophets, Sahaba, and core Islamic morals.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl hover:bg-white/[0.05] hover:-translate-y-2 group transition-all duration-500 animate-in slide-in-from-bottom-12 fade-in duration-1000 ease-out delay-[1200ms] fill-mode-both flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
              <Trophy size={28} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Earn XP & Badges</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
              Gamified learning keeps kids motivated! Take quizzes after every story to earn XP, maintain daily streaks, and unlock achievements.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl hover:bg-white/[0.05] hover:-translate-y-2 group transition-all duration-500 animate-in slide-in-from-bottom-12 fade-in duration-1000 ease-out delay-[1400ms] fill-mode-both flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(217,70,239,0.2)] group-hover:scale-110 transition-transform">
              <Bot size={28} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Interactive AI Guide</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
              Have a question about a story? Our safe, custom-tuned AI companion is always ready to explain Islamic concepts in a kid-friendly way.
            </p>
          </div>

        </div>

        {/* HOW IT WORKS SECTION */}
        <div id="how-it-works" className="mb-20 sm:mb-32 relative text-center pt-20 -mt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs sm:text-sm mb-4 sm:mb-6 animate-in fade-in duration-1000 ease-out fill-mode-both">
            Simple & Effective
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-10 sm:mb-16 animate-in slide-in-from-bottom-6 fade-in duration-1000 ease-out fill-mode-both">
            How NoorKids Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-8 relative max-w-4xl mx-auto px-4 sm:px-0">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-100 fill-mode-both">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a1128] border-4 border-[#1e293b] flex items-center justify-center text-xl sm:text-2xl font-black text-indigo-400 mb-4 sm:mb-6 shadow-xl">1</div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Read a Story</h4>
              <p className="text-slate-400 text-sm max-w-[250px] sm:max-w-xs">Immerse in beautifully written, values-based Islamic tales tailored for children.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-300 fill-mode-both">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a1128] border-4 border-[#1e293b] flex items-center justify-center text-xl sm:text-2xl font-black text-amber-400 mb-4 sm:mb-6 shadow-xl">2</div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Take the Quiz</h4>
              <p className="text-slate-400 text-sm max-w-[250px] sm:max-w-xs">Test comprehension and reinforce learning with engaging interactive quizzes.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-500 fill-mode-both">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a1128] border-4 border-[#1e293b] flex items-center justify-center text-xl sm:text-2xl font-black text-emerald-400 mb-4 sm:mb-6 shadow-xl">3</div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Earn Rewards</h4>
              <p className="text-slate-400 text-sm max-w-[250px] sm:max-w-xs">Gain XP, build reading streaks, and unlock amazing achievement badges!</p>
            </div>
          </div>
        </div>

        {/* ABOUT US SECTION */}
        <div id="mission" className="mb-10 sm:mb-16 pt-20 -mt-20">
          <div className="glass-panel rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 md:p-16 relative overflow-hidden flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-12 animate-in slide-in-from-bottom-12 fade-in duration-1000 ease-out fill-mode-both">
            {/* Decorative background glow */}
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
            
            <div className="flex-1 relative z-10 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-6 font-medium">
                At <span className="text-amber-400 font-bold">NoorKids</span>, we believe that learning about Islam should be the most exciting part of a child's day. 
              </p>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                In today's digital age, children are surrounded by endless entertainment. We built NoorKids to provide a safe, engaging, and premium digital environment where modern technology (like our custom AI guide) meets timeless Islamic values. Our goal is to nurture a lifelong love for the Deen in the hearts of the next generation.
              </p>
            </div>
            
            <div className="flex-1 relative z-10 flex justify-center w-full">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-amber-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <img 
                  src="/logo.jpg" 
                  alt="NoorKids About" 
                  className="relative z-10 w-full h-full object-cover rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TESTIMONIALS SECTION */}
        <div id="reviews" className="mb-10 sm:mb-16 relative pt-20 -mt-20">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 sm:mb-16 gap-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-4 sm:mb-6 animate-in fade-in duration-1000 ease-out fill-mode-both">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs sm:text-sm">
                  <MessageSquare size={16} /> What Parents Say
                </div>
                <button 
                  onClick={() => setIsReviewModalOpen(true)}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-4 py-2 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap"
                >
                  Write a Review
                </button>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                Loved by Families Worldwide
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Default Hardcoded Reviews */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-100 fill-mode-both">
              <div className="flex gap-1 mb-4 text-amber-400">
                {[1,2,3,4,5].map(star => <Star key={star} size={18} fill="currentColor" />)}
              </div>
              <p className="text-slate-300 mb-6 italic leading-relaxed">"My son used to spend hours on random YouTube videos. Now he asks to log into NoorKids every single day. The AI companion is incredibly smart and safe!"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">FA</div>
                <div>
                  <h4 className="text-white font-bold text-sm">Fatima A.</h4>
                  <p className="text-slate-500 text-xs">Mother of 2</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-300 fill-mode-both">
              <div className="flex gap-1 mb-4 text-amber-400">
                {[1,2,3,4,5].map(star => <Star key={star} size={18} fill="currentColor" />)}
              </div>
              <p className="text-slate-300 mb-6 italic leading-relaxed">"The gamification is brilliant. Earning badges for answering questions about the Prophets has completely transformed how my kids view Islamic studies."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold">OY</div>
                <div>
                  <h4 className="text-white font-bold text-sm">Omar Y.</h4>
                  <p className="text-slate-500 text-xs">Father of 3</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-500 fill-mode-both">
              <div className="flex gap-1 mb-4 text-amber-400">
                {[1,2,3,4,5].map(star => <Star key={star} size={18} fill="currentColor" />)}
              </div>
              <p className="text-slate-300 mb-6 italic leading-relaxed">"Finally, a premium, modern app that doesn't compromise on Islamic values. It's beautiful, fast, and my daughter absolutely loves the interactive stories."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 font-bold">SA</div>
                <div>
                  <h4 className="text-white font-bold text-sm">Sarah A.</h4>
                  <p className="text-slate-500 text-xs">Mother of 1</p>
                </div>
              </div>
            </div>

            {/* Dynamic Approved Reviews */}
            {Array.isArray(reviews) && reviews.map((review, idx) => (
              <div key={idx} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out fill-mode-both" style={{ animationDelay: `${700 + (idx * 200)}ms` }}>
                <div className="flex gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} className={i >= review.rating ? "text-slate-600" : ""} />)}
                </div>
                <p className="text-slate-300 mb-6 italic leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{review.name}</h4>
                    <p className="text-slate-500 text-xs">Verified Parent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ SECTION */}
        <div id="faq" className="mb-10 sm:mb-16 relative pt-20 -mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300 font-bold text-xs sm:text-sm mb-4 sm:mb-6 animate-in fade-in duration-1000 ease-out fill-mode-both">
              <HelpCircle size={16} /> Got Questions?
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4 text-left">
            <details className="group glass-panel rounded-2xl border border-white/10 bg-white/[0.02] animate-in slide-in-from-bottom-4 fade-in duration-1000 ease-out fill-mode-both cursor-pointer overflow-hidden transition-all duration-300">
              <summary className="flex items-center justify-between text-base sm:text-lg font-bold text-white p-6 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
                Is the AI Guide safe for my children?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">Absolutely. Our AI is highly constrained and custom-tuned specifically for NoorKids. It will only answer questions related to Islamic history, morals, and the stories provided, refusing any inappropriate or off-topic queries.</p>
              </div>
            </details>
            
            <details className="group glass-panel rounded-2xl border border-white/10 bg-white/[0.02] animate-in slide-in-from-bottom-4 fade-in duration-1000 ease-out delay-100 fill-mode-both cursor-pointer overflow-hidden transition-all duration-300">
              <summary className="flex items-center justify-between text-base sm:text-lg font-bold text-white p-6 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
                What age group is this app designed for?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">NoorKids is designed to be accessible and engaging for children ages 5 to 12. The interactive stories use simple language, while the quizzes adapt to challenge older children appropriately.</p>
              </div>
            </details>
            
            <details className="group glass-panel rounded-2xl border border-white/10 bg-white/[0.02] animate-in slide-in-from-bottom-4 fade-in duration-1000 ease-out delay-200 fill-mode-both cursor-pointer overflow-hidden transition-all duration-300">
              <summary className="flex items-center justify-between text-base sm:text-lg font-bold text-white p-6 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
                Do I need an active internet connection?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">Yes, an active internet connection is required to interact with the AI guide, update your progress streaks, and fetch new stories from our ever-growing library.</p>
              </div>
            </details>
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="group pt-4 pb-4 sm:pt-8 sm:pb-8 text-center relative animate-in fade-in duration-1000 ease-out delay-[1600ms] fill-mode-both w-full">
          {/* Subtle Background Glow behind the text instead of a box */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[300px] bg-indigo-500/10 rounded-[100%] blur-[120px] pointer-events-none"></div>
          
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 sm:mb-8 relative z-10 tracking-tighter">
            Ready to begin the adventure?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 mb-10 sm:mb-14 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed px-4">
            Join thousands of parents who trust <span className="text-amber-400 font-bold">NoorKids</span> to make Islamic education engaging, safe, and incredibly fun.
          </p>
          <div className="relative z-10 px-4 sm:px-0">
            <Link 
              to="/register" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-5 sm:px-12 sm:py-6 md:px-14 md:py-7 rounded-full font-black text-xl hover:scale-105 hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-all duration-300 group/btn"
            >
              Create Free Account
              <ArrowRight className="group-hover/btn:translate-x-2 transition-transform w-6 h-6 sm:w-8 sm:h-8" />
            </Link>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030305] pt-12 pb-8 animate-in fade-in duration-1000 delay-[1800ms] fill-mode-both">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center">
          
          {/* Logo & Brand Name */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <img 
              src="/logo.jpg" 
              alt="NoorKids" 
              className="w-12 h-12 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10"
            />
            <span className="text-2xl font-black text-white tracking-tight">NoorKids</span>
          </div>

          {/* Copyright */}
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} NoorKids App. Built with ❤️ for our Ummah.
          </p>

        </div>
      </footer>

      {/* REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="text-amber-400 w-5 h-5" fill="currentColor" /> Write a Review
              </h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {reviewSubmitStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Thank You!</h4>
                  <p className="text-slate-400">Your review has been submitted and is pending admin approval.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                      <input required type="text" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Rating</label>
                      <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})} className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors">
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                        <option value={3}>⭐⭐⭐ (3/5)</option>
                        <option value={2}>⭐⭐ (2/5)</option>
                        <option value={1}>⭐ (1/5)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                    <input required type="email" value={reviewForm.email} onChange={e => setReviewForm({...reviewForm, email: e.target.value})} className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="We won't share this publicly" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Your Review</label>
                    <textarea required rows={4} value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})} className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="Tell us what you love about NoorKids!"></textarea>
                  </div>
                  
                  {reviewSubmitStatus === 'error' && (
                    <p className="text-rose-400 text-sm">An error occurred. Please try again later.</p>
                  )}
                  
                  <div className="pt-2">
                    <button disabled={reviewSubmitStatus === 'submitting'} type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50">
                      {reviewSubmitStatus === 'submitting' ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

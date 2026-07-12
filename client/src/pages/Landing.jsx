import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Bot, Trophy, ArrowRight, ShieldCheck, Heart, Star, MessageSquare, HelpCircle, ChevronDown, X } from 'lucide-react';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const mockReviewsPool = [
  { id: 1, name: "Fatima A.", role: "Mother of 2", text: "My son used to spend hours on random YouTube videos. Now he asks to log into NoorKids every single day. The AI companion is incredibly smart and safe!", rating: 5, initial: "F" },
  { id: 2, name: "Omar Y.", role: "Father of 3", text: "The gamification is brilliant. Earning badges for answering questions about the Prophets has completely transformed how my kids view Islamic studies.", rating: 5, initial: "O" },
  { id: 3, name: "Sarah A.", role: "Mother of 1", text: "Finally, a premium, modern app that doesn't compromise on Islamic values. It's beautiful, fast, and my daughter absolutely loves the interactive stories.", rating: 5, initial: "S" },
  { id: 4, name: "Ahmed K.", role: "Father of 2", text: "A wonderful initiative. The stories are written beautifully and the audio narration is so soothing. Highly recommended for all Muslim parents.", rating: 5, initial: "A" },
  { id: 5, name: "Aisha M.", role: "Mother of 4", text: "NoorKids makes learning Islam so fun. My kids are actually competing to see who can finish more stories and get more XP!", rating: 4, initial: "A" },
  { id: 6, name: "Bilal H.", role: "Father of 1", text: "The AI companion is a game changer. It answers my son's questions patiently and always stays within the bounds of the story.", rating: 5, initial: "B" },
  { id: 7, name: "Zainab T.", role: "Mother of 2", text: "I love that there are no ads or popups. It's a completely safe environment where I don't have to look over their shoulder constantly.", rating: 5, initial: "Z" },
  { id: 8, name: "Tariq S.", role: "Uncle", text: "Gifted this to my nephews and they love it. The quizzes really help them remember the details of the Prophets' lives.", rating: 5, initial: "T" },
  { id: 9, name: "Hina J.", role: "Mother of 3", text: "The Urdu narration is so professional and clear. It's helping my kids improve their Urdu vocabulary as well as learn about Islam.", rating: 5, initial: "H" },
  { id: 10, name: "Rizwan B.", role: "Father of 2", text: "MashaAllah, such a high-quality app. The animations and illustrations are gorgeous without being distracting.", rating: 5, initial: "R" }
];

export default function Landing() {
  // --- Reviews State & Logic ---
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isHoveringReviews, setIsHoveringReviews] = useState(false);
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);

  // --- Global Click Effect ---
  const [clickEffects, setClickEffects] = useState([]);
  useEffect(() => {
    const handleClick = (e) => {
      const newClick = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setClickEffects(prev => [...prev, newClick]);
      setTimeout(() => {
        setClickEffects(prev => prev.filter(c => c.id !== newClick.id));
      }, 1000);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (isHoveringReviews || isAllReviewsModalOpen) return;
    const interval = setInterval(() => {
      setReviewIndex((prev) => (prev + 3) % mockReviewsPool.length);
    }, 3000); // Rotate every 3s
    return () => clearInterval(interval);
  }, [isHoveringReviews, isAllReviewsModalOpen]);

  const displayedReviews = [
    mockReviewsPool[reviewIndex % mockReviewsPool.length],
    mockReviewsPool[(reviewIndex + 1) % mockReviewsPool.length],
    mockReviewsPool[(reviewIndex + 2) % mockReviewsPool.length],
  ];

  // --- Modal & Form State ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 5, text: '' });
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState(null);

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

  // --- Smooth Scroll Logic ---
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- FAQ State ---
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const faqs = [
    {
      q: "Is the AI Guide safe for my children?",
      a: "Absolutely. Our AI is highly constrained and custom-tuned specifically for NoorKids. It will only answer questions related to Islamic history, morals, and the stories provided, refusing any inappropriate or off-topic queries."
    },
    {
      q: "What age group is this app designed for?",
      a: "NoorKids is designed to be accessible and engaging for children ages 5 to 12. The interactive stories use simple language, while the quizzes adapt to challenge older children appropriately."
    },
    {
      q: "Do I need an active internet connection?",
      a: "Yes, an active internet connection is required to interact with the AI guide, update your progress streaks, and fetch new stories from our ever-growing library."
    }
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Global Click Effects */}
      <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
        <AnimatePresence>
          {clickEffects.map(click => (
            <motion.div
              key={click.id}
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-10 h-10 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
              style={{ left: click.x - 20, top: click.y - 20 }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Background Magic Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-500/10 rounded-full blur-[150px]"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
      </div>

      {/* Full-width Sticky Navigation Bar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl"
      >
        <nav className="flex items-center justify-between w-full px-6 md:px-10 lg:px-16 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.jpg" alt="NoorKids Logo" className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-white/20 hover:scale-105 transition-transform" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md hidden sm:block">NoorKids</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm sm:text-base font-medium text-slate-300">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="hover:text-amber-400 transition-colors">How it Works</a>
            <a href="#mission" onClick={(e) => handleScrollTo(e, 'mission')} className="hover:text-amber-400 transition-colors">Our Mission</a>
            <a href="mailto:support@noorkids.com" className="hover:text-amber-400 transition-colors">Contact Us</a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors text-sm sm:text-base px-2">Log In</Link>
            <Link to="/register">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] text-sm sm:text-base whitespace-nowrap"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </nav>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-32 overflow-x-hidden pt-28">
        
        {/* HERO SECTION */}
        <div className="pb-16 sm:pb-24 md:pb-36 flex flex-col items-center text-center">
          <motion.div 
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-xs sm:text-sm mb-6 sm:mb-8 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          >
            <Sparkles size={14} className="sm:w-4 sm:h-4" /> A New Way to Learn
          </motion.div>
          
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500 tracking-tight leading-[1.15] md:leading-[1.1] mb-6 sm:mb-8 drop-shadow-2xl max-w-5xl"
          >
            <motion.span className="block" variants={fadeUpVariant}>A Magical Journey</motion.span>
            <motion.span className="block" variants={fadeUpVariant}>Through Islamic Stories.</motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-2xl text-slate-400 max-w-2xl mb-8 sm:mb-12 leading-relaxed font-medium px-2"
          >
            Immerse your children in beautifully written tales, interactive quizzes, and a safe AI companion that makes learning about Islam an unforgettable adventure.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.6 }}
            className="px-4 sm:px-0 w-full sm:w-auto flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
          >
            <Link to="/register">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(245,158,11,0.6)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full font-black text-base sm:text-lg md:text-xl shadow-[0_0_30px_rgba(245,158,11,0.4)]"
              >
                Start Reading for Free 
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-500"
          >
            <div className="flex items-center gap-1.5 sm:gap-2"><ShieldCheck size={16} className="text-emerald-400 sm:w-[18px] sm:h-[18px]" /> 100% Kid Safe</div>
            <div className="flex items-center gap-1.5 sm:gap-2"><Heart size={16} className="text-rose-400 sm:w-[18px] sm:h-[18px]" /> Loved by Parents</div>
          </motion.div>
        </div>

        {/* FEATURES GRID */}
        <motion.div 
          id="features" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-20 sm:mb-32 relative"
        >
          {/* Card 1 */}
          <motion.div 
            variants={fadeUpVariant}
            whileHover={{ y: -6, boxShadow: "0 0 30px rgba(99,102,241,0.2)", borderColor: "rgba(99,102,241,0.3)" }}
            className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl transition-colors duration-300 flex flex-col items-center text-center group"
          >
            <motion.div 
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <BookOpen size={28} className="sm:w-8 sm:h-8" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Captivating Stories</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
              A growing library of beautifully written, age-appropriate stories covering Prophets, Sahaba, and core Islamic morals.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            variants={fadeUpVariant}
            whileHover={{ y: -6, boxShadow: "0 0 30px rgba(245,158,11,0.2)", borderColor: "rgba(245,158,11,0.3)" }}
            className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl transition-colors duration-300 flex flex-col items-center text-center group"
          >
            <motion.div 
              whileHover={{ rotate: -8, scale: 1.1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <Trophy size={28} className="sm:w-8 sm:h-8" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Earn XP & Badges</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
              Gamified learning keeps kids motivated! Take quizzes after every story to earn XP, maintain daily streaks, and unlock achievements.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            variants={fadeUpVariant}
            whileHover={{ y: -6, boxShadow: "0 0 30px rgba(217,70,239,0.2)", borderColor: "rgba(217,70,239,0.3)" }}
            className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl transition-colors duration-300 flex flex-col items-center text-center group"
          >
            <motion.div 
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(217,70,239,0.2)]"
            >
              <Bot size={28} className="sm:w-8 sm:h-8" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Interactive AI Guide</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
              Have a question about a story? Our safe, custom-tuned AI companion is always ready to explain Islamic concepts in a kid-friendly way.
            </p>
          </motion.div>
        </motion.div>

        {/* HOW IT WORKS SECTION */}
        <motion.div 
          id="how-it-works" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mb-20 sm:mb-32 relative text-center pt-20 -mt-20"
        >
          <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs sm:text-sm mb-4 sm:mb-6">
            Simple & Effective
          </motion.div>
          <motion.h2 variants={fadeUpVariant} className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-10 sm:mb-16">
            How NoorKids Works
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-8 relative max-w-4xl mx-auto px-4 sm:px-0">
            {/* Connecting line for desktop */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
              className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500 z-0 origin-left"
            ></motion.div>
            
            {[
              { num: 1, title: "Read a Story", desc: "Immerse in beautifully written, values-based Islamic tales tailored for children.", color: "text-indigo-400" },
              { num: 2, title: "Take the Quiz", desc: "Test comprehension and reinforce learning with engaging interactive quizzes.", color: "text-amber-400" },
              { num: 3, title: "Earn Rewards", desc: "Gain XP, build reading streaks, and unlock amazing achievement badges!", color: "text-emerald-400" },
            ].map((step) => (
              <motion.div key={step.num} variants={fadeUpVariant} className="relative z-10 flex flex-col items-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a1128] border-4 border-[#1e293b] flex items-center justify-center text-xl sm:text-2xl font-black ${step.color} mb-4 sm:mb-6 shadow-xl`}>
                  {step.num}
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{step.title}</h4>
                <p className="text-slate-400 text-sm max-w-[250px] sm:max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ABOUT US SECTION */}
        <motion.div 
          id="mission" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mb-10 sm:mb-16 pt-20 -mt-20"
        >
          <div className="glass-panel rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 md:p-16 relative overflow-hidden flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-12">
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
            
            <motion.div variants={fadeUpVariant} className="flex-1 relative z-10 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-6 font-medium">
                At <span className="text-amber-400 font-bold">NoorKids</span>, we believe that learning about Islam should be the most exciting part of a child's day. 
              </p>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                In today's digital age, children are surrounded by endless entertainment. We built NoorKids to provide a safe, engaging, and premium digital environment where modern technology (like our custom AI guide) meets timeless Islamic values. Our goal is to nurture a lifelong love for the Deen in the hearts of the next generation.
              </p>
            </motion.div>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="flex-1 relative z-10 flex justify-center w-full"
            >
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-amber-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <img 
                  src="/logo.jpg" 
                  alt="NoorKids About" 
                  className="relative z-10 w-full h-full object-cover rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/10"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* TESTIMONIALS SECTION */}
        <div id="reviews" className="mb-10 sm:mb-16 relative pt-20 -mt-20">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 sm:mb-16 gap-6">
            <div className="text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-between w-full flex-wrap gap-4 mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs sm:text-sm">
                  <MessageSquare size={16} /> What Parents Say
                </div>
                <div className="flex items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAllReviewsModalOpen(true)}
                    className="border border-white/20 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-colors"
                  >
                    View All Reviews
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(245,158,11,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-5 py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] text-xs sm:text-sm whitespace-nowrap"
                  >
                    Write a Review
                  </motion.button>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                Loved by Families Worldwide
              </h2>
            </div>
          </div>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-h-[300px]"
            onMouseEnter={() => setIsHoveringReviews(true)}
            onMouseLeave={() => setIsHoveringReviews(false)}
          >
            <AnimatePresence mode="wait">
              {displayedReviews.map((review) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl relative flex flex-col h-full"
                >
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    className="flex gap-1 mb-4 text-amber-400"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i} variants={{ hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1 } }}>
                        <Star size={18} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} className={i >= review.rating ? "text-slate-600" : ""} />
                      </motion.div>
                    ))}
                  </motion.div>
                  <p className="text-slate-300 mb-6 italic leading-relaxed flex-grow">"{review.text}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
                      {review.initial}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{review.name}</h4>
                      <p className="text-slate-500 text-xs">{review.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* FAQ SECTION */}
        <motion.div 
          id="faq" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mb-10 sm:mb-16 relative pt-20 -mt-20 max-w-4xl mx-auto"
        >
          <div className="text-center mb-10 sm:mb-16">
            <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300 font-bold text-xs sm:text-sm mb-4 sm:mb-6">
              <HelpCircle size={16} /> Got Questions?
            </motion.div>
            <motion.h2 variants={fadeUpVariant} className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
              Frequently Asked Questions
            </motion.h2>
          </div>
          
          <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeUpVariant}
                className="glass-panel rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <div 
                  className="flex items-center justify-between text-base sm:text-lg font-bold text-white p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleFaq(idx)}
                >
                  {faq.q}
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* BOTTOM CTA */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUpVariant}
          className="pt-4 pb-4 sm:pt-8 sm:pb-8 text-center relative w-full"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[300px] bg-indigo-500/10 rounded-[100%] blur-[120px] pointer-events-none"></div>
          
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 sm:mb-8 relative z-10 tracking-tighter">
            Ready to begin the adventure?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 mb-10 sm:mb-14 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed px-4">
            Join thousands of parents who trust <span className="text-amber-400 font-bold">NoorKids</span> to make Islamic education engaging, safe, and incredibly fun.
          </p>
          <div className="relative z-10 px-4 sm:px-0 flex justify-center">
            <Link to="/register">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(245,158,11,0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-5 sm:px-12 sm:py-6 md:px-14 md:py-7 rounded-full font-black text-xl group/btn"
              >
                Create Free Account
                <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.button>
            </Link>
          </div>
        </motion.div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030305] pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center gap-3 mb-6">
            <img src="/logo.jpg" alt="NoorKids" className="w-12 h-12 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10" />
            <span className="text-2xl font-black text-white tracking-tight">NoorKids</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} NoorKids App. Built with ❤️ for our Ummah.
          </p>
        </div>
      </footer>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
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
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Thank You!</h4>
                    <p className="text-slate-400">Your review has been submitted and is pending admin approval.</p>
                  </motion.div>
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
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={reviewSubmitStatus === 'submitting'} type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50">
                        {reviewSubmitStatus === 'submitting' ? 'Submitting...' : 'Submit Review'}
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALL REVIEWS MODAL */}
      <AnimatePresence>
        {isAllReviewsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="text-rose-400 w-5 h-5" /> All Reviews
                </h3>
                <button onClick={() => setIsAllReviewsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-[#050508]/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockReviewsPool.map((review) => (
                    <div key={review.id} className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <div className="flex gap-1 mb-3 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} className={i >= review.rating ? "text-slate-600" : ""} />
                        ))}
                      </div>
                      <p className="text-slate-300 mb-4 italic text-sm">"{review.text}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                          {review.initial}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-xs">{review.name}</h4>
                          <p className="text-slate-500 text-[10px]">{review.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

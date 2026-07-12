import RegisterForm from "../components/Auth/RegisterForm";
import { Moon, Sparkles, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050508] relative overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Modern Professional Background */}
      <div className="absolute inset-0 bg-[#020617] z-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        {/* Deep Mesh Gradient Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-900/30 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-amber-900/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] right-[50%] w-[40vw] h-[40vw] bg-violet-900/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      </div>
      
      {/* Back Button - Top Left Screen */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 sm:top-10 sm:left-10 z-50 flex items-center gap-2 text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.08] px-4 py-2 rounded-full backdrop-blur-md border border-white/5 transition-all duration-300 group hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-sm font-bold">Back to Home</span>
      </Link>

      {/* Center Form Card */}
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 p-8 sm:p-10 group/card hover:border-white/20 transition-colors duration-500 mt-10 mb-10">
        
        {/* Glowing border top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30 group-hover/card:opacity-100 transition-opacity duration-700"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="mb-5 group-hover/card:scale-110 group-hover/card:rotate-[2deg] transition-transform duration-500">
            <img 
              src="/logo.jpg" 
              alt="NoorKids Logo" 
              className="w-16 h-16 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)] border border-white/20 object-cover"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2 text-center">
            Create account
          </h1>
          <p className="text-slate-400 text-sm font-medium text-center">
            Sign up to start your family's journey.
          </p>
        </div>

        {/* The Form Itself */}
        <div className="relative">
          <RegisterForm />
        </div>

      </div>
    </div>
  );
}

export default Register;
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="text-center mt-12 md:mt-24 px-4 relative max-w-7xl mx-auto">
      
      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-xl tracking-tight mb-6">
          NoorKids AI
        </h1>

        <p className="mt-8 text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto text-slate-300 font-medium leading-relaxed">
          Embark on a beautiful journey of Islamic storytelling. <br className="hidden md:block" />
          <span className="text-amber-200/80">Listen, read, and chat with AI.</span>
        </p>

        <Link
          to="/stories"
          className="
            inline-flex items-center gap-3
            mt-12
            bg-gradient-to-r from-amber-400 to-orange-500
            hover:from-amber-300 hover:to-orange-400
            text-slate-900
            text-xl
            font-black
            px-10
            py-5
            rounded-full
            transition-all duration-300
            hover:scale-105
            hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]
            group
          "
        >
          <Sparkles className="group-hover:rotate-12 transition-transform" />
          Start Your Journey
        </Link>
      </div>
      
    </section>
  );
}

export default Hero;
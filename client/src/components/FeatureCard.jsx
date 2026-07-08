function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div
      className="glass-card rounded-[2.5rem] p-8 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-amber-400/30 transition-all duration-500 group flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-amber-400/20">
        <Icon size={40} strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold mb-4 text-white group-hover:text-amber-300 transition-colors duration-300">
        {title}
      </h2>

      <p className="text-slate-400 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
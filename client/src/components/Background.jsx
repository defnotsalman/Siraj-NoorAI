import { Moon } from 'lucide-react';

function Background() {
  return (
    <>
      {/* Deep Sky Base with Ambient Gradients */}
      {/* We use a single full-screen div with multiple radial gradients to prevent any bounding box clipping */}
      <div 
        className="fixed inset-0 -z-50"
        style={{
          backgroundColor: '#0a1128',
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(49,46,129,0.5) 0%, rgba(49,46,129,0) 50%),
            radial-gradient(circle at 20% 80%, rgba(30,58,138,0.4) 0%, rgba(30,58,138,0) 50%)
          `
        }}
      />

      {/* Elegant Crescent Moon */}
      <div className="fixed top-12 right-12 md:top-20 md:right-24 -z-30 pointer-events-none opacity-40 mix-blend-screen">
        <div className="relative">
          {/* Subtle glow behind moon */}
          <div 
            className="absolute inset-0 rounded-full scale-[2]" 
            style={{ background: 'radial-gradient(circle, rgba(253,230,138,0.15) 0%, rgba(253,230,138,0) 70%)' }} 
          />
          <Moon 
            size={120} 
            strokeWidth={1} 
            className="text-amber-100/80 drop-shadow-[0_0_15px_rgba(253,230,138,0.3)] relative z-10" 
            fill="currentColor"
          />
        </div>
      </div>
    </>
  );
}

export default Background;
import { Moon } from 'lucide-react';

function Background() {
  return (
    <>
      {/* Deep Sky Base */}
      <div className="fixed inset-0 -z-50 bg-[#0a1128]" />
      
      {/* Ambient Gradient Meshes */}
      <div className="fixed inset-0 -z-40 overflow-hidden pointer-events-none">
        {/* Soft top-right glow */}
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-900/20 blur-[120px]" />
        
        {/* Soft bottom-left glow */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      {/* Elegant Crescent Moon */}
      <div className="fixed top-12 right-12 md:top-20 md:right-24 -z-30 pointer-events-none opacity-40 mix-blend-screen">
        <div className="relative">
          {/* Subtle glow behind moon */}
          <div className="absolute inset-0 bg-amber-200/20 blur-3xl rounded-full scale-150" />
          <Moon 
            size={120} 
            strokeWidth={1} 
            className="text-amber-100/80 drop-shadow-[0_0_15px_rgba(253,230,138,0.3)]" 
            fill="currentColor"
          />
        </div>
      </div>
    </>
  );
}

export default Background;
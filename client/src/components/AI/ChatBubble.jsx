import { User, Sparkles } from "lucide-react";

function ChatBubble({ message, sender }) {
  const isUser = sender === "user";

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? "justify-end" : "justify-start"} items-end`}>
      
      {!isUser && (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-indigo-400 mb-1">
          <Sparkles size={18} className="md:w-5 md:h-5" />
        </div>
      )}

      <div
        className={`
          max-w-[85%] md:max-w-[75%]
          px-5 md:px-6
          py-3 md:py-4
          text-base md:text-lg leading-relaxed
          ${
            isUser
              ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 rounded-[2rem] rounded-br-sm shadow-[0_10px_25px_rgba(245,158,11,0.2)] font-medium border border-amber-300"
              : "bg-white/10 text-slate-100 rounded-[2rem] rounded-bl-sm backdrop-blur-xl border border-white/10 shadow-lg"
          }
        `}
      >
        {message}
      </div>

      {isUser && (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-amber-400 shrink-0 shadow-lg border border-slate-600 mb-1">
          <User size={18} className="md:w-5 md:h-5" />
        </div>
      )}

    </div>
  );
}

export default ChatBubble;
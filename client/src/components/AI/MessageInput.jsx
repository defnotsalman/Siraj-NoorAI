import { useState } from "react";
import { SendHorizonal } from "lucide-react";

function MessageInput({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      send();
    }
  };

  return (
    <div className="pt-4 px-6 pb-14 md:pt-6 md:px-10 md:pb-16 shrink-0 relative z-10">
      <div className="relative group max-w-4xl mx-auto drop-shadow-2xl">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask NoorKids AI..."
          className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-[2rem] pl-8 pr-16 py-5 text-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-slate-800/90 focus:ring-4 ring-indigo-500/20 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        />
        
        <button
          onClick={send}
          disabled={!text.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 text-white w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-bold hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-[0_0_20px_rgba(139,92,246,0.6)]"
        >
          <SendHorizonal size={22} className="ml-0.5 -mt-0.5" />
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
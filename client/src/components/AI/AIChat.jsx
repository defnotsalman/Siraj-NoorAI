import { useState, useRef, useEffect } from "react";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import { Sparkles, Moon, Star } from 'lucide-react';

function AIChat({ storyId, storyTitle }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      message: storyTitle 
        ? `Assalamu Alaikum! I am NoorKids AI. What would you like to know about "${storyTitle}"?`
        : "Assalamu Alaikum! I am NoorKids AI. Ask me anything about Islamic stories."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("Urdu");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        message: text
      }
    ]);

    try {
      setIsTyping(true);
      const response = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          storyId, 
          question: text,
          conversationHistory: messages,
          language
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          message: data.answer
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          message: `[DEBUG FRONTEND ERROR]: ${error.message || "Failed to connect"}`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative z-10 w-full h-full bg-transparent">
      
      {/* WhatsApp style Doodle Pattern Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l1.43 4.294 4.512 1.42-4.51 1.422-1.432 4.29-1.43-4.29-4.513-1.42 4.513-1.422L54.627 0zm-27 21l1.43 4.294 4.512 1.42-4.51 1.422-1.432 4.29-1.43-4.29-4.513-1.42 4.513-1.422L27.627 21zM9.54 36.31l1.196 3.585 3.77 1.187-3.77 1.187-1.196 3.586-1.196-3.586-3.77-1.187 3.77-1.187 1.196-3.585zm38.168-1.5l1.196 3.585 3.77 1.187-3.77 1.187-1.196 3.586-1.196-3.586-3.77-1.187 3.77-1.187 1.196-3.585zM38.125 45l1.43 4.294 4.512 1.42-4.51 1.422-1.432 4.29-1.43-4.29-4.513-1.42 4.513-1.422L38.125 45zM22.84 0l1.196 3.585 3.77 1.187-3.77 1.187-1.196 3.586-1.196-3.586-3.77-1.187 3.77-1.187 1.196-3.585zM8.33 13.91l1.43 4.294 4.512 1.42-4.51 1.422-1.432 4.29-1.43-4.29-4.513-1.42 4.513-1.422L8.33 13.91z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-[60]">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-800/80 border border-white/20 text-slate-200 text-xs px-3 py-1.5 rounded-full outline-none focus:border-indigo-400 backdrop-blur-md cursor-pointer"
        >
          <option value="Urdu">Urdu (اردو)</option>
          <option value="Roman Urdu">Roman Urdu</option>
          <option value="English">English</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8 custom-scrollbar space-y-4 relative z-10">
        
        {messages.length === 1 && !isTyping ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-700 pb-10">
             <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_10px_40px_rgba(168,85,247,0.4)] mb-6 border border-white/20">
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
             </div>
             
             <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight drop-shadow-md">NoorKids AI</h2>
             <p className="text-slate-300 text-center max-w-lg mb-10 text-sm md:text-base leading-relaxed">
               Your intelligent assistant for exploring Islamic stories, answering questions, and learning more about your beautiful faith.
             </p>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-3xl mx-auto">
               {[
                 { title: "Story Summary", query: "Can you summarize this story for me?", icon: "BookOpen", color: "from-indigo-600 to-blue-600", border: "border-indigo-500/30", bg: "bg-indigo-950/40" },
                 { title: "Main Characters", query: "Who are the main characters in this story?", icon: "User", color: "from-rose-600 to-pink-600", border: "border-pink-500/30", bg: "bg-rose-950/40" },
                 { title: "Moral Lesson", query: "What is the main moral lesson of this story?", icon: "Heart", color: "from-emerald-600 to-teal-600", border: "border-emerald-500/30", bg: "bg-emerald-950/40" },
                 { title: "Important Events", query: "What are the most important events that happened?", icon: "Clock", color: "from-amber-600 to-orange-600", border: "border-amber-500/30", bg: "bg-amber-950/40" },
                 { title: "Why it matters", query: "Why is this story important for us to learn?", icon: "Sparkles", color: "from-purple-600 to-fuchsia-600", border: "border-purple-500/30", bg: "bg-purple-950/40" },
                 { title: "Test Me", query: "Ask me a simple question to test my knowledge on this story.", icon: "Target", color: "from-cyan-600 to-blue-600", border: "border-cyan-500/30", bg: "bg-cyan-950/40" }
               ].map((s, i) => (
                 <button 
                   key={i} 
                   onClick={() => sendMessage(s.query)}
                   className={`flex flex-col items-center justify-center p-5 rounded-2xl ${s.bg} hover:bg-slate-800/60 border ${s.border} backdrop-blur-sm transition-all hover:-translate-y-1 group cursor-pointer shadow-lg`}
                 >
                   <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-all`}>
                     {s.icon === "BookOpen" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
                     {s.icon === "Sparkles" && <Sparkles className="text-white" size={24} />}
                     {s.icon === "Clock" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                     {s.icon === "Heart" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}
                     {s.icon === "Target" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
                     {s.icon === "User" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                   </div>
                   <span className="text-slate-200 font-bold text-sm tracking-wide text-center">{s.title}</span>
                 </button>
               ))}
             </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatBubble
                key={index}
                sender={msg.sender}
                message={msg.message}
              />
            ))}
            {isTyping && (
              <div className="flex gap-3 mb-6 justify-start">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg border border-indigo-400">
                  <span className="text-xl leading-none -mt-1 font-serif">*</span>
                </div>
                <div className="bg-white/10 text-slate-100 rounded-3xl rounded-tl-sm px-6 py-4 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput onSend={sendMessage} />

    </div>

  );

}

export default AIChat;
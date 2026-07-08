import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';

function AudioPlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const utteranceRef = useRef(null);

  // Initialize and cleanup
  useEffect(() => {
    // Ensure voices are loaded (Chrome sometimes needs this to be triggered)
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const initUtterance = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find an Urdu voice
    const voices = window.speechSynthesis.getVoices();
    const urduVoice = voices.find(v => v.lang.toLowerCase().includes('ur'));
    if (urduVoice) {
      utterance.voice = urduVoice;
    } else {
      utterance.lang = 'ur-PK'; // Fallback hint
    }

    utterance.rate = playbackRate;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    utteranceRef.current = utterance;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused && utteranceRef.current) {
        window.speechSynthesis.resume();
      } else {
        initUtterance();
        window.speechSynthesis.speak(utteranceRef.current);
      }
      setIsPlaying(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    utteranceRef.current = null;
  };

  const changeSpeed = () => {
    let newRate = 1;
    if (playbackRate === 1) newRate = 1.25;
    else if (playbackRate === 1.25) newRate = 0.75;
    
    setPlaybackRate(newRate);
    
    // Restart utterance if speaking to apply rate change
    if (isPlaying) {
       window.speechSynthesis.cancel();
       setTimeout(() => {
          initUtterance();
          utteranceRef.current.rate = newRate;
          window.speechSynthesis.speak(utteranceRef.current);
       }, 50);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xl border border-white/5">
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlayPause}
        className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
      >
        {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
      </button>

      {/* Stop Button */}
      <button 
        onClick={stop}
        className="bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors shrink-0 shadow-lg border border-white/5"
      >
        <Square fill="currentColor" size={16} />
      </button>

      {/* Status Bar */}
      <div className="flex-1 w-full flex flex-col justify-center items-start px-2 text-center md:text-left">
        <h3 className="text-amber-400 font-bold mb-1 w-full">Story Reader</h3>
        <p className="text-slate-400 text-sm w-full">
          {isPlaying ? "Playing aloud..." : window.speechSynthesis.paused ? "Paused" : "Ready to listen"}
        </p>
      </div>

      {/* Speed Toggle */}
      <button 
        onClick={changeSpeed}
        className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full font-bold text-sm transition-colors shrink-0 text-slate-200 border border-white/5"
      >
        {playbackRate}x
      </button>

    </div>
  );
}

export default AudioPlayer;

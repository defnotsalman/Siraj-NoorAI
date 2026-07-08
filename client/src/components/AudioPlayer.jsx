import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';

function AudioPlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef([]);

  // Initialize voices and cleanup
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    
    // Chrome needs this event to load voices reliably
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // 1. Try Urdu
    let voice = voices.find(v => v.lang.toLowerCase().includes('ur'));
    // 2. Try Arabic (can read the script)
    if (!voice) voice = voices.find(v => v.lang.toLowerCase().includes('ar'));
    // 3. Fallback to default
    if (!voice) voice = voices.find(v => v.default) || voices[0];
    return voice;
  };

  const splitText = (fullText) => {
    // Split text by Urdu period (۔), English period (.), or newlines to prevent long-text silent crashes
    return fullText
      .split(/[\n۔.]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const playNextChunk = () => {
    if (chunkIndexRef.current >= chunksRef.current.length) {
      setIsPlaying(false);
      return;
    }

    const chunk = chunksRef.current[chunkIndexRef.current];
    const utterance = new SpeechSynthesisUtterance(chunk);
    
    const voice = getVoice();
    if (voice) {
      utterance.voice = voice;
    } else {
      utterance.lang = 'ur-PK'; 
    }
    
    utterance.rate = playbackRate;

    utterance.onend = () => {
      chunkIndexRef.current += 1;
      // Play next chunk
      setTimeout(playNextChunk, 100);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      // Some browsers throw interrupted errors when paused/cancelled, we only stop if it's playing
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        // Start fresh
        window.speechSynthesis.cancel();
        chunksRef.current = splitText(text);
        chunkIndexRef.current = 0;
        playNextChunk();
      }
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    chunkIndexRef.current = chunksRef.current.length; // End it
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
          playNextChunk();
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

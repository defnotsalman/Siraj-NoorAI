import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';

export default function PracticeRecitation({ surahNumber, ayahNumber, targetText }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setError(null);
      setResult(null);
      cleanupAudio();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Detect browser supported MIME types
        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/aac',
          'audio/wav'
        ];
        let selectedMimeType = '';
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            break;
          }
        }

        const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
        console.log("Starting MediaRecorder with options:", options);
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsGrading(true);
          const mimeTypeUsed = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeUsed });
          
          const formData = new FormData();
          
          // Set appropriate file extension
          let extension = 'webm';
          if (mimeTypeUsed.includes('mp4')) extension = 'mp4';
          else if (mimeTypeUsed.includes('ogg')) extension = 'ogg';
          else if (mimeTypeUsed.includes('wav')) extension = 'wav';
          else if (mimeTypeUsed.includes('aac')) extension = 'aac';

          formData.append('audio', audioBlob, `recitation.${extension}`);
          formData.append('targetText', targetText);

          try {
            const response = await fetch('http://localhost:5000/api/quran/practice', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            
            if (!response.ok) {
              if (data.aiEngineDown) {
                throw new Error("AI Engine is not running. Ask your developer to start it.");
              }
              throw new Error(data.error || "Failed to grade recitation");
            }
            
            setResult(data);
          } catch (err) {
            console.error("Grading error:", err);
            setError(err.message);
          } finally {
            setIsGrading(false);
            cleanupAudio();
          }
        };

        // Initialize AudioContext for visualizer
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          source.connect(analyser);

          const draw = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            ctx.clearRect(0, 0, width, height);
            
            // Draw real-time audio visualization bars
            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
              barHeight = (dataArray[i] / 255) * height * 0.95;
              
              const gradient = ctx.createLinearGradient(0, height, 0, 0);
              gradient.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
              gradient.addColorStop(1, 'rgba(245, 158, 11, 0.95)');
              
              ctx.fillStyle = gradient;
              ctx.fillRect(x, height - barHeight, barWidth - 3, barHeight);
              x += barWidth;
            }

            // Draw a subtle bottom line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height - 1);
            ctx.lineTo(width, height - 1);
            ctx.stroke();
          };

          // Delay slightly to ensure canvas is rendered
          setTimeout(() => {
            draw();
          }, 50);
        }

        mediaRecorder.start();
        setIsRecording(true);
        setAttemptCount(prev => prev + 1);
      } catch (err) {
        console.error("Mic access denied or error:", err);
        setError("Could not access microphone. Please check system permissions and connections.");
        cleanupAudio();
      }
    }
  };

  return (
    <div className="bg-[#141824] rounded-2xl p-4 mt-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-white">Practice Recitation</h4>
          <p className="text-xs text-slate-400">Read the Ayah out loud to check your accuracy.</p>
        </div>
        <button 
          onClick={toggleRecording}
          disabled={isGrading}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(243,24,96,0.4)] animate-pulse' 
              : 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          }`}
        >
          {isGrading ? <Loader2 className="animate-spin" size={20} /> : isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} fill="currentColor" />}
        </button>
      </div>

      {/* Real-time Visualizer */}
      {isRecording && (
        <div className="bg-[#0A0D14] rounded-xl p-3 mb-4 border border-white/5 flex flex-col items-center justify-center gap-2">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={60} 
            className="w-full max-w-md h-[60px]"
          />
          <span className="text-[10px] text-amber-500 font-mono tracking-wider animate-pulse">
            🎤 RECORDING ACTIVE... SPEAK NOW
          </span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-4 flex items-center gap-3">
          <AlertCircle className="text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-[#0A0D14] rounded-xl p-5 mt-4 border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Header & Score */}
          <div className="flex items-start justify-between border-b border-white/5 pb-4">
            <div>
              <h5 className="text-white font-medium flex items-center gap-2 mb-1">
                {result.score > 80 ? '✨ Excellent!' : '⚠️ Good effort!'} 
                <span className="text-xs text-slate-500 font-normal">(Attempt #{attemptCount})</span>
              </h5>
              <p className="text-sm text-slate-400">
                {result.score > 80 
                  ? "Your pronunciation is highly accurate." 
                  : "You're close! Focus on pronunciation and rhythm."}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 mb-1">Accuracy Score</span>
              <span className={`text-2xl font-bold ${result.score > 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                {result.score}%
              </span>
            </div>
          </div>

          {/* Word Matching Visualization */}
          <div className="bg-white/[0.02] p-4 rounded-lg">
            <div className="flex flex-wrap gap-2 text-2xl font-nastaliq justify-end leading-loose" dir="rtl">
              {result.words.map((w, i) => (
                <span key={i} className={w.matched ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-amber-500 opacity-60'}>
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
            <h6 className="text-indigo-300 font-medium text-sm flex items-center gap-2 mb-3">
              💡 Tips:
            </h6>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
              <li>Listen to the reference pronunciation</li>
              <li>Speak clearly into the microphone</li>
              <li>Match the rhythm and tone</li>
              <li>Practice makes perfect!</li>
            </ul>
          </div>

          {/* Demo Footnote */}
          <div className="pt-2 border-t border-white/5 flex justify-center">
            <span className="text-[10px] text-slate-600 font-mono tracking-wider">
              Analyzed using MFCC + DTW + Cosine Similarity
            </span>
          </div>

        </div>
      )}
    </div>
  );
}

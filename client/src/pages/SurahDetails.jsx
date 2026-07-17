import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, DownloadCloud, CheckCircle2 } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import PracticeRecitation from '../components/Quran/PracticeRecitation';

// Helper to convert Al Quran Cloud's custom bracket syntax to HTML spans
const parseTajweed = (text) => {
  if (!text) return "";
  // The API returns tajweed in the format: [rule[text]
  // E.g., [h:1[ٱ] -> rule = h:1, text = ٱ
  let parsedText = text.replace(/\[([^\[\]]+)\[([^\]]+)\]/g, (match, rule, content) => {
    // Map the short codes to our global.css classes
    let className = "";
    if (rule.startsWith('n') || rule.startsWith('p') || rule.startsWith('m') || rule.startsWith('o')) {
      className = "madd";
    } else if (rule.startsWith('q')) {
      className = "qalaqah";
    } else if (rule.startsWith('c')) {
      className = "ghunnah";
    } else if (rule.startsWith('s')) {
      className = "ikhafa";
    } else if (rule.startsWith('f')) {
      className = "idgham_wo_ghunnah";
    } else if (rule.startsWith('a')) {
      className = "idgham_ghunnah";
    } else if (rule.startsWith('i')) {
      className = "iqlab";
    } else if (rule.startsWith('l')) {
      className = "lam_shamsiyyah"; // We'll make this gray
    } else if (rule.startsWith('h')) {
      className = "hamzat_wasl"; // We'll make this gray
    }
    
    if (!className) return content; // If unknown rule, just return the text
    return `<span class="tajweed ${className}">${content}</span>`;
  });

  // Wrap Waqf (stopping) Unicode characters in styled tags with hover tooltips
  parsedText = parsedText.replace(/([\u06D6-\u06DC])/g, (match) => {
    let title = "";
    let className = "";
    if (match === '\u06D8') { // ۘ (Meem)
      title = "مـ - Compulsory Stop (Waqf e Lazim)";
      className = "waqf-lazim";
    } else if (match === '\u06DA') { // ۚ (Jeem)
      title = "ج - Permissible Stop (Waqf e Jaaiz)";
      className = "waqf-jaaiz";
    } else if (match === '\u06D9') { // ۙ (Laa)
      title = "لا - No need of stopping (Laa)";
      className = "waqf-laa";
    } else if (match === '\u06D6') { // ۖ (Sad-Lam-Alef)
      title = "صلي - Preference for continuation (Al-Wasl Awlaa)";
      className = "waqf-wasl";
    } else if (match === '\u06D7') { // ۗ (Qaf-Lam-Alef)
      title = "قلى - Preference for stopping (Al-Waqf Awlaa)";
      className = "waqf-qif";
    } else if (match === '\u06DB') { // ۛ (Three dots)
      title = "∴ - Embracing Stop (Mu'anaqah)";
      className = "waqf-muanaqah";
    } else if (match === '\u06DC') { // ۜ (Seen)
      title = "س - Silence Symbol (Saktah)";
      className = "waqf-saktah";
    }
    return `<span class="waqf-symbol ${className}" title="${title}">${match}</span>`;
  });

  return parsedText;
};

export default function SurahDetails() {
  const { id } = useParams();
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [legendTab, setLegendTab] = useState('tajweed'); // 'tajweed' or 'stopping'
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    fetch(`http://192.168.1.69:5000/api/quran/surah/${id}`)
      .then(res => res.json())
      .then(data => {
        setSurah(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load surah:", err);
        setLoading(false);
      });
      
    // Check if this surah is already cached
    if ('caches' in window) {
      caches.open('quran-data').then(cache => {
        cache.match(`http://192.168.1.69:5000/api/quran/surah/${id}`).then(response => {
          if (response) setIsDownloaded(true);
        });
      });
    }
  }, [id]);

  const handleDownload = async () => {
    if (!surah || isDownloading) return;
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const totalAyahs = surah.ayahs.length;
      let completed = 0;

      // Ensure JSON data is cached (usually Workbox NetworkFirst does this, but we explicitly cache it to be safe)
      if ('caches' in window) {
        const dataCache = await caches.open('quran-data');
        await dataCache.add(`http://192.168.1.69:5000/api/quran/surah/${id}`);
      }

      // Download all audio files in parallel batches (e.g. 5 at a time) to avoid browser limitations
      const audioUrls = surah.ayahs.map(a => `http://192.168.1.69:5000/api/quran/audio?url=${encodeURIComponent(a.audio)}`);
      
      const batchSize = 5;
      for (let i = 0; i < audioUrls.length; i += batchSize) {
        const batch = audioUrls.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
          try {
            // Making a normal fetch request allows Workbox CacheFirst runtime rule to intercept and cache it
            // We no longer need no-cors because the proxy adds CORS headers
            await fetch(url);
          } catch (e) {
            console.error("Failed to fetch audio for cache", url, e);
          }
          completed++;
          setDownloadProgress(Math.round((completed / totalAyahs) * 100));
        }));
      }

      setIsDownloaded(true);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!surah) {
    return <div className="text-center text-white mt-20">Surah not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/quran" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Index
        </Link>
        <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent"></div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 relative z-10">{surah.englishName}</h1>
          <p className="text-amber-400 mb-4 relative z-10">{surah.englishNameTranslation} • {surah.revelationType}</p>
          <h2 className="text-4xl md:text-5xl font-nastaliq text-white opacity-90 relative z-10">{surah.name}</h2>
          
          <div className="flex items-center justify-center gap-4 mt-6 relative z-10 flex-wrap">
            <button
              onClick={handleDownload}
              disabled={isDownloaded || isDownloading}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isDownloaded ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 
                isDownloading ? 'bg-amber-500/20 text-amber-400 cursor-wait' : 
                'bg-[#141824] text-slate-300 hover:bg-[#1a2035] hover:text-white border border-white/10'
              }`}
            >
              {isDownloaded ? (
                <><CheckCircle2 size={16} /> Saved Offline</>
              ) : isDownloading ? (
                <><Loader2 size={16} className="animate-spin" /> {downloadProgress}% Downloading...</>
              ) : (
                <><DownloadCloud size={16} /> Download Offline</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rules Legend */}
      <div className="mb-8">
        <button 
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mx-auto"
        >
          <Info size={16} /> {showLegend ? 'Hide' : 'Show'} Quran Rules Legend
        </button>
        {showLegend && (
          <div className="glass-panel p-5 rounded-2xl mt-4 animate-fade-in-up">
            <div className="flex border-b border-white/5 pb-2 mb-4 justify-center gap-6">
              <button 
                onClick={() => setLegendTab('tajweed')} 
                className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${legendTab === 'tajweed' ? 'text-amber-400 border-amber-400' : 'text-slate-400 border-transparent hover:text-white'}`}
              >
                Tajweed Rules
              </button>
              <button 
                onClick={() => setLegendTab('stopping')} 
                className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${legendTab === 'stopping' ? 'text-amber-400 border-amber-400' : 'text-slate-400 border-transparent hover:text-white'}`}
              >
                Quran Stopping Rules (Waqf)
              </button>
            </div>
            
            {legendTab === 'tajweed' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22c55e]"></span><span className="text-slate-300">Ghunnah (Nasalization)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span><span className="text-slate-300">Ikhfa (Hidden)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#94a3b8]"></span><span className="text-slate-300">Idgham (Merge)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#06b6d4]"></span><span className="text-slate-300">Iqlab (Conversion)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span><span className="text-slate-300">Qalqalah (Echoing)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span><span className="text-slate-300">Madd (Prolongation)</span></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#f43f5e] font-quran text-xl leading-none">ۘ</span>
                  <div>
                    <span className="text-white font-medium block">مـ (Waqf e Lazim)</span>
                    <span className="text-slate-400">Compulsory Stop: You must stop to avoid changing the meaning.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#3b82f6] font-quran text-xl leading-none">ۚ</span>
                  <div>
                    <span className="text-white font-medium block">ج (Waqf e Jaaiz)</span>
                    <span className="text-slate-400">Permissible Stop: You can pause or continue. Stopping is preferred.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#dc2626] font-quran text-xl leading-none">ۙ</span>
                  <div>
                    <span className="text-white font-medium block">لا (Laa)</span>
                    <span className="text-slate-400">No Stopping: Do not stop at this mark to preserve flow/meaning.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#10b981] font-quran text-xl leading-none">ۖ</span>
                  <div>
                    <span className="text-white font-medium block">صلي (Al-Wasl Awlaa)</span>
                    <span className="text-slate-400">Preference for Continuation: Better to continue without pausing.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#f59e0b] font-quran text-xl leading-none">ۗ</span>
                  <div>
                    <span className="text-white font-medium block">قلى (Al-Waqf Awlaa)</span>
                    <span className="text-slate-400">Preference for Stopping: Stopping here is better.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#a855f7] font-quran text-xl leading-none">ۛ</span>
                  <div>
                    <span className="text-white font-medium block">∴ (Mu'anaqah)</span>
                    <span className="text-slate-400">Embracing Stop: You must pause at one of the two symbols, but not both.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#eab308] font-quran text-xl leading-none">ۜ</span>
                  <div>
                    <span className="text-white font-medium block">س / ۜ (Saktah)</span>
                    <span className="text-slate-400">Silence Symbol: Pause briefly without breaking/taking breath.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#eab308] font-quran text-sm leading-none pt-1">وقفتہ</span>
                  <div>
                    <span className="text-white font-medium block">وقفتہ (Waqfah)</span>
                    <span className="text-slate-400">Longer Pause: Pause for longer without breaking/taking breath.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-amber-500 font-quran text-lg leading-none">ط</span>
                  <div>
                    <span className="text-white font-medium block">ط (Waqf e Mutlaq)</span>
                    <span className="text-slate-400">Absolute Pause: Pause, take a breath, and then continue.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-emerald-400 font-quran text-lg leading-none">⃝</span>
                  <div>
                    <span className="text-white font-medium block">⃝ (Waqf e Taam)</span>
                    <span className="text-slate-400">Conclusion of Verse: Standard recommendation to pause at the end of an Ayah.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ayahs */}
      <div className="space-y-8">
        {surah.ayahs.map(ayah => (
          <div key={ayah.numberInSurah} className="glass-panel p-6 rounded-3xl group">
            <div className="flex justify-between items-start mb-6 gap-6">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#141824] flex items-center justify-center text-amber-500 font-bold border border-white/5">
                {ayah.numberInSurah}
              </div>
              
              {/* The Uthmani Text with Tajweed Tags */}
              <div 
                className="text-right text-3xl md:text-4xl font-quran leading-[2.5] md:leading-[3] text-white flex-1"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: parseTajweed(ayah.text) }}
              />
            </div>

            {/* Translations */}
            <div className="space-y-4">
              {/* Urdu Translation */}
              <p className="text-slate-300 text-lg font-nastaliq text-right leading-loose text-xl" dir="rtl">
                {ayah.translation?.ur}
              </p>
              
              {/* English Translation */}
              <p className="text-slate-400 text-lg leading-relaxed text-left" dir="ltr">
                {ayah.translation?.en}
              </p>
            </div>

            {/* Listen and Practice */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <AudioPlayer audioUrl={`http://192.168.1.69:5000/api/quran/audio?url=${encodeURIComponent(ayah.audio)}`} storyId={null} />
              <PracticeRecitation surahNumber={surah.number} ayahNumber={ayah.numberInSurah} targetText={ayah.text} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

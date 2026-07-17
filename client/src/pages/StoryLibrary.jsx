import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StoryCard from "../components/StoryCard";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

function StoryLibrary() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stories from API for the featured section
    fetch("http://192.168.18.64:5000/api/stories")
      .then(res => res.json())
      .then(data => {
        const sortedData = [...data].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
        const featured = [];
        const usedHues = new Set();
        
        for (const story of sortedData) {
          if (featured.length === 3) break;
          
          // Calculate the approximate hue used in StoryCard
          const hue = (story.title.length * 15) % 360;
          // Group hues into 6 bins (60 degrees each) to guarantee they look completely different
          const colorBin = Math.floor(hue / 60);
          
          if (!usedHues.has(colorBin)) {
            usedHues.add(colorBin);
            featured.push(story);
          }
        }
        
        // Fallback: fill the rest if we couldn't find 3 distinct ones
        if (featured.length < 3) {
           const remaining = sortedData.filter(d => !featured.some(f => f.id === d.id));
           featured.push(...remaining.slice(0, 3 - featured.length));
        }

        setStories(featured);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">

      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-4 tracking-tight flex items-center gap-3">
            <Sparkles className="text-amber-400" /> Featured Stories
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Begin your beautiful Islamic adventure today.
          </p>
        </div>
        
        <Link 
          to="/stories"
          className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold transition-all border border-white/5"
        >
          View All Stories <ArrowRight size={18} />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-amber-400">
          <Loader2 size={48} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center md:hidden">
        <Link 
          to="/stories"
          className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-4 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          View All Stories <ArrowRight size={18} />
        </Link>
      </div>

    </div>
  );
}

export default StoryLibrary;
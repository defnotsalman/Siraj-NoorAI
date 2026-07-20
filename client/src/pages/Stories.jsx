import { useState, useEffect } from "react";
import StoryCard from "../components/StoryCard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import { Library, Loader2, AlertCircle } from "lucide-react";

function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("All");

  useEffect(() => {
    fetch("http://localhost:5000/api/stories")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stories");
        return res.json();
      })
      .then(data => {
        setStories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Could not load stories. Please try again later.");
        setLoading(false);
      });
  }, []);

  const filteredStories = stories.filter((story) => {
    const matchesSearch = story.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selected === "All" || story.category === selected;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-white">
        <Loader2 size={64} className="text-amber-400 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-amber-300">Loading library...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-white text-center px-4">
        <AlertCircle size={80} className="text-rose-400 mb-6" />
        <h2 className="text-3xl font-bold text-amber-300 mb-8">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 min-h-screen">

      <div className="flex flex-col items-center justify-center text-center mb-12">
        <div className="bg-amber-400/20 p-4 rounded-full text-amber-400 mb-6 border border-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.15)]">
          <Library size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-4 tracking-tight drop-shadow-sm">
          All Stories
        </h1>
        <p className="text-lg text-slate-400 font-medium bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-inner">
          {filteredStories.length} Stories Available
        </p>
      </div>

      <div className="glass-panel p-6 rounded-3xl mb-12 flex flex-col md:flex-row gap-6 items-center">
        <div className="w-full md:w-1/2">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
        <div className="w-full md:w-1/2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <CategoryFilter selected={selected} setSelected={setSelected} />
        </div>
      </div>

      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-3xl mt-8">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-2xl font-bold text-white mb-2">No stories found</h3>
          <p className="text-slate-400">Try adjusting your search or category filter.</p>
        </div>
      )}

    </div>
  );
}

export default Stories;
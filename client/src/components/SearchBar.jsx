import { Search } from "lucide-react";

function SearchBar({ search, setSearch }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder="Search for a story..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-black/20 border border-white/10 rounded-full py-4 pl-12 pr-6 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
      />
    </div>
  );
}

export default SearchBar;
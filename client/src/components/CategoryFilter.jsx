function CategoryFilter({ selected, setSelected }) {
  const categories = [
    "All",
    "Prophets",
    "Seerah",
    "Sahaba",
    "Islamic Values"
  ];

  return (
    <div className="flex gap-2 min-w-max">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelected(cat)}
          className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
            selected === cat
              ? "bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
              : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/5"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
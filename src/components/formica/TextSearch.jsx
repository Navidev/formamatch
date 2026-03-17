import { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function TextSearch({ onSearch, loading }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="flex gap-3"
    >
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="לדוגמה: אלון בהיר וחמים, שיש לבן, אפור כהה מאט..."
        className="flex-1 bg-stone-900/50 border border-stone-700/40 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700/50 focus:bg-stone-900/70 transition-all"
        dir="rtl"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-stone-100 font-bold text-sm rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20 whitespace-nowrap"
      >
        <Search className="w-4 h-4" />
        חפש
      </button>
    </motion.form>
  );
}
import { motion } from "framer-motion";
import ResultCard from "./ResultCard";

export default function ResultsGrid({ results }) {
  if (!results.length) return null;

  const maxScore = results[0]?.score || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700/40 to-transparent" />
        <span className="text-sm font-semibold text-amber-500/80">
          {results.length} פורמייקות מתאימות
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700/40 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((item, i) => (
          <ResultCard key={item.code} item={item} index={i} maxScore={maxScore} />
        ))}
      </div>
    </motion.div>
  );
}
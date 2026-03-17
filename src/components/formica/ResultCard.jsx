import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { FALLBACK_IMG } from "@/lib/formicaCatalog";

export default function ResultCard({ item, index }) {
  const pct = item.similarity ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 ${
        index === 0
          ? "bg-stone-900/60 border border-amber-700/40 ring-1 ring-amber-800/20"
          : "bg-stone-900/40 border border-stone-800/40"
      }`}
    >
      {index === 0 && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-gradient-to-r from-amber-700 to-amber-800 text-[10px] font-bold text-stone-100 rounded-full shadow-lg">
          הכי מתאים ✓
        </div>
      )}

      <div className="flex">
        <div className="relative w-24 flex-shrink-0 overflow-hidden">
          <img
            src={item.img || FALLBACK_IMG}
            alt={item.code}
            className="w-full h-full min-h-[130px] object-cover transition-transform duration-500 group-hover:scale-110"
            onError={e => { e.target.src = FALLBACK_IMG; }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-stone-900/50 to-transparent" />
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between min-h-[130px]">
          <div>
            <p className="font-mono text-sm font-bold text-stone-100 tracking-wide mb-2">
              {item.code}
            </p>

            {/* Similarity bar */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <span>דמיון ויזואלי</span>
                <span className={`font-mono font-semibold ${pct >= 85 ? "text-amber-500" : "text-stone-500"}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-stone-800/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.07, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-700"
                />
              </div>
            </div>

            {/* AI reason */}
            {item.reason && (
              <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
                {item.reason}
              </p>
            )}
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-amber-500/80 border border-amber-800/25 rounded-lg hover:bg-amber-900/20 hover:text-amber-400 transition-all self-start"
          >
            פרטים באתר
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
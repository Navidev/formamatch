import { motion } from "framer-motion";
import { categoryLabel, toneLabel, warmthLabel } from "@/lib/formicaMatch";
import { Palette, Sun, Layers, Thermometer } from "lucide-react";

const tagIcons = {
  color: Palette,
  tone: Sun,
  category: Layers,
  warmth: Thermometer,
};

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null;

  const tags = [
    { key: "color", icon: "color", label: analysis.color },
    { key: "tone", icon: "tone", label: toneLabel(analysis.tone) },
    { key: "category", icon: "category", label: categoryLabel(analysis.category) },
    { key: "warmth", icon: "warmth", label: warmthLabel(analysis.warmth) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-stone-900/50 border border-stone-800/60 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
          ניתוח התמונה
        </span>
      </div>

      <p className="text-stone-200 text-sm leading-relaxed mb-5">
        {analysis.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {tags.map(({ key, icon, label }) => {
          const Icon = tagIcons[icon];
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-900/15 border border-amber-800/20 text-xs text-amber-400/90 font-medium"
            >
              <Icon className="w-3 h-3" />
              {label}
            </span>
          );
        })}
        {analysis.keywords?.map(k => (
          <span
            key={k}
            className="inline-flex items-center px-3 py-1.5 rounded-full bg-stone-800/40 border border-stone-700/30 text-xs text-stone-400 font-medium"
          >
            {k}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
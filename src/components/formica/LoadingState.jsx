import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <Loader2 className="w-8 h-8 text-amber-600/70 animate-spin mb-4" />
      <p className="text-stone-400 text-sm">מנתח ומשווה לכל הפורמייקות...</p>
    </motion.div>
  );
}
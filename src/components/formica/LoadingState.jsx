import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingState({ step = 1 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-4"
    >
      <Loader2 className="w-8 h-8 text-amber-600/70 animate-spin" />
      <div className="flex flex-col items-center gap-2">
        <p className="text-stone-400 text-sm">
          {step === 1 ? "שלב 1/2 — מנתח תמונה ומחפש מועמדים..." : "שלב 2/2 — משווה ויזואלית לתמונות הקטלוג..."}
        </p>
        <div className="flex gap-1.5">
          <div className={`h-1 w-12 rounded-full ${step >= 1 ? "bg-amber-600" : "bg-stone-700"}`} />
          <div className={`h-1 w-12 rounded-full ${step >= 2 ? "bg-amber-600" : "bg-stone-700"}`} />
        </div>
      </div>
    </motion.div>
  );
}

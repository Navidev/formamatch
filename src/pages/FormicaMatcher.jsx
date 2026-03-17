import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { FORMICA_CATALOG } from "@/lib/formicaCatalog";
import { matchFormica } from "@/lib/formicaMatch";
import UploadZone from "@/components/formica/UploadZone";
import AnalysisPanel from "@/components/formica/AnalysisPanel";
import ResultsGrid from "@/components/formica/ResultsGrid";
import LoadingState from "@/components/formica/LoadingState";

const SYSTEM_PROMPT = `You are an expert at matching formica materials. The user uploads an image of formica or a material they want to match.

Your task: Analyze the image and describe the visual characteristics in a structured way.

Return JSON only (no markdown) with this structure:
{
  "description": "Brief description of what you see (in Hebrew)",
  "color": "main color name in English (e.g. grey, brown, oak, white, black, beige)",
  "tone": "bright/medium/dark",
  "category": "solid/wood/stone/metal/pattern",
  "warmth": "warm/cool/neutral",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}

Keywords should be in English and match common material descriptors like: oak, walnut, marble, matte, glossy, grain, natural, rustic, modern, etc.`;

export default function FormicaMatcher() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [fileObj, setFileObj] = useState(null);

  const handleFileSelect = useCallback((file) => {
    const url = URL.createObjectURL(file);
    setImage(url);
    setFileObj(file);
    setResults([]);
    setAnalysis(null);
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setImage(null);
    setFileObj(null);
    setResults([]);
    setAnalysis(null);
    setError(null);
  }, []);

  const handleAnalyze = async () => {
    if (!fileObj) return;
    setLoading(true);
    setError(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObj });

    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: SYSTEM_PROMPT + "\n\nAnalyze the formica or material in the image and return JSON only.",
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          description: { type: "string" },
          color: { type: "string" },
          tone: { type: "string", enum: ["bright", "medium", "dark"] },
          category: { type: "string", enum: ["solid", "wood", "stone", "metal", "pattern"] },
          warmth: { type: "string", enum: ["warm", "cool", "neutral"] },
          keywords: { type: "array", items: { type: "string" } },
        },
        required: ["description", "color", "tone", "category", "warmth", "keywords"],
      },
    });

    setAnalysis(parsed);
    setResults(matchFormica(parsed));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-950" dir="rtl">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
      <style>{`body { font-family: 'Heebo', sans-serif; }`}</style>

      {/* Header */}
      <header className="border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <span className="text-base">🪵</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-100 tracking-tight">מתאם פורמייקה</h1>
              <p className="text-[11px] text-stone-600">מקור הפורמייקה — חיפוש חכם לפי תמונה</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-600 font-mono" dir="ltr">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-700/60" />
            {FORMICA_CATALOG.length} פורמייקות
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <UploadZone
          image={image}
          onFileSelect={handleFileSelect}
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          loading={loading}
        />

        <AnimatePresence mode="wait">
          {loading && <LoadingState key="loading" />}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-red-950/30 border border-red-900/30 px-5 py-4 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {analysis && !loading && <AnalysisPanel analysis={analysis} />}
        {results.length > 0 && !loading && <ResultsGrid results={results} />}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-stone-900/60">
          <p className="text-[11px] text-stone-700">
            הצבעים המוצגים עשויים להיות שונים מהמוצר בפועל • לאישור סופי מומלץ להזמין דוגמה פיזית
          </p>
        </div>
      </main>
    </div>
  );
}
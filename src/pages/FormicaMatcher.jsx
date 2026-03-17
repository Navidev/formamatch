import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { FORMICA_CATALOG } from "@/lib/formicaCatalog";
import { CATALOG_FOR_PROMPT } from "@/lib/formicaCatalogPrompt";
import UploadZone from "@/components/formica/UploadZone";
import AnalysisPanel from "@/components/formica/AnalysisPanel";
import ResultsGrid from "@/components/formica/ResultsGrid";
import LoadingState from "@/components/formica/LoadingState";
import TextSearch from "@/components/formica/TextSearch";

const SYSTEM_PROMPT = `אתה מומחה להתאמת פורמייקה עם ניסיון של 20 שנה.
המשתמש מעלה תמונה של פורמייקה או חומר שהוא רוצה להתאים.

להלן רשימת כל הפורמייקות הזמינות בפורמט: קוד|תיאור
${CATALOG_FOR_PROMPT}

המשימה שלך:
1. נתח לעומק את התמונה — צבע, גוון, טקסטורה, חום/קור, בהירות
2. השווה ויזואלית לכל הפורמייקות ברשימה
3. בחר את 6 הפורמייקות הכי קרובות ויזואלית

החזר JSON בלבד (ללא markdown):
{
  "description": "תיאור מפורט של מה שרואים בתמונה",
  "color": "שם הצבע הראשי בעברית",
  "tone": "bright/medium/dark",
  "category": "solid/wood/stone/metal/pattern",
  "warmth": "warm/cool/neutral",
  "matches": [
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 95},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 88},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 82},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 75},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 70},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 65}
  ]
}

חשוב: השתמש אך ורק בקודים שמופיעים ברשימה. similarity הוא אחוז דמיון 0-100.`;

export default function FormicaMatcher() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [mode, setMode] = useState("image"); // "image" | "text"

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

  const runLLM = async (promptText, fileUrl = null) => {
    console.log("runLLM called, fileUrl:", fileUrl ? "exists" : "null", "promptText length:", promptText?.length);
    setLoading(true);
    setError(null);
    try {
      const params = {
        prompt: promptText,
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            color: { type: "string" },
            tone: { type: "string", enum: ["bright", "medium", "dark"] },
            category: { type: "string", enum: ["solid", "wood", "stone", "metal", "pattern"] },
            warmth: { type: "string", enum: ["warm", "cool", "neutral"] },
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  reason: { type: "string" },
                  similarity: { type: "number" },
                },
                required: ["code", "reason", "similarity"],
              },
            },
          },
          required: ["description", "color", "tone", "category", "warmth", "matches"],
        },
      };
      if (fileUrl) params.file_urls = [fileUrl];

      const parsed = await base44.integrations.Core.InvokeLLM(params);
      setAnalysis(parsed);

      const matched = (parsed.matches || []).map(m => {
        const entry = FORMICA_CATALOG.find(c => c.code === m.code);
        return entry ? { ...entry, reason: m.reason, similarity: m.similarity } : null;
      }).filter(Boolean);
      setResults(matched);
    } catch (err) {
      setError("שגיאה: " + (err?.message || "אנא נסה שוב"));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileObj) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObj });
      await runLLM(SYSTEM_PROMPT + "\n\nנתח את התמונה ומצא את ההתאמות הכי מדויקות מהרשימה. החזר JSON בלבד.", file_url);
    } catch (err) {
      setError("שגיאה בהעלאת התמונה: " + (err?.message || "אנא נסה שוב"));
      setLoading(false);
    }
  };

  const handleTextSearch = async (query) => {
    const textPrompt = `אתה מומחה להתאמת פורמייקה.

להלן רשימת כל הפורמייקות הזמינות בפורמט: קוד|תיאור
${CATALOG_FOR_PROMPT}

המשתמש מחפש: "${query}"

המשימה שלך:
1. הבן מה המשתמש מחפש — צבע, סגנון, טקסטורה, גוון
2. בחר את 6 הפורמייקות הכי מתאימות מהרשימה
3. דרג לפי דמיון ל-${query}

החזר JSON בלבד (ללא markdown):
{
  "description": "תיאור מה המשתמש מחפש",
  "color": "שם הצבע בעברית",
  "tone": "bright/medium/dark",
  "category": "solid/wood/stone/metal/pattern",
  "warmth": "warm/cool/neutral",
  "matches": [
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 95},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 88},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 82},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 75},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 70},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 65}
  ]
}

חשוב: השתמש אך ורק בקודים שמופיעים ברשימה.`;

    setAnalysis(null);
    setResults([]);
    await runLLM(textPrompt);
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
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Mode switcher */}
        <div className="flex items-center gap-1 p-1 bg-stone-900/60 border border-stone-800/40 rounded-xl w-fit">
          {[
            { key: "image", label: "העלאת תמונה", icon: "📷" },
            { key: "text", label: "חיפוש טקסטואלי", icon: "🔤" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setResults([]); setAnalysis(null); setError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === key
                  ? "bg-amber-800/40 text-amber-300 border border-amber-700/30"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {mode === "image" ? (
          <UploadZone
            image={image}
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            loading={loading}
          />
        ) : (
          <TextSearch onSearch={handleTextSearch} loading={loading} />
        )}

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
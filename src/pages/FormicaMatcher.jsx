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

const STAGE1_PROMPT = `אתה מומחה להתאמת פורמייקה עם ניסיון של 20 שנה.
המשתמש מעלה תמונה של פורמייקה או חומר שהוא רוצה להתאים.

להלן רשימת כל הפורמייקות הזמינות בפורמט: קוד|תיאור
${CATALOG_FOR_PROMPT}

המשימה שלך:
1. נתח לעומק את התמונה — קטגוריה (עץ/אבן/מתכת/אחיד/דוגמה), צבע, גוון, טקסטורה, חום/קור, בהירות
2. זהה את הקטגוריה הויזואלית המדויקת: **אם רואים עץ — בחר רק עץ. אם אבן — רק אבן. אם אחיד — רק אחיד.**
3. בחר **12 מועמדים** הכי קרובים מהרשימה — לפי קטגוריה קודם, אחר כך לפי צבע וגוון

החזר JSON בלבד (ללא markdown):
{
  "description": "תיאור מפורט של מה שרואים בתמונה",
  "color": "שם הצבע הראשי בעברית",
  "tone": "bright/medium/dark",
  "category": "solid/wood/stone/metal/pattern",
  "warmth": "warm/cool/neutral",
  "matches": [
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 90},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 88},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 85},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 82},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 80},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 78},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 75},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 73},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 70},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 68},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 65},
    {"code": "XXXX XX", "reason": "סיבה קצרה בעברית", "similarity": 62}
  ]
}

חשוב: השתמש אך ורק בקודים שמופיעים ברשימה. החזר בדיוק 12 מועמדים.`;

const TEXT_SEARCH_PROMPT = (query) => `אתה מומחה להתאמת פורמייקה.

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

const RESPONSE_SCHEMA_FULL = {
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
};

const RESPONSE_SCHEMA_MATCHES_ONLY = {
  type: "object",
  properties: {
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
  required: ["matches"],
};

export default function FormicaMatcher() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [mode, setMode] = useState("image");

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

  const toJpeg = (file) => new Promise((resolve, reject) => {
    const isHeic = /heic|heif/i.test(file.name || "") || /heic|heif/i.test(file.type || "");
    const isJpegOrPng = /jpeg|jpg|png|webp/i.test(file.type || "") || /\.(jpe?g|png|webp)$/i.test(file.name || "");

    // If it's a standard image format, just force the type and return directly
    if (isJpegOrPng && !isHeic) {
      resolve(new File([file], "image.jpg", { type: "image/jpeg" }));
      return;
    }

    // For HEIC or unknown types, use canvas conversion
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("לא ניתן לקרוא את הקובץ"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("לא ניתן לטעון את התמונה"));
      img.onload = () => {
        const MAX_PX = 2048;
        const scale = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const bstr = atob(dataUrl.split(",")[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        resolve(new File([u8arr], "image.jpg", { type: "image/jpeg" }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleAnalyze = async () => {
    if (!fileObj) return;
    setLoading(true);
    setLoadingStep(1);
    setError(null);
    setAnalysis(null);
    setResults([]);

    try {
      const jpegFile = await toJpeg(fileObj);
      console.log("jpegFile name:", jpegFile.name, "type:", jpegFile.type, "size:", jpegFile.size);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: jpegFile });

      // Stage 1: text-based analysis → 12 candidates
      console.log("Stage 1: analyzing image text...");
      const stage1Raw = await base44.integrations.Core.InvokeLLM({
        prompt: STAGE1_PROMPT + "\n\nנתח את התמונה ומצא 12 מועמדים. החזר JSON בלבד.",
        model: "claude_sonnet_4_6",
        file_urls: [file_url],
        response_json_schema: RESPONSE_SCHEMA_FULL,
      });
      const stage1 = stage1Raw?.response || stage1Raw;
      console.log("Stage 1 result:", JSON.stringify(stage1).substring(0, 300));

      // Map 12 candidates to catalog entries (only those with images)
      const candidates = (stage1.matches || [])
        .slice(0, 12)
        .map(m => FORMICA_CATALOG.find(c => c.code === m.code))
        .filter(c => c && c.img);

      if (candidates.length === 0) {
        throw new Error("לא נמצאו מועמדים בשלב 1");
      }

      // Stage 2: visual comparison — original image + catalog images
      setLoadingStep(2);
      console.log("Stage 2: visual comparison with", candidates.length, "candidates...");

      const candidateList = candidates
        .map((c, i) => `תמונה ${i + 2}: קוד ${c.code}`)
        .join("\n");

      const stage2Prompt = `אתה מומחה להתאמת פורמייקה עם עין ויזואלית מדויקת.

התמונה הראשונה היא הפורמייקה שהנגר מחפש להתאים.
התמונות הבאות הן מועמדות מהקטלוג:
${candidateList}

המשימה: השווה ויזואלית כל מועמדת לתמונה הראשונה.
בחר בדיוק 6 הדומות ביותר — לפי צבע, גוון, מרקם וסגנון.
פסול מועמדות שקטגוריה שלהן שונה (למשל אבן כשהמקור הוא עץ).

החזר JSON בלבד:
{
  "matches": [
    {"code": "XXXX XX", "reason": "סיבה ויזואלית קצרה בעברית", "similarity": 95},
    {"code": "XXXX XX", "reason": "סיבה ויזואלית קצרה בעברית", "similarity": 88},
    {"code": "XXXX XX", "reason": "סיבה ויזואלית קצרה בעברית", "similarity": 82},
    {"code": "XXXX XX", "reason": "סיבה ויזואלית קצרה בעברית", "similarity": 75},
    {"code": "XXXX XX", "reason": "סיבה ויזואלית קצרה בעברית", "similarity": 70},
    {"code": "XXXX XX", "reason": "סיבה ויזואלית קצרה בעברית", "similarity": 65}
  ]
}`;

      const allImageUrls = [file_url, ...candidates.map(c => c.img).filter(Boolean)];
      const stage2Raw = await base44.integrations.Core.InvokeLLM({
        prompt: stage2Prompt,
        model: "claude_sonnet_4_6",
        file_urls: allImageUrls,
        response_json_schema: RESPONSE_SCHEMA_MATCHES_ONLY,
      });
      const stage2 = stage2Raw?.response || stage2Raw;
      console.log("Stage 2 result:", JSON.stringify(stage2).substring(0, 300));

      setAnalysis(stage1);

      const matched = (stage2.matches || [])
        .map(m => {
          const entry = FORMICA_CATALOG.find(c => c.code === m.code);
          return entry ? { ...entry, reason: m.reason, similarity: m.similarity } : null;
        })
        .filter(Boolean);

      setResults(matched);
    } catch (err) {
      console.log("Error:", err?.message, err);
      setError("שגיאה: " + (err?.message || "אנא נסה שוב"));
    } finally {
      setLoading(false);
    }
  };

  const handleTextSearch = async (query) => {
    setAnalysis(null);
    setResults([]);
    setLoading(true);
    setLoadingStep(1);
    setError(null);
    try {
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: TEXT_SEARCH_PROMPT(query),
        model: "claude_sonnet_4_6",
        response_json_schema: RESPONSE_SCHEMA_FULL,
      });
      const parsed = raw?.response || raw;
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

  return (
    <div className="min-h-screen bg-stone-950" dir="rtl">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
      <style>{`body { font-family: 'Heebo', sans-serif; }`}</style>

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

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
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
          {loading && <LoadingState key="loading" step={loadingStep} />}
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

        <div className="text-center pt-8 border-t border-stone-900/60">
          <p className="text-[11px] text-stone-700">
            הצבעים המוצגים עשויים להיות שונים מהמוצר בפועל • לאישור סופי מומלץ להזמין דוגמה פיזית
          </p>
        </div>
      </main>
    </div>
  );
}
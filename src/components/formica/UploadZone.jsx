import { useState, useRef, useCallback } from "react";
import { Upload, Camera, RefreshCw, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadZone({ image, onFileSelect, onAnalyze, onReset, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const processFile = useCallback((file) => {
    console.log("processFile:", file?.name, "type:", file?.type, "size:", file?.size);
    if (!file) return;
    // On iPhone, HEIC files often have empty type — allow all files from the picker
    const isImage = file.type.startsWith("image/") || file.name?.match(/\.(jpe?g|png|webp|heic|heif)$/i) || file.type === "";
    if (!isImage) return;
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
        dragOver
          ? "border-amber-600/60 bg-amber-950/20"
          : image
            ? "border-stone-700/40 bg-stone-900/30"
            : "border-stone-700/30 bg-stone-900/20"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={e => processFile(e.target.files[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => processFile(e.target.files[0])}
      />

      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 px-6 gap-5"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-900/30 to-stone-800/30 border border-stone-700/30 flex items-center justify-center">
              <Camera className="w-8 h-8 text-amber-600/70" />
            </div>

            {/* Two buttons for mobile */}
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-800/30 border border-amber-700/30 text-amber-300 hover:bg-amber-800/50 transition-all text-sm font-medium"
              >
                <Camera className="w-5 h-5" />
                <span>צלם</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-stone-800/50 border border-stone-700/30 text-stone-300 hover:bg-stone-800 transition-all text-sm font-medium"
              >
                <FolderOpen className="w-5 h-5" />
                <span>גלריה / קובץ</span>
              </button>
            </div>

            <p className="text-sm text-stone-500 max-w-xs text-center">
              צלם תמונה חדשה, או בחר קובץ JPEG/PNG מה-Files
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col sm:flex-row items-center gap-6 p-8"
          >
            <div className="relative group">
              <img
                src={image}
                alt="uploaded"
                className="w-32 h-44 object-cover rounded-xl border-2 border-stone-700/40 shadow-2xl"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="flex items-center gap-2 text-amber-500">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">תמונה הועלתה בהצלחה</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                disabled={loading}
                className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-stone-100 font-bold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20 hover:shadow-amber-800/30 hover:-translate-y-0.5"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                )}
                {loading ? "מנתח..." : "מצא פורמייקות מתאימות"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                className="text-xs text-stone-500 hover:text-amber-500 transition-colors underline underline-offset-2"
              >
                החלף תמונה
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
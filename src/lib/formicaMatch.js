import { FORMICA_CATALOG } from "./formicaCatalog";

export function matchFormica(analysisData) {
  const { color, tone, category, warmth, keywords } = analysisData;
  const searchTerms = [color, tone, category, warmth, ...(keywords || [])]
    .map(t => t?.toLowerCase())
    .filter(Boolean);

  const scored = FORMICA_CATALOG.map(item => {
    const haystack = (item.tags + " " + item.code).toLowerCase();
    let score = 0;
    searchTerms.forEach(term => {
      if (haystack.includes(term)) score += term.length > 4 ? 3 : 1;
    });
    if (category === "wood" && item.tags.includes("wood")) score += 5;
    if (category === "stone" && (item.tags.includes("stone") || item.tags.includes("marble"))) score += 5;
    if (category === "solid" && !item.tags.includes("wood") && !item.tags.includes("stone") && !item.tags.includes("pattern")) score += 3;
    if (tone === "dark" && item.tags.includes("dark")) score += 3;
    if (tone === "bright" && item.tags.includes("light")) score += 3;
    if (warmth === "warm" && item.tags.includes("warm")) score += 2;
    if (warmth === "cool" && item.tags.includes("cool")) score += 2;
    return { ...item, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 6);
}

export const categoryLabel = (c) => ({ solid: "אחיד", wood: "עץ", stone: "אבן/שיש", metal: "מתכת", pattern: "דוגמה" }[c] || c);
export const toneLabel = (t) => ({ bright: "בהיר", medium: "בינוני", dark: "כהה" }[t] || t);
export const warmthLabel = (w) => ({ warm: "חמים", cool: "קר", neutral: "ניטרלי" }[w] || w);
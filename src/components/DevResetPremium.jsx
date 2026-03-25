import React from "react";
import { usePremium } from "@/lib/PremiumContext";
import { RotateCcw } from "lucide-react";

// Detecta ambiente de preview/dev pelo hostname
const IS_DEV = (() => {
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host.includes("base44.com") ||
    host.includes("127.0.0.1") ||
    host.includes(".preview.") ||
    import.meta.env.DEV === true
  );
})();

export default function DevResetPremium() {
  const { devResetTrial } = usePremium();

  if (!IS_DEV) return null;

  return (
    <div className="flex justify-center mt-2">
      <button
        onClick={devResetTrial}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border/60 text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-colors"
        title="Dev only — não aparece em produção"
      >
        <RotateCcw className="w-3 h-3" />
        Resetar teste premium
      </button>
    </div>
  );
}
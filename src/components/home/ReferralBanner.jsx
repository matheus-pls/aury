import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Share2, Check, X } from "lucide-react";

const SHARE_TEXT = `Oi! Estou usando o Aury para organizar minhas finanças e tá sendo muito bom.\n\nÉ gratuito e bem simples de usar. Acho que você ia gostar! 👉 aury.app`;

export default function ReferralBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("aury_referral_dismissed") === "1"; } catch { return false; }
  });
  const [shared, setShared] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem("aury_referral_dismissed", "1"); } catch {}
    setDismissed(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: SHARE_TEXT }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(SHARE_TEXT);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl p-4"
      style={{
        background: "hsl(220,13%,11%)",
        border: "1px solid rgba(95,189,189,0.15)",
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl flex-shrink-0" style={{ background: "rgba(95,189,189,0.12)" }}>
          <Users className="w-4 h-4 text-[#5FBDBD]" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-foreground">Conhece alguém que também quer organizar a vida financeira?</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            Compartilha o Aury com quem você quer bem. É gratuito.
          </p>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition-all hover:opacity-90 active:scale-95 text-white"
            style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
          >
            {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {shared ? "Link copiado!" : "Indicar o Aury"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
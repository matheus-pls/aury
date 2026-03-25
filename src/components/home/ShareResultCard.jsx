import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, TrendingUp, X } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function buildShareText({ balance, totalIncome, spentPct, userName }) {
  const name = userName ? `, ${userName}` : "";
  if (balance > 0 && spentPct <= 75) {
    return `🎯 Esse mês eu guardei ${fmt(balance)} usando o Aury!\nControle financeiro sem complicação. Experimenta: aury.app`;
  }
  if (balance > 0) {
    return `💚 Fechei o mês com ${fmt(balance)} no positivo!\nO Aury me ajudou a organizar tudo. Experimenta: aury.app`;
  }
  return `📊 Estou cuidando das minhas finanças com o Aury.\nVocê também deveria experimentar: aury.app`;
}

function buildAchievement({ balance, totalIncome, spentPct }) {
  if (spentPct <= 60) return { emoji: "🏆", label: "Mestre da Economia", sub: `Gastou só ${spentPct.toFixed(0)}% da renda esse mês` };
  if (balance > totalIncome * 0.2) return { emoji: "💰", label: "Meta Batida!", sub: `Guardou ${fmt(balance)} esse mês` };
  if (spentPct <= 80) return { emoji: "✅", label: "No Controle", sub: `Fechando o mês no positivo` };
  return null;
}

export default function ShareResultCard({ balance, totalIncome, spentPct, userName }) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const achievement = buildAchievement({ balance, totalIncome, spentPct });

  // Só mostra se houver conquista real e saldo positivo
  if (!achievement || balance <= 0 || dismissed) return null;

  const shareText = buildShareText({ balance, totalIncome, spentPct, userName });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl overflow-hidden p-5"
          style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(95,189,189,0.06))",
            border: "1px solid rgba(52,211,153,0.2)",
          }}
        >
          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{achievement.emoji}</span>
            <div>
              <p className="font-bold text-foreground text-sm">{achievement.label}</p>
              <p className="text-xs text-muted-foreground">{achievement.sub}</p>
            </div>
          </div>

          {/* Preview do card de compartilhamento */}
          <div
            className="rounded-xl p-3 mb-4 text-xs text-muted-foreground leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />
            {shareText.split("\n")[0]}
          </div>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #34D399, #059669)" }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copiado!" : "Compartilhar conquista"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
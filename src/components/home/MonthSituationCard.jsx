import React from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingDown, TrendingUp, Minus } from "lucide-react";

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function MonthSituationCard({ balance, totalIncome, totalExpenses, spentPct }) {
  const isPositive = balance > 0;
  const isNegative = balance < 0;
  const isWarning = spentPct >= 80 && balance >= 0;

  const statusConfig = isNegative
    ? {
        label: "Você passou do limite",
        interpretation: "Risco de fechar no negativo",
        interpretColor: "#F87171",
        bg: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)",
        barColor: "#F87171",
        Icon: TrendingDown,
      }
    : isWarning
    ? {
        label: "Atenção — quase no limite",
        interpretation: "Atenção aos seus gastos",
        interpretColor: "#FCD34D",
        bg: "linear-gradient(135deg, #1c1500 0%, #422006 100%)",
        barColor: "#FCD34D",
        Icon: Minus,
      }
    : {
        label: "Sobrou esse mês",
        interpretation: "Você está no controle",
        interpretColor: "#34D399",
        bg: "linear-gradient(135deg, #052e16 0%, #064e3b 100%)",
        barColor: "#34D399",
        Icon: TrendingUp,
      };

  const StatusIcon = statusConfig.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl p-6 text-white shadow-xl overflow-hidden"
      style={{ background: statusConfig.bg }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Situação do mês</p>
          <p className="text-white/80 text-sm">{statusConfig.label}</p>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
          <StatusIcon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Balance */}
      <div className="mb-5">
        <h2
          className="text-4xl font-bold tabular-nums"
          style={{ color: statusConfig.interpretColor }}
        >
          {formatCurrency(balance)}
        </h2>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Você gastou <span className="font-semibold text-white/80">{spentPct.toFixed(0)}% do que ganha</span></span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(spentPct, 100)}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: statusConfig.barColor }}
          />
        </div>
      </div>

      {/* In/Out */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div>
          <p className="text-white/50 text-xs mb-0.5">Entradas</p>
          <p className="text-base font-semibold tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-0.5">Saídas</p>
          <p className="text-base font-semibold tabular-nums">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Interpretation badge */}
      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: statusConfig.interpretColor }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig.interpretColor }} />
        {statusConfig.interpretation}
      </div>
    </motion.div>
  );
}
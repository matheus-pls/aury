import React from "react";
import { TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function MonthProgress({ balance, totalIncome }) {
  const saved = Math.max(balance, 0);
  const goal = totalIncome > 0 ? totalIncome * 0.2 : 0;
  const pct = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;

  if (totalIncome === 0) return null;

  const statusColor =
    pct >= 100 ? "#34D399" : pct >= 50 ? "#5FBDBD" : pct >= 20 ? "#FBBF24" : "#A1A1AA";

  const statusMessage =
    pct >= 100
      ? "🎉 Meta batida! Você está guardando o suficiente."
      : pct >= 75
      ? `Quase lá! Só faltam ${fmt(goal - saved)} para bater a meta.`
      : pct >= 50
      ? `Na metade do caminho — continue assim!`
      : pct >= 20
      ? `Você já guardou ${pct.toFixed(0)}% da meta. Cada real conta.`
      : `Meta: guardar 20% da sua renda. Faltam ${fmt(goal - saved)}.`;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ background: `${statusColor}15` }}>
          <TrendingUp className="w-4 h-4" style={{ color: statusColor }} />
        </div>
        <p className="font-semibold text-sm text-foreground">Progresso do Mês</p>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${statusColor}18`, color: statusColor }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Guardado até agora</p>
          <p className="text-2xl font-bold text-foreground">{fmt(saved)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Meta do mês</p>
          <div className="flex items-center gap-1 justify-end">
            <Target className="w-3 h-3 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">{fmt(goal)}</p>
          </div>
        </div>
      </div>

      {/* Barra de progresso com cor dinâmica */}
      <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${statusColor}99, ${statusColor})` }}
        />
      </div>

      <p className="text-xs leading-snug" style={{ color: statusColor }}>
        {statusMessage}
      </p>
    </div>
  );
}
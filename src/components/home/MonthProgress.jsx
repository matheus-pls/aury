import React from "react";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function MonthProgress({ balance, totalIncome }) {
  const saved = Math.max(balance, 0);
  const goal = totalIncome > 0 ? totalIncome * 0.2 : 0; // 20% da renda como meta de poupança
  const pct = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;

  if (totalIncome === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-[#5FBDBD]/10 rounded-lg">
          <TrendingUp className="w-4 h-4 text-[#5FBDBD]" />
        </div>
        <p className="font-semibold text-sm text-foreground">Progresso do Mês</p>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Guardado até agora</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(saved)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Meta (20% da renda)</p>
          <p className="text-sm font-semibold text-muted-foreground">{formatCurrency(goal)}</p>
        </div>
      </div>

      <Progress value={pct} className="h-2" />

      <p className="text-xs text-muted-foreground mt-2">
        {pct >= 100
          ? "🎉 Meta de poupança atingida!"
          : pct >= 50
          ? `Você já guardou ${pct.toFixed(0)}% da meta — continue!`
          : `Faltam ${formatCurrency(goal - saved)} para atingir a meta`}
      </p>
    </div>
  );
}
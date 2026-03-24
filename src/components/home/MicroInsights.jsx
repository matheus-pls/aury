import React from "react";
import { Lightbulb } from "lucide-react";

export default function MicroInsights({ expenses, totalIncome }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();

  const currentTotal = expenses
    .filter((e) => e.month_year === currentMonth)
    .reduce((s, e) => s + e.amount, 0);

  const prevTotal = expenses
    .filter((e) => e.month_year === prevMonth)
    .reduce((s, e) => s + e.amount, 0);

  const superfluousTotal = expenses
    .filter((e) => e.category === "superfluous")
    .reduce((s, e) => s + e.amount, 0);

  const superfluousBudget = totalIncome * 0.1;

  const insights = [];

  if (prevTotal > 0 && currentTotal > 0) {
    const diff = ((currentTotal - prevTotal) / prevTotal) * 100;
    if (Math.abs(diff) >= 5) {
      insights.push(
        diff > 0
          ? `Seus gastos aumentaram ${diff.toFixed(0)}% em relação ao mês passado.`
          : `Seus gastos caíram ${Math.abs(diff).toFixed(0)}% em relação ao mês passado. Ótimo!`
      );
    }
  }

  if (superfluousBudget > 0 && superfluousTotal > superfluousBudget * 0.7) {
    insights.push("Você está gastando mais em supérfluos essa semana. Fique de olho!");
  }

  if (totalIncome > 0 && currentTotal < totalIncome * 0.5) {
    insights.push("Você usou menos da metade da renda. Considere guardar o restante.");
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-500/10 rounded-lg">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <p className="font-semibold text-sm text-foreground">Insights</p>
      </div>
      <div className="space-y-2">
        {insights.slice(0, 2).map((insight, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
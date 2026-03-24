import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Zap } from "lucide-react";

export default function SmartAlert({ spentPct, expensesByCategory, totalIncome }) {
  const superfluous = expensesByCategory.superfluous || 0;
  const superfluousBudget = totalIncome * 0.1;
  const superfluousPct = superfluousBudget > 0 ? (superfluous / superfluousBudget) * 100 : 0;

  const getAlert = () => {
    if (totalIncome === 0) return null;

    if (spentPct > 100) {
      return {
        icon: XCircle,
        color: "bg-red-500/10 border-red-500/30 text-red-400",
        iconColor: "text-red-400",
        dot: "bg-red-500",
        message: "Você passou do seu orçamento esse mês. Hora de frear os gastos.",
      };
    }
    if (spentPct > 85) {
      return {
        icon: AlertTriangle,
        color: "bg-orange-500/10 border-orange-500/30 text-orange-400",
        iconColor: "text-orange-400",
        dot: "bg-orange-500",
        message: "Se continuar nesse ritmo, você pode estourar o mês antes do fim.",
      };
    }
    if (superfluousPct > 90) {
      return {
        icon: AlertTriangle,
        color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
        iconColor: "text-yellow-400",
        dot: "bg-yellow-500",
        message: `Você já usou ${superfluousPct.toFixed(0)}% do orçamento de supérfluos.`,
      };
    }
    if (spentPct <= 60) {
      return {
        icon: CheckCircle2,
        color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        iconColor: "text-emerald-400",
        dot: "bg-emerald-500",
        message: "Você está dentro do planejado. Continue assim!",
      };
    }
    return {
      icon: Zap,
      color: "bg-[#5FBDBD]/10 border-[#5FBDBD]/30 text-[#5FBDBD]",
      iconColor: "text-[#5FBDBD]",
      dot: "bg-[#5FBDBD]",
      message: "Atenção: você já usou mais da metade do orçamento do mês.",
    };
  };

  const alert = getAlert();
  if (!alert) return null;

  const Icon = alert.icon;

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${alert.color}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${alert.iconColor}`} />
      <p className="text-sm font-medium leading-snug">{alert.message}</p>
    </div>
  );
}
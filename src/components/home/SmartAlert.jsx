import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Zap, TrendingDown, PiggyBank, Star } from "lucide-react";
import { motion } from "framer-motion";

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Retorna o dia atual como fração do mês (0–1)
const monthProgress = () => {
  const now = new Date();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() / total;
};

function buildAlerts({ spentPct, expensesByCategory, totalIncome, balance }) {
  const alerts = [];
  const monthPct = monthProgress();

  const superfluous = expensesByCategory.superfluous || 0;
  const fixed = expensesByCategory.fixed || 0;
  const essential = expensesByCategory.essential || 0;

  const superfluousBudget = totalIncome * 0.10;
  const fixedBudget = totalIncome * 0.50;
  const essentialBudget = totalIncome * 0.15;

  const superfluousPct = superfluousBudget > 0 ? (superfluous / superfluousBudget) * 100 : 0;
  const fixedPct = fixedBudget > 0 ? (fixed / fixedBudget) * 100 : 0;
  const essentialPct = essentialBudget > 0 ? (essential / essentialBudget) * 100 : 0;

  // ── RISCO (prioridade 0 = mais alta) ─────────────────────────────────────
  if (spentPct >= 100) {
    alerts.push({
      priority: 0,
      type: "risk",
      icon: XCircle,
      bg: "bg-red-500/10",
      border: "border-red-500/25",
      iconColor: "text-red-400",
      label: "Risco",
      labelBg: "bg-red-500/20 text-red-400",
      message: `Você estourou o orçamento do mês. Evite novos gastos até o fim do mês.`,
    });
  } else if (spentPct >= 85) {
    alerts.push({
      priority: 0,
      type: "risk",
      icon: XCircle,
      bg: "bg-red-500/10",
      border: "border-red-500/25",
      iconColor: "text-red-400",
      label: "Risco",
      labelBg: "bg-red-500/20 text-red-400",
      message: `Você já usou ${spentPct.toFixed(0)}% da renda — se continuar assim, vai fechar o mês no vermelho.`,
    });
  } else if (spentPct > monthPct * 100 + 15) {
    // gastando muito mais rápido do que o mês avança
    alerts.push({
      priority: 0,
      type: "risk",
      icon: TrendingDown,
      bg: "bg-red-500/10",
      border: "border-red-500/25",
      iconColor: "text-red-400",
      label: "Risco",
      labelBg: "bg-red-500/20 text-red-400",
      message: `Você já gastou ${spentPct.toFixed(0)}% mas o mês está apenas ${(monthPct * 100).toFixed(0)}% completo.`,
    });
  }

  // ── AVISO (prioridade 1) ──────────────────────────────────────────────────
  if (superfluousPct >= 80) {
    alerts.push({
      priority: 1,
      type: "warning",
      icon: AlertTriangle,
      bg: "bg-orange-500/10",
      border: "border-orange-500/25",
      iconColor: "text-orange-400",
      label: "Aviso",
      labelBg: "bg-orange-500/20 text-orange-400",
      message: `Você já usou ${superfluousPct.toFixed(0)}% do orçamento de supérfluos. Fique de olho!`,
    });
  } else if (fixedPct >= 95) {
    alerts.push({
      priority: 1,
      type: "warning",
      icon: AlertTriangle,
      bg: "bg-orange-500/10",
      border: "border-orange-500/25",
      iconColor: "text-orange-400",
      label: "Aviso",
      labelBg: "bg-orange-500/20 text-orange-400",
      message: `Seus gastos fixos já consumiram ${fixedPct.toFixed(0)}% do orçamento previsto para eles.`,
    });
  } else if (essentialPct >= 95) {
    alerts.push({
      priority: 1,
      type: "warning",
      icon: AlertTriangle,
      bg: "bg-orange-500/10",
      border: "border-orange-500/25",
      iconColor: "text-orange-400",
      label: "Aviso",
      labelBg: "bg-orange-500/20 text-orange-400",
      message: `Seus gastos essenciais estão acima do planejado (${essentialPct.toFixed(0)}%).`,
    });
  }

  // ── OPORTUNIDADE (prioridade 2) ────────────────────────────────────────────
  if (superfluous > 0 && superfluousBudget > 0 && superfluousPct < 70) {
    const saving = superfluousBudget * 0.3;
    alerts.push({
      priority: 2,
      type: "opportunity",
      icon: PiggyBank,
      bg: "bg-[#5FBDBD]/10",
      border: "border-[#5FBDBD]/25",
      iconColor: "text-[#5FBDBD]",
      label: "Dica",
      labelBg: "bg-[#5FBDBD]/20 text-[#5FBDBD]",
      message: `Você pode economizar até ${formatCurrency(saving)} reduzindo gastos supérfluos esse mês.`,
    });
  } else if (balance > totalIncome * 0.15 && spentPct < 70) {
    alerts.push({
      priority: 2,
      type: "opportunity",
      icon: Zap,
      bg: "bg-[#5FBDBD]/10",
      border: "border-[#5FBDBD]/25",
      iconColor: "text-[#5FBDBD]",
      label: "Dica",
      labelBg: "bg-[#5FBDBD]/20 text-[#5FBDBD]",
      message: `Você tem ${formatCurrency(balance)} sobrando — que tal direcionar uma parte para a sua caixinha?`,
    });
  }

  // ── STATUS POSITIVO (prioridade 3 = mais baixa) ───────────────────────────
  if (spentPct <= 60 && monthPct >= 0.4) {
    alerts.push({
      priority: 3,
      type: "positive",
      icon: CheckCircle2,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      iconColor: "text-emerald-400",
      label: "Ótimo",
      labelBg: "bg-emerald-500/20 text-emerald-400",
      message: `Você está indo muito bem! Apenas ${spentPct.toFixed(0)}% da renda gasta até agora.`,
    });
  } else if (spentPct <= 75) {
    alerts.push({
      priority: 3,
      type: "positive",
      icon: Star,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      iconColor: "text-emerald-400",
      label: "No controle",
      labelBg: "bg-emerald-500/20 text-emerald-400",
      message: `Seus gastos estão dentro do planejado. Continue assim até o fim do mês.`,
    });
  }

  // Ordena por prioridade e retorna o mais importante
  alerts.sort((a, b) => a.priority - b.priority);
  return alerts[0] || null;
}

export default function SmartAlert({ spentPct, expensesByCategory, totalIncome, balance }) {
  if (totalIncome === 0) return null;

  const alert = buildAlerts({ spentPct, expensesByCategory, totalIncome, balance });
  if (!alert) return null;

  const Icon = alert.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 rounded-2xl border p-4 ${alert.bg} ${alert.border}`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${alert.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.labelBg}`}>
            {alert.label}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground leading-snug">{alert.message}</p>
      </div>
    </motion.div>
  );
}
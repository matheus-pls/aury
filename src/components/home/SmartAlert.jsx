import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Zap, TrendingDown, PiggyBank, Star, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const monthProgress = () => {
  const now = new Date();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() / total;
};

// Cada alerta tem: priority, type, icon, bg, border, iconColor, label, labelBg
// + messageFree (curta) + messagePremium (detalhada) + teaserFree (frase de CTA)
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

  const projectedEnd = monthPct > 0 ? (spentPct / monthPct) : spentPct;
  const possibleSaving = fmt(superfluousBudget * 0.3);

  // ── RISCO ─────────────────────────────────────────────────────────────────
  if (spentPct >= 100) {
    alerts.push({
      priority: 0, type: "risk",
      icon: TrendingDown,
      accentColor: "#F87171",
      label: "Risco",
      messageFree: "Você pode estourar o orçamento esse mês.",
      messagePremium: `Você já usou ${spentPct.toFixed(0)}% da renda. No ritmo atual vai fechar ${projectedEnd.toFixed(0)}% — ${fmt(balance < 0 ? Math.abs(balance) : 0)} no vermelho.`,
      teaserFree: "Veja exatamente quanto você pode perder no Premium",
    });
  } else if (spentPct >= 85) {
    alerts.push({
      priority: 0, type: "risk",
      icon: TrendingDown,
      accentColor: "#F87171",
      label: "Risco",
      messageFree: "Você pode estourar o orçamento esse mês.",
      messagePremium: `Você já usou ${spentPct.toFixed(0)}% da renda. No ritmo atual vai fechar o mês em ${projectedEnd.toFixed(0)}%.`,
      teaserFree: "Veja exatamente quanto você pode perder no Premium",
    });
  } else if (spentPct > monthPct * 100 + 15) {
    alerts.push({
      priority: 0, type: "risk",
      icon: TrendingDown,
      accentColor: "#FBBF24",
      label: "Atenção",
      messageFree: "Você pode estourar o orçamento esse mês.",
      messagePremium: `Você gastou ${spentPct.toFixed(0)}% com apenas ${(monthPct * 100).toFixed(0)}% do mês passado. Projeção: ${projectedEnd.toFixed(0)}% ao final.`,
      teaserFree: "Veja exatamente quanto você pode perder no Premium",
    });
  }

  // ── AVISO ─────────────────────────────────────────────────────────────────
  if (superfluousPct >= 80) {
    alerts.push({
      priority: 1, type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Aviso",
      messageFree: "Você usou grande parte do orçamento de supérfluos.",
      messagePremium: `${superfluousPct.toFixed(0)}% do orçamento de supérfluos consumido. Você pode economizar ${possibleSaving} cortando o restante.`,
      teaserFree: "Veja exatamente quanto você pode perder no Premium",
    });
  } else if (fixedPct >= 95) {
    alerts.push({
      priority: 1, type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Aviso",
      messageFree: "Seus gastos fixos estão acima do planejado.",
      messagePremium: `Gastos fixos em ${fixedPct.toFixed(0)}% do limite. Isso pressiona o restante do orçamento.`,
      teaserFree: "Veja exatamente quanto você pode perder no Premium",
    });
  } else if (essentialPct >= 95) {
    alerts.push({
      priority: 1, type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Aviso",
      messageFree: "Seus gastos essenciais estão altos esse mês.",
      messagePremium: `Essenciais em ${essentialPct.toFixed(0)}% do limite previsto. Revise seus hábitos de consumo.`,
      teaserFree: "Veja exatamente quanto você pode perder no Premium",
    });
  }

  // ── OPORTUNIDADE ──────────────────────────────────────────────────────────
  if (superfluous > 0 && superfluousBudget > 0 && superfluousPct < 70) {
    alerts.push({
      priority: 2, type: "opportunity",
      icon: PiggyBank,
      bg: "bg-[#5FBDBD]/10", border: "border-[#5FBDBD]/25", iconColor: "text-[#5FBDBD]",
      label: "Dica", labelBg: "bg-[#5FBDBD]/20 text-[#5FBDBD]",
      messageFree: "Você pode economizar ajustando seus supérfluos.",
      messagePremium: `Reduzindo 30% dos supérfluos você economiza ${possibleSaving} esse mês e acelera sua reserva.`,
      teaserFree: "Ver simulação de economia",
    });
  } else if (balance > totalIncome * 0.15 && spentPct < 70) {
    alerts.push({
      priority: 2, type: "opportunity",
      icon: Zap,
      bg: "bg-[#5FBDBD]/10", border: "border-[#5FBDBD]/25", iconColor: "text-[#5FBDBD]",
      label: "Oportunidade", labelBg: "bg-[#5FBDBD]/20 text-[#5FBDBD]",
      messageFree: "Você tem dinheiro sobrando esse mês.",
      messagePremium: `Você tem ${fmt(balance)} sobrando. Direcionar parte disso para a caixinha pode garantir ${(balance / totalIncome * 100).toFixed(0)}% do mês seguinte.`,
      teaserFree: "Veja como usar esse dinheiro com inteligência",
    });
  }

  // ── POSITIVO ──────────────────────────────────────────────────────────────
  if (spentPct <= 60 && monthPct >= 0.4) {
    alerts.push({
      priority: 3, type: "positive",
      icon: CheckCircle2,
      bg: "bg-emerald-500/10", border: "border-emerald-500/25", iconColor: "text-emerald-400",
      label: "Ótimo", labelBg: "bg-emerald-500/20 text-emerald-400",
      messageFree: "Você está indo muito bem esse mês!",
      messagePremium: `Apenas ${spentPct.toFixed(0)}% da renda gasta com ${(monthPct * 100).toFixed(0)}% do mês passado. Projeção: fechar com ${fmt(balance)} sobrando.`,
      teaserFree: "Veja sua projeção de fechamento",
    });
  } else if (spentPct <= 75) {
    alerts.push({
      priority: 3, type: "positive",
      icon: Star,
      bg: "bg-emerald-500/10", border: "border-emerald-500/25", iconColor: "text-emerald-400",
      label: "No controle", labelBg: "bg-emerald-500/20 text-emerald-400",
      messageFree: "Seus gastos estão dentro do planejado.",
      messagePremium: `Gastos em ${spentPct.toFixed(0)}% da renda. Se mantiver o ritmo, fechará o mês com ${fmt(balance)} de saldo positivo.`,
      teaserFree: "Ver comparação com mês anterior",
    });
  }

  alerts.sort((a, b) => a.priority - b.priority);
  return alerts[0] || null;
}

export default function SmartAlert({ spentPct, expensesByCategory, totalIncome, balance, isPremium }) {
  const navigate = useNavigate();
  if (totalIncome === 0) return null;

  const alert = buildAlerts({ spentPct, expensesByCategory, totalIncome, balance });
  if (!alert) return null;

  const Icon = alert.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border p-4 ${alert.bg} ${alert.border}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-0">
        <div className={`mt-0.5 flex-shrink-0 ${alert.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.labelBg}`}>
              {alert.label}
            </span>
          </div>

          {/* Mensagem principal */}
          <p className="text-sm font-medium text-foreground leading-snug">
            {isPremium ? alert.messagePremium : alert.messageFree}
          </p>

          {/* Teaser + CTA para FREE */}
          {!isPremium && (
            <div className="mt-3">
              {/* Linha de detalhe borrada */}
              <div className="relative mb-2 overflow-hidden rounded-lg">
                <p className="text-xs text-muted-foreground blur-[4px] select-none pointer-events-none">
                  {alert.messagePremium}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border">
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Premium</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate(createPageUrl("Upgrade"))}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {alert.teaserFree} →
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
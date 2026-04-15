import React from "react";
import { AlertTriangle, CheckCircle2, Zap, TrendingDown, PiggyBank, Star, Sparkles, Lock, ArrowRight } from "lucide-react";
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

function buildAlert({ spentPct, expensesByCategory, totalIncome, balance }) {
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
  const projectedBalance = totalIncome - (totalIncome * projectedEnd / 100);
  const projectedDeficit = projectedBalance < 0 ? Math.abs(projectedBalance) : 0;
  const possibleSaving = fmt(superfluous * 0.3);

  // ── RISCO: acima de 100% ──────────────────────────────────────────────────
  if (spentPct >= 100) {
    const deficit = Math.abs(balance);
    return {
      type: "risk",
      icon: TrendingDown,
      accentColor: "#F87171",
      label: "Risco",
      // mensagem FREE já específica com valor
      messageFree: `Você pode estourar o orçamento em até ${fmt(deficit)} esse mês.`,
      // projeção no Premium
      projectionText: `No ritmo atual, você termina o mês com ${fmt(deficit)} no vermelho.`,
      ctas: ["Evitar fechar no negativo", "Ver projeção completa"],
    };
  }

  // ── RISCO: acelerado ─────────────────────────────────────────────────────
  if (spentPct >= 85) {
    const estimatedDeficit = projectedDeficit > 0 ? projectedDeficit : totalIncome * ((projectedEnd - 100) / 100);
    return {
      type: "risk",
      icon: TrendingDown,
      accentColor: "#F87171",
      label: "Risco",
      messageFree: `Você pode estourar o orçamento em até ${fmt(Math.abs(estimatedDeficit))} esse mês.`,
      projectionText: `No ritmo atual, você termina o mês com ${fmt(Math.abs(estimatedDeficit))} no vermelho.`,
      ctas: ["Evitar fechar no negativo", "Simular meu mês"],
    };
  }

  // ── ATENÇÃO: ritmo acelerado ──────────────────────────────────────────────
  if (spentPct > monthPct * 100 + 15) {
    const estimatedOver = totalIncome * (projectedEnd / 100) - totalIncome;
    return {
      type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Atenção",
      messageFree: `Seus gastos estão acelerados. Projeção: ${fmt(projectedDeficit > 0 ? projectedDeficit : Math.abs(estimatedOver))} além do orçamento.`,
      projectionText: `Se continuar assim, termina o mês ${projectedEnd > 100 ? `${fmt(Math.abs(estimatedOver))} no vermelho` : `com apenas ${fmt(Math.max(projectedBalance, 0))} sobrando`}.`,
      ctas: ["Ver projeção completa", "Simular meu mês"],
    };
  }

  // ── AVISO: supérfluos ────────────────────────────────────────────────────
  if (superfluousPct >= 80) {
    return {
      type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Aviso",
      messageFree: `${superfluousPct.toFixed(0)}% do orçamento de lazer e extras consumido.`,
      projectionText: `Cortando 30% desses gastos, você economiza ${possibleSaving} ainda esse mês.`,
      ctas: ["Ver simulação de corte", "Simular meu mês"],
    };
  }

  if (fixedPct >= 95) {
    return {
      type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Aviso",
      messageFree: "Seus gastos fixos estão acima do planejado.",
      projectionText: `Com os fixos em ${fixedPct.toFixed(0)}%, sobra menos para o resto do mês.`,
      ctas: ["Ver como reorganizar", "Ver projeção completa"],
    };
  }

  if (essentialPct >= 95) {
    return {
      type: "warning",
      icon: AlertTriangle,
      accentColor: "#FBBF24",
      label: "Aviso",
      messageFree: "Seus gastos essenciais estão altos esse mês.",
      projectionText: `Essenciais em ${essentialPct.toFixed(0)}% do limite. Veja onde ajustar.`,
      ctas: ["Ver análise por categoria", "Simular meu mês"],
    };
  }

  // ── OPORTUNIDADE ─────────────────────────────────────────────────────────
  if (superfluous > 0 && superfluousBudget > 0 && superfluousPct < 70) {
    return {
      type: "opportunity",
      icon: PiggyBank,
      accentColor: "#5FBDBD",
      label: "Dica",
      messageFree: `Você pode economizar ${possibleSaving} só ajustando seus supérfluos.`,
      projectionText: `Reduzindo 30% dos lazer/extras, você acelera sua reserva de emergência.`,
      ctas: ["Ver simulação de economia", "Simular meu mês"],
    };
  }

  if (balance > totalIncome * 0.15 && spentPct < 70) {
    return {
      type: "opportunity",
      icon: Zap,
      accentColor: "#5FBDBD",
      label: "Oportunidade",
      messageFree: `Você tem ${fmt(balance)} sobrando esse mês.`,
      projectionText: `Direcionando parte disso agora, você garante mais tranquilidade no mês que vem.`,
      ctas: ["Ver onde investir esse valor", "Simular meu mês"],
    };
  }

  // ── POSITIVO ──────────────────────────────────────────────────────────────
  if (spentPct <= 60 && monthPct >= 0.4) {
    return {
      type: "positive",
      icon: CheckCircle2,
      accentColor: "#34D399",
      label: "Ótimo",
      messageFree: `Você está indo bem! Projeção: fechar o mês com ${fmt(balance)} sobrando.`,
      projectionText: `Apenas ${spentPct.toFixed(0)}% da renda gasta com ${(monthPct * 100).toFixed(0)}% do mês passado.`,
      ctas: ["Ver comparação com mês anterior", "Ver projeção completa"],
    };
  }

  if (spentPct <= 75) {
    return {
      type: "positive",
      icon: Star,
      accentColor: "#34D399",
      label: "No controle",
      messageFree: `Gastos em dia. Você deve fechar o mês com ${fmt(balance)} de saldo.`,
      projectionText: `Se mantiver o ritmo, termina o mês no positivo.`,
      ctas: ["Ver projeção completa", "Simular meu mês"],
    };
  }

  return null;
}

export default function SmartAlert({ spentPct, expensesByCategory, totalIncome, balance, isPremium }) {
  const navigate = useNavigate();
  if (totalIncome === 0) return null;

  const alert = buildAlert({ spentPct, expensesByCategory, totalIncome, balance });
  if (!alert) return null;

  const Icon = alert.icon;
  const accent = alert.accentColor;
  const isRisk = alert.type === "risk" || alert.type === "warning";
  // primary CTA muda por contexto
  const primaryCTA = alert.ctas?.[0] || "Ver projeção completa";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden flex"
      style={{
        background: "hsl(var(--card))",
        border: `1px solid ${accent}22`,
      }}
    >
      {/* Borda lateral colorida */}
      <div className="w-1 flex-shrink-0" style={{ background: accent, opacity: 0.7 }} />

      <div className="flex-1 p-4">
        <div className="flex items-start gap-3">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
          <div className="flex-1 min-w-0">

            {/* Label */}
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1.5"
              style={{ background: `${accent}18`, color: accent }}
            >
              {alert.label}
            </span>

            {/* Mensagem principal — já com valor específico para FREE */}
            <p className="text-sm font-medium text-foreground leading-snug">
              {alert.messageFree}
            </p>

            {/* Projeção futura — bloqueada para FREE */}
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}15`, background: `${accent}08` }}>
              {isPremium ? (
                <div className="px-3 py-2.5">
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium">Projeção do mês</p>
                  <p className="text-sm font-semibold text-foreground">{alert.projectionText}</p>
                </div>
              ) : (
                <div className="relative px-3 py-2.5">
                  {/* conteúdo borrado */}
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium blur-[3px] select-none pointer-events-none">Projeção do mês</p>
                  <p className="text-sm font-semibold text-foreground blur-[5px] select-none pointer-events-none">{alert.projectionText}</p>
                  {/* overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-1.5 bg-background/85 backdrop-blur-sm px-3 py-1 rounded-full border border-border/60">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Disponível no Premium</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA para FREE */}
            {!isPremium && (
              <button
                onClick={() => navigate(createPageUrl("Upgrade"))}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: isRisk
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "linear-gradient(135deg, #5FBDBD, #1B3A52)",
                  color: "#fff",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {primaryCTA}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
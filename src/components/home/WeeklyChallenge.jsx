import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Share2, Check, ChevronRight, Zap } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function buildChallenge(expenses, totalIncome) {
  const weekStart = getWeekStart();
  const weekExpenses = expenses.filter((e) => e.date && new Date(e.date + "T00:00:00") >= weekStart);
  const superfluousThisWeek = weekExpenses
    .filter((e) => e.category === "superfluous")
    .reduce((s, e) => s + (e.amount || 0), 0);

  const weeklyGoal = totalIncome > 0 ? totalIncome * 0.2 / 4 : 200; // 20% da renda / 4 semanas
  const daysWithoutSuperfluous = (() => {
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const hasSuper = expenses.some((e) => e.date === dateStr && e.category === "superfluous");
      if (!hasSuper) count++;
      else break;
    }
    return count;
  })();

  // Desafio 1: dias sem supérfluos
  if (daysWithoutSuperfluous >= 3) {
    const completed = daysWithoutSuperfluous >= 7;
    return {
      id: "no-superfluous",
      emoji: "🚫",
      title: completed ? "7 dias sem supérfluos!" : `${daysWithoutSuperfluous} dias sem supérfluos`,
      sub: completed ? "Você completou o desafio da semana!" : `Continue! Faltam ${7 - daysWithoutSuperfluous} dias.`,
      progress: Math.min((daysWithoutSuperfluous / 7) * 100, 100),
      completed,
      shareText: `🏆 Completei o desafio de 7 dias sem gastos supérfluos no Aury!\nControle financeiro de verdade. Experimenta: aury.app`,
    };
  }

  // Desafio 2: guardar meta semanal
  const weeklyBalance = weeklyGoal - superfluousThisWeek;
  const savingPct = weeklyGoal > 0 ? Math.min((Math.max(weeklyBalance, 0) / weeklyGoal) * 100, 100) : 0;
  const completed = savingPct >= 100;

  return {
    id: "weekly-saving",
    emoji: "🎯",
    title: completed ? "Meta semanal batida!" : `Guardar ${fmt(weeklyGoal)} essa semana`,
    sub: completed
      ? "Você guardou mais que o planejado!"
      : superfluousThisWeek > 0
      ? `Já gastou ${fmt(superfluousThisWeek)} em extras essa semana`
      : "Nenhum gasto supérfluo ainda essa semana 💪",
    progress: savingPct,
    completed,
    shareText: `🎯 Bati minha meta semanal no Aury! ${fmt(weeklyGoal)} guardados.\nOrganize sua vida financeira também: aury.app`,
  };
}

export default function WeeklyChallenge({ expenses, totalIncome }) {
  const [shared, setShared] = useState(false);

  if (!expenses.length || totalIncome === 0) return null;

  const challenge = buildChallenge(expenses, totalIncome);

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: challenge.shareText }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(challenge.shareText);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  const progressColor = challenge.completed ? "#34D399" : challenge.progress >= 60 ? "#5FBDBD" : "#FBBF24";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-4"
      style={{
        background: "hsl(220,13%,11%)",
        border: `1px solid ${progressColor}22`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${progressColor}18` }}>
          <Trophy className="w-4 h-4" style={{ color: progressColor }} />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Desafio da semana</p>
        {challenge.completed && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <Check className="w-2.5 h-2.5" /> Completo
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{challenge.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{challenge.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{challenge.sub}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${challenge.progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: progressColor }}
        />
      </div>

      {challenge.completed ? (
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #34D399, #059669)" }}
        >
          {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {shared ? "Compartilhado!" : "Compartilhar conquista"}
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{challenge.progress.toFixed(0)}% concluído</span>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: progressColor }}>
            <Zap className="w-3 h-3" />
            Continue assim!
          </div>
        </div>
      )}
    </motion.div>
  );
}
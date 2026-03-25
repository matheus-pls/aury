import React from "react";
import { motion } from "framer-motion";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Calcula gastos de hoje e ontem
function getTodayAndYesterday(expenses) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayTotal = expenses
    .filter((e) => e.date === today)
    .reduce((s, e) => s + (e.amount || 0), 0);

  const yesterdayTotal = expenses
    .filter((e) => e.date === yesterday)
    .reduce((s, e) => s + (e.amount || 0), 0);

  return { todayTotal, yesterdayTotal };
}

function getWeekTotals(expenses) {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeek = expenses
    .filter((e) => e.date && new Date(e.date + "T00:00:00") >= thisWeekStart)
    .reduce((s, e) => s + (e.amount || 0), 0);

  const lastWeek = expenses
    .filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d >= lastWeekStart && d < thisWeekStart;
    })
    .reduce((s, e) => s + (e.amount || 0), 0);

  return { thisWeek, lastWeek };
}

function buildInsight(expenses, totalIncome) {
  if (!expenses.length) return null;

  const { todayTotal, yesterdayTotal } = getTodayAndYesterday(expenses);
  const { thisWeek, lastWeek } = getWeekTotals(expenses);

  // Prioridade: comparação com ontem (mais impactante)
  if (todayTotal > 0 && yesterdayTotal > 0) {
    const diff = todayTotal - yesterdayTotal;
    const diffPct = Math.abs((diff / yesterdayTotal) * 100).toFixed(0);
    if (diff > 0) {
      return {
        emoji: "📊",
        text: `Você gastou ${diffPct}% mais que ontem. Hoje: ${fmt(todayTotal)}.`,
        color: "#FBBF24",
      };
    } else {
      return {
        emoji: "🎯",
        text: `Você gastou ${diffPct}% menos que ontem. Ótimo ritmo!`,
        color: "#34D399",
      };
    }
  }

  // Só hoje
  if (todayTotal > 0) {
    const todayPct = totalIncome > 0 ? ((todayTotal / totalIncome) * 100).toFixed(1) : null;
    return {
      emoji: todayTotal > totalIncome * 0.05 ? "⚠️" : "👀",
      text: `Hoje você já gastou ${fmt(todayTotal)}${todayPct ? ` (${todayPct}% da sua renda)` : ""}.`,
      color: todayTotal > totalIncome * 0.05 ? "#FBBF24" : "#A1A1AA",
    };
  }

  // Comparação semanal
  if (thisWeek > 0 && lastWeek > 0) {
    const diff = thisWeek - lastWeek;
    if (diff < 0) {
      return {
        emoji: "🙌",
        text: `Você economizou ${fmt(Math.abs(diff))} a mais que na semana passada!`,
        color: "#34D399",
      };
    } else {
      return {
        emoji: "📉",
        text: `Você gastou ${fmt(diff)} a mais que na semana passada.`,
        color: "#FBBF24",
      };
    }
  }

  // Nenhum gasto hoje
  return {
    emoji: "☀️",
    text: "Nenhum gasto registrado hoje. Bom dia!",
    color: "#5FBDBD",
  };
}

export default function DailyInsightBanner({ expenses, totalIncome }) {
  const insight = buildInsight(expenses, totalIncome);
  if (!insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "hsl(220,13%,11%)",
        border: `1px solid ${insight.color}20`,
      }}
    >
      <span className="text-lg flex-shrink-0">{insight.emoji}</span>
      <p className="text-sm text-muted-foreground leading-snug">
        <span className="font-semibold" style={{ color: insight.color }}>
          {insight.text.split(" ").slice(0, 4).join(" ")}{" "}
        </span>
        {insight.text.split(" ").slice(4).join(" ")}
      </p>
    </motion.div>
  );
}
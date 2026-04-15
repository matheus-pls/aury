import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useAnimatedCurrency } from "@/hooks/useAnimatedNumber";

export default function MonthSituationCard({ balance, totalIncome, totalExpenses, spentPct }) {
  console.log("[MonthSituationCard] Props recebidas:", { balance, totalIncome, totalExpenses, spentPct });
  const isNegative = balance < 0;
  const isWarning = spentPct >= 80 && balance >= 0;

  const statusConfig = isNegative
    ? {
        label: "Hora de segurar um pouco",
        interpretation: "Risco de fechar no negativo",
        interpretColor: "#F87171",
        border: "1px solid rgba(239,68,68,0.18)",
        barColor: "#F87171",
        Icon: TrendingDown,
      }
    : isWarning
    ? {
        label: "Quase no limite, bora ajustar",
        interpretation: "Atenção aos seus gastos",
        interpretColor: "#FBBF24",
        border: "1px solid rgba(251,191,36,0.18)",
        barColor: "#FBBF24",
        Icon: Minus,
      }
    : {
        label: "Você está no controle",
        interpretation: "Situação saudável",
        interpretColor: "#34D399",
        border: "1px solid rgba(52,211,153,0.18)",
        barColor: "#34D399",
        Icon: TrendingUp,
      };

  const StatusIcon = statusConfig.Icon;

  // Números animados
  const animBalance = useAnimatedCurrency(balance);
  const animIncome = useAnimatedCurrency(totalIncome, 600);
  const animExpenses = useAnimatedCurrency(totalExpenses, 600);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
      className="rounded-3xl overflow-hidden shadow-lg transition-shadow"
      style={{ background: "hsl(var(--card))", border: statusConfig.border }}
    >
      <div className="flex">
        {/* Barra lateral de estado */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-1 rounded-l-3xl flex-shrink-0 origin-top"
          style={{ background: statusConfig.interpretColor, opacity: 0.7 }}
        />
        <div className="flex-1 p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Situação do mês</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusConfig.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.25 }}
                  className="text-foreground/80 text-sm font-medium"
                >
                  {statusConfig.label}
                </motion.p>
              </AnimatePresence>
            </div>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-2.5 rounded-xl"
              style={{ background: "hsl(var(--muted))" }}
            >
              <StatusIcon className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>

          {/* Balance animado */}
          <div className="mb-5">
            <motion.h2
              key={balance}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold tabular-nums"
              style={{ color: statusConfig.interpretColor }}
            >
              {animBalance}
            </motion.h2>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                Você gastou{" "}
                <span className="font-semibold text-foreground/80">{spentPct.toFixed(0)}% do que ganha</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(spentPct, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: statusConfig.barColor }}
              />
            </div>
          </div>

          {/* Entradas / Saídas */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <p className="text-muted-foreground text-xs mb-0.5">Entradas</p>
              <p className="text-base font-semibold tabular-nums text-foreground">{animIncome}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <p className="text-muted-foreground text-xs mb-0.5">Saídas</p>
              <p className="text-base font-semibold tabular-nums text-foreground">{animExpenses}</p>
            </motion.div>
          </div>

          {/* Badge */}
          <div
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "hsl(var(--muted))", color: statusConfig.interpretColor }}
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusConfig.interpretColor }}
            />
            {statusConfig.interpretation}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
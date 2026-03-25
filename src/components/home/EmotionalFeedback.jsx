import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function EmotionalFeedback({ currentSpentPct, previousSpentPct }) {
  if (previousSpentPct === undefined || previousSpentPct === null) return null;

  const diff = currentSpentPct - previousSpentPct;
  const absDiff = Math.abs(diff).toFixed(0);
  
  let emoji = '';
  let message = '';
  let subMessage = '';
  let icon = null;
  let color = '';
  let bgColor = '';

  // Melhorou (gastou menos%)
  if (diff < -5) {
    emoji = '🚀';
    message = 'Boa! Você está evoluindo';
    subMessage = `Redução de ${absDiff}% na renda gasta`;
    icon = TrendingUp;
    color = '#34D399';
    bgColor = 'rgba(52, 211, 153, 0.08)';
  }
  // Piorou (gastou mais%)
  else if (diff > 5) {
    emoji = '⚠️';
    message = 'Atenção, seu padrão mudou';
    subMessage = `Aumento de ${absDiff}% na renda gasta`;
    icon = TrendingDown;
    color = '#FBBF24';
    bgColor = 'rgba(251, 191, 36, 0.08)';
  }
  // Manteve (variação pequena)
  else {
    emoji = '💪';
    message = 'Consistência é o caminho';
    subMessage = `Padrão mantido este mês`;
    icon = Minus;
    color = '#5FBDBD';
    bgColor = 'rgba(95, 189, 189, 0.08)';
  }

  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-3.5 border border-border/40 flex items-center gap-3"
      style={{ background: bgColor }}
    >
      <span className="text-xl flex-shrink-0">{emoji}</span>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {message}
        </p>
        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color }}>
          <Icon className="w-3 h-3" />
          {subMessage}
        </p>
      </div>
    </motion.div>
  );
}
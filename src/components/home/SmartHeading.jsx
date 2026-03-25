import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown, TrendingUp, Zap } from 'lucide-react';

export default function SmartHeading({ spentPct, balance, totalIncome }) {
  // Determinar status baseado no % de gasto
  let status, message, subMessage, icon, bgColor, textColor, accentColor;

  if (spentPct >= 100) {
    status = 'critical';
    message = `Você já ultrapassou sua renda em ${(spentPct - 100).toFixed(0)}%`;
    subMessage = 'Hora de frear e reorganizar';
    icon = AlertCircle;
    bgColor = 'rgba(239, 68, 68, 0.08)';
    textColor = '#EF4444';
    accentColor = '#DC2626';
  } else if (spentPct >= 85) {
    status = 'warning';
    message = `Você já usou ${spentPct.toFixed(0)}% da sua renda`;
    subMessage = 'Cuidado, você está no limite';
    icon = AlertCircle;
    bgColor = 'rgba(251, 191, 36, 0.08)';
    textColor = '#FBBF24';
    accentColor = '#F59E0B';
  } else if (spentPct >= 70) {
    status = 'balanced';
    message = `Você está controlando bem. ${(100 - spentPct).toFixed(0)}% ainda disponível`;
    subMessage = 'Continua assim, você está no trilho';
    icon = TrendingDown;
    bgColor = 'rgba(52, 211, 153, 0.08)';
    textColor = '#34D399';
    accentColor = '#10B981';
  } else {
    status = 'good';
    message = `Ótimo controle! Você tem ${(100 - spentPct).toFixed(0)}% de margem`;
    subMessage = balance > 0 ? 'Você pode investir ou poupar' : 'Continue assim';
    icon = TrendingUp;
    bgColor = 'rgba(34, 197, 94, 0.08)';
    textColor = '#22C55E';
    accentColor = '#16A34A';
  }

  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-4 border border-border/40 flex items-start gap-3"
      style={{ background: bgColor }}
    >
      <div
        className="p-2 rounded-lg flex-shrink-0 mt-0.5"
        style={{ background: textColor + '15' }}
      >
        <Icon className="w-4 h-4" style={{ color: textColor }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {message}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(0, 0%, 55%)' }}>
          {subMessage}
        </p>
      </div>

      {/* Indicador de status visual */}
      <div className="flex-shrink-0">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: status === 'critical' || status === 'warning' ? Infinity : 0, duration: 2 }}
          className="w-2 h-2 rounded-full"
          style={{ background: textColor }}
        />
      </div>
    </motion.div>
  );
}
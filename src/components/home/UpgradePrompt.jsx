import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpgradePrompt({ spentPct, balance, totalIncome, isPremium }) {
  const navigate = useNavigate();

  if (isPremium) return null;

  let shouldShow = false;
  let type = null;

  // Gatilho 1: Em risco (85%+ da renda gasta)
  if (spentPct >= 85) {
    shouldShow = true;
    type = 'risk';
  }

  // Gatilho 2: Sobra dinheiro (menos de 70% gasto + balance positivo)
  if (spentPct < 70 && balance > 0 && balance > totalIncome * 0.1) {
    shouldShow = true;
    type = 'surplus';
  }

  if (!shouldShow) return null;

  const isRisk = type === 'risk';
  const message = isRisk
    ? 'Veja a projeção completa do mês'
    : 'Descubra como investir melhor';
  const subMessage = isRisk
    ? 'Com análises avançadas'
    : 'Estratégias personalizadas para seu perfil';
  const bgColor = isRisk
    ? 'rgba(239, 68, 68, 0.08)'
    : 'rgba(34, 197, 94, 0.08)';
  const textColor = isRisk ? '#EF4444' : '#22C55E';
  const accentColor = isRisk ? '#DC2626' : '#16A34A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-4 border border-border/40 cursor-pointer hover:border-border/60 transition-colors"
      style={{ background: bgColor }}
      onClick={() => navigate('/Upgrade')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="p-2 rounded-lg flex-shrink-0 mt-0.5"
            style={{ background: textColor + '15' }}
          >
            {isRisk ? (
              <TrendingUp className="w-4 h-4" style={{ color: textColor }} />
            ) : (
              <Sparkles className="w-4 h-4" style={{ color: textColor }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {message}
            </p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              {subMessage}
            </p>
          </div>
        </div>

        <div
          className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
          style={{ background: accentColor + '20', color: accentColor }}
        >
          Premium
        </div>
      </div>
    </motion.div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const PROFILE_NAMES = {
  essential: "Essencial",
  balanced: "Equilibrado",
  focused: "Focado",
};

const PROFILE_EMOJIS = {
  essential: "🌿",
  balanced: "⚖️",
  focused: "🎯",
};

export default function InitialPlanModal({ settings, totalIncome, userId }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!settings || !userId) return;

    // Verificar se o usuário já viu o plano inicial
    const planSeenKey = `aury_plan_seen_${userId}`;
    const planAlreadySeen = localStorage.getItem(planSeenKey);

    if (!planAlreadySeen && settings.onboarding_completed && totalIncome > 0) {
      setIsOpen(true);
      localStorage.setItem(planSeenKey, 'true');
    }
  }, [settings, userId]);

  if (!settings || !isOpen) return null;

  const income = totalIncome || 0;
  const freeMoney = Math.max(0, income - (settings.onboarding_fixed_expenses || 0));

  const distribution = {
    essential: freeMoney * ((settings.essential_percentage || 30) / 100),
    superfluous: freeMoney * ((settings.superfluous_percentage || 20) / 100),
    emergency: freeMoney * ((settings.emergency_percentage || 25) / 100),
    investment: freeMoney * ((settings.investment_percentage || 25) / 100),
  };

  const profile = settings.financial_profile || 'balanced';
  const profileName = PROFILE_NAMES[profile];
  const profileEmoji = PROFILE_EMOJIS[profile];

  const handleClose = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-background rounded-3xl border border-border max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com close button */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5FBDBD]" />
                <h2 className="text-lg font-bold text-foreground">Seu Plano Inicial</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6">
              {/* Texto intro */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center space-y-2"
              >
                <p className="text-sm text-muted-foreground">
                  Baseado no seu perfil <span className="text-lg">{profileEmoji}</span> <strong>{profileName}</strong>, organizamos seu dinheiro assim:
                </p>
              </motion.div>

              {/* Resumo Renda */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl p-4 border border-border/50 space-y-3"
                style={{ background: 'hsl(220, 13%, 11%)' }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Renda Mensal</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(income)}</span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gastos Fixos</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(settings.onboarding_fixed_expenses || 0)}</span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">Dinheiro Livre</span>
                  <span className="text-xl font-bold text-[#5FBDBD]">{formatCurrency(freeMoney)}</span>
                </div>
              </motion.div>

              {/* Distribuição por Categoria */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Como distribuir o dinheiro livre</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Essenciais', value: distribution.essential, emoji: '🛒', desc: 'Supermercado, farmácia...' },
                    { label: 'Supérfluos', value: distribution.superfluous, emoji: '🎉', desc: 'Lazer, assinaturas...' },
                    { label: 'Reserva', value: distribution.emergency, emoji: '🛡️', desc: 'Emergências inesperadas' },
                    { label: 'Investimentos', value: distribution.investment, emoji: '💰', desc: 'Crescimento no longo prazo' },
                  ].map((item, idx) => {
                    const pct = freeMoney > 0 ? ((item.value / freeMoney) * 100).toFixed(0) : 0;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.08 }}
                        className="flex items-start justify-between p-3 rounded-xl border border-border/30"
                        style={{ background: 'rgba(95,189,189,0.05)' }}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="text-lg mt-0.5">{item.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-[#5FBDBD]">{formatCurrency(item.value)}</p>
                          <p className="text-[10px] text-muted-foreground">{pct}%</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Nota */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-xs text-center text-muted-foreground"
              >
                Você consegue ajustar esse plano a qualquer momento em Planejamento 👍
              </motion.p>

              {/* Botão */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={handleClose}
                  className="w-full h-11 text-white font-semibold"
                  style={{ background: 'linear-gradient(135deg, #5FBDBD, #1B3A52)' }}
                >
                  Entendi, vamos começar
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
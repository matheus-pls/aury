import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

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

export default function OnboardingPlanGenerator({ monthlyIncome, fixedExpenses, selectedGoal, selectedProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    // Simula o processamento do plano
    const timer = setTimeout(() => {
      const income = parseFloat(monthlyIncome.replace(/\D/g, '')) / 100;
      const fixed = fixedExpenses ? parseFloat(fixedExpenses.replace(/\D/g, '')) / 100 : 0;
      
      const freeMoney = Math.max(0, income - fixed);
      const fixedPct = income > 0 ? (fixed / income) * 100 : 0;

      // Usar distribuição do perfil (em percentual do dinheiro livre)
      const profileDistributions = {
        essential: { essential: 40, superfluous: 30, emergency: 20, investment: 10 },
        balanced: { essential: 30, superfluous: 20, emergency: 25, investment: 25 },
        focused: { essential: 25, superfluous: 10, emergency: 30, investment: 35 },
      };

      const distribution = profileDistributions[selectedProfile] || profileDistributions.balanced;

      const essential = freeMoney * (distribution.essential / 100);
      const superfluous = freeMoney * (distribution.superfluous / 100);
      const emergency = freeMoney * (distribution.emergency / 100);
      const investment = freeMoney * (distribution.investment / 100);

      setPlan({
        income,
        fixed,
        freeMoney,
        fixedPct,
        distribution: {
          essential,
          superfluous,
          emergency,
          investment,
        },
        profile: selectedProfile,
        goal: selectedGoal,
      });

      setStep(1);
    }, 800);

    return () => clearTimeout(timer);
  }, [monthlyIncome, fixedExpenses, selectedGoal, selectedProfile]);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => {
        setStep(2);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  return (
    <div className="text-center space-y-8">
      {/* Spinner e título inicial */}
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`space-y-3 ${step > 0 ? 'hidden' : ''}`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-14 h-14 mx-auto rounded-full border-4 border-white/10 border-t-[#5FBDBD]"
        />
        <h2 className="text-xl font-bold text-white">Montando seu plano...</h2>
        <p className="text-sm" style={{ color: 'hsl(0, 0%, 55%)' }}>
          Tudo certo. Já vou te mostrar o que preparei 🌱
        </p>
      </motion.div>

      {/* Plano Gerado */}
      {step >= 1 && plan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Header com check */}
          <div className="space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'rgba(95, 189, 189, 0.15)' }}
            >
              <Check className="w-8 h-8 text-[#5FBDBD]" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Seu ponto de partida está pronto</h2>
            <p className="text-sm" style={{ color: 'hsl(0, 0%, 55%)' }}>
              Aqui está como seu dinheiro pode fluir
            </p>
          </div>

          {/* Resumo Financeiro */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 border space-y-4"
            style={{ background: 'hsl(220, 13%, 11%)', borderColor: 'hsl(220, 10%, 20%)' }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="text-left">
                <p className="text-xs" style={{ color: 'hsl(0, 0%, 55%)' }}>
                  Renda Mensal
                </p>
                <p className="text-lg font-bold text-white">{formatCurrency(plan.income)}</p>
              </div>
              <div className="text-left">
                <p className="text-xs" style={{ color: 'hsl(0, 0%, 55%)' }}>
                  Gastos Fixos
                </p>
                <p className="text-lg font-bold text-white">{formatCurrency(plan.fixed)}</p>
                <p className="text-xs" style={{ color: 'hsl(0, 0%, 40%)' }}>
                  {plan.fixedPct.toFixed(0)}% da renda
                </p>
              </div>
            </div>

            <div
              className="h-0.5 rounded-full"
              style={{ background: 'hsl(220, 10%, 25%)' }}
            />

            <div className="text-left">
              <p className="text-xs" style={{ color: 'hsl(0, 0%, 55%)' }}>
                Dinheiro Livre para Organizar
              </p>
              <p className="text-2xl font-bold" style={{ color: '#5FBDBD' }}>
                {formatCurrency(plan.freeMoney)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(0, 0%, 45%)' }}>
                Depois dos gastos fixos, você tem esse valor para distribuir
              </p>
            </div>
          </motion.div>

          {/* Sugestão de Distribuição */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-5 border space-y-4"
              style={{ background: 'rgba(95, 189, 189, 0.08)', borderColor: 'rgba(95, 189, 189, 0.2)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5FBDBD]" />
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-[#5FBDBD]">
                    Seu Plano {PROFILE_EMOJIS[plan.profile]}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(0, 0%, 45%)' }}>
                    Com base no seu perfil {PROFILE_NAMES[plan.profile].toLowerCase()}, distribuímos seu dinheiro
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-left">
                {[
                  { label: 'Essenciais', value: plan.distribution.essential, emoji: '🛒', desc: 'Supermercado, farmácia...' },
                  { label: 'Supérfluos', value: plan.distribution.superfluous, emoji: '🎉', desc: 'Lazer, assinaturas...' },
                  { label: 'Reserva', value: plan.distribution.emergency, emoji: '🛡️', desc: 'Emergências inesperadas' },
                  { label: 'Investimentos', value: plan.distribution.investment, emoji: '💰', desc: 'Crescimento no longo prazo' },
                ].map((item, idx) => {
                  const pct = plan.freeMoney > 0 ? ((item.value / plan.freeMoney) * 100).toFixed(0) : 0;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22 + idx * 0.08 }}
                      className="flex items-start justify-between p-3 rounded-lg"
                      style={{ background: 'rgba(95, 189, 189, 0.05)' }}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="text-lg mt-0.5">{item.emoji}</span>
                        <div>
                          <p className="text-xs font-semibold text-white">{item.label}</p>
                          <p className="text-[10px]" style={{ color: 'hsl(0, 0%, 45%)' }}>{item.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: '#5FBDBD' }}>
                          {formatCurrency(item.value)}
                        </p>
                        <p className="text-[10px]" style={{ color: 'hsl(0, 0%, 45%)' }}>
                          {pct}%
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-xs text-center mt-3" style={{ color: 'hsl(0, 0%, 45%)' }}>
                Esse plano reflete seu estilo. Você consegue ajustar depois 👍
              </p>
            </motion.div>
          )}

          {/* Mensagem final */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 pt-2"
            >
              <div className="space-y-2">
                <p className="text-sm text-white font-semibold">
                  ✨ Seu plano está pronto!
                </p>
                <p className="text-xs" style={{ color: 'hsl(0, 0%, 55%)' }}>
                  Você tem tudo que precisa para começar a controlar seu dinheiro e atingir seus objetivos.
                </p>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex justify-center gap-1 mt-3"
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#5FBDBD' }}
                  />
                ))}
              </motion.div>
              <p className="text-xs" style={{ color: 'hsl(0, 0%, 45%)' }}>
                Levando você para o app...
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
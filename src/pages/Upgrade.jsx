import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Crown, Sparkles, CheckCircle2, ArrowLeft,
  Calculator, TrendingUp, Shield, Zap, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/lib/PremiumContext";
import { toast } from "sonner";

const BENEFITS = [
  { icon: Calculator, label: "Simulações de Futuro", desc: "Veja o impacto de cada decisão financeira" },
  { icon: Sparkles, label: "Planejamento Automático", desc: "A Aury monta seu plano do mês por você" },
  { icon: TrendingUp, label: "Análise de Comportamento", desc: "Entenda seus padrões e evolua financeiramente" },
  { icon: Zap, label: "IA Avançada", desc: "Respostas mais inteligentes e personalizadas" },
  { icon: Shield, label: "Relatórios Completos", desc: "Visualize sua evolução mês a mês" },
];

export default function Upgrade() {
  const { isPremium, activate, deactivate, minutesLeft } = usePremium();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const [minsLeft, setMinsLeft] = useState(minutesLeft());

  // Atualiza o contador a cada 30s enquanto premium estiver ativo
  useEffect(() => {
    if (!isPremium) return;
    setMinsLeft(minutesLeft());
    const interval = setInterval(() => setMinsLeft(minutesLeft()), 30000);
    return () => clearInterval(interval);
  }, [isPremium]);

  const handleActivate = async () => {
    setActivating(true);
    await new Promise(r => setTimeout(r, 800));
    activate();
    setActivating(false);
    toast.success("Premium ativado por 15 minutos! Aproveite 🎉");
    setTimeout(() => navigate(createPageUrl("NewPlanning")), 500);
  };

  const handleDeactivate = () => {
    deactivate();
    toast.info("Teste encerrado. Você pode reativar quando quiser.");
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </motion.button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl"
        style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 35%, #1B3A52 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white fill-white/80" />
            </div>
            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">Aury Premium</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">O app completo,<br />do jeito que você merece</h1>
          <p className="text-white/80 text-sm leading-relaxed">
            Desbloqueie todos os recursos e deixa a Aury trabalhar de verdade pelo seu futuro financeiro.
          </p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">O que você desbloqueia</h2>
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto flex-shrink-0" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="space-y-3"
      >
        {isPremium ? (
          <>
            <div className="flex flex-col items-center gap-1 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500/50" />
                <p className="text-amber-500 font-semibold">Premium ativo!</p>
              </div>
              <p className="text-xs text-amber-400/70">
                {minsLeft > 1 ? `Expira em ~${minsLeft} minutos` : "Expirando em instantes..."}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-11 border-muted text-muted-foreground hover:text-foreground"
              onClick={handleDeactivate}
            >
              <Lock className="w-4 h-4 mr-2" />
              Encerrar teste
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full h-13 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 rounded-2xl"
              onClick={handleActivate}
              disabled={activating}
            >
              {activating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Ativando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Ativar Premium para teste
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Modo de teste — 15 minutos · sem cobrança real 🔒
            </p>
          </>
        )}

        <Button
          variant="ghost"
          className="w-full h-11 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      </motion.div>
    </div>
  );
}
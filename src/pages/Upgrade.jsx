import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Crown, Sparkles, CheckCircle2, ArrowLeft,
  Calculator, TrendingUp, Shield, Zap, Lock, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/lib/PremiumContext";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import DevResetPremium from "@/components/DevResetPremium";
import { useAuth } from "@/lib/AuthContext";

const BENEFITS = [
  { icon: Calculator, label: "Simulações de Futuro", desc: "Veja o impacto de cada decisão financeira" },
  { icon: Sparkles, label: "Planejamento Automático", desc: "A Aury monta seu plano do mês por você" },
  { icon: TrendingUp, label: "Análise de Comportamento", desc: "Entenda seus padrões e evolua financeiramente" },
  { icon: Zap, label: "IA Avançada", desc: "Respostas mais inteligentes e personalizadas" },
  { icon: Shield, label: "Relatórios Completos", desc: "Visualize sua evolução mês a mês" },
];

function isInIframe() {
  try { return window.self !== window.top; } catch { return true; }
}

export default function Upgrade() {
  const { isPremium, trialUsed, activate, deactivate, minutesLeft, stripeStatus, refreshSubscription, userEmail } = usePremium();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const [minsLeft, setMinsLeft] = useState(minutesLeft());
  const [checkingSession, setCheckingSession] = useState(false);
  const [userEmailInput, setUserEmailInput] = useState("");

  // Atualiza o contador a cada 30s enquanto premium (trial) estiver ativo
  useEffect(() => {
    if (!isPremium || stripeStatus === "active") return;
    setMinsLeft(minutesLeft());
    const interval = setInterval(() => setMinsLeft(minutesLeft()), 30000);
    return () => clearInterval(interval);
  }, [isPremium, stripeStatus]);

  // Detecta retorno do checkout Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");

    if (success === "true") {
      setCheckingSession(true);
      // Aguarda webhook processar (até 5 tentativas)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const email = userEmail || userEmailInput;
        if (email) {
          await refreshSubscription(email);
        }
        if (attempts >= 5) {
          clearInterval(poll);
          setCheckingSession(false);
          toast.success("Premium ativado com sucesso! 🎉");
          // Limpa params da URL
          window.history.replaceState({}, "", window.location.pathname);
        }
      }, 2000);
    }

    if (canceled === "true") {
      toast.info("Checkout cancelado. Sua assinatura não foi alterada.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleStripeCheckout = async () => {
    if (isInIframe()) {
      alert("O checkout do Stripe só funciona no app publicado. Abra o app em uma nova aba para assinar.");
      return;
    }

    const email = userEmail || userEmailInput;
    if (!email) {
      toast.error("Faça login para assinar o Premium.");
      return;
    }

    setActivating(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        user_email: email,
        success_url: `${window.location.origin}/Upgrade?success=true`,
        cancel_url: `${window.location.origin}/Upgrade?canceled=true`
      });

      if (res.data?.error === "already_subscribed") {
        toast.info("Você já tem uma assinatura ativa!");
        await refreshSubscription(email);
        return;
      }

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Erro ao iniciar checkout. Tente novamente.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao conectar com o Stripe. Tente novamente.");
    } finally {
      setActivating(false);
    }
  };

  // Trial local (fallback)
  const handleActivateTrial = async () => {
    setActivating(true);
    await new Promise(r => setTimeout(r, 800));
    activate();
    setActivating(false);
    toast.success("Teste premium ativado por 15 minutos! 🎉");
    setTimeout(() => navigate(createPageUrl("NewPlanning")), 500);
  };

  const handleDeactivate = () => {
    deactivate();
    toast.info("Teste encerrado.");
  };

  const isStripeActive = stripeStatus === "active";

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
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
            <span className="text-white font-bold text-lg">R$ 9,90</span>
            <span className="text-white/80 text-xs">/mês</span>
          </div>
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
        {/* Verificando sessão */}
        {checkingSession && (
          <div className="flex items-center justify-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
            <p className="text-amber-500 text-sm font-medium">Confirmando pagamento...</p>
          </div>
        )}

        {/* Premium ativo via Stripe */}
        {!checkingSession && isStripeActive && (
          <div className="flex flex-col items-center gap-2 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500 fill-amber-500/50" />
              <p className="text-amber-500 font-bold text-lg">Premium Ativo! ✨</p>
            </div>
            <p className="text-xs text-amber-400/80">
              Sua assinatura está ativa. Aproveite todos os recursos!
            </p>
          </div>
        )}

        {/* Trial local ativo */}
        {!checkingSession && !isStripeActive && isPremium && (
          <>
            <div className="flex flex-col items-center gap-1 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500/50" />
                <p className="text-amber-500 font-semibold">Modo teste ativo</p>
              </div>
              <p className="text-xs text-amber-400/70">
                {minsLeft > 1 ? `Expira em ~${minsLeft} minutos` : "Expirando em instantes..."}
              </p>
            </div>
            <Button
              className="w-full h-13 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 rounded-2xl"
              onClick={handleStripeCheckout}
              disabled={activating}
            >
              <Crown className="w-5 h-5 mr-2" />
              🚀 Começar Premium agora — R$9,90/mês
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-muted text-muted-foreground hover:text-foreground"
              onClick={handleDeactivate}
            >
              <Lock className="w-4 h-4 mr-2" />
              Encerrar teste
            </Button>
          </>
        )}

        {/* Não premium, trial já usado */}
        {!checkingSession && !isPremium && trialUsed && !isStripeActive && (
          <>
            <div className="flex flex-col items-center gap-2 p-5 bg-muted/40 border border-border rounded-2xl text-center mb-1">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-1">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm">Seu teste grátis já foi utilizado</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Assine o Premium para continuar com todos os recursos.
              </p>
            </div>
            <Button
              className="w-full h-13 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 rounded-2xl"
              onClick={handleStripeCheckout}
              disabled={activating}
            >
              {activating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Abrindo checkout...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  🚀 Começar Premium agora — R$9,90/mês
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Assinatura recorrente · Cancele quando quiser 🔒
            </p>
          </>
        )}

        {/* Não premium, sem trial usado */}
        {!checkingSession && !isPremium && !trialUsed && !isStripeActive && (
          <>
            <Button
              className="w-full h-13 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 rounded-2xl"
              onClick={handleStripeCheckout}
              disabled={activating}
            >
              {activating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Abrindo checkout...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  🚀 Começar Premium agora — R$9,90/mês
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Assinatura recorrente · Cancele quando quiser 🔒
            </p>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="outline"
              className="w-full h-11 border-border text-muted-foreground hover:text-foreground"
              onClick={handleActivateTrial}
              disabled={activating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Testar grátis por 15 minutos
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          className="w-full h-11 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>

        <DevResetPremium />
      </motion.div>
    </div>
  );
}
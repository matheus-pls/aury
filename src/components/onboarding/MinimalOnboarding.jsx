import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import OnboardingPlanGenerator from "./OnboardingPlanGenerator";

const TOTAL_STEPS = 5; // Renda, Objetivo, Gastos Fixos, Perfil, Plano

const GOALS = [
  { id: "control", label: "Parar de gastar sem controle", emoji: "🛑" },
  { id: "organize", label: "Organizar minha vida financeira", emoji: "📋" },
  { id: "save", label: "Começar a guardar dinheiro", emoji: "💰" },
  { id: "freedom", label: "Ter mais liberdade financeira", emoji: "🚀" },
];

const PROFILES = [
  {
    id: "essential",
    label: "Essencial",
    description: "Foco em flexibilidade e viver bem",
    emoji: "🌿",
    distribution: {
      essential: 40,
      superfluous: 30,
      emergency: 20,
      investment: 10,
    },
  },
  {
    id: "balanced",
    label: "Equilibrado",
    description: "Equilíbrio entre viver e poupar",
    emoji: "⚖️",
    distribution: {
      essential: 30,
      superfluous: 20,
      emergency: 25,
      investment: 25,
    },
  },
  {
    id: "focused",
    label: "Focado",
    description: "Prioridade em reserva e investimentos",
    emoji: "🎯",
    distribution: {
      essential: 25,
      superfluous: 10,
      emergency: 30,
      investment: 35,
    },
  },
];

const PROGRESS_KEY = "aury_onboarding_progress";

export default function MinimalOnboarding() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; } })();
  const [step, setStep] = useState(saved.step || 1);
  const [monthlyIncome, setMonthlyIncome] = useState(saved.monthlyIncome || "");
  const [selectedGoal, setSelectedGoal] = useState(saved.selectedGoal || null);
  const [fixedExpenses, setFixedExpenses] = useState(saved.fixedExpenses || "");
  const [selectedProfile, setSelectedProfile] = useState(saved.selectedProfile || null);
  const [finishing, setFinishing] = useState(false);
  const navigate = useNavigate();

  // Salva progresso sempre que algum valor mudar
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step, monthlyIncome, selectedGoal, fixedExpenses, selectedProfile }));
    } catch {}
  }, [step, monthlyIncome, selectedGoal, fixedExpenses, selectedProfile]);
  const queryClient = useQueryClient();

  // Pega o userId para isolar o localStorage por usuário
  const getUserId = async () => {
    try {
      const u = await base44.auth.me();
      return u?.id || u?.email || null;
    } catch { return null; }
  };

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
  });

  const createSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.UserSettings.create(data),
  });

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
  };

  const handleComplete = async () => {
    setStep(5); // show plan generation screen
    setFinishing(true);

    const incomeValue = monthlyIncome ? parseFloat(monthlyIncome.replace(/\D/g, "")) / 100 : 0;
    const fixedValue = fixedExpenses ? parseFloat(fixedExpenses.replace(/\D/g, "")) / 100 : 0;

    // 1. Criar renda do usuário
    if (incomeValue > 0) {
      await createIncomeMutation.mutateAsync({
        description: "Renda Mensal",
        amount: incomeValue,
        type: "salary",
        is_active: true,
      });
    }

    // 2. Criar gastos fixos iniciais (se informado)
    if (fixedValue > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await base44.entities.Expense.create({
        description: "Gastos Fixos",
        amount: fixedValue,
        category: "fixed",
        date: new Date().toISOString().slice(0, 10),
        month_year: currentMonth,
        is_recurring: true,
        recurrence_type: "months",
        recurrence_interval: 1,
      });
    }

    // 3. Buscar distribuição do perfil selecionado
    const selectedProfileData = PROFILES.find(p => p.id === selectedProfile);
    const profileDistribution = selectedProfileData?.distribution || PROFILES[1].distribution; // default: balanced

    // 4. Criar settings com distribuição baseada no perfil
    const distribution = {
      fixed_percentage: incomeValue > 0 ? (fixedValue / incomeValue) * 100 : 0,
      essential_percentage: profileDistribution.essential,
      superfluous_percentage: profileDistribution.superfluous,
      emergency_percentage: profileDistribution.emergency,
      investment_percentage: profileDistribution.investment,
    };

    await createSettingsMutation.mutateAsync({
      risk_profile: selectedProfile === "focused" ? "aggressive" : selectedProfile === "essential" ? "conservative" : "moderate",
      fixed_percentage: distribution.fixed_percentage,
      essential_percentage: distribution.essential_percentage,
      superfluous_percentage: distribution.superfluous_percentage,
      emergency_percentage: distribution.emergency_percentage,
      investment_percentage: distribution.investment_percentage,
      emergency_fund_goal_months: 6,
      current_emergency_fund: 0,
      notifications_enabled: true,
      onboarding_completed: true,
      onboarding_income: incomeValue,
      onboarding_fixed_expenses: fixedValue,
      financial_profile: selectedProfile,
    });

    const userId = await getUserId();

    queryClient.invalidateQueries({ queryKey: ["incomes", userId] });
    queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
    queryClient.invalidateQueries({ queryKey: ["settings", userId] });
    queryClient.invalidateQueries({ queryKey: ["settings-onboarding", userId] });

    // Salva localStorage com chave isolada por usuário
    if (userId) {
      localStorage.setItem(`aury_onboarding_complete_${userId}`, "true");
    }
  };

  const handlePlanComplete = () => {
    localStorage.removeItem(PROGRESS_KEY);
    navigate(createPageUrl("Home"), { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "hsl(220, 15%, 7%)" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/9721f298e_aury_sem_fundo_1.png"
          alt="Aury"
          className="h-16 mx-auto"
        />
      </motion.div>

      <div className="max-w-sm w-full">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Renda */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-1.5">Vamos começar simples</h1>
                <p className="text-sm" style={{ color: "hsl(0, 0%, 58%)" }}>
                  Qual sua renda mensal aproximada?
                </p>
              </div>
              <div
                className="rounded-2xl p-7 border space-y-5"
                style={{ background: "hsl(220, 13%, 11%)", borderColor: "hsl(220, 10%, 20%)" }}
              >
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Ex: R$ 3.000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(formatCurrency(e.target.value))}
                    className="text-xl font-bold h-14 bg-transparent border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#5FBDBD] focus-visible:border-[#5FBDBD]"
                    autoFocus
                  />
                  <p className="text-xs" style={{ color: "hsl(0, 0%, 45%)" }}>
                    Pode ser um valor aproximado 👍
                  </p>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!monthlyIncome}
                  className="w-full h-12 font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <ProgressDots step={step} />
            </motion.div>
          )}

          {/* STEP 2 — Objetivo */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-1.5">O que você quer melhorar hoje?</h1>
                <p className="text-sm" style={{ color: "hsl(0, 0%, 58%)" }}>
                  Escolha o que faz mais sentido pra você agora
                </p>
              </div>
              <div
                className="rounded-2xl p-5 border space-y-3"
                style={{ background: "hsl(220, 13%, 11%)", borderColor: "hsl(220, 10%, 20%)" }}
              >
                {GOALS.map((goal) => {
                  const active = selectedGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left"
                      style={{
                        background: active ? "rgba(95,189,189,0.12)" : "transparent",
                        borderColor: active ? "#5FBDBD" : "hsl(220, 10%, 22%)",
                      }}
                    >
                      <span className="text-xl">{goal.emoji}</span>
                      <span
                        className="flex-1 text-sm font-medium"
                        style={{ color: active ? "#5FBDBD" : "hsl(0, 0%, 80%)" }}
                      >
                        {goal.label}
                      </span>
                      {active && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#5FBDBD" }} />}
                    </button>
                  );
                })}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="flex-1 h-11 text-white/50 hover:text-white hover:bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!selectedGoal}
                    className="flex-1 h-11 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              <ProgressDots step={step} />
            </motion.div>
          )}

          {/* STEP 3 — Gastos fixos */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-1.5">Você tem ideia dos seus gastos fixos?</h1>
                <p className="text-sm" style={{ color: "hsl(0, 0%, 58%)" }}>
                  Aluguel, contas... pode ser um chute mesmo
                </p>
              </div>
              <div
                className="rounded-2xl p-7 border space-y-5"
                style={{ background: "hsl(220, 13%, 11%)", borderColor: "hsl(220, 10%, 20%)" }}
              >
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Ex: R$ 1.500"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(formatCurrency(e.target.value))}
                    className="text-xl font-bold h-14 bg-transparent border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#5FBDBD] focus-visible:border-[#5FBDBD]"
                    autoFocus
                  />
                  <p className="text-xs" style={{ color: "hsl(0, 0%, 45%)" }}>
                    Pode ser um chute — a gente ajusta depois
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="flex-1 h-11 text-white/50 hover:text-white hover:bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    className="flex-1 h-11 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  </div>
              </div>
              <ProgressDots step={step} />
            </motion.div>
          )}

          {/* STEP 4 — Perfil Financeiro */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-1.5">Qual é seu estilo financeiro?</h1>
                <p className="text-sm" style={{ color: "hsl(0, 0%, 58%)" }}>
                  Isso vai personalizar seu plano inicial
                </p>
              </div>
              <div
                className="rounded-2xl p-5 border space-y-3"
                style={{ background: "hsl(220, 13%, 11%)", borderColor: "hsl(220, 10%, 20%)" }}
              >
                {PROFILES.map((profile) => {
                  const active = selectedProfile === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile.id)}
                      className="w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left"
                      style={{
                        background: active ? "rgba(95,189,189,0.12)" : "transparent",
                        borderColor: active ? "#5FBDBD" : "hsl(220, 10%, 22%)",
                      }}
                    >
                      <span className="text-2xl mt-0.5">{profile.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm"
                          style={{ color: active ? "#5FBDBD" : "hsl(0, 0%, 95%)" }}
                        >
                          {profile.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(0, 0%, 55%)" }}>
                          {profile.description}
                        </p>
                      </div>
                      {active && <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#5FBDBD" }} />}
                    </button>
                  );
                })}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="flex-1 h-11 text-white/50 hover:text-white hover:bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={!selectedProfile}
                    className="flex-1 h-11 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              <ProgressDots step={step} />
            </motion.div>
          )}

          {/* STEP 5 — Plan Generator */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-8"
            >
              <OnboardingPlanGenerator
                monthlyIncome={monthlyIncome}
                fixedExpenses={fixedExpenses}
                selectedGoal={selectedGoal}
                selectedProfile={selectedProfile}
                onComplete={handlePlanComplete}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressDots({ step }) {
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i + 1 === step ? 24 : 6,
            opacity: i + 1 <= step ? 1 : 0.25,
          }}
          transition={{ duration: 0.25 }}
          className="h-1.5 rounded-full"
          style={{ background: "#5FBDBD" }}
        />
      ))}
    </div>
  );
}

// Nota: ProgressDots mostra 4 steps (1-4) pois step 5 (Plan Generator) é a tela final sem dots
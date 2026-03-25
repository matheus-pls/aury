import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

const TOTAL_STEPS = 4;

const GOALS = [
  { id: "control", label: "Parar de gastar sem controle", emoji: "🛑" },
  { id: "organize", label: "Organizar minha vida financeira", emoji: "📋" },
  { id: "save", label: "Começar a guardar dinheiro", emoji: "💰" },
  { id: "freedom", label: "Ter mais liberdade financeira", emoji: "🚀" },
];

export default function MinimalOnboarding() {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [fixedExpenses, setFixedExpenses] = useState("");
  const [finishing, setFinishing] = useState(false);
  const navigate = useNavigate();
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
    setStep(4); // show loading screen
    setFinishing(true);

    if (monthlyIncome) {
      const incomeValue = parseFloat(monthlyIncome.replace(/\D/g, "")) / 100;
      if (incomeValue > 0) {
        await createIncomeMutation.mutateAsync({
          description: "Renda Mensal",
          amount: incomeValue,
          type: "salary",
          is_active: true,
        });
      }
    }

    await createSettingsMutation.mutateAsync({
      risk_profile: "moderate",
      fixed_percentage: 50,
      essential_percentage: 15,
      superfluous_percentage: 10,
      emergency_percentage: 15,
      investment_percentage: 10,
      emergency_fund_goal_months: 6,
      current_emergency_fund: 0,
      notifications_enabled: true,
      onboarding_completed: true,
    });

    queryClient.invalidateQueries(["incomes"]);
    queryClient.invalidateQueries(["settings"]);
    queryClient.invalidateQueries(["settings-onboarding"]);
    localStorage.setItem("aury_onboarding_complete", "true");

    setTimeout(() => {
      navigate(createPageUrl("Home"), { replace: true });
    }, 1800);
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
                    onClick={handleComplete}
                    className="flex-1 h-11 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <button
                  onClick={handleComplete}
                  className="w-full text-xs text-center py-1 transition-colors"
                  style={{ color: "hsl(0, 0%, 40%)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0, 0%, 65%)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(0, 0%, 40%)")}
                >
                  Pular por agora
                </button>
              </div>
              <ProgressDots step={step} />
            </motion.div>
          )}

          {/* STEP 4 — Loading final */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-8"
            >
              <div className="space-y-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="w-14 h-14 mx-auto rounded-full border-4 border-white/10 border-t-[#5FBDBD]"
                />
                <h2 className="text-xl font-bold text-white">Montando seu plano...</h2>
                <p className="text-sm" style={{ color: "hsl(0, 0%, 55%)" }}>
                  Tudo certo. Já vou te mostrar o que preparei 🌱
                </p>
              </div>
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
      {Array.from({ length: 3 }).map((_, i) => (
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
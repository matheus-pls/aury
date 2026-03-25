import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft } from "lucide-react";

const TOTAL_STEPS = 3;

export default function MinimalOnboarding() {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data)
  });

  const createSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.UserSettings.create(data)
  });

  const handleComplete = async () => {
    if (monthlyIncome) {
      const incomeValue = parseFloat(monthlyIncome.replace(/\D/g, "")) / 100;
      if (incomeValue > 0) {
        await createIncomeMutation.mutateAsync({
          description: "Renda Mensal",
          amount: incomeValue,
          type: "salary",
          is_active: true
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
      onboarding_completed: true
    });

    queryClient.invalidateQueries(['incomes']);
    queryClient.invalidateQueries(['settings']);
    queryClient.invalidateQueries(['settings-onboarding']);
    localStorage.setItem("aury_onboarding_complete", "true");
    navigate(createPageUrl("Home"), { replace: true });
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const steps = [
    {
      title: "Bem-vindo à Aury",
      subtitle: "Não precisa ser perfeito, só sincero",
    },
    {
      title: "Quase lá",
      subtitle: "Última pergunta, prometo",
    },
    {
      title: "Tudo pronto!",
      subtitle: "Vamos caminhar juntos",
    },
  ];

  const isLoading = createIncomeMutation.isPending || createSettingsMutation.isPending;

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

      {/* Card */}
      <div className="max-w-sm w-full">
        {/* Step header */}
        <motion.div
          key={`header-${step}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-1.5">
            {steps[step - 1].title}
          </h1>
          <p className="text-sm" style={{ color: "hsl(0, 0%, 58%)" }}>
            {steps[step - 1].subtitle}
          </p>
        </motion.div>

        {/* Card body */}
        <div
          className="rounded-2xl p-7 border"
          style={{ background: "hsl(220, 13%, 11%)", borderColor: "hsl(220, 10%, 20%)" }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    Qual sua renda mensal?
                  </label>
                  <Input
                    type="text"
                    placeholder="R$ 0,00"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(formatCurrency(e.target.value))}
                    className="text-xl font-bold h-14 bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#5FBDBD] focus-visible:border-[#5FBDBD]"
                    autoFocus
                  />
                  <p className="text-xs" style={{ color: "hsl(0, 0%, 45%)" }}>
                    Um valor aproximado já ajuda. A gente ajusta depois.
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    Gastos fixos que você já sabe
                  </label>
                  <Input
                    type="text"
                    placeholder="R$ 0,00"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(formatCurrency(e.target.value))}
                    className="text-xl font-bold h-14 bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#5FBDBD] focus-visible:border-[#5FBDBD]"
                    autoFocus
                  />
                  <p className="text-xs" style={{ color: "hsl(0, 0%, 45%)" }}>
                    Aluguel, contas fixas... Se não souber agora, sem problema.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 text-white/60 hover:text-white hover:bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-6"
              >
                <div className="text-5xl">✨</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">
                    Está tudo pronto!
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(0, 0%, 58%)" }}>
                    Preparei tudo com base no que você me contou. Vamos juntos cuidar do seu dinheiro.
                  </p>
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="w-full h-12 font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #5FBDBD, #1B3A52)" }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Configurando...
                    </span>
                  ) : "Começar agora"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
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
      </div>
    </div>
  );
}
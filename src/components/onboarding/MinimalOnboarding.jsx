import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Sparkles } from "lucide-react";

export default function MinimalOnboarding() {
  const [step, setStep] = useState(1); // 1: renda, 2: gastos fixos, 3: pronto
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
    try {
      // Create income
      if (monthlyIncome) {
        const incomeValue = parseFloat(monthlyIncome.replace(/\D/g, ""));
        if (incomeValue > 0) {
          await createIncomeMutation.mutateAsync({
            description: "Renda Mensal",
            amount: incomeValue,
            type: "salary",
            is_active: true
          });
        }
      }

      // Create default settings with onboarding_completed = true
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
      
      // Save to localStorage as well for backwards compat
      localStorage.setItem("aury_onboarding_complete", "true");
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Even on error, mark as complete and redirect
      localStorage.setItem("aury_onboarding_complete", "true");
      navigate(createPageUrl("Home"));
    }
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleIncomeChange = (e) => {
    setMonthlyIncome(formatCurrency(e.target.value));
  };

  const handleFixedChange = (e) => {
    setFixedExpenses(formatCurrency(e.target.value));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-aury">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
            alt="Aury" 
            className="h-8 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-[#1B3A52] mb-2">
            {step === 1 && "Bem-vindo à Aury"}
            {step === 2 && "Quase lá"}
            {step === 3 && "Tudo pronto!"}
          </h1>
          <p className="text-slate-500">
           {step === 1 && "Não precisa ser perfeito, só sincero"}
           {step === 2 && "Última pergunta, prometo"}
           {step === 3 && "Vamos caminhar juntos"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="income" className="text-[#1B3A52]">
                  Qual sua renda mensal?
                </Label>
                <Input
                  id="income"
                  type="text"
                  placeholder="R$ 0,00"
                  value={monthlyIncome}
                  onChange={handleIncomeChange}
                  className="text-2xl font-bold h-14 border-slate-200 focus:border-[#5FBDBD]"
                />
                <p className="text-xs text-slate-500">
                 Um valor aproximado já ajuda. A gente ajusta depois.
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!monthlyIncome}
                className="w-full h-12 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] shadow-md"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="fixed" className="text-[#1B3A52]">
                  Gastos fixos que você já sabe
                </Label>
                <Input
                  id="fixed"
                  type="text"
                  placeholder="R$ 0,00"
                  value={fixedExpenses}
                  onChange={handleFixedChange}
                  className="text-2xl font-bold h-14 border-slate-200 focus:border-[#5FBDBD]"
                />
                <p className="text-xs text-slate-500">
                 Aluguel, contas fixas... Se não souber agora, sem problema.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-slate-200"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] shadow-md"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              <div className="text-6xl mb-4">✨</div>
              <div>
                <h3 className="text-xl font-bold text-[#1B3A52] mb-2">
                  Está tudo pronto!
                </h3>
                <p className="text-slate-600 leading-relaxed">
                 Preparei tudo com base no que você me contou. Vamos juntos.
                </p>
              </div>

              <Button
                onClick={handleComplete}
                disabled={createIncomeMutation.isPending || createSettingsMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] shadow-md"
              >
                {createIncomeMutation.isPending || createSettingsMutation.isPending ? "Configurando..." : "Começar"}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-8 bg-[#5FBDBD]"
                  : i < step
                  ? "w-1.5 bg-[#5FBDBD]/50"
                  : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
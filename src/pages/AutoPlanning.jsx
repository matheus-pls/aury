import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Sparkles,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  Calendar,
  Wallet,
  Target,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";

export default function AutoPlanning() {
  const [showDetails, setShowDetails] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.filter({ is_completed: false })
  });

  const defaultSettings = {
    fixed_percentage: 50,
    essential_percentage: 20,
    superfluous_percentage: 15,
    emergency_percentage: 10,
    investment_percentage: 5
  };

  const currentSettings = settings || defaultSettings;

  // Calculations
  const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Distribution
  const distribution = {
    fixed: totalIncome * (currentSettings.fixed_percentage / 100),
    essential: totalIncome * (currentSettings.essential_percentage / 100),
    superfluous: totalIncome * (currentSettings.superfluous_percentage / 100),
    emergency: totalIncome * (currentSettings.emergency_percentage / 100),
    investment: totalIncome * (currentSettings.investment_percentage / 100)
  };

  // Total savings (emergency + investment)
  const monthlySavings = distribution.emergency + distribution.investment;
  const weeklySavings = monthlySavings / 4;

  // Available for spending (excluding savings)
  const availableForSpending = totalIncome - monthlySavings;
  const dailySpendingLimit = availableForSpending / daysInMonth;
  const remainingBudget = availableForSpending - totalSpent;
  const canSpendToday = Math.max(0, remainingBudget / (daysRemaining || 1));

  // Goals allocation
  const totalGoalsTarget = goals.reduce((sum, g) => sum + (g.target_amount - g.current_amount), 0);
  const goalsAllocation = Math.min(monthlySavings * 0.3, totalGoalsTarget / 12); // 30% of savings or what's needed

  // Risk assessment
  const spentPercentage = availableForSpending > 0 ? (totalSpent / availableForSpending) * 100 : 0;
  const projectedSpending = (totalSpent / currentDay) * daysInMonth;
  const projectedExcess = projectedSpending - availableForSpending;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyDetailed = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRiskLevel = () => {
    if (spentPercentage < 60) return { level: "Seguro", color: "emerald", icon: CheckCircle2, message: "Você está no caminho certo!" };
    if (spentPercentage < 85) return { level: "Atenção", color: "amber", icon: AlertTriangle, message: "Fique atento aos gastos" };
    return { level: "Crítico", color: "red", icon: AlertTriangle, message: "Risco de estourar o orçamento!" };
  };

  const risk = getRiskLevel();
  const RiskIcon = risk.icon;

  // Alerts
  const alerts = [];
  if (projectedExcess > 0) {
    alerts.push({
      type: "warning",
      message: `No ritmo atual, você pode ultrapassar o orçamento em ${formatCurrency(projectedExcess)}`
    });
  }
  if (remainingBudget < dailySpendingLimit * 5 && daysRemaining > 5) {
    alerts.push({
      type: "danger",
      message: "Orçamento crítico! Considere reduzir gastos supérfluos."
    });
  }
  if (spentPercentage < 50 && currentDay > 15) {
    alerts.push({
      type: "success",
      message: "Ótimo controle! Você está economizando mais do que o planejado."
    });
  }

  // Projected end of month
  const projectedBalance = totalIncome - projectedSpending;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton to={createPageUrl("Planning")} className="mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-[#5FBDBD]" />
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Plano do Mês</h1>
        </div>
        <p className="text-slate-500">Quanto sobra e para onde vai</p>
      </motion.div>

      {/* Sobra Diária Segura - Destaque Principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] text-white shadow-aury"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="relative text-center">
          <p className="text-white/70 text-sm mb-2">Sobra diária segura</p>
          <h2 className="text-6xl font-bold mb-3 tabular-nums">{formatCurrency(canSpendToday)}</h2>
          <p className="text-white/80 text-base">
            Você pode gastar isso hoje sem comprometer o mês
          </p>
        </div>
      </motion.div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <p className="text-xs text-muted-foreground mb-1">Renda</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(totalIncome)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <p className="text-xs text-muted-foreground mb-1">Já Gasto</p>
          <p className="text-xl font-bold text-rose-400 tabular-nums">{formatCurrency(totalSpent)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <p className="text-xs text-muted-foreground mb-1">Economia</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatCurrency(monthlySavings)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <p className="text-xs text-muted-foreground mb-1">Dias Restantes</p>
          <p className="text-xl font-bold text-foreground">{daysRemaining}</p>
        </motion.div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                alert.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : alert.type === "warning"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <p className={`text-sm ${
                alert.type === "success"
                  ? "text-emerald-400"
                  : alert.type === "warning"
                  ? "text-amber-400"
                  : "text-red-400"
              }`}>
                {alert.message}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Details Expandable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-slate-800">Para onde vai meu dinheiro</span>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100"
            >
              <div className="p-6 space-y-6">
                {/* Monthly Overview */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[#00A8A0]" />
                    Resumo do Mês
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-500 mb-1">Renda Total</p>
                      <p className="text-2xl font-bold text-slate-800 tabular-nums">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-500 mb-1">Já Gasto</p>
                      <p className="text-2xl font-bold text-slate-800 tabular-nums">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-500 mb-1">Orçamento Restante</p>
                      <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(remainingBudget)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-500 mb-1">Dias Restantes</p>
                      <p className="text-2xl font-bold text-slate-800">{daysRemaining}</p>
                    </div>
                  </div>
                </div>

                {/* Distribution */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#00A8A0]" />
                    Distribuição Recomendada
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Gastos Fixos", value: distribution.fixed, color: "bg-slate-600" },
                      { label: "Essenciais", value: distribution.essential, color: "bg-[#00A8A0]" },
                      { label: "Supérfluos", value: distribution.superfluous, color: "bg-amber-500" },
                      { label: "Reserva de Emergência", value: distribution.emergency, color: "bg-emerald-500" },
                      { label: "Investimentos", value: distribution.investment, color: "bg-violet-500" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-slate-600">{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums">{formatCurrencyDetailed(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                {goals.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#00A8A0]" />
                      Alocação para Metas
                    </h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-sm text-purple-600 mb-2">Sugestão mensal para suas metas</p>
                      <p className="text-3xl font-bold text-purple-700 tabular-nums">{formatCurrency(goalsAllocation)}</p>
                      <p className="text-xs text-purple-600 mt-2">
                        {goals.length} {goals.length === 1 ? 'meta ativa' : 'metas ativas'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Projection */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00A8A0]" />
                    Projeção até Fim do Mês
                  </h3>
                  <div className={`rounded-xl p-4 ${
                    projectedBalance >= 0 
                      ? "bg-emerald-50 border border-emerald-200" 
                      : "bg-red-50 border border-red-200"
                  }`}>
                    <p className="text-sm text-slate-600 mb-3">Se manter o ritmo atual de gastos:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Projeção de gastos totais</span>
                        <span className="font-semibold text-slate-800 tabular-nums">{formatCurrencyDetailed(projectedSpending)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Saldo final estimado</span>
                        <span className={`font-bold text-lg tabular-nums ${
                          projectedBalance >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {formatCurrencyDetailed(projectedBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Recomendações
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Limite diário recomendado: <strong>{formatCurrency(dailySpendingLimit)}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Economia semanal planejada: <strong>{formatCurrency(weeklySavings)}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Investimento mensal automático: <strong>{formatCurrency(distribution.investment)}</strong></span>
                    </li>
                    {goalsAllocation > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Contribuição para metas: <strong>{formatCurrency(goalsAllocation)}</strong></span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
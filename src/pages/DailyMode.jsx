import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";

export default function DailyMode() {
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
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth }, '-date')
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
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
  
  // Reserve percentages (emergency + investment)
  const reservePercentage = currentSettings.emergency_percentage + currentSettings.investment_percentage;
  const availableForSpending = totalIncome * (1 - reservePercentage / 100);
  
  // Daily calculation
  const optimalDailyLimit = availableForSpending / daysInMonth;
  const spentToday = expenses
    .filter(e => e.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const remainingBudget = availableForSpending - totalSpent;
  const recommendedDailySpending = remainingBudget > 0 ? remainingBudget / (daysRemaining || 1) : 0;
  
  // Today's status
  const canSpendToday = Math.max(0, recommendedDailySpending - spentToday);
  const todayProgress = optimalDailyLimit > 0 ? (spentToday / optimalDailyLimit) * 100 : 0;
  
  // Status
  const getStatus = () => {
    if (todayProgress < 80) return { type: "good", color: "emerald", icon: CheckCircle2, message: "Você está no controle!" };
    if (todayProgress < 100) return { type: "warning", color: "amber", icon: AlertCircle, message: "Atenção ao limite" };
    return { type: "danger", color: "red", icon: AlertCircle, message: "Limite ultrapassado" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Daily ranking
  const dailySpending = expenses.reduce((acc, exp) => {
    const date = exp.date;
    acc[date] = (acc[date] || 0) + exp.amount;
    return acc;
  }, {});

  const dailyRanking = Object.entries(dailySpending)
    .map(([date, amount]) => ({
      date: new Date(date).getDate(),
      amount,
      dateStr: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Projections
  const averageDailySpending = totalSpent / currentDay;
  const projectedMonthEnd = averageDailySpending * daysInMonth;
  const projectedBalance = totalIncome - projectedMonthEnd;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton to={createPageUrl("Planning")} className="mb-4" />
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Modo Dia a Dia</h1>
        <p className="text-slate-500 mt-1">Quanto você pode gastar hoje?</p>
      </motion.div>

      {/* Main Card - Can Spend Today */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`bg-gradient-to-br from-${status.color}-500 to-${status.color}-600 rounded-3xl p-8 text-white shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <span className="text-white/90">Hoje, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
          </div>
          <StatusIcon className="w-8 h-8" />
        </div>

        <div className="text-center mb-8">
          <p className="text-white/80 text-lg mb-2">Você pode gastar</p>
          <h2 className="text-6xl font-bold mb-2 tabular-nums">{formatCurrency(canSpendToday)}</h2>
          <p className="text-white/70 text-sm">{status.message}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Gasto de hoje</span>
            <span className="font-semibold">{formatCurrency(spentToday)}</span>
          </div>
          <Progress 
            value={Math.min(todayProgress, 100)} 
            className="h-2 bg-white/20"
          />
          <div className="flex justify-between text-xs text-white/70">
            <span>Limite diário ideal: {formatCurrency(optimalDailyLimit)}</span>
            <span>{todayProgress.toFixed(0)}%</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <p className="text-sm text-slate-500">Dias restantes</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{daysRemaining}</p>
          <p className="text-xs text-slate-500 mt-1">até o fim do mês</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            <p className="text-sm text-slate-500">Média diária</p>
          </div>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">{formatCurrency(averageDailySpending)}</p>
          <p className="text-xs text-slate-500 mt-1">gastos por dia</p>
        </motion.div>
      </div>

      {/* Details Expandable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-slate-800">Ver detalhes completos</span>
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
              <div className="p-5 space-y-6">
                {/* Projection */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Projeção até o fim do mês</h3>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-600">Se manter o ritmo atual</span>
                      {projectedBalance >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Projeção de gastos</span>
                        <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(projectedMonthEnd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Saldo estimado</span>
                        <span className={`font-bold tabular-nums ${projectedBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(projectedBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Ranking */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Dias com maior gasto</h3>
                  <div className="space-y-2">
                    {dailyRanking.map((day, index) => (
                      <div 
                        key={day.date}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0 ? 'bg-red-100 text-red-600' :
                            index === 1 ? 'bg-orange-100 text-orange-600' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {index + 1}º
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">Dia {day.date}</p>
                            <p className="text-xs text-slate-500">{day.dateStr}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(day.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Dica para hoje</h4>
                  <p className="text-sm text-blue-700">
                    {canSpendToday > optimalDailyLimit * 1.5
                      ? "Você tem uma boa margem hoje! Considere guardar o excedente."
                      : canSpendToday > 0
                      ? "Mantenha o foco e você terminará o mês no azul!"
                      : "Você já atingiu seu limite diário. Tente evitar gastos extras hoje."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
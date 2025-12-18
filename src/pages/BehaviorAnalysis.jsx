import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShoppingCart,
  AlertCircle,
  Award,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BehaviorAnalysis() {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch last 3 months of expenses
  const months = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses-analysis'],
    queryFn: async () => {
      const promises = months.map(month => 
        base44.entities.Expense.filter({ month_year: month })
      );
      const results = await Promise.all(promises);
      return results.flat();
    }
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);

  // Analysis calculations
  const analyzeExpenses = () => {
    if (allExpenses.length === 0) return null;

    // Category analysis
    const byCategory = allExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // Biggest category
    const biggestCategory = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)[0];

    // Superfluous spending
    const superfluousTotal = byCategory.superfluous || 0;
    const superfluousPercentage = totalIncome > 0 
      ? (superfluousTotal / (totalIncome * 3)) * 100 
      : 0;

    // Daily patterns
    const byDayOfWeek = allExpenses.reduce((acc, exp) => {
      const day = new Date(exp.date).getDay();
      acc[day] = (acc[day] || 0) + exp.amount;
      return acc;
    }, {});

    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const mostExpensiveDay = Object.entries(byDayOfWeek)
      .sort(([, a], [, b]) => b - a)[0];

    // Monthly trend
    const byMonth = allExpenses.reduce((acc, exp) => {
      acc[exp.month_year] = (acc[exp.month_year] || 0) + exp.amount;
      return acc;
    }, {});

    const monthlyValues = Object.values(byMonth);
    const avgMonthly = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    const currentMonthSpending = byMonth[currentMonth] || 0;
    const trend = currentMonthSpending > avgMonthly ? "up" : "down";
    const trendPercentage = Math.abs(((currentMonthSpending - avgMonthly) / avgMonthly) * 100);

    // Biggest single expense
    const biggestExpense = allExpenses.reduce((max, exp) => 
      exp.amount > max.amount ? exp : max
    , allExpenses[0]);

    // Recurring patterns
    const descriptions = allExpenses.map(e => e.description.toLowerCase());
    const recurring = descriptions.filter((desc, idx) => 
      descriptions.indexOf(desc) !== idx
    ).length;

    // Best month
    const bestMonth = Object.entries(byMonth)
      .sort(([, a], [, b]) => a - b)[0];

    return {
      biggestCategory,
      superfluousTotal,
      superfluousPercentage,
      mostExpensiveDay: mostExpensiveDay ? {
        day: daysOfWeek[mostExpensiveDay[0]],
        amount: mostExpensiveDay[1]
      } : null,
      trend,
      trendPercentage,
      biggestExpense,
      recurringCount: recurring,
      totalExpenses: allExpenses.reduce((sum, e) => sum + e.amount, 0),
      avgMonthly,
      bestMonth: bestMonth ? {
        month: bestMonth[0],
        amount: bestMonth[1]
      } : null,
      categoryBreakdown: byCategory
    };
  };

  const analysis = analyzeExpenses();

  const categoryLabels = {
    fixed: "Gastos Fixos",
    essential: "Essenciais",
    superfluous: "Supérfluos",
    emergency: "Reserva",
    investment: "Investimentos"
  };

  // Generate insights
  const generateInsights = () => {
    if (!analysis) return [];

    const insights = [];

    // Insight 1: Main pattern
    if (analysis.biggestCategory) {
      insights.push({
        emoji: "📊",
        title: "Seu maior gasto",
        message: `Você gastou mais com ${categoryLabels[analysis.biggestCategory[0]] || analysis.biggestCategory[0]}`,
        detail: `Nos últimos 3 meses, ${formatCurrency(analysis.biggestCategory[1])} foram para essa categoria.`,
        color: "from-blue-500 to-blue-600"
      });
    }

    // Insight 2: Superfluous spending
    if (analysis.superfluousPercentage > 15) {
      insights.push({
        emoji: "💸",
        title: "Atenção aos supérfluos",
        message: `${analysis.superfluousPercentage.toFixed(0)}% da sua renda vai para gastos não essenciais`,
        detail: `Isso representa ${formatCurrency(analysis.superfluousTotal)} nos últimos 3 meses. Pequenos cortes aqui podem fazer diferença!`,
        color: "from-amber-500 to-orange-500"
      });
    } else if (analysis.superfluousPercentage < 8) {
      insights.push({
        emoji: "🎯",
        title: "Você é disciplinado!",
        message: "Seus gastos supérfluos estão muito controlados",
        detail: `Apenas ${analysis.superfluousPercentage.toFixed(0)}% da renda vai para o não essencial. Parabéns pelo controle!`,
        color: "from-emerald-500 to-green-600"
      });
    }

    // Insight 3: Day pattern
    if (analysis.mostExpensiveDay) {
      insights.push({
        emoji: "📅",
        title: "Seu dia de maior gasto",
        message: `${analysis.mostExpensiveDay.day} é quando você mais gasta`,
        detail: `Em média, ${formatCurrency(analysis.mostExpensiveDay.amount / 3)} saem da sua conta nesse dia da semana.`,
        color: "from-purple-500 to-purple-600"
      });
    }

    // Insight 4: Trend
    if (analysis.trendPercentage > 10) {
      insights.push({
        emoji: analysis.trend === "up" ? "📈" : "📉",
        title: analysis.trend === "up" ? "Gastos em alta" : "Gastos em baixa",
        message: `Este mês você gastou ${analysis.trendPercentage.toFixed(0)}% ${analysis.trend === "up" ? "mais" : "menos"} que a média`,
        detail: analysis.trend === "up" 
          ? "Fique atento! Seus gastos estão aumentando." 
          : "Ótimo trabalho! Você está economizando mais.",
        color: analysis.trend === "up" ? "from-red-500 to-red-600" : "from-emerald-500 to-emerald-600"
      });
    }

    // Insight 5: Best month
    if (analysis.bestMonth) {
      const monthName = new Date(analysis.bestMonth.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      insights.push({
        emoji: "🏆",
        title: "Seu melhor mês",
        message: `${monthName} foi seu mês mais econômico`,
        detail: `Você gastou apenas ${formatCurrency(analysis.bestMonth.amount)}. Tente repetir esse desempenho!`,
        color: "from-yellow-500 to-amber-500"
      });
    }

    // Insight 6: Biggest expense
    if (analysis.biggestExpense) {
      insights.push({
        emoji: "💰",
        title: "Seu maior gasto",
        message: `${analysis.biggestExpense.description}`,
        detail: `${formatCurrency(analysis.biggestExpense.amount)} - isso representa ${((analysis.biggestExpense.amount / analysis.totalExpenses) * 100).toFixed(0)}% dos seus gastos totais.`,
        color: "from-pink-500 to-rose-600"
      });
    }

    return insights.slice(0, 6); // Max 6 insights
  };

  const insights = generateInsights();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const nextInsight = () => {
    if (currentInsightIndex < insights.length - 1) {
      setCurrentInsightIndex(currentInsightIndex + 1);
    }
  };

  const prevInsight = () => {
    if (currentInsightIndex > 0) {
      setCurrentInsightIndex(currentInsightIndex - 1);
    }
  };

  if (!analysis || insights.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Sem dados suficientes</h2>
          <p className="text-slate-500">Registre mais gastos para gerar sua análise de comportamento</p>
        </div>
      </div>
    );
  }

  if (showFullReport) {
    return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => setShowFullReport(false)}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar aos insights
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Relatório Completo</h1>
          <p className="text-slate-500 mt-1">Análise detalhada dos últimos 3 meses</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
          >
            <p className="text-sm text-slate-500 mb-1">Total Gasto</p>
            <p className="text-3xl font-bold text-slate-800 tabular-nums">{formatCurrency(analysis.totalExpenses)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
          >
            <p className="text-sm text-slate-500 mb-1">Média Mensal</p>
            <p className="text-3xl font-bold text-slate-800 tabular-nums">{formatCurrency(analysis.avgMonthly)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
          >
            <p className="text-sm text-slate-500 mb-1">Total de Gastos</p>
            <p className="text-3xl font-bold text-slate-800">{allExpenses.length}</p>
          </motion.div>
        </div>

        {/* All Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gradient-to-br ${insight.color} rounded-2xl p-6 text-white`}
            >
              <div className="text-4xl mb-3">{insight.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{insight.title}</h3>
              <p className="text-white/90 text-lg mb-2">{insight.message}</p>
              <p className="text-white/70 text-sm">{insight.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <h3 className="font-semibold text-slate-800 mb-4">Gastos por Categoria</h3>
          <div className="space-y-3">
            {Object.entries(analysis.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / analysis.totalExpenses) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600">{categoryLabels[category] || category}</span>
                      <span className="text-sm font-semibold text-slate-800">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00A8A0]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>
    );
  }

  const currentInsight = insights[currentInsightIndex];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentInsightIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentInsightIndex 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Insight Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsightIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-br ${currentInsight.color} rounded-3xl p-8 text-white shadow-2xl`}
          >
            <div className="text-center">
              <div className="text-7xl mb-6">{currentInsight.emoji}</div>
              <h2 className="text-2xl font-bold mb-4">{currentInsight.title}</h2>
              <p className="text-3xl font-bold mb-6">{currentInsight.message}</p>
              <p className="text-white/80 text-lg">{currentInsight.detail}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={prevInsight}
            disabled={currentInsightIndex === 0}
            className="text-slate-600 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Anterior
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowFullReport(true)}
            className="text-slate-600"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver relatório completo
          </Button>

          {currentInsightIndex < insights.length - 1 ? (
            <Button
              variant="ghost"
              onClick={nextInsight}
              className="text-slate-600"
            >
              Próximo
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setCurrentInsightIndex(0)}
              className="text-slate-600"
            >
              Recomeçar
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
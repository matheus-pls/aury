import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Calendar, Clock, BarChart3, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import BackButton from "@/components/BackButton";

export default function ConsumptionPatterns() {
  const getLastMonths = (count) => {
    const months = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  };

  const lastMonths = getLastMonths(3);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses-patterns', lastMonths],
    queryFn: async () => {
      const allExpenses = await base44.entities.Expense.list();
      return allExpenses.filter(e => lastMonths.includes(e.month_year));
    }
  });

  // Day of week analysis
  const byDayOfWeek = expenses.reduce((acc, e) => {
    const day = new Date(e.date).getDay();
    acc[day] = (acc[day] || 0) + e.amount;
    return acc;
  }, {});

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayChartData = daysOfWeek.map((day, index) => ({
    day,
    total: byDayOfWeek[index] || 0
  }));

  // Find recurring patterns (same description appearing multiple times)
  const descriptionCount = expenses.reduce((acc, e) => {
    const desc = e.description.toLowerCase().trim();
    if (!acc[desc]) {
      acc[desc] = { count: 0, total: 0, category: e.category, description: e.description };
    }
    acc[desc].count++;
    acc[desc].total += e.amount;
    return acc;
  }, {});

  const recurringPatterns = Object.values(descriptionCount)
    .filter(item => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Frequent small expenses (< R$ 50 that appear often)
  const smallExpenses = expenses.filter(e => e.amount < 50);
  const smallExpensesTotal = smallExpenses.reduce((sum, e) => sum + e.amount, 0);
  const smallExpensesPercent = expenses.length > 0 ? (smallExpenses.length / expenses.length) * 100 : 0;

  // Category frequency
  const categoryFrequency = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const mostFrequentCategory = Object.entries(categoryFrequency).reduce((max, [cat, freq]) =>
    freq > (max[1] || 0) ? [cat, freq] : max, ['', 0]
  );

  const categoryLabels = {
    fixed: 'Gastos Fixos',
    essential: 'Essenciais',
    superfluous: 'Supérfluos',
    emergency: 'Emergência',
    investment: 'Investimentos'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5FBDBD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Identificando padrões...</p>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Dados insuficientes</h2>
          <p className="text-slate-500">Registre gastos para identificar padrões de consumo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Analysis")} />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Quando eu gasto mais</h1>
            <p className="text-slate-500 text-sm">Seus padrões de timing</p>
          </div>
        </div>
      </motion.div>

      {/* Day of Week Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border border-slate-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#1B3A52] mb-4">Gastos por dia da semana</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dayChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#4facfe" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recurring Patterns */}
      {recurringPatterns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#1B3A52]">O que sempre volta</h3>
          {recurringPatterns.map((pattern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1B3A52] mb-1">{pattern.description}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span>{pattern.count}x nos últimos meses</span>
                        <span>•</span>
                        <span>{formatCurrency(pattern.total)} total</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1B3A52]">{formatCurrency(pattern.total / pattern.count)}</p>
                      <p className="text-xs text-slate-500">média por ocorrência</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Small Expenses Impact */}
      {smallExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-amber-200 bg-amber-50/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-2">Pequenos gastos somam</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    {smallExpensesPercent.toFixed(0)}% dos seus gastos são pequenos (até R$ 50), mas somam <strong>{formatCurrency(smallExpensesTotal)}</strong>
                  </p>
                  <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                    <p className="text-xs font-medium text-amber-900 mb-1">💡 O que fazer</p>
                    <p className="text-sm text-amber-800">
                      Cortando metade desses pequenos gastos, você economiza {formatCurrency(smallExpensesTotal * 0.5)} por mês.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Most Frequent Category */}
      {mostFrequentCategory[0] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-2 border-[#5FBDBD]/20 bg-[#5FBDBD]/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1B3A52] mb-2">Categoria mais frequente</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>{categoryLabels[mostFrequentCategory[0]]}</strong> aparece {mostFrequentCategory[1]} vezes nos últimos meses
                  </p>
                  <p className="text-xs text-slate-500">
                    Essa é sua categoria de gastos mais recorrente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
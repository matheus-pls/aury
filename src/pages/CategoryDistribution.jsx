import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { PieChart, Home, ShoppingBag, Coffee, Shield, TrendingUp as Investment } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import BackButton from "@/components/BackButton";

export default function CategoryDistribution() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const categoryIcons = {
    fixed: Home,
    essential: ShoppingBag,
    superfluous: Coffee,
    emergency: Shield,
    investment: Investment
  };

  const categoryLabels = {
    fixed: 'Gastos Fixos',
    essential: 'Essenciais',
    superfluous: 'Supérfluos',
    emergency: 'Emergência',
    investment: 'Investimentos'
  };

  const categoryColors = {
    fixed: '#1B3A52',
    essential: '#5FBDBD',
    superfluous: '#F59E0B',
    emergency: '#EF4444',
    investment: '#10B981'
  };

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const chartData = Object.entries(byCategory).map(([cat, amount]) => ({
    name: categoryLabels[cat],
    value: amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0,
    color: categoryColors[cat]
  })).sort((a, b) => b.value - a.value);

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
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Sem gastos este mês</h2>
          <p className="text-slate-500">Registre gastos para ver a distribuição por categoria</p>
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
          <div className="w-12 h-12 bg-gradient-to-br from-[#1B3A52] to-[#0A2540] rounded-2xl flex items-center justify-center shadow-aury">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Para onde vai meu dinheiro</h1>
            <p className="text-slate-500 text-sm">Distribuição por categoria este mês</p>
          </div>
        </div>
      </motion.div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#1B3A52] to-[#0A2540] rounded-2xl p-6 text-white shadow-aury"
      >
        <p className="text-white/80 text-sm mb-2">Total gasto este mês</p>
        <h2 className="text-4xl font-bold">{formatCurrency(totalExpenses)}</h2>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border border-slate-200">
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#1B3A52]">Detalhamento por categoria</h3>
        {chartData.map((item, index) => {
          const categoryKey = Object.keys(categoryLabels).find(key => categoryLabels[key] === item.name);
          const Icon = categoryIcons[categoryKey];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#1B3A52] mb-1">{item.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-slate-700">{formatCurrency(item.value)}</span>
                          <span className="text-sm text-slate-500">({item.percentage}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
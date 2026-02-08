import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import BackButton from "@/components/BackButton";

export default function MonthlyTrends() {
  const getLastMonths = (count) => {
    const months = [];
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  };

  const lastMonths = getLastMonths(6);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses-trends'],
    queryFn: () => base44.entities.Expense.list()
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  const byMonth = expenses.reduce((acc, e) => {
    if (lastMonths.includes(e.month_year)) {
      acc[e.month_year] = (acc[e.month_year] || 0) + e.amount;
    }
    return acc;
  }, {});

  const chartData = lastMonths.map(month => {
    const [year, monthNum] = month.split('-');
    const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'short' });
    
    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      gastos: byMonth[month] || 0,
      renda: totalIncome
    };
  });

  const currentMonthTotal = byMonth[lastMonths[lastMonths.length - 1]] || 0;
  const lastMonthTotal = byMonth[lastMonths[lastMonths.length - 2]] || 0;
  const trend = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Calculate average
  const avgExpenses = Object.values(byMonth).reduce((sum, val) => sum + val, 0) / Object.keys(byMonth).length;

  // Calculate projection
  const recentMonths = [byMonth[lastMonths[lastMonths.length - 1]], byMonth[lastMonths[lastMonths.length - 2]], byMonth[lastMonths[lastMonths.length - 3]]].filter(Boolean);
  const avgRecent = recentMonths.reduce((sum, val) => sum + val, 0) / recentMonths.length;
  const projection = avgRecent * 1.1; // 10% growth projection

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
          <p className="text-slate-500">Carregando tendências...</p>
        </div>
      </div>
    );
  }

  if (Object.keys(byMonth).length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Dados insuficientes</h2>
          <p className="text-slate-500">Registre gastos por alguns meses para ver tendências</p>
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
          <div className="w-12 h-12 bg-gradient-to-br from-[#2A4A62] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Tendências Mensais</h1>
            <p className="text-slate-500 text-sm">Evolução dos últimos 6 meses</p>
          </div>
        </div>
      </motion.div>

      {/* Current vs Last Month */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 text-white shadow-aury ${
          trend > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm mb-2">Comparado ao mês anterior</p>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold">{Math.abs(trend).toFixed(0)}%</h2>
              {trend > 0 ? (
                <div className="flex items-center gap-1 text-white/90">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Aumento</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-white/90">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-sm font-medium">Redução</span>
                </div>
              )}
            </div>
          </div>
        </div>
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="renda" stroke="#10B981" strokeWidth={2} name="Renda" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="gastos" stroke="#1B3A52" strokeWidth={3} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">Média dos 6 meses</p>
              <p className="text-2xl font-bold text-[#1B3A52]">{formatCurrency(avgExpenses)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">Mês atual</p>
              <p className="text-2xl font-bold text-[#1B3A52]">{formatCurrency(currentMonthTotal)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">Projeção próximo mês</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(projection)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="border-2 border-[#5FBDBD]/20 bg-[#5FBDBD]/5">
          <CardContent className="p-5">
            <h3 className="font-semibold text-[#1B3A52] mb-2">💡 Insight</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {trend > 15 
                ? `Se mantiver esse ritmo, seus gastos aumentarão ${(trend * 3).toFixed(0)}% em 3 meses. Considere revisar suas categorias de gastos.`
                : trend < -10
                ? `Excelente! Mantendo esse controle, você pode economizar ${formatCurrency(Math.abs(currentMonthTotal - lastMonthTotal) * 12)} em um ano.`
                : `Seus gastos estão estáveis. Continue monitorando para manter o equilíbrio.`}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
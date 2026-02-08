import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/BackButton";

export default function SmartAnalysis() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 7);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list()
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

  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  
  const currentExpenses = expenses.filter(e => e.month_year === currentMonth);
  const lastMonthExpenses = expenses.filter(e => e.month_year === lastMonth);
  
  const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const monthTrend = lastMonthTotal > 0 ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const highlights = [];
  const attentionPoints = [];

  // Positive highlights
  if (monthTrend < -10) {
    highlights.push({
      icon: TrendingDown,
      title: "Redução de gastos",
      message: `Você gastou ${Math.abs(monthTrend).toFixed(0)}% a menos este mês`,
      color: "from-emerald-500 to-green-600"
    });
  }

  if (totalIncome > 0 && currentTotal < totalIncome * 0.85) {
    highlights.push({
      icon: CheckCircle2,
      title: "Controle financeiro",
      message: "Seus gastos estão dentro do esperado",
      color: "from-[#5FBDBD] to-[#4FA9A5]"
    });
  }

  const emergencyFund = settings?.current_emergency_fund || 0;
  const fixedExpenses = currentExpenses.filter(e => e.category === 'fixed').reduce((s, e) => s + e.amount, 0);
  const emergencyGoal = fixedExpenses * (settings?.emergency_fund_goal_months || 6);
  
  if (emergencyFund > emergencyGoal * 0.7) {
    highlights.push({
      icon: CheckCircle2,
      title: "Reserva em dia",
      message: `Você está ${(emergencyFund / emergencyGoal * 100).toFixed(0)}% da meta de emergência`,
      color: "from-blue-500 to-indigo-600"
    });
  }

  // Attention points
  if (monthTrend > 15) {
    attentionPoints.push({
      icon: TrendingUp,
      title: "Gastos crescendo",
      message: `Aumento de ${monthTrend.toFixed(0)}% comparado ao mês anterior`,
      suggestion: "Revise seus gastos variáveis nos próximos dias"
    });
  }

  if (totalIncome > 0 && currentTotal > totalIncome * 0.95) {
    attentionPoints.push({
      icon: AlertCircle,
      title: "Perto do limite",
      message: "Você está usando quase toda sua renda mensal",
      suggestion: "Evite novos gastos não essenciais este mês"
    });
  }

  if (emergencyFund < emergencyGoal * 0.3) {
    attentionPoints.push({
      icon: AlertCircle,
      title: "Reserva baixa",
      message: "Sua reserva de emergência está abaixo do recomendado",
      suggestion: `Tente economizar ${formatCurrency((emergencyGoal * 0.1))} por mês`
    });
  }

  const recurringExpenses = currentExpenses.filter(e => e.is_recurring);
  if (recurringExpenses.length > 5) {
    attentionPoints.push({
      icon: Clock,
      title: "Muitas assinaturas",
      message: `${recurringExpenses.length} gastos recorrentes ativos`,
      suggestion: "Revise se todas são realmente necessárias"
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5FBDBD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Analisando seus dados...</p>
        </div>
      </div>
    );
  }

  if (highlights.length === 0 && attentionPoints.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Dados insuficientes</h2>
          <p className="text-slate-500">Registre gastos para ver análises inteligentes</p>
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
          <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Análise Inteligente</h1>
            <p className="text-slate-500 text-sm">Resumo automático da sua situação</p>
          </div>
        </div>
      </motion.div>

      {/* Period Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl p-6 text-white shadow-aury"
      >
        <p className="text-white/80 text-sm mb-2">Este mês até agora</p>
        <h2 className="text-4xl font-bold mb-4">{formatCurrency(currentTotal)}</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            {monthTrend < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-300">{Math.abs(monthTrend).toFixed(0)}% menor</span>
              </>
            ) : monthTrend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span className="text-amber-300">{monthTrend.toFixed(0)}% maior</span>
              </>
            ) : (
              <span className="text-white/70">Igual ao mês anterior</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Positive Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#1B3A52]">Destaques Positivos</h3>
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="border border-slate-200 hover:shadow-aury transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${highlight.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#1B3A52] mb-1">{highlight.title}</h4>
                        <p className="text-sm text-slate-600">{highlight.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Attention Points */}
      {attentionPoints.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#1B3A52]">Pontos de Atenção</h3>
          {attentionPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card className="border-2 border-amber-200 bg-amber-50/50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-1">{point.title}</h4>
                        <p className="text-sm text-amber-800">{point.message}</p>
                      </div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-medium text-amber-900 mb-1">💡 Sugestão</p>
                      <p className="text-sm text-amber-800">{point.suggestion}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
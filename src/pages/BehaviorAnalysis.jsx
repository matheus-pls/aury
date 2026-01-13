import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  Target,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackButton from "@/components/BackButton";

export default function BehaviorAnalysis() {
  const [showFullReport, setShowFullReport] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(3);

  // Get last N months
  const getLastMonths = (count) => {
    const months = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  };

  const lastMonths = getLastMonths(selectedPeriod);

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses-analysis', lastMonths],
    queryFn: async () => {
      const allExpenses = await base44.entities.Expense.list();
      return allExpenses.filter(e => lastMonths.includes(e.month_year));
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

  // Analysis calculations
  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  
  // By category
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const largestCategory = Object.entries(byCategory).reduce((max, [cat, val]) => 
    val > (max[1] || 0) ? [cat, val] : max, ['', 0]
  );

  const superfluousSpending = byCategory.superfluous || 0;
  const superfluousPercentage = totalIncome > 0 ? (superfluousSpending / totalIncome) * 100 : 0;

  // By day of week
  const byDayOfWeek = expenses.reduce((acc, e) => {
    const day = new Date(e.date).getDay();
    acc[day] = (acc[day] || 0) + e.amount;
    return acc;
  }, {});

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const mostExpensiveDay = Object.entries(byDayOfWeek).reduce((max, [day, val]) =>
    val > (max[1] || 0) ? [day, val] : max, [0, 0]
  );

  // By month
  const byMonth = expenses.reduce((acc, e) => {
    acc[e.month_year] = (acc[e.month_year] || 0) + e.amount;
    return acc;
  }, {});

  const bestMonth = Object.entries(byMonth).reduce((min, [month, val]) =>
    val < (min[1] || Infinity) ? [month, val] : min, ['', Infinity]
  );

  // Biggest expense
  const biggestExpense = expenses.reduce((max, e) => 
    e.amount > (max.amount || 0) ? e : max, {}
  );

  // Recurring
  const recurringExpenses = expenses.filter(e => e.is_recurring);
  const recurringTotal = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const categoryLabels = {
    fixed: 'Gastos Fixos',
    essential: 'Essenciais',
    superfluous: 'Supérfluos',
    emergency: 'Emergência',
    investment: 'Investimentos'
  };

  // Generate insights with actions (1 insight = 1 action)
  const insights = [];

  if (superfluousPercentage > 15) {
    const dailySavings = (superfluousSpending * 0.3) / 30;
    const monthlySavings = superfluousSpending * 0.3;
    insights.push({
      type: 'superfluous',
      title: 'Reduza supérfluos',
      message: `${superfluousPercentage.toFixed(0)}% da sua renda vai para gastos supérfluos.`,
      action: `Se você gastar ${formatCurrency(dailySavings)} a menos por dia em lazer, economiza ${formatCurrency(monthlySavings)} por mês.`,
      impact: `+${Math.ceil(monthlySavings / 100)} pontos de tranquilidade`
    });
  } else if (superfluousPercentage > 0) {
    insights.push({
      type: 'superfluous',
      title: 'Você é disciplinado!',
      message: `Seus gastos supérfluos estão muito controlados. Apenas ${superfluousPercentage.toFixed(0)}% da renda vai para o não essencial.`,
      action: `Continue assim e sua tranquilidade financeira permanece alta.`,
      impact: `Controle mantido`
    });
  }

  if (mostExpensiveDay[0] && mostExpensiveDay[1] > 0) {
    const avgDay = mostExpensiveDay[1] / (lastMonths.length * 4);
    insights.push({
      type: 'pattern',
      title: `${daysOfWeek[mostExpensiveDay[0]]}s são caras`,
      message: `Você gasta mais nas ${daysOfWeek[mostExpensiveDay[0]]}s.`,
      action: `Planeje ${formatCurrency(avgDay * 0.7)} para esse dia e evite compras por impulso.`,
      impact: `Economia de ~${formatCurrency(avgDay * 0.3)} por ${daysOfWeek[mostExpensiveDay[0]]}`
    });
  }

  if (recurringExpenses.length > 0 && recurringTotal > totalIncome * 0.2) {
    insights.push({
      type: 'recurring',
      title: 'Revise recorrentes',
      message: `Você tem ${recurringExpenses.length} gasto${recurringExpenses.length > 1 ? 's' : ''} recorrente${recurringExpenses.length > 1 ? 's' : ''} (${formatCurrency(recurringTotal)}/mês).`,
      action: `Cancele 1 assinatura não essencial e economize ${formatCurrency(recurringTotal * 0.2)} por mês.`,
      impact: `+${Math.ceil(recurringTotal * 0.2 / 100)} pontos de tranquilidade`
    });
  }

  if (largestCategory[0] && largestCategory[1] > totalIncome * 0.4) {
    const potentialSaving = largestCategory[1] * 0.15;
    insights.push({
      type: 'category',
      title: `Categoria dominante: ${categoryLabels[largestCategory[0]]}`,
      message: `${formatCurrency(largestCategory[1])} vão para ${categoryLabels[largestCategory[0]] || largestCategory[0]}.`,
      action: `Reduza 15% nessa categoria e economize ${formatCurrency(potentialSaving)} ao mês.`,
      impact: `+${Math.ceil(potentialSaving / 100)} pontos de tranquilidade`
    });
  }

  if (bestMonth[0] && bestMonth[0] !== '') {
    const [year, month] = bestMonth[0].split('-');
    const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const worstMonth = Object.entries(byMonth).reduce((max, [m, val]) =>
      val > (max[1] || 0) ? [m, val] : max, ['', 0]
    );
    const difference = worstMonth[1] - bestMonth[1];
    
    if (difference > 0) {
      insights.push({
        type: 'trend',
        title: `Replique ${monthName}`,
        message: `${monthName} foi seu mês mais econômico: ${formatCurrency(bestMonth[1])}.`,
        action: `Siga o mesmo padrão daquele mês e economize ${formatCurrency(difference)} neste.`,
        impact: `Potencial de ${formatCurrency(difference)} de economia`
      });
    }
  }

  // If no insights, add a default positive one
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      title: 'Você está no caminho certo',
      message: 'Seus gastos estão equilibrados.',
      action: 'Continue registrando suas movimentações para manter o controle.',
      impact: 'Tranquilidade mantida'
    });
  }

  const handleNext = () => {
    if (currentInsightIndex < insights.length - 1) {
      setCurrentInsightIndex(currentInsightIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentInsightIndex > 0) {
      setCurrentInsightIndex(currentInsightIndex - 1);
    }
  };

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

  if (expenses.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Dados insuficientes
          </h2>
          <p className="text-slate-500">
            Registre gastos por pelo menos um mês para ver análises comportamentais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Analysis")} />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Análise de Comportamento</h1>
            <p className="text-slate-500 text-sm">Últimos {selectedPeriod} meses de atividade financeira</p>
          </div>
          <Select value={selectedPeriod.toString()} onValueChange={(val) => setSelectedPeriod(parseInt(val))}>
            <SelectTrigger className="w-40 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Navigation or Insights Display */}
      {!showFullReport ? (
        <div className="space-y-6">
          {/* Current Insight Card - Premium Design */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentInsightIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="rounded-3xl p-8 shadow-aury bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] text-white relative overflow-hidden"
            >
              {/* Decorative Elements */}
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{insights[currentInsightIndex]?.title}</h3>
                    <p className="text-white/90 leading-relaxed text-base">{insights[currentInsightIndex]?.message}</p>
                  </div>
                </div>

                {/* Action Block */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-300 text-xs font-semibold mb-1">Ação Sugerida</p>
                      <p className="text-white text-sm leading-relaxed">{insights[currentInsightIndex]?.action}</p>
                      {insights[currentInsightIndex]?.impact && (
                        <p className="text-white/70 text-xs mt-2">💡 {insights[currentInsightIndex]?.impact}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <p className="text-sm text-white/70">Insight {currentInsightIndex + 1} de {insights.length}</p>
                  <div className="flex gap-1.5">
                    {insights.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentInsightIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons - Premium Style */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-[#5FBDBD]/30 text-slate-600"
              onClick={handlePrevious}
              disabled={currentInsightIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#5FBDBD]/30 hover:bg-[#5FBDBD]/5 text-[#1B3A52]"
              onClick={() => setShowFullReport(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver relatório completo
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] shadow-md"
              onClick={handleNext}
              disabled={currentInsightIndex === insights.length - 1}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Full Report Header - Premium */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1B3A52]">Relatório Completo</h2>
            <Button 
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 hover:border-[#5FBDBD]/30"
              onClick={() => setShowFullReport(false)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar aos insights
            </Button>
          </div>

          {/* All Insights - Elegant Cards */}
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border border-slate-200 hover:border-[#5FBDBD]/30 hover:shadow-aury transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-[#1B3A52] mb-1">{insight.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{insight.message}</p>
                      </div>
                    </div>
                    {insight.action && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-900 mb-1">Ação Sugerida</p>
                            <p className="text-sm text-emerald-800">{insight.action}</p>
                            {insight.impact && (
                              <p className="text-xs text-emerald-600 mt-1">💡 {insight.impact}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
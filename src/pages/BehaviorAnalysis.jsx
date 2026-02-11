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

  // Analyze month-over-month trends for personalization
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthSpending = byMonth[currentMonth] || 0;
  const lastMonthKey = lastMonths[1] || lastMonths[0];
  const lastMonthSpending = byMonth[lastMonthKey] || 0;
  const spendingTrend = lastMonthSpending > 0 ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0;

  // By category per month
  const byCategoryByMonth = expenses.reduce((acc, e) => {
    if (!acc[e.month_year]) acc[e.month_year] = {};
    acc[e.month_year][e.category] = (acc[e.month_year][e.category] || 0) + e.amount;
    return acc;
  }, {});

  // Category growth analysis
  const categoryGrowth = {};
  Object.keys(categoryLabels).forEach(cat => {
    const currentCat = byCategoryByMonth[currentMonth]?.[cat] || 0;
    const lastCat = byCategoryByMonth[lastMonthKey]?.[cat] || 0;
    if (lastCat > 0) {
      categoryGrowth[cat] = ((currentCat - lastCat) / lastCat) * 100;
    }
  });

  // Find category with highest growth
  const growingCategory = Object.entries(categoryGrowth).reduce((max, [cat, growth]) =>
    growth > (max[1] || -Infinity) ? [cat, growth] : max, ['', -Infinity]
  );

  // Generate highly personalized insights
  const insights = [];

  // Trend-based insight (personalized to THIS user's behavior)
  if (spendingTrend > 20 && currentMonthSpending > 0) {
    const increaseAmount = currentMonthSpending - lastMonthSpending;
    insights.push({
      type: 'warning',
      title: 'Seus gastos subiram',
      message: `Esse mês você gastou ${spendingTrend.toFixed(0)}% a mais que o anterior.`,
      action: `Se conseguir cortar ${formatCurrency(increaseAmount * 0.4)} nos próximos 15 dias, volta ao normal.`,
      impact: `Volta ao ritmo anterior`
    });
  } else if (spendingTrend < -15 && lastMonthSpending > 0) {
    insights.push({
      type: 'positive',
      title: 'Você melhorou',
      message: `Seus gastos caíram ${Math.abs(spendingTrend).toFixed(0)}% comparado ao mês passado.`,
      action: `Mantendo isso, você economiza ${formatCurrency(Math.abs(currentMonthSpending - lastMonthSpending) * 12)} em um ano.`,
      impact: `Você está no caminho certo`
    });
  }

  // Category-specific personalized insight
  if (growingCategory[0] && growingCategory[1] > 30) {
    const catLabel = categoryLabels[growingCategory[0]];
    const currentCatAmount = byCategoryByMonth[currentMonth]?.[growingCategory[0]] || 0;
    insights.push({
      type: 'category',
      title: `${catLabel} disparou`,
      message: `Neste mês, ${catLabel} cresceu ${growingCategory[1].toFixed(0)}% comparado ao anterior.`,
      action: `Corte ${formatCurrency(currentCatAmount * 0.25)} de ${catLabel} e recupere o equilíbrio.`,
      impact: `+${Math.ceil((currentCatAmount * 0.25) / 100)} pontos de tranquilidade`
    });
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Day-specific personalized insight
  if (mostExpensiveDay[0] && mostExpensiveDay[1] > totalExpenses * 0.2) {
    const dayName = daysOfWeek[mostExpensiveDay[0]];
    const avgDaySpend = mostExpensiveDay[1] / (lastMonths.length * 4);
    insights.push({
      type: 'pattern',
      title: `${dayName}s custam caro pra você`,
      message: `Você concentra gastos nas ${dayName}s: ${formatCurrency(mostExpensiveDay[1])} nos últimos meses.`,
      action: `Limite ${dayName} a ${formatCurrency(avgDaySpend * 0.6)} e economize ${formatCurrency(avgDaySpend * 0.4)} por semana.`,
      impact: `Economia de ${formatCurrency((avgDaySpend * 0.4) * 4)} por mês`
    });
  }

  // Superfluous analysis (personalized impact)
  if (superfluousPercentage > 20) {
    const targetPercentage = 12;
    const targetAmount = totalIncome * (targetPercentage / 100);
    const excessAmount = superfluousSpending - targetAmount;
    insights.push({
      type: 'superfluous',
      title: 'Lazer pesando no bolso',
      message: `${superfluousPercentage.toFixed(0)}% da sua renda foi para supérfluos neste mês.`,
      action: `Corte ${formatCurrency(excessAmount)} em lazer e atinja ${targetPercentage}% (ideal pra você).`,
      impact: `+${Math.ceil(excessAmount / 100)} pontos de tranquilidade`
    });
  } else if (superfluousPercentage > 0 && superfluousPercentage < 8) {
    insights.push({
      type: 'positive',
      title: 'Controle exemplar',
      message: `Apenas ${superfluousPercentage.toFixed(0)}% vai para supérfluos. Você está muito disciplinado.`,
      action: `Mantenha esse padrão e considere alocar parte dessa economia para metas.`,
      impact: `Tranquilidade máxima mantida`
    });
  }

  // Recurring expenses (personalized to user's situation)
  if (recurringExpenses.length > 3 && recurringTotal > totalIncome * 0.15) {
    const highestRecurring = recurringExpenses.reduce((max, exp) => 
      exp.amount > (max?.amount || 0) ? exp : max, null
    );
    insights.push({
      type: 'recurring',
      title: 'Assinaturas acumulando',
      message: `${recurringExpenses.length} gastos recorrentes somam ${formatCurrency(recurringTotal)}/mês.`,
      action: `Cancele ${highestRecurring?.description || 'a assinatura'} mais cara (${formatCurrency(highestRecurring?.amount || 0)}) e economize imediatamente.`,
      impact: `+${Math.ceil((highestRecurring?.amount || 0) / 100)} pontos de tranquilidade`
    });
  }

  // Default positive feedback if no specific insights
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      title: 'Tá tudo certo',
      message: 'Seu comportamento está equilibrado.',
      action: 'Continue assim. Não precisa mudar nada agora.',
      impact: 'Você está bem'
    });
  }

  // Limit to 5 most relevant insights
  insights.splice(5);

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
          <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Como você se comporta</h1>
            <p className="text-slate-500 text-sm">Seus hábitos dos últimos {selectedPeriod} meses</p>
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
              className="rounded-3xl p-8 shadow-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white relative overflow-hidden"
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
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Target,
  PiggyBank,
  Calendar,
  Clock,
  Briefcase,
  Zap,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SCENARIOS = [
  {
    id: "reduce_spending",
    title: "Redução de Gastos",
    icon: PiggyBank,
    gradient: "from-[#5FBDBD] to-[#4FA9A5]",
    description: "Simule o impacto de economizar mais mensalmente"
  },
  {
    id: "change_job",
    title: "Mudança de Renda",
    icon: Briefcase,
    gradient: "from-[#1B3A52] to-[#0A2540]",
    description: "Veja como uma nova renda afeta seus objetivos"
  },
  {
    id: "zero_superfluous",
    title: "Corte de Supérfluos",
    icon: Zap,
    gradient: "from-[#4FA9A5] to-[#2A4A62]",
    description: "Descubra o potencial de 30 dias sem supérfluos"
  },
  {
    id: "goal_time",
    title: "Previsão de Metas",
    icon: Target,
    gradient: "from-[#2A4A62] to-[#1B3A52]",
    description: "Calcule quando você alcançará seus objetivos"
  }
];

export default function Simulation() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioData, setScenarioData] = useState({
    reductionAmount: 200,
    newIncome: 0,
    selectedGoal: null
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return base44.entities.Expense.filter({ month_year: currentMonth });
    }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.filter({ is_completed: false })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  const currentIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const superfluousSpending = expenses
    .filter(e => e.category === 'superfluous')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  useEffect(() => {
    setScenarioData(prev => ({ ...prev, newIncome: currentIncome }));
  }, [currentIncome]);

  const activeSettings = settings || {
    emergency_percentage: 15,
    investment_percentage: 10
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const monthlySavings = currentIncome * ((activeSettings.emergency_percentage + activeSettings.investment_percentage) / 100);

  const calculateScenarioImpact = () => {
    if (!selectedScenario) return null;

    const selectedGoalData = goals.find(g => g.id === scenarioData.selectedGoal);
    
    switch(selectedScenario.id) {
      case "reduce_spending": {
        const newMonthlySavings = monthlySavings + scenarioData.reductionAmount;
        const monthsToGoal = selectedGoalData 
          ? Math.ceil((selectedGoalData.target_amount - (selectedGoalData.current_amount || 0)) / newMonthlySavings)
          : null;
        const currentMonthsToGoal = selectedGoalData && monthlySavings > 0
          ? Math.ceil((selectedGoalData.target_amount - (selectedGoalData.current_amount || 0)) / monthlySavings)
          : null;
        const timeSaved = currentMonthsToGoal && monthsToGoal ? currentMonthsToGoal - monthsToGoal : null;
        
        return {
          monthlySavings: newMonthlySavings,
          yearSavings: newMonthlySavings * 12,
          extraPerMonth: scenarioData.reductionAmount,
          monthsToGoal,
          timeSaved,
          goalName: selectedGoalData?.title
        };
      }
      
      case "change_job": {
        const newIncome = scenarioData.newIncome;
        const newMonthlySavings = newIncome * ((activeSettings.emergency_percentage + activeSettings.investment_percentage) / 100);
        const incomeDiff = newIncome - currentIncome;
        const monthsToGoal = selectedGoalData 
          ? Math.ceil((selectedGoalData.target_amount - (selectedGoalData.current_amount || 0)) / newMonthlySavings)
          : null;
        const currentMonthsToGoal = selectedGoalData && monthlySavings > 0
          ? Math.ceil((selectedGoalData.target_amount - (selectedGoalData.current_amount || 0)) / monthlySavings)
          : null;
        const timeSaved = currentMonthsToGoal && monthsToGoal ? currentMonthsToGoal - monthsToGoal : null;
        
        return {
          newIncome,
          incomeDiff,
          monthlySavings: newMonthlySavings,
          yearSavings: newMonthlySavings * 12,
          monthsToGoal,
          timeSaved,
          goalName: selectedGoalData?.title
        };
      }
      
      case "zero_superfluous": {
        const savings30Days = superfluousSpending;
        const extraYearly = savings30Days * 12;
        const newMonthlySavings = monthlySavings + savings30Days;
        const monthsToGoal = selectedGoalData 
          ? Math.ceil((selectedGoalData.target_amount - (selectedGoalData.current_amount || 0)) / newMonthlySavings)
          : null;
        const currentMonthsToGoal = selectedGoalData && monthlySavings > 0
          ? Math.ceil((selectedGoalData.target_amount - (selectedGoalData.current_amount || 0)) / monthlySavings)
          : null;
        const timeSaved = currentMonthsToGoal && monthsToGoal ? currentMonthsToGoal - monthsToGoal : null;
        
        return {
          savings30Days,
          extraYearly,
          currentSuperfluous: superfluousSpending,
          monthsToGoal,
          timeSaved,
          goalName: selectedGoalData?.title
        };
      }
      
      case "goal_time": {
        if (!selectedGoalData) return null;
        
        const remaining = selectedGoalData.target_amount - (selectedGoalData.current_amount || 0);
        const monthsNeeded = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
        const targetDate = monthsNeeded ? new Date(Date.now() + monthsNeeded * 30 * 24 * 60 * 60 * 1000) : null;
        
        return {
          goalName: selectedGoalData.title,
          targetAmount: selectedGoalData.target_amount,
          currentAmount: selectedGoalData.current_amount || 0,
          remaining,
          monthsNeeded,
          targetDate,
          monthlySavings
        };
      }
      
      default:
        return null;
    }
  };

  const impact = calculateScenarioImpact();

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Planning")} />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Simulações</h1>
            <p className="text-slate-500 text-sm">Preveja o impacto das suas decisões financeiras</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedScenario ? (
          <motion.div
            key="scenarios"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {SCENARIOS.map((scenario, index) => {
              const Icon = scenario.icon;
              return (
                <motion.button
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedScenario(scenario)}
                  className="group text-left"
                >
                  <Card className="hover:shadow-aury transition-all border border-slate-200 hover:border-[#5FBDBD]/30 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${scenario.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-[#1B3A52] mb-1 group-hover:text-[#5FBDBD] transition-colors">
                            {scenario.title}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            {scenario.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#5FBDBD] group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="simulation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Input Card - Premium Style */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedScenario.gradient} flex items-center justify-center`}>
                      {React.createElement(selectedScenario.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#1B3A52]">{selectedScenario.title}</CardTitle>
                      <p className="text-sm text-slate-500">{selectedScenario.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedScenario(null)}
                    className="text-slate-500 hover:text-[#1B3A52]"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {selectedScenario.id === "reduce_spending" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#1B3A52]">Quanto você quer economizar por mês?</Label>
                      <Input
                        type="number"
                        value={scenarioData.reductionAmount}
                        onChange={(e) => setScenarioData({ ...scenarioData, reductionAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="Ex: 200"
                        className="border-slate-200 focus:border-[#5FBDBD]"
                      />
                      <p className="text-xs text-slate-500">Sua economia mensal atual: {formatCurrency(monthlySavings)}</p>
                    </div>
                    
                    {goals.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1B3A52]">Conectar com meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Selecione uma meta" />
                          </SelectTrigger>
                          <SelectContent>
                            {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title} - {formatCurrency(goal.target_amount)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {selectedScenario.id === "change_job" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#1B3A52]">Qual seria sua nova renda?</Label>
                      <Input
                        type="number"
                        value={scenarioData.newIncome}
                        onChange={(e) => setScenarioData({ ...scenarioData, newIncome: parseFloat(e.target.value) || 0 })}
                        placeholder="Nova renda mensal"
                        className="border-slate-200 focus:border-[#5FBDBD]"
                      />
                      <p className="text-xs text-slate-500">Sua renda atual: {formatCurrency(currentIncome)}</p>
                    </div>
                    
                    {goals.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1B3A52]">Conectar com meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Selecione uma meta" />
                          </SelectTrigger>
                          <SelectContent>
                            {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title} - {formatCurrency(goal.target_amount)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {selectedScenario.id === "zero_superfluous" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl border border-[#5FBDBD]/20">
                      <p className="text-sm text-[#1B3A52] mb-2 font-medium">Seus gastos supérfluos este mês</p>
                      <p className="text-3xl font-bold text-[#1B3A52]">{formatCurrency(superfluousSpending)}</p>
                    </div>
                    
                    {goals.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1B3A52]">Conectar com meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Selecione uma meta" />
                          </SelectTrigger>
                          <SelectContent>
                            {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title} - {formatCurrency(goal.target_amount)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {selectedScenario.id === "goal_time" && (
                  <div className="space-y-4">
                    {goals.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500 mb-4">Você ainda não tem metas cadastradas</p>
                        <Button variant="outline" className="border-[#5FBDBD] text-[#5FBDBD] hover:bg-[#5FBDBD]/5">
                          Criar minha primeira meta
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1B3A52]">Escolha sua meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Selecione uma meta" />
                          </SelectTrigger>
                          <SelectContent>
                            {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title} - {formatCurrency(goal.target_amount)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Card - Premium Style */}
            {impact && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-[#5FBDBD]/30 shadow-aury bg-gradient-to-br from-[#5FBDBD]/5 to-[#1B3A52]/5">
                  <CardHeader className="border-b border-[#5FBDBD]/20">
                    <CardTitle className="flex items-center gap-2 text-[#1B3A52]">
                      <TrendingUp className="w-5 h-5 text-[#5FBDBD]" />
                      Resultado da Simulação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    {selectedScenario.id === "reduce_spending" && (
                      <>
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500 mb-2">Economia adicional mensal</p>
                          <p className="text-4xl font-bold text-[#5FBDBD] mb-1">
                            +{formatCurrency(impact.extraPerMonth)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <Calendar className="w-5 h-5 text-[#5FBDBD] mx-auto mb-2" />
                            <p className="text-xl font-bold text-[#1B3A52]">{formatCurrency(impact.yearSavings)}</p>
                            <p className="text-xs text-slate-500 mt-1">Em 1 ano</p>
                          </div>
                          {impact.timeSaved && impact.timeSaved > 0 && (
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                              <Clock className="w-5 h-5 text-[#2A4A62] mx-auto mb-2" />
                              <p className="text-xl font-bold text-[#1B3A52]">-{impact.timeSaved} {impact.timeSaved === 1 ? 'mês' : 'meses'}</p>
                              <p className="text-xs text-slate-500 mt-1">Antecipa sua meta</p>
                            </div>
                          )}
                        </div>

                        {impact.goalName && impact.monthsToGoal && (
                          <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-[#5FBDBD]" />
                              <p className="font-semibold text-[#1B3A52] text-sm">Meta: {impact.goalName}</p>
                            </div>
                            <p className="text-3xl font-bold text-[#5FBDBD] mb-2">
                              {impact.monthsToGoal} {impact.monthsToGoal === 1 ? 'mês' : 'meses'}
                            </p>
                            <p className="text-sm text-slate-600">
                              Você alcança em {new Date(Date.now() + impact.monthsToGoal * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedScenario.id === "change_job" && (
                      <>
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500 mb-2">Diferença mensal</p>
                          <p className={`text-4xl font-bold mb-1 ${impact.incomeDiff > 0 ? 'text-[#5FBDBD]' : 'text-rose-500'}`}>
                            {impact.incomeDiff > 0 ? '+' : ''}{formatCurrency(impact.incomeDiff)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <PiggyBank className="w-5 h-5 text-[#5FBDBD] mx-auto mb-2" />
                            <p className="text-xl font-bold text-[#1B3A52]">{formatCurrency(impact.monthlySavings)}</p>
                            <p className="text-xs text-slate-500 mt-1">Nova economia/mês</p>
                          </div>
                          {impact.timeSaved && impact.timeSaved > 0 && (
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                              <Clock className="w-5 h-5 text-[#2A4A62] mx-auto mb-2" />
                              <p className="text-xl font-bold text-[#1B3A52]">-{impact.timeSaved} {impact.timeSaved === 1 ? 'mês' : 'meses'}</p>
                              <p className="text-xs text-slate-500 mt-1">Antecipa sua meta</p>
                            </div>
                          )}
                        </div>

                        {impact.goalName && impact.monthsToGoal && (
                          <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-[#5FBDBD]" />
                              <p className="font-semibold text-[#1B3A52] text-sm">Meta: {impact.goalName}</p>
                            </div>
                            <p className="text-3xl font-bold text-[#5FBDBD] mb-2">
                              {impact.monthsToGoal} {impact.monthsToGoal === 1 ? 'mês' : 'meses'}
                            </p>
                            <p className="text-sm text-slate-600">
                              Com a nova renda, você alcança em {new Date(Date.now() + impact.monthsToGoal * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedScenario.id === "zero_superfluous" && (
                      <>
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500 mb-2">Economia em 30 dias</p>
                          <p className="text-4xl font-bold text-[#5FBDBD] mb-1">
                            {formatCurrency(impact.savings30Days)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <Calendar className="w-5 h-5 text-[#5FBDBD] mx-auto mb-2" />
                            <p className="text-xl font-bold text-[#1B3A52]">{formatCurrency(impact.extraYearly)}</p>
                            <p className="text-xs text-slate-500 mt-1">Em 12 meses</p>
                          </div>
                          {impact.timeSaved && impact.timeSaved > 0 && (
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                              <Clock className="w-5 h-5 text-[#2A4A62] mx-auto mb-2" />
                              <p className="text-xl font-bold text-[#1B3A52]">-{impact.timeSaved} {impact.timeSaved === 1 ? 'mês' : 'meses'}</p>
                              <p className="text-xs text-slate-500 mt-1">Antecipa sua meta</p>
                            </div>
                          )}
                        </div>

                        {impact.goalName && impact.monthsToGoal && (
                          <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-[#5FBDBD]" />
                              <p className="font-semibold text-[#1B3A52] text-sm">Meta: {impact.goalName}</p>
                            </div>
                            <p className="text-3xl font-bold text-[#5FBDBD] mb-2">
                              {impact.monthsToGoal} {impact.monthsToGoal === 1 ? 'mês' : 'meses'}
                            </p>
                            <p className="text-sm text-slate-600">
                              Cortando supérfluos, você alcança em {new Date(Date.now() + impact.monthsToGoal * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedScenario.id === "goal_time" && impact.monthsNeeded && (
                      <>
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500 mb-2">Para alcançar: {impact.goalName}</p>
                          <p className="text-4xl font-bold text-[#5FBDBD] mb-1">
                            {impact.monthsNeeded} {impact.monthsNeeded === 1 ? 'mês' : 'meses'}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-5 space-y-3 shadow-sm">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Meta</span>
                            <span className="font-bold text-[#1B3A52]">{formatCurrency(impact.targetAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Já conquistado</span>
                            <span className="font-semibold text-[#5FBDBD]">{formatCurrency(impact.currentAmount)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-3 text-sm">
                            <span className="text-slate-600">Falta</span>
                            <span className="font-bold text-[#1B3A52]">{formatCurrency(impact.remaining)}</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl p-5 border border-[#5FBDBD]/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-[#5FBDBD]" />
                            <p className="font-semibold text-[#1B3A52]">Previsão de Conquista</p>
                          </div>
                          <p className="text-3xl font-bold text-[#5FBDBD] mb-1">
                            {impact.targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-slate-600">
                            Economizando {formatCurrency(impact.monthlySavings)} por mês
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
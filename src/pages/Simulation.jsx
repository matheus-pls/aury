import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Target,
  PiggyBank,
  Calendar,
  Zap,
  Clock,
  Briefcase,
  PartyPopper,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    title: "E se eu economizar...",
    emoji: "💰",
    icon: PiggyBank,
    color: "from-emerald-500 to-green-500",
    description: "Quanto tempo ganho cortando gastos?"
  },
  {
    id: "change_job",
    title: "E se eu mudar de emprego...",
    emoji: "💼",
    icon: Briefcase,
    color: "from-blue-500 to-indigo-500",
    description: "Como isso afeta minhas metas?"
  },
  {
    id: "zero_superfluous",
    title: "E se eu cortar supérfluos...",
    emoji: "⚡",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    description: "Veja o impacto de 30 dias sem supérfluos"
  },
  {
    id: "goal_time",
    title: "Quando alcanço meu objetivo?",
    emoji: "🎯",
    icon: Target,
    color: "from-purple-500 to-pink-500",
    description: "Calcule quando suas metas viram realidade"
  }
];

export default function Simulation() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioData, setScenarioData] = useState({
    reductionAmount: 200,
    newIncome: 0,
    challengeDays: 30,
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

  // Scenario calculations
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Simulador de Cenários</h1>
        <p className="text-slate-500 mt-1">Descubra o impacto emocional das suas decisões financeiras</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedScenario ? (
          <motion.div
            key="scenarios"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {SCENARIOS.map((scenario, index) => {
              const Icon = scenario.icon;
              return (
                <motion.button
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedScenario(scenario)}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all border-2 hover:border-[#00A8A0]">
                    <CardContent className="p-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${scenario.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">
                        {scenario.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {scenario.description}
                      </p>
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
            <Button
              variant="ghost"
              onClick={() => setSelectedScenario(null)}
              className="mb-4"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Voltar aos cenários
            </Button>

            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedScenario.color} flex items-center justify-center`}>
                    {React.createElement(selectedScenario.icon, { className: "w-6 h-6 text-white" })}
                  </div>
                  <div>
                    <p className="text-xl">{selectedScenario.title}</p>
                    <p className="text-sm font-normal text-slate-500">{selectedScenario.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedScenario.id === "reduce_spending" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quanto você quer economizar por mês?</Label>
                      <Input
                        type="number"
                        value={scenarioData.reductionAmount}
                        onChange={(e) => setScenarioData({ ...scenarioData, reductionAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="Ex: 200"
                      />
                      <p className="text-xs text-slate-500">Sua economia mensal atual: {formatCurrency(monthlySavings)}</p>
                    </div>
                    
                    {goals.length > 0 && (
                      <div className="space-y-2">
                        <Label>Conectar com meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger>
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
                      <Label>Qual seria sua nova renda?</Label>
                      <Input
                        type="number"
                        value={scenarioData.newIncome}
                        onChange={(e) => setScenarioData({ ...scenarioData, newIncome: parseFloat(e.target.value) || 0 })}
                        placeholder="Nova renda mensal"
                      />
                      <p className="text-xs text-slate-500">Sua renda atual: {formatCurrency(currentIncome)}</p>
                    </div>
                    
                    {goals.length > 0 && (
                      <div className="space-y-2">
                        <Label>Conectar com meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger>
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
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-800 mb-2">Seus gastos supérfluos este mês</p>
                      <p className="text-3xl font-bold text-amber-900">{formatCurrency(superfluousSpending)}</p>
                    </div>
                    
                    {goals.length > 0 && (
                      <div className="space-y-2">
                        <Label>Conectar com meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger>
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
                        <Button variant="outline">Criar minha primeira meta</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Escolha sua meta</Label>
                        <Select value={scenarioData.selectedGoal || ""} onValueChange={(val) => setScenarioData({ ...scenarioData, selectedGoal: val })}>
                          <SelectTrigger>
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

            {/* Results Card */}
            {impact && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className={`border-2 bg-gradient-to-br ${selectedScenario.color} bg-opacity-5`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-[#00A8A0]" />
                      Impacto Emocional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedScenario.id === "reduce_spending" && (
                      <>
                        <div className="text-center py-6">
                          <p className="text-6xl mb-4">{scenarioData.reductionAmount >= 500 ? "🚀" : scenarioData.reductionAmount >= 200 ? "💪" : "🌱"}</p>
                          <p className="text-3xl font-bold text-slate-800 mb-2">
                            +{formatCurrency(impact.extraPerMonth)}/mês
                          </p>
                          <p className="text-slate-600">
                            Economia extra todo mês
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-xl p-4 text-center">
                            <Calendar className="w-6 h-6 text-[#00A8A0] mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(impact.yearSavings)}</p>
                            <p className="text-xs text-slate-500">Em 1 ano</p>
                          </div>
                          {impact.timeSaved && impact.timeSaved > 0 && (
                            <div className="bg-white rounded-xl p-4 text-center">
                              <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-purple-600">-{impact.timeSaved} {impact.timeSaved === 1 ? 'mês' : 'meses'}</p>
                              <p className="text-xs text-slate-500">Antecipa sua meta</p>
                            </div>
                          )}
                        </div>

                        {impact.goalName && impact.monthsToGoal && (
                          <div className="bg-white rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <Target className="w-5 h-5 text-[#00A8A0]" />
                              <p className="font-semibold text-slate-800">Meta: {impact.goalName}</p>
                            </div>
                            <p className="text-4xl font-bold text-[#00A8A0] mb-2">
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
                        <div className="text-center py-6">
                          <p className="text-6xl mb-4">
                            {impact.incomeDiff > 0 ? "📈" : impact.incomeDiff < 0 ? "📉" : "➡️"}
                          </p>
                          <p className={`text-3xl font-bold mb-2 ${impact.incomeDiff > 0 ? 'text-emerald-600' : impact.incomeDiff < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {impact.incomeDiff > 0 ? '+' : ''}{formatCurrency(impact.incomeDiff)}
                          </p>
                          <p className="text-slate-600">Diferença mensal</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-xl p-4 text-center">
                            <PiggyBank className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(impact.monthlySavings)}</p>
                            <p className="text-xs text-slate-500">Nova economia/mês</p>
                          </div>
                          {impact.timeSaved && impact.timeSaved > 0 && (
                            <div className="bg-white rounded-xl p-4 text-center">
                              <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-purple-600">-{impact.timeSaved} {impact.timeSaved === 1 ? 'mês' : 'meses'}</p>
                              <p className="text-xs text-slate-500">Antecipa sua meta</p>
                            </div>
                          )}
                        </div>

                        {impact.goalName && impact.monthsToGoal && (
                          <div className="bg-white rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <Target className="w-5 h-5 text-[#00A8A0]" />
                              <p className="font-semibold text-slate-800">Meta: {impact.goalName}</p>
                            </div>
                            <p className="text-4xl font-bold text-[#00A8A0] mb-2">
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
                        <div className="text-center py-6">
                          <p className="text-6xl mb-4">⚡</p>
                          <p className="text-3xl font-bold text-amber-600 mb-2">
                            {formatCurrency(impact.savings30Days)}
                          </p>
                          <p className="text-slate-600">Economia em 30 dias sem supérfluos</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-xl p-4 text-center">
                            <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(impact.extraYearly)}</p>
                            <p className="text-xs text-slate-500">Em 12 meses</p>
                          </div>
                          {impact.timeSaved && impact.timeSaved > 0 && (
                            <div className="bg-white rounded-xl p-4 text-center">
                              <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-purple-600">-{impact.timeSaved} {impact.timeSaved === 1 ? 'mês' : 'meses'}</p>
                              <p className="text-xs text-slate-500">Antecipa sua meta</p>
                            </div>
                          )}
                        </div>

                        {impact.goalName && impact.monthsToGoal && (
                          <div className="bg-white rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <Target className="w-5 h-5 text-[#00A8A0]" />
                              <p className="font-semibold text-slate-800">Meta: {impact.goalName}</p>
                            </div>
                            <p className="text-4xl font-bold text-[#00A8A0] mb-2">
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
                        <div className="text-center py-6">
                          <p className="text-6xl mb-4">🎯</p>
                          <p className="text-3xl font-bold text-purple-600 mb-2">
                            {impact.monthsNeeded} {impact.monthsNeeded === 1 ? 'mês' : 'meses'}
                          </p>
                          <p className="text-slate-600">Para alcançar: {impact.goalName}</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Meta</span>
                            <span className="font-bold text-slate-800">{formatCurrency(impact.targetAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Já conquistado</span>
                            <span className="font-semibold text-emerald-600">{formatCurrency(impact.currentAmount)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-3">
                            <span className="text-slate-600">Falta</span>
                            <span className="font-bold text-[#00A8A0]">{formatCurrency(impact.remaining)}</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                          <div className="flex items-center gap-3 mb-3">
                            <PartyPopper className="w-6 h-6 text-purple-600" />
                            <p className="font-semibold text-purple-800">Previsão de Conquista</p>
                          </div>
                          <p className="text-3xl font-bold text-purple-600 mb-1">
                            {impact.targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-purple-600">
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
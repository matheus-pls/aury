import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles,
  Scissors,
  TrendingUp,
  Ban,
  Target,
  Clock,
  Heart,
  ArrowRight,
  Calendar,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import { createPageUrl } from "@/utils";

const SIMULATION_TYPES = [
  {
    id: "cut_expenses",
    title: "Cortar Gastos",
    description: "Veja como economizar mais",
    icon: Scissors,
    color: "from-[#5FBDBD] to-[#4FA9A5]",
    prompt: "E se eu cortar"
  },
  {
    id: "new_job",
    title: "Trocar de Emprego",
    description: "Simule uma nova renda",
    icon: TrendingUp,
    color: "from-[#2A4A62] to-[#1B3A52]",
    prompt: "E se eu ganhar"
  },
  {
    id: "stop_superfluous",
    title: "Economizar Com",
    description: "Corte gastos específicos",
    icon: Ban,
    color: "from-[#1B3A52] to-[#0A2540]",
    prompt: "Se eu economizar com"
  },
  {
    id: "reach_goal",
    title: "Alcançar Meta",
    description: "Quando você chega lá?",
    icon: Target,
    color: "from-[#5FBDBD] to-[#2A4A62]",
    prompt: "Quando alcanço"
  }
];

export default function Simulations() {
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [simulationValue, setSimulationValue] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [result, setResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list()
  });

  const { data: income = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.list()
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.list()
  });

  const activeGoals = goals.filter(g => !g.is_completed);

  const calculateCurrentMonthlyExpenses = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return expenses
      .filter(e => e.month_year === currentMonth)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateSuperflousExpenses = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return expenses
      .filter(e => e.month_year === currentMonth && e.category === 'superfluous')
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateMonthlyIncome = () => {
    return income
      .filter(i => i.is_active)
      .reduce((sum, i) => sum + i.amount, 0);
  };

  const calculateMonthlySavings = () => {
    return calculateMonthlyIncome() - calculateCurrentMonthlyExpenses();
  };

  const runSimulation = () => {
    if (!selectedSimulation) return;

    setIsSimulating(true);
    
    setTimeout(() => {
      const currentIncome = calculateMonthlyIncome();
      const currentExpenses = calculateCurrentMonthlyExpenses();
      const currentSavings = calculateMonthlySavings();
      const superfluousExpenses = calculateSuperflousExpenses();
      
      let simulationResult = {};

      switch (selectedSimulation.id) {
        case "cut_expenses":
          const cutAmount = parseFloat(simulationValue) || 0;
          const newExpenses = currentExpenses - cutAmount;
          const newSavings = currentIncome - newExpenses;
          const savingsIncrease = newSavings - currentSavings;
          
          simulationResult = {
            title: `Cortando R$ ${cutAmount.toFixed(2)} dos gastos`,
            metrics: [
              { label: "Nova economia mensal", value: `R$ ${newSavings.toFixed(2)}`, change: `+R$ ${savingsIncrease.toFixed(2)}` },
              { label: "Economia anual extra", value: `R$ ${(savingsIncrease * 12).toFixed(2)}` }
            ],
            emotional: {
              message: savingsIncrease > 0 
                ? `Você economizaria ${Math.round((savingsIncrease / currentIncome) * 100)}% a mais do seu salário!`
                : "Essa economia não fará diferença significativa",
              impact: savingsIncrease > currentSavings * 0.3 ? "high" : savingsIncrease > 0 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsWithoutCut = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsWithCut = newSavings > 0 ? Math.ceil(remaining / newSavings) : 999;
              const timeSaved = monthsWithoutCut - monthsWithCut;
              
              simulationResult.goalImpact = {
                goalTitle: goal.title,
                monthsBefore: monthsWithoutCut > 100 ? "Nunca" : `${monthsWithoutCut} meses`,
                monthsAfter: monthsWithCut > 100 ? "Nunca" : `${monthsWithCut} meses`,
                timeSaved: timeSaved > 0 ? `${timeSaved} meses mais rápido!` : "Sem diferença"
              };
            }
          }
          break;

        case "new_job":
          const newIncome = parseFloat(simulationValue) || 0;
          const incomeIncrease = newIncome - currentIncome;
          const newSavingsJob = newIncome - currentExpenses;
          
          simulationResult = {
            title: `Com salário de R$ ${newIncome.toFixed(2)}`,
            metrics: [
              { label: "Aumento de renda", value: `R$ ${incomeIncrease.toFixed(2)}`, change: `+${Math.round((incomeIncrease / currentIncome) * 100)}%` },
              { label: "Nova economia mensal", value: `R$ ${newSavingsJob.toFixed(2)}` },
              { label: "Economia anual", value: `R$ ${(newSavingsJob * 12).toFixed(2)}` }
            ],
            emotional: {
              message: incomeIncrease > currentIncome * 0.2 
                ? "Uma mudança transformadora! Vale a pena buscar!"
                : "Um bom aumento, mas analise outros fatores",
              impact: incomeIncrease > currentIncome * 0.3 ? "high" : incomeIncrease > currentIncome * 0.1 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsBefore = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsAfter = newSavingsJob > 0 ? Math.ceil(remaining / newSavingsJob) : 999;
              const timeSaved = monthsBefore - monthsAfter;
              
              simulationResult.goalImpact = {
                goalTitle: goal.title,
                monthsBefore: monthsBefore > 100 ? "Nunca" : `${monthsBefore} meses`,
                monthsAfter: monthsAfter > 100 ? "Nunca" : `${monthsAfter} meses`,
                timeSaved: timeSaved > 0 ? `${timeSaved} meses mais rápido!` : "Sem diferença"
              };
            }
          }
          break;

        case "stop_superfluous":
          const savingsFromChallenge = superfluousExpenses;
          const newSavingsChallenge = currentSavings + savingsFromChallenge;
          
          simulationResult = {
            title: "Desafio: 30 dias sem supérfluos",
            metrics: [
              { label: "Economia no mês", value: `R$ ${savingsFromChallenge.toFixed(2)}` },
              { label: "Nova economia mensal", value: `R$ ${newSavingsChallenge.toFixed(2)}` },
              { label: "Em 3 meses", value: `R$ ${(savingsFromChallenge * 3).toFixed(2)}` }
            ],
            emotional: {
              message: savingsFromChallenge > currentIncome * 0.1 
                ? "Impressionante! Você tem margem para economizar muito!"
                : "Seus supérfluos já estão controlados. Parabéns!",
              impact: savingsFromChallenge > currentIncome * 0.15 ? "high" : savingsFromChallenge > currentIncome * 0.05 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsBefore = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsAfter = newSavingsChallenge > 0 ? Math.ceil(remaining / newSavingsChallenge) : 999;
              const timeSaved = monthsBefore - monthsAfter;
              
              simulationResult.goalImpact = {
                goalTitle: goal.title,
                monthsBefore: monthsBefore > 100 ? "Nunca" : `${monthsBefore} meses`,
                monthsAfter: monthsAfter > 100 ? "Nunca" : `${monthsAfter} meses`,
                timeSaved: timeSaved > 0 ? `${timeSaved} meses mais rápido!` : "Sem diferença"
              };
            }
          }
          break;

        case "reach_goal":
          if (selectedGoal && activeGoals.length > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsNeeded = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const targetDate = new Date();
              targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
              
              simulationResult = {
                title: `Meta: ${goal.title}`,
                metrics: [
                  { label: "Faltam", value: `R$ ${remaining.toFixed(2)}` },
                  { label: "Você economiza por mês", value: `R$ ${currentSavings.toFixed(2)}` },
                  { label: "Tempo estimado", value: monthsNeeded > 100 ? "Nunca" : `${monthsNeeded} meses` }
                ],
                emotional: {
                  message: monthsNeeded <= 12 
                    ? `Você está quase lá! Só mais ${monthsNeeded} meses!`
                    : monthsNeeded <= 36 
                    ? "Com disciplina, você consegue! Continue firme!"
                    : "Meta ambiciosa! Considere aumentar a renda ou cortar gastos.",
                  impact: monthsNeeded <= 12 ? "high" : monthsNeeded <= 36 ? "medium" : "low",
                  date: monthsNeeded <= 100 ? targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : null
                }
              };
            }
          }
          break;
      }

      setResult(simulationResult);
      setIsSimulating(false);
    }, 1500);
  };

  const resetSimulation = () => {
    setSelectedSimulation(null);
    setSimulationValue("");
    setSelectedGoal("");
    setResult(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton to={createPageUrl("Planning")} className="mb-4" />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Simulações</h1>
            <p className="text-slate-500">Visualize o impacto das suas decisões</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedSimulation && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {SIMULATION_TYPES.map((sim, index) => {
              const Icon = sim.icon;
              return (
                <motion.div
                  key={sim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-aury transition-all border border-slate-200 hover:border-[#5FBDBD] group"
                    onClick={() => setSelectedSimulation(sim)}
                  >
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sim.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1B3A52] mb-1">
                        {sim.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {sim.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {selectedSimulation && !result && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border border-slate-200 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedSimulation.color} flex items-center justify-center shadow-lg`}>
                    {React.createElement(selectedSimulation.icon, { className: "w-8 h-8 text-white" })}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1B3A52]">{selectedSimulation.title}</h2>
                    <p className="text-slate-500">{selectedSimulation.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedSimulation.id === "cut_expenses" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quanto você quer cortar dos gastos mensais?
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 500"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Gasto atual: {formatCurrency(calculateCurrentMonthlyExpenses())}
                      </p>
                    </div>
                  )}

                  {selectedSimulation.id === "new_job" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Qual seria sua nova renda mensal?
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 8000"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Renda atual: {formatCurrency(calculateMonthlyIncome())}
                      </p>
                    </div>
                  )}

                  {selectedSimulation.id === "stop_superfluous" && (
                    <div className="bg-[#5FBDBD]/10 border border-[#5FBDBD]/30 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Ban className="w-6 h-6 text-[#5FBDBD]" />
                        <h3 className="font-semibold text-[#1B3A52]">Economize cortando gastos</h3>
                      </div>
                      <p className="text-[#1B3A52] text-sm">
                        Digite o valor mensal que deseja economizar ou o nome de um gasto específico (ex: streaming, delivery, academia)
                      </p>
                    </div>
                  )}

                  {activeGoals.length > 0 && selectedSimulation.id !== "reach_goal" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Vincular a uma meta (opcional)
                      </label>
                      <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione uma meta" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeGoals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title} - {formatCurrency(goal.target_amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedSimulation.id === "reach_goal" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Qual meta você quer alcançar?
                      </label>
                      <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione uma meta" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeGoals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title} - {formatCurrency(goal.target_amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-2">
                        Economia mensal atual: {formatCurrency(calculateMonthlySavings())}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={resetSimulation}
                    className="flex-1 h-12"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={runSimulation}
                    disabled={isSimulating || (selectedSimulation.id !== "stop_superfluous" && !simulationValue) || (selectedSimulation.id === "reach_goal" && !selectedGoal)}
                    className="flex-1 h-12 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] text-white hover:opacity-90"
                  >
                    {isSimulating ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-pulse" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Simular
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <Card className="border-2 border-[#5FBDBD] shadow-aury-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{result.title}</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  result.emotional?.impact === "high" 
                    ? "bg-white/20" 
                    : result.emotional?.impact === "medium"
                    ? "bg-white/15"
                    : "bg-white/10"
                }`}>
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">{result.emotional?.message}</span>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.metrics?.map((metric, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-50 rounded-xl p-5"
                    >
                      <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-[#1B3A52]">{metric.value}</p>
                      {metric.change && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">{metric.change}</p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {result.emotional?.date && (
                  <div className="bg-[#5FBDBD]/10 border border-[#5FBDBD]/30 rounded-xl p-5 flex items-center gap-4">
                    <Calendar className="w-8 h-8 text-[#5FBDBD]" />
                    <div>
                      <p className="text-sm text-slate-600">Você alcançará sua meta em</p>
                      <p className="text-xl font-bold text-[#1B3A52] capitalize">{result.emotional.date}</p>
                    </div>
                  </div>
                )}

                {result.goalImpact && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-6 h-6 text-emerald-600" />
                      <h3 className="font-bold text-lg text-emerald-900">
                        Impacto na Meta: {result.goalImpact.goalTitle}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-emerald-700 mb-1">Sem mudanças</p>
                        <p className="text-xl font-bold text-emerald-900">{result.goalImpact.monthsBefore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700 mb-1">Com esta mudança</p>
                        <p className="text-xl font-bold text-emerald-600">{result.goalImpact.monthsAfter}</p>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-xl p-4 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-sm text-emerald-700">Tempo economizado</p>
                        <p className="font-bold text-lg text-emerald-900">{result.goalImpact.timeSaved}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={resetSimulation}
              variant="outline"
              className="w-full h-12"
            >
              Nova Simulação
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
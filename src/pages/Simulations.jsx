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
  Zap,
  Hourglass
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import { createPageUrl } from "@/utils";

const SIMULATION_TYPES = [
  {
    id: "cost_of_time",
    title: "Quanto vale meu tempo",
    description: "Converte um gasto em horas de trabalho",
    icon: Clock,
    color: "from-[#667eea] to-[#764ba2]",
    prompt: "Isso custa"
  },
  {
    id: "cut_specific",
    title: "Cortar um gasto",
    description: "O impacto de eliminar algo específico",
    icon: Ban,
    color: "from-[#f093fb] to-[#f5576c]",
    prompt: "Se eu parar de gastar"
  },
  {
    id: "reduce_category",
    title: "Reduzir uma categoria",
    description: "O que muda se você gastar menos em algo",
    icon: TrendingDown,
    color: "from-[#4facfe] to-[#00f2fe]",
    prompt: "Se eu reduzir"
  },
  {
    id: "new_income",
    title: "Ganhar mais",
    description: "Como uma renda maior muda tudo",
    icon: TrendingUp,
    color: "from-[#43e97b] to-[#38f9d7]",
    prompt: "Se eu ganhar"
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

  const calculateHourlyRate = () => {
    const monthlyIncome = calculateMonthlyIncome();
    // Assumindo 22 dias úteis por mês, 8 horas por dia = 176 horas
    return monthlyIncome / 176;
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
        case "cost_of_time":
          const expenseValue = parseFloat(simulationValue) || 0;
          const hourlyRate = calculateHourlyRate();
          const monthlyIncome = calculateMonthlyIncome();
          
          if (hourlyRate <= 0) {
            simulationResult = {
              title: "Configure sua renda",
              metrics: [
                { label: "O que fazer", value: "Cadastre sua renda mensal primeiro" }
              ],
              emotional: {
                message: "Sem isso, não consigo calcular quanto vale sua hora.",
                impact: "low"
              }
            };
          } else {
            const hoursOfWork = expenseValue / hourlyRate;
            const daysOfWork = hoursOfWork / 8;
            const monthsOfWork = daysOfWork / 22; // dias úteis médios
            
            let emotionalMessage = "";
            let timeDescription = "";
            
            if (hoursOfWork < 1) {
              timeDescription = `${Math.round(hoursOfWork * 60)} minutos`;
              emotionalMessage = `É pouco. Mas tudo conta no final do mês.`;
            } else if (hoursOfWork < 8) {
              timeDescription = `${hoursOfWork.toFixed(1)} horas`;
              emotionalMessage = `Menos de um dia de trabalho. Vale a pena?`;
            } else if (daysOfWork < 22) {
              timeDescription = `${daysOfWork.toFixed(1)} dias`;
              emotionalMessage = daysOfWork > 7 
                ? `Mais de uma semana inteira trabalhando só pra isso.`
                : `${Math.ceil(daysOfWork)} dias de trabalho. Pense bem.`;
            } else {
              timeDescription = `${monthsOfWork.toFixed(1)} meses`;
              emotionalMessage = `Você trabalha ${Math.ceil(monthsOfWork)} meses inteiros pra pagar isso.`;
            }

            simulationResult = {
              title: `R$ ${expenseValue.toFixed(2)} = ${timeDescription} trabalhando`,
              metrics: [
                { 
                  label: "Tempo de trabalho necessário",
                  value: timeDescription,
                  change: `${hoursOfWork.toFixed(1)} horas no total`
                },
                { 
                  label: "Sua hora vale",
                  value: formatCurrency(hourlyRate)
                }
              ],
              emotional: {
                message: emotionalMessage,
                impact: daysOfWork > 7 ? "high" : daysOfWork > 3 ? "medium" : "low"
              }
            };

            if (expenseValue > monthlyIncome * 0.5) {
              simulationResult.metrics.push({
                label: "Em relação à sua renda",
                value: `${((expenseValue / monthlyIncome) * 100).toFixed(0)}% do salário`
              });
            }
          }
          break;

        case "cut_specific":
          const cutAmount = parseFloat(simulationValue) || 0;
          const annualSavings = cutAmount * 12;
          const asPercentOfIncome = currentIncome > 0 ? (cutAmount / currentIncome) * 100 : 0;
          
          simulationResult = {
            title: `Cortando R$ ${cutAmount.toFixed(2)}/mês`,
            metrics: [
              { 
                label: "Você economiza por mês", 
                value: formatCurrency(cutAmount),
                change: `${asPercentOfIncome.toFixed(1)}% da sua renda`
              },
              { 
                label: "Em 1 ano você tem", 
                value: formatCurrency(annualSavings)
              },
              { 
                label: "Sua nova economia mensal", 
                value: formatCurrency(currentSavings + cutAmount),
                change: `antes: ${formatCurrency(currentSavings)}`
              }
            ],
            emotional: {
              message: cutAmount > currentIncome * 0.1
                ? `Isso faz diferença real. Vale o esforço.`
                : cutAmount > 0
                ? `Pode parecer pouco, mas somando dá ${formatCurrency(annualSavings)} por ano.`
                : `Coloque um valor pra ver o impacto`,
              impact: cutAmount > currentIncome * 0.15 ? "high" : cutAmount > currentIncome * 0.05 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0 && cutAmount > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsBefore = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsAfter = (currentSavings + cutAmount) > 0 ? Math.ceil(remaining / (currentSavings + cutAmount)) : 999;
              const timeSaved = monthsBefore - monthsAfter;
              
              simulationResult.goalImpact = {
                goalTitle: goal.title,
                monthsBefore: monthsBefore > 100 ? "Nunca" : `${monthsBefore} meses`,
                monthsAfter: monthsAfter > 100 ? "Nunca" : `${monthsAfter} meses`,
                timeSaved: timeSaved > 0 ? `${timeSaved} meses mais rápido` : "Sem mudança"
              };
            }
          }
          break;

        case "reduce_category":
          const reductionPercent = parseFloat(simulationValue) || 0;
          const categoryExpenses = calculateSuperflousExpenses();
          const reductionAmount = categoryExpenses * (reductionPercent / 100);
          const newMonthlyExpenses = currentExpenses - reductionAmount;
          const newMonthlySavings = currentIncome - newMonthlyExpenses;
          
          simulationResult = {
            title: `Cortando ${reductionPercent}% dos supérfluos`,
            metrics: [
              { 
                label: "Você economiza por mês", 
                value: formatCurrency(reductionAmount),
                change: `de ${formatCurrency(categoryExpenses)} em supérfluos`
              },
              { 
                label: "Nova economia mensal total", 
                value: formatCurrency(newMonthlySavings),
                change: `antes: ${formatCurrency(currentSavings)}`
              },
              { 
                label: "Em 1 ano você junta", 
                value: formatCurrency(reductionAmount * 12)
              }
            ],
            emotional: {
              message: reductionPercent >= 50
                ? `Cortar metade dos supérfluos é desafiador, mas possível.`
                : reductionPercent >= 30
                ? `Uma redução equilibrada. Dá pra manter sem sofrer.`
                : reductionPercent > 0
                ? `Pequenos cortes já ajudam. Comece por aqui.`
                : `Digite uma % pra ver quanto economiza`,
              impact: reductionPercent >= 40 ? "high" : reductionPercent >= 20 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0 && reductionAmount > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsBefore = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsAfter = newMonthlySavings > 0 ? Math.ceil(remaining / newMonthlySavings) : 999;
              const timeSaved = monthsBefore - monthsAfter;
              
              simulationResult.goalImpact = {
                goalTitle: goal.title,
                monthsBefore: monthsBefore > 100 ? "Nunca" : `${monthsBefore} meses`,
                monthsAfter: monthsAfter > 100 ? "Nunca" : `${monthsAfter} meses`,
                timeSaved: timeSaved > 0 ? `${timeSaved} meses mais rápido` : "Sem mudança"
              };
            }
          }
          break;

        case "new_income":
          const newIncome = parseFloat(simulationValue) || 0;
          const incomeIncrease = newIncome - currentIncome;
          const newSavingsWithIncome = newIncome - currentExpenses;
          const increasePercent = currentIncome > 0 ? (incomeIncrease / currentIncome) * 100 : 0;
          
          simulationResult = {
            title: `Ganhando R$ ${newIncome.toFixed(2)}/mês`,
            metrics: [
              { 
                label: "Aumento na renda", 
                value: formatCurrency(incomeIncrease),
                change: `+${increasePercent.toFixed(0)}%`
              },
              { 
                label: "Nova economia mensal", 
                value: formatCurrency(newSavingsWithIncome),
                change: `antes: ${formatCurrency(currentSavings)}`
              },
              { 
                label: "Em 1 ano você junta", 
                value: formatCurrency(newSavingsWithIncome * 12)
              }
            ],
            emotional: {
              message: increasePercent > 30
                ? `Isso muda tudo. Pode transformar sua vida.`
                : increasePercent > 15
                ? `Um salto bom. Faz diferença real no longo prazo.`
                : increasePercent > 0
                ? `Toda renda extra ajuda. Já é um avanço.`
                : `Coloque o novo salário pra ver o impacto`,
              impact: increasePercent > 30 ? "high" : increasePercent > 15 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0 && newSavingsWithIncome > currentSavings) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsBefore = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsAfter = newSavingsWithIncome > 0 ? Math.ceil(remaining / newSavingsWithIncome) : 999;
              const timeSaved = monthsBefore - monthsAfter;
              
              simulationResult.goalImpact = {
                goalTitle: goal.title,
                monthsBefore: monthsBefore > 100 ? "Nunca" : `${monthsBefore} meses`,
                monthsAfter: monthsAfter > 100 ? "Nunca" : `${monthsAfter} meses`,
                timeSaved: timeSaved > 0 ? `${timeSaved} meses mais rápido` : "Sem mudança"
              };
            }
          }
          break;

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
                ? `Isso representa ${Math.round((savingsIncrease / currentIncome) * 100)}% a mais do seu salário. Vale a pena!`
                : "Talvez valha a pena explorar outras formas de economizar",
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

        case "old_cut_expenses":
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
                ? "Essa mudança pode transformar sua situação. Vale explorar!"
                : "Um avanço positivo. Considere também outros aspectos da mudança.",
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

        case "old_new_job":
          const expenseValue = parseFloat(simulationValue) || 0;
          const hourlyRate = calculateHourlyRate();
          const monthlyIncome = calculateMonthlyIncome();
          
          if (hourlyRate <= 0) {
            simulationResult = {
              title: "Não é possível calcular",
              metrics: [
                { label: "Renda necessária", value: "Configure sua renda primeiro" }
              ],
              emotional: {
                message: "Configure sua renda mensal na aba de Configurações para usar esta simulação.",
                impact: "low"
              }
            };
          } else {
            const hoursOfWork = expenseValue / hourlyRate;
            const daysOfWork = hoursOfWork / 8;
            
            // Cálculo emocional
            let emotionalMessage = "";
            if (hoursOfWork < 1) {
              emotionalMessage = `Esse gasto equivale a apenas ${Math.round(hoursOfWork * 60)} minutos do seu mês. Pequeno, mas conta.`;
            } else if (hoursOfWork < 8) {
              emotionalMessage = `Esse gasto custa ${hoursOfWork.toFixed(1)} horas de trabalho. Vale a pena?`;
            } else if (daysOfWork < 7) {
              emotionalMessage = `Esse gasto equivale a ${daysOfWork.toFixed(1)} dias completos de trabalho. Pense bem antes!`;
            } else {
              emotionalMessage = `Esse gasto custa ${daysOfWork.toFixed(1)} dias de trabalho. É realmente necessário?`;
            }

            simulationResult = {
              title: `R$ ${expenseValue.toFixed(2)} em tempo de trabalho`,
              metrics: [
                { 
                  label: "Horas de trabalho",
                  value: `${hoursOfWork.toFixed(1)}h`,
                  change: `${(hoursOfWork / 8).toFixed(1)} dias`
                },
                { 
                  label: "Sua taxa horária",
                  value: formatCurrency(hourlyRate)
                }
              ],
              emotional: {
                message: emotionalMessage,
                impact: daysOfWork > 7 ? "high" : daysOfWork > 1 ? "medium" : "low"
              }
            };

            // Se for 1 mês de renda
            if (expenseValue > monthlyIncome * 0.5) {
              simulationResult.metrics.push({
                label: "Em relação à renda",
                value: `${((expenseValue / monthlyIncome) * 100).toFixed(1)}% da renda`
              });
            }
          }
          break;

        case "old_cost_of_time":
          let savingsAmount = 0;
          const numericMatch = simulationValue.match(/[\d.,]+/);
          
          if (numericMatch) {
            // Valor numérico fornecido
            savingsAmount = parseFloat(numericMatch[0].replace(',', '.'));
          } else if (simulationValue.trim()) {
            // Buscar gastos por descrição
            const matchingExpenses = expenses.filter(e => 
              e.description?.toLowerCase().includes(simulationValue.toLowerCase())
            );
            savingsAmount = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);
          }
          
          const newSavingsWithCut = currentSavings + savingsAmount;
          const savingsRate = currentIncome > 0 ? (savingsAmount / currentIncome) * 100 : 0;
          
          simulationResult = {
            title: `Economizando ${formatCurrency(savingsAmount)}/mês`,
            metrics: [
              { label: "Economia mensal", value: `R$ ${savingsAmount.toFixed(2)}` },
              { label: "Nova poupança", value: `R$ ${newSavingsWithCut.toFixed(2)}` },
              { label: "Em 1 ano", value: `R$ ${(savingsAmount * 12).toFixed(2)}` }
            ],
            emotional: {
              message: savingsAmount > currentIncome * 0.1 
                ? "Essa economia faz uma diferença real no longo prazo!"
                : savingsAmount > 0
                ? "Pequenas mudanças somam muito ao longo do tempo!"
                : "Digite um valor ou nome de gasto para ver o impacto",
              impact: savingsAmount > currentIncome * 0.15 ? "high" : savingsAmount > currentIncome * 0.05 ? "medium" : "low"
            }
          };

          if (selectedGoal && activeGoals.length > 0 && savingsAmount > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsBefore = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const monthsAfter = newSavingsWithCut > 0 ? Math.ceil(remaining / newSavingsWithCut) : 999;
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

        case "old_stop_superfluous":
          if (selectedGoal && activeGoals.length > 0) {
            const goal = activeGoals.find(g => g.id === selectedGoal);
            if (goal) {
              const remaining = goal.target_amount - (goal.current_amount || 0);
              const monthsNeeded = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : 999;
              const targetDate = new Date();
              targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
              
              // Calcular economia realista (20-30% da renda disponível)
              const availableForSavings = currentIncome - currentExpenses;
              const realisticMonthlySavings = Math.max(availableForSavings * 0.3, currentSavings);
              const realisticMonths = realisticMonthlySavings > 0 ? Math.ceil(remaining / realisticMonthlySavings) : 999;
              
              // Calcular se precisa economizar mais
              const needsMoreSavings = monthsNeeded > 24;
              const recommendedSavings = needsMoreSavings ? realisticMonthlySavings : currentSavings;
              
              simulationResult = {
                title: `Meta: ${goal.title}`,
                metrics: [
                  { label: "Faltam", value: `R$ ${remaining.toFixed(2)}` },
                  { label: "Economia atual/mês", value: `R$ ${currentSavings.toFixed(2)}` },
                  { label: "Tempo no ritmo atual", value: monthsNeeded > 100 ? "Mais de 8 anos" : `${monthsNeeded} meses` }
                ],
                emotional: {
                  message: monthsNeeded <= 12 
                    ? `Você está perto! Apenas ${monthsNeeded} meses no ritmo atual.`
                    : monthsNeeded <= 24 
                    ? "Mantendo o foco, você chega lá. Um passo de cada vez!"
                    : realisticMonths <= 36
                    ? `Ajustando para R$ ${realisticMonthlySavings.toFixed(2)}/mês (${Math.round((realisticMonthlySavings/currentIncome)*100)}% da renda), você alcança em ${realisticMonths} meses`
                    : "Essa meta pede uma renda maior ou um ajuste no valor. Vamos encontrar o caminho juntos?",
                  impact: monthsNeeded <= 12 ? "high" : monthsNeeded <= 24 ? "medium" : "low",
                  date: monthsNeeded <= 100 ? targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : null
                }
              };
              
              // Adicionar métricas de economia recomendada se necessário
              if (needsMoreSavings && realisticMonthlySavings > currentSavings) {
                simulationResult.metrics.push({
                  label: "Economia recomendada/mês",
                  value: `R$ ${realisticMonthlySavings.toFixed(2)}`,
                  change: `Para alcançar em ${realisticMonths} meses`
                });
              }
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
            <p className="text-slate-500">Veja em números o que muda na prática</p>
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
                  {selectedSimulation.id === "cost_of_time" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quanto é o gasto?
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 350"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Vou converter em horas/dias de trabalho
                      </p>
                    </div>
                  )}

                  {selectedSimulation.id === "cut_specific" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quanto é esse gasto mensal?
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 80"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Ex: assinatura, delivery recorrente, hábito específico
                      </p>
                    </div>
                  )}

                  {selectedSimulation.id === "reduce_category" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quanto % você quer cortar dos supérfluos?
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 30"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Você gasta {formatCurrency(calculateSuperflousExpenses())} em supérfluos este mês
                      </p>
                    </div>
                  )}

                  {selectedSimulation.id === "new_income" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Qual seria o novo salário?
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 7500"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Sua renda atual: {formatCurrency(calculateMonthlyIncome())}
                      </p>
                    </div>
                  )}

                  {activeGoals.length > 0 && selectedSimulation.id !== "cost_of_time" && (
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
                    disabled={isSimulating || !simulationValue}
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
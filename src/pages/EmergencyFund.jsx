import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Shield,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/BackButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmergencyFund() {
  const [showDetails, setShowDetails] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const currentMonth = new Date().toISOString().slice(0, 7);

  const queryClient = useQueryClient();

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setShowAddDialog(false);
      setAddAmount("");
    }
  });

  const defaultSettings = {
    fixed_percentage: 50,
    essential_percentage: 20,
    superfluous_percentage: 15,
    emergency_percentage: 10,
    investment_percentage: 5,
    emergency_fund_goal_months: 6,
    current_emergency_fund: 0
  };

  const currentSettings = settings || defaultSettings;

  // Calculations
  const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  
  const expensesByCategory = {
    fixed: expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + (e.amount || 0), 0),
    emergency: expenses.filter(e => e.category === 'emergency').reduce((s, e) => s + (e.amount || 0), 0)
  };

  // Emergency fund calculations
  const monthlyEssentialExpenses = expensesByCategory.fixed; // Fixed expenses as baseline
  const emergencyGoalMonths = currentSettings.emergency_fund_goal_months || 6;
  const idealEmergencyFund = monthlyEssentialExpenses * emergencyGoalMonths;
  
  const emergencyContributions = expensesByCategory.emergency;
  const currentEmergencyFund = (currentSettings.current_emergency_fund || 0) + emergencyContributions;
  
  const remainingToGoal = Math.max(0, idealEmergencyFund - currentEmergencyFund);
  const progressPercentage = idealEmergencyFund > 0 
    ? Math.min((currentEmergencyFund / idealEmergencyFund) * 100, 100)
    : 0;

  // Survival time
  const monthsOfSurvival = monthlyEssentialExpenses > 0 
    ? currentEmergencyFund / monthlyEssentialExpenses 
    : 0;

  // Monthly contribution
  const monthlyContribution = totalIncome * (currentSettings.emergency_percentage / 100);
  const monthsToComplete = remainingToGoal > 0 && monthlyContribution > 0
    ? Math.ceil(remainingToGoal / monthlyContribution)
    : 0;

  // Risk level
  const getRiskLevel = () => {
    if (progressPercentage >= 100) return { 
      level: "Protegido", 
      color: "emerald", 
      icon: CheckCircle2, 
      message: "Sua reserva está completa!" 
    };
    if (progressPercentage >= 50) return { 
      level: "Construindo", 
      color: "blue", 
      icon: TrendingUp, 
      message: "Continue assim, você está no caminho certo" 
    };
    if (progressPercentage >= 25) return { 
      level: "Iniciando", 
      color: "amber", 
      icon: AlertTriangle, 
      message: "Aumente suas contribuições se possível" 
    };
    return { 
      level: "Crítico", 
      color: "red", 
      icon: AlertTriangle, 
      message: "Priorize construir sua reserva!" 
    };
  };

  const risk = getRiskLevel();
  const RiskIcon = risk.icon;

  // Alerts
  const alerts = [];
  if (currentEmergencyFund === 0) {
    alerts.push({
      type: "danger",
      message: "Você ainda não tem reserva de emergência. Comece agora mesmo!"
    });
  } else if (monthsOfSurvival < 1) {
    alerts.push({
      type: "danger",
      message: `Sua reserva cobre apenas ${monthsOfSurvival.toFixed(1)} mês. O ideal é ter no mínimo 3 meses.`
    });
  } else if (monthsOfSurvival < 3) {
    alerts.push({
      type: "warning",
      message: `Você tem ${monthsOfSurvival.toFixed(1)} meses de reserva. Continue aumentando!`
    });
  } else if (monthsOfSurvival >= emergencyGoalMonths) {
    alerts.push({
      type: "success",
      message: "Parabéns! Você atingiu sua meta de reserva de emergência."
    });
  }

  if (monthlyContribution < monthlyEssentialExpenses * 0.1 && progressPercentage < 100) {
    alerts.push({
      type: "warning",
      message: "Sua contribuição mensal é baixa. Tente aumentar para acelerar sua meta."
    });
  }

  const handleAddContribution = () => {
    if (!addAmount || parseFloat(addAmount) <= 0) return;

    const newTotal = currentEmergencyFund + parseFloat(addAmount);
    const data = {
      ...currentSettings,
      current_emergency_fund: newTotal
    };

    if (settings) {
      updateSettingsMutation.mutate({ id: settings.id, data });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyDetailed = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton to={createPageUrl("Planning")} className="mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-[#5FBDBD]" />
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Reserva de Emergência</h1>
            </div>
            <p className="text-slate-500">Proteção financeira para imprevistos</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-gradient-to-br from-${risk.color}-500 to-${risk.color}-600 rounded-3xl p-8 text-white shadow-xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RiskIcon className="w-8 h-8" />
            <div>
              <p className="text-white/80 text-sm">Status da Reserva</p>
              <p className="text-2xl font-bold">{risk.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Progresso</p>
            <p className="text-3xl font-bold">{progressPercentage.toFixed(0)}%</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Reserva atual</span>
            <span className="font-semibold">{formatCurrency(currentEmergencyFund)}</span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-white/20" />
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Meta de {emergencyGoalMonths} meses</span>
            <span className="font-semibold">{formatCurrency(idealEmergencyFund)}</span>
          </div>
        </div>

        <p className="text-white/90 text-sm">{risk.message}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <p className="text-sm text-slate-500">Tempo de Sobrevivência</p>
          </div>
          <p className="text-4xl font-bold text-slate-800">{monthsOfSurvival.toFixed(1)}</p>
          <p className="text-sm text-slate-500 mt-1">meses sem renda</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-slate-400" />
            <p className="text-sm text-slate-500">Falta para Meta</p>
          </div>
          <p className="text-4xl font-bold text-slate-800 tabular-nums">{formatCurrency(remainingToGoal)}</p>
          <p className="text-sm text-slate-500 mt-1">ainda faltam</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-slate-400" />
            <p className="text-sm text-slate-500">Tempo até Completar</p>
          </div>
          <p className="text-4xl font-bold text-slate-800">
            {monthsToComplete > 0 ? monthsToComplete : "—"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {monthsToComplete > 0 ? "meses no ritmo atual" : "meta atingida"}
          </p>
        </motion.div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                alert.type === "success"
                  ? "bg-emerald-50 border-emerald-200"
                  : alert.type === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p className={`text-sm ${
                alert.type === "success"
                  ? "text-emerald-700"
                  : alert.type === "warning"
                  ? "text-amber-700"
                  : "text-red-700"
              }`}>
                {alert.message}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Details Expandable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-slate-800">Ver detalhes completos</span>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100"
            >
              <div className="p-6 space-y-6">
                {/* Calculation Breakdown */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Como Calculamos</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Gastos fixos mensais</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{formatCurrencyDetailed(monthlyEssentialExpenses)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Meta de meses de cobertura</span>
                      <span className="font-semibold text-slate-800">{emergencyGoalMonths} meses</span>
                    </div>
                    <div className="flex justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-emerald-700 font-medium">Reserva ideal total</span>
                      <span className="font-bold text-emerald-700 tabular-nums">{formatCurrencyDetailed(idealEmergencyFund)}</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Contribution */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Aportes Mensais</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-2">Contribuição mensal automática</p>
                    <p className="text-3xl font-bold text-blue-700 mb-3 tabular-nums">{formatCurrency(monthlyContribution)}</p>
                    <p className="text-xs text-blue-600">
                      {currentSettings.emergency_percentage}% da sua renda ({formatCurrencyDetailed(totalIncome)})
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Recomendações</h3>
                  <div className="space-y-2">
                    {progressPercentage < 100 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800 font-medium mb-2">📈 Para completar mais rápido</p>
                        <p className="text-xs text-amber-700">
                          Com um aporte adicional de {formatCurrency(remainingToGoal / 6)} por mês, 
                          você completa sua reserva em 6 meses.
                        </p>
                      </div>
                    )}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium mb-2">💡 Dica</p>
                      <p className="text-xs text-green-700">
                        Mantenha sua reserva em aplicações líquidas e seguras, como CDB com liquidez diária ou Tesouro Selic.
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-medium mb-2">🎯 Meta ideal</p>
                      <p className="text-xs text-blue-700">
                        O recomendado é ter entre 6 e 12 meses de gastos essenciais guardados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Contribution Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Reserva atual</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{formatCurrency(currentEmergencyFund)}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Aporte</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                autoFocus
              />
            </div>

            {addAmount && parseFloat(addAmount) > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-sm text-emerald-600 mb-1">Nova reserva</p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(currentEmergencyFund + parseFloat(addAmount))}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddContribution}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                disabled={!addAmount || parseFloat(addAmount) <= 0 || updateSettingsMutation.isPending}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
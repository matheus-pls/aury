import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Shield,
  TrendingUp,
  TrendingDown,
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
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmergencyFund() {
  const [showDetails, setShowDetails] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['settings']);
      if (showAddDialog) {
        toast.success("Valor adicionado à caixinha!");
      } else if (showWithdrawDialog) {
        toast.success("Valor retirado da caixinha");
      }
      setShowAddDialog(false);
      setShowWithdrawDialog(false);
      setAddAmount("");
      setWithdrawAmount("");
      setWithdrawConfirm(false);
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

  // Status level
  const getStatusLevel = () => {
    if (progressPercentage >= 100) return { 
      level: "Completa", 
      gradient: "from-[#5FBDBD] via-[#4FA9A5] to-[#2A4A62]",
      icon: CheckCircle2, 
      message: "Você construiu sua proteção. Essa reserva te dá tranquilidade." 
    };
    if (progressPercentage >= 50) return { 
      level: "Crescendo", 
      gradient: "from-[#5FBDBD] to-[#4FA9A5]",
      icon: TrendingUp, 
      message: "Você está no caminho certo. Continue nesse ritmo." 
    };
    if (progressPercentage >= 25) return { 
      level: "Começando", 
      gradient: "from-[#4FA9A5] to-[#2A4A62]",
      icon: Shield, 
      message: "Todo início conta. Cada quantia fortalece sua segurança." 
    };
    return { 
      level: "Em Construção", 
      gradient: "from-[#2A4A62] to-[#1B3A52]",
      icon: Shield, 
      message: "Sua caixinha está te esperando. Comece com o que puder." 
    };
  };

  const status = getStatusLevel();
  const StatusIcon = status.icon;

  // Informational messages
  const messages = [];
  if (currentEmergencyFund === 0) {
    messages.push({
      type: "info",
      message: "Sua caixinha ainda está vazia. Que tal começar com uma pequena quantia?"
    });
  } else if (monthsOfSurvival < 1) {
    messages.push({
      type: "info",
      message: `Sua reserva já cobre ${monthsOfSurvival.toFixed(1)} mês. Continuando assim, você chega nos 3 meses recomendados.`
    });
  } else if (monthsOfSurvival < 3) {
    messages.push({
      type: "info",
      message: `Você tem ${monthsOfSurvival.toFixed(1)} meses guardados. Está construindo sua segurança.`
    });
  } else if (monthsOfSurvival >= emergencyGoalMonths) {
    messages.push({
      type: "success",
      message: "Sua meta foi alcançada! Você tem a segurança que planejou."
    });
  }

  if (monthlyContribution < monthlyEssentialExpenses * 0.1 && progressPercentage < 100) {
    messages.push({
      type: "info",
      message: "Aumentando um pouco a contribuição mensal, você acelera a construção da sua reserva."
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

  const handleWithdraw = () => {
    if (!withdrawConfirm || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return;

    const newTotal = Math.max(0, currentEmergencyFund - parseFloat(withdrawAmount));
    const data = {
      ...currentSettings,
      current_emergency_fund: newTotal
    };

    if (settings) {
      updateSettingsMutation.mutate({ id: settings.id, data });
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      setWithdrawConfirm(false);
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Caixinha</h1>
              </div>
              <p className="text-muted-foreground">Sua segurança para imprevistos</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] shadow-md"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            <Button
              onClick={() => setShowWithdrawDialog(true)}
              variant="outline"
              className="border-border text-foreground hover:bg-accent"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Retirar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative overflow-hidden bg-gradient-to-br ${status.gradient} rounded-3xl p-8 text-white shadow-aury-lg`}
      >
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <StatusIcon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Sua Caixinha</p>
                <p className="text-2xl font-bold">{status.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Progresso</p>
              <p className="text-4xl font-bold">{progressPercentage.toFixed(0)}%</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-baseline">
              <div>
                <p className="text-white/70 text-xs mb-1">Valor guardado</p>
                <p className="text-3xl font-bold tabular-nums">{formatCurrency(currentEmergencyFund)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs mb-1">Meta total</p>
                <p className="text-xl font-semibold tabular-nums">{formatCurrency(idealEmergencyFund)}</p>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-white/70 text-sm">{emergencyGoalMonths} meses de proteção</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-white/90 text-sm leading-relaxed">{status.message}</p>
          </div>
        </div>
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
            <Clock className="w-5 h-5 text-[#5FBDBD]" />
            <p className="text-sm text-slate-600 font-medium">Proteção Atual</p>
          </div>
          <p className="text-4xl font-bold text-[#1B3A52]">{monthsOfSurvival.toFixed(1)}</p>
          <p className="text-sm text-slate-500 mt-1">meses de tranquilidade</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-[#5FBDBD]" />
            <p className="text-sm text-slate-600 font-medium">Falta Guardar</p>
          </div>
          <p className="text-4xl font-bold text-[#1B3A52] tabular-nums">{formatCurrency(remainingToGoal)}</p>
          <p className="text-sm text-slate-500 mt-1">para completar</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-[#5FBDBD]" />
            <p className="text-sm text-slate-600 font-medium">No Ritmo Atual</p>
          </div>
          <p className="text-4xl font-bold text-[#1B3A52]">
            {monthsToComplete > 0 ? monthsToComplete : "—"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {monthsToComplete > 0 ? "meses até completar" : "objetivo alcançado"}
          </p>
        </motion.div>
      </div>

      {/* Informational Messages */}
      {messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-5 rounded-2xl border ${
                msg.type === "success"
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                  : "bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 border-[#5FBDBD]/20"
              }`}
            >
              <p className={`text-sm leading-relaxed ${
                msg.type === "success"
                  ? "text-emerald-700"
                  : "text-[#1B3A52]"
              }`}>
                {msg.message}
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
                  <h3 className="font-semibold text-slate-800 mb-4">Orientações</h3>
                  <div className="space-y-3">
                    {progressPercentage < 100 && (
                      <div className="bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 border border-[#5FBDBD]/20 rounded-xl p-4">
                        <p className="text-sm text-[#1B3A52] font-medium mb-2">💫 Para acelerar</p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Adicionando {formatCurrency(remainingToGoal / 6)} por mês, você completa sua caixinha em 6 meses. No seu tempo, sem pressão.
                        </p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-800 font-medium mb-2">💡 Onde guardar</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Aplicações líquidas e seguras são ideais: CDB com liquidez diária, Tesouro Selic ou poupança.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-800 font-medium mb-2">🎯 Quanto é o ideal</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Entre 6 e 12 meses de gastos essenciais é o recomendado para ter tranquilidade.
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
            <DialogTitle className="text-[#1B3A52]">Adicionar à Caixinha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Caixinha atual</p>
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
                <p className="text-sm text-emerald-600 mb-1">Nova caixinha</p>
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

      {/* Withdraw Dialog with Confirmation */}
      <Dialog open={showWithdrawDialog} onOpenChange={(open) => {
        setShowWithdrawDialog(open);
        if (!open) {
          setWithdrawConfirm(false);
          setWithdrawAmount("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Retirar da Caixinha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">A caixinha é sua segurança</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    É sempre bom manter um valor guardado para imprevistos. Tem certeza que deseja retirar agora?
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Caixinha atual</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{formatCurrency(currentEmergencyFund)}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount" className="text-[#1B3A52]">Valor a Retirar</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0,00"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                autoFocus
                className="border-slate-200 focus:border-[#5FBDBD]"
              />
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-rose-50 rounded-lg p-4">
                <p className="text-sm text-rose-600 mb-1">Nova caixinha</p>
                <p className="text-2xl font-bold text-rose-700 tabular-nums">
                  {formatCurrency(Math.max(0, currentEmergencyFund - parseFloat(withdrawAmount)))}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="withdrawConfirm"
                checked={withdrawConfirm}
                onChange={(e) => setWithdrawConfirm(e.target.checked)}
                className="w-4 h-4 text-[#5FBDBD] rounded focus:ring-[#5FBDBD]"
              />
              <Label htmlFor="withdrawConfirm" className="text-sm text-slate-700 cursor-pointer">
                Confirmo que quero retirar este valor
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 border-slate-200"
                onClick={() => {
                  setShowWithdrawDialog(false);
                  setWithdrawConfirm(false);
                  setWithdrawAmount("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleWithdraw}
                className="flex-1 bg-rose-500 hover:bg-rose-600"
                disabled={!withdrawConfirm || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || updateSettingsMutation.isPending}
              >
                Retirar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
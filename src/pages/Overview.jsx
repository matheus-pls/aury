import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles,
  Calendar,
  Shield,
  Target,
  TrendingUp,
  Wallet,
  Receipt,
  ChevronRight,
  AlertCircle,
  TrendingDown,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Overview() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
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

  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const availableBalance = totalIncome - totalExpenses;
  const spentPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const activeSettings = settings || { emergency_percentage: 15, investment_percentage: 10 };
  const fixedExpenses = expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + (e.amount || 0), 0);
  const emergencyGoal = fixedExpenses * (activeSettings.emergency_fund_goal_months || 6);
  const currentEmergencyFund = activeSettings.current_emergency_fund || 0;
  const emergencyProgress = emergencyGoal > 0 ? (currentEmergencyFund / emergencyGoal) * 100 : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const quickActions = [
    { label: "Planejamento", icon: Sparkles, page: "Planning", color: "from-purple-500 to-purple-600" },
    { label: "Movimentações", icon: Wallet, page: "Movements", color: "from-blue-500 to-blue-600" },
    { label: "Metas", icon: Target, page: "GoalsHub", color: "from-pink-500 to-pink-600" },
    { label: "Análises", icon: TrendingUp, page: "Analysis", color: "from-emerald-500 to-emerald-600" }
  ];

  const alerts = [];
  if (spentPercentage > 90) {
    alerts.push({
      type: "danger",
      message: "Você já gastou mais de 90% da sua renda este mês!",
      icon: AlertCircle
    });
  }
  if (emergencyProgress < 30) {
    alerts.push({
      type: "warning",
      message: "Sua reserva de emergência está abaixo do ideal",
      icon: Shield
    });
  }
  if (totalIncome === 0) {
    alerts.push({
      type: "info",
      message: "Cadastre suas fontes de renda para começar",
      icon: Info
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Seu panorama financeiro completo</p>
      </motion.div>

      {/* Main Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#00A8A0] to-[#008F88] rounded-3xl p-8 text-white shadow-xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm mb-2">Saldo do Mês</p>
            <h2 className="text-5xl font-bold">{formatCurrency(availableBalance)}</h2>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
          <div>
            <p className="text-white/70 text-xs mb-1">Renda</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs mb-1">Gastos</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>Você gastou {spentPercentage.toFixed(0)}% da sua renda</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${spentPercentage > 100 ? 'bg-red-400' : 'bg-white'}`}
            />
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            const colors = {
              danger: "bg-red-50 border-red-200 text-red-800",
              warning: "bg-amber-50 border-amber-200 text-amber-800",
              info: "bg-blue-50 border-blue-200 text-blue-800"
            };
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-4 rounded-xl border ${colors[alert.type]}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{alert.message}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <p className="text-sm text-slate-500">Reserva</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{emergencyProgress.toFixed(0)}%</p>
            <Progress value={emergencyProgress} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-purple-500" />
              <p className="text-sm text-slate-500">Metas</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{goals.length}</p>
            <p className="text-xs text-slate-500 mt-2">
              {goals.length === 0 ? 'Nenhuma meta ativa' : `${goals.length} ${goals.length === 1 ? 'meta' : 'metas'} ativas`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="w-5 h-5 text-rose-500" />
              <p className="text-sm text-slate-500">Gastos do Mês</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{expenses.length}</p>
            <p className="text-xs text-slate-500 mt-2">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={createPageUrl(action.page)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group"
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <p className="font-medium text-slate-800">{action.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
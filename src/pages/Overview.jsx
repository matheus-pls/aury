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
  Info,
  Heart
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

  // Índice de Tranquilidade Financeira (0-100)
  const calculateTranquilityIndex = () => {
    let score = 0;
    
    // Reserva de emergência (40 pontos)
    score += Math.min(emergencyProgress, 100) * 0.4;
    
    // Controle de gastos (40 pontos)
    if (spentPercentage <= 70) score += 40;
    else if (spentPercentage <= 85) score += 25;
    else if (spentPercentage <= 100) score += 15;
    
    // Equilíbrio mensal (20 pontos)
    if (availableBalance > 0) {
      const balanceRatio = availableBalance / Math.max(totalIncome, 1);
      score += Math.min(balanceRatio * 100, 20);
    }
    
    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const tranquilityIndex = calculateTranquilityIndex();
  
  const getTranquilityStatus = () => {
    if (tranquilityIndex >= 70) return { label: "Tranquilo", color: "from-emerald-500 to-teal-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50" };
    if (tranquilityIndex >= 40) return { label: "Atenção", color: "from-amber-500 to-orange-500", textColor: "text-amber-700", bgColor: "bg-amber-50" };
    return { label: "Risco", color: "from-rose-500 to-red-500", textColor: "text-rose-700", bgColor: "bg-rose-50" };
  };

  const tranquilityStatus = getTranquilityStatus();

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
      message: "Atenção: você está perto do limite do seu orçamento mensal",
      icon: AlertCircle
    });
  }
  if (emergencyProgress < 30 && totalIncome > 0) {
    const monthsToSafety = emergencyGoal > 0 ? Math.ceil(emergencyGoal / (totalIncome * 0.15)) : 0;
    alerts.push({
      type: "warning",
      message: `Se algo inesperado acontecer hoje, sua reserva cobre apenas ${(emergencyProgress / 100 * 6).toFixed(1)} meses. ${monthsToSafety > 0 ? `Economizando 15% ao mês, você atinge segurança em ${monthsToSafety} meses.` : ''}`,
      icon: Shield
    });
  }
  if (totalIncome === 0) {
    alerts.push({
      type: "info",
      message: "Cadastre suas fontes de renda para começar a usar o Aury",
      icon: Info
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Seu panorama financeiro de hoje</p>
      </motion.div>

      {/* Índice de Tranquilidade Financeira */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br ${tranquilityStatus.color} text-white shadow-2xl`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6" />
            <p className="text-white/90 text-sm font-medium">Tranquilidade Financeira</p>
          </div>
          
          <div className="flex items-end gap-4 mb-6">
            <h2 className="text-6xl font-bold">{tranquilityIndex}</h2>
            <span className="text-3xl font-light mb-2 opacity-90">/100</span>
          </div>

          <div className={`inline-block px-4 py-2 rounded-full ${tranquilityStatus.bgColor} ${tranquilityStatus.textColor} font-semibold`}>
            {tranquilityStatus.label}
          </div>

          <p className="mt-4 text-white/80 text-sm max-w-md">
            {tranquilityIndex >= 70 && "Você está no caminho certo. Continue assim!"}
            {tranquilityIndex >= 40 && tranquilityIndex < 70 && "Fique atento aos seus gastos e fortaleça sua reserva."}
            {tranquilityIndex < 40 && "É hora de revisar suas finanças. Pequenas mudanças fazem diferença."}
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Main Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-3xl p-8 text-white shadow-xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/90 text-sm mb-2">Disponível este mês</p>
            <h2 className="text-5xl font-bold">{formatCurrency(availableBalance)}</h2>
            <p className="text-white/70 text-xs mt-2">
              {availableBalance > 0 
                ? `Você ainda tem ${formatCurrency(availableBalance)} para usar`
                : "Você ultrapassou seu orçamento mensal"}
            </p>
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
          <div className="flex justify-between text-xs text-white/90 mb-2">
            <span>Utilizado: {spentPercentage.toFixed(0)}%</span>
            <span>{spentPercentage <= 100 ? 'Dentro do controle' : 'Acima do esperado'}</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${spentPercentage > 100 ? 'bg-red-400' : 'bg-white'} rounded-full`}
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
              danger: "bg-red-50 border-red-200 text-red-900",
              warning: "bg-amber-50 border-amber-200 text-amber-900",
              info: "bg-blue-50 border-blue-200 text-blue-900"
            };
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex items-start gap-3 p-5 rounded-2xl border-2 ${colors[alert.type]} shadow-sm`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{alert.message}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Reserva de Emergência</p>
              </div>
              <p className="text-3xl font-bold text-[#1B3A52] mb-2">{emergencyProgress.toFixed(0)}%</p>
              <Progress value={emergencyProgress} className="h-2 mb-2" />
              <p className="text-xs text-slate-500">
                {emergencyProgress < 100 ? `Faltam ${(100 - emergencyProgress).toFixed(0)}% para segurança total` : 'Você está protegido'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-50 rounded-xl">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Metas Ativas</p>
              </div>
              <p className="text-3xl font-bold text-[#1B3A52] mb-2">{goals.length}</p>
              <p className="text-xs text-slate-500">
                {goals.length === 0 ? 'Defina seus objetivos' : `${goals.length} objetivo${goals.length > 1 ? 's' : ''} em andamento`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <Receipt className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Este Mês</p>
              </div>
              <p className="text-3xl font-bold text-[#1B3A52] mb-2">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-slate-500">
                {expenses.length} movimentação{expenses.length !== 1 ? 'ões' : ''} registrada{expenses.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-[#1B3A52] text-lg mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={createPageUrl(action.page)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="group"
                >
                  <Card className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-[#5FBDBD]/20">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <p className="font-medium text-[#1B3A52]">{action.label}</p>
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
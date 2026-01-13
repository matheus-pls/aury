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
import AuryFlow from "../components/overview/AuryFlow";

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

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  // Check if user needs daily check-in
  React.useEffect(() => {
    if (!settingsLoading && settings) {
      const today = new Date().toISOString().split('T')[0];
      const lastCheckin = settings.last_checkin_date;
      
      // Redirect to check-in if not done today
      if (lastCheckin !== today) {
        window.location.href = createPageUrl("DailyCheckIn");
      }
    }
  }, [settings, settingsLoading]);

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
    { label: "Aury Flow", icon: Sparkles, page: "Movements", color: "from-[#5FBDBD] to-[#4FA9A5]" },
    { label: "Plano do Mês", icon: Calendar, page: "AutoPlanning", color: "from-[#4FA9A5] to-[#2A4A62]" },
    { label: "Metas", icon: Target, page: "Goals", color: "from-[#2A4A62] to-[#1B3A52]" },
  ];

  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;
  
  const alerts = [];
  if (totalIncome === 0) {
    alerts.push({
      type: "warning",
      message: "Cadastre sua renda mensal",
      action: "Vá em Registrar → Rendas para começar",
      icon: Info
    });
  }

  if (spendingPercentage > 90 && totalIncome > 0) {
    const dailyRemaining = availableBalance / Math.max(daysRemaining, 1);
    alerts.push({
      type: "danger",
      message: "Você já gastou mais de 90% da sua renda",
      action: `Gaste no máximo ${formatCurrency(dailyRemaining)} por dia até o fim do mês`,
      icon: AlertCircle
    });
  } else if (spendingPercentage > 70 && totalIncome > 0) {
    alerts.push({
      type: "warning",
      message: "70% da renda já foi usada",
      action: "Priorize apenas gastos essenciais nos próximos dias",
      icon: TrendingDown
    });
  }

  if (emergencyProgress < 30 && totalIncome > 0 && alerts.length === 0) {
    const monthlySuggestion = totalIncome * 0.05;
    alerts.push({
      type: "warning",
      message: "Sua reserva de emergência está baixa",
      action: `Economize ${formatCurrency(monthlySuggestion)} por mês para fortalecer sua segurança`,
      icon: Shield
    });
  }

  if (alerts.length === 0 && totalIncome > 0) {
    alerts.push({
      type: "success",
      message: "Suas finanças estão equilibradas",
      action: "Continue registrando seus gastos com a Aury",
      icon: Heart
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

      {/* Método Aury - Card Fixo e Discreto */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-2 border-[#5FBDBD]/20 bg-gradient-to-br from-[#5FBDBD]/5 to-[#1B3A52]/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1B3A52] text-base mb-2 flex items-center gap-2">
                  O Método Aury
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Seu caminho para clareza financeira em 3 pilares:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-white/80 rounded-lg border border-slate-200">
                    <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Segurança</p>
                      <p className="text-xs text-slate-500">Proteção financeira</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-white/80 rounded-lg border border-slate-200">
                    <TrendingUp className="w-4 h-4 text-[#5FBDBD] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Clareza</p>
                      <p className="text-xs text-slate-500">Quanto posso gastar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-white/80 rounded-lg border border-slate-200">
                    <Target className="w-4 h-4 text-[#1B3A52] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Ação</p>
                      <p className="text-xs text-slate-500">O que ajustar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Aury Flow - Entrada Rápida Inteligente */}
      <AuryFlow />

      {/* Índice de Tranquilidade Financeira - Compacto e Premium */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] text-white shadow-aury"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-white/90" />
              <p className="text-white/80 text-xs font-medium">Tranquilidade Financeira</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">{tranquilityIndex}</h2>
              <span className="text-lg font-light text-white/80">/100</span>
              <span className="ml-2 text-sm font-semibold px-3 py-1 rounded-full bg-white/20">
                {tranquilityStatus.label}
              </span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="text-2xl">
              {tranquilityIndex >= 70 ? "😌" : tranquilityIndex >= 40 ? "🤔" : "😰"}
            </div>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
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
              danger: "bg-red-50 border-red-200",
              warning: "bg-amber-50 border-amber-200",
              success: "bg-emerald-50 border-emerald-200",
              info: "bg-blue-50 border-blue-200"
            };
            const textColors = {
              danger: "text-red-900",
              warning: "text-amber-900",
              success: "text-emerald-900",
              info: "text-blue-900"
            };
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`p-4 rounded-xl border ${colors[alert.type]} shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textColors[alert.type]}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${textColors[alert.type]}`}>{alert.message}</p>
                    {alert.action && (
                      <p className={`text-xs ${textColors[alert.type]} opacity-75`}>
                        💡 {alert.action}
                      </p>
                    )}
                  </div>
                </div>
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
                  <Card className="cursor-pointer hover:shadow-aury transition-all border border-slate-200 hover:border-[#5FBDBD]/50 bg-white">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <p className="font-semibold text-[#1B3A52] text-sm">{action.label}</p>
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
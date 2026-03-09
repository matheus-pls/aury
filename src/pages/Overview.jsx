import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
  Heart,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuryFlow from "../components/overview/AuryFlow";
import { toast } from "sonner";
import UpgradeBanner from "@/components/UpgradeBanner";
import UpgradeModal from "@/components/UpgradeModal";
import PremiumBadge from "@/components/PremiumBadge";
import { Crown, Lock } from "lucide-react";

export default function Overview() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Redirect to DailyCheckIn if not done today
  React.useEffect(() => {
    if (settingsLoading) return;
    const today = new Date().toISOString().split('T')[0];
    if (!settings?.last_checkin_date || settings.last_checkin_date !== today) {
      navigate(createPageUrl("DailyCheckIn"));
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

  const [user, setUser] = React.useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [upgradeFeature, setUpgradeFeature] = React.useState("");

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  const isPremium = true; // user?.is_premium || false;

  const handlePremiumAction = (featureName) => {
    setUpgradeFeature(featureName);
    setShowUpgradeModal(true);
  };

  const quickActions = [
    { label: "Registrar Gasto", icon: Receipt, action: "expense", color: "from-[#5FBDBD] to-[#4FA9A5]" },
    { label: "Adicionar Renda", icon: TrendingUp, action: "income", color: "from-[#2A4A62] to-[#1B3A52]" },
    { label: "Criar Meta", icon: Target, action: "goal", color: "from-[#1B3A52] to-[#0A2540]" },
    { label: "Ver Análises", icon: Sparkles, page: "Analysis", color: "from-[#5FBDBD] to-[#2A4A62]", premium: true },
    { label: "Resumo Mensal", icon: FileText, page: "MonthlyReport", color: "from-[#4FA9A5] to-[#1B3A52]" }
  ];

  const [quickActionDialog, setQuickActionDialog] = React.useState(null);
  const [quickFormData, setQuickFormData] = React.useState({
    description: "",
    amount: "",
    category: "essential",
    date: new Date().toISOString().slice(0, 10),
    type: "salary"
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      toast.success("Gasto registrado com sucesso!");
      setQuickActionDialog(null);
      setQuickFormData({
        description: "",
        amount: "",
        category: "essential",
        date: new Date().toISOString().slice(0, 10),
        type: "salary"
      });
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      toast.success("Renda adicionada com sucesso!");
      setQuickActionDialog(null);
      setQuickFormData({
        description: "",
        amount: "",
        category: "essential",
        date: new Date().toISOString().slice(0, 10),
        type: "salary"
      });
    }
  });

  const handleQuickAction = (action) => {
    if (action.premium && !isPremium) {
      handlePremiumAction(action.label);
      return;
    }
    if (action.page) {
      window.location.href = createPageUrl(action.page);
    } else if (action.action === "goal") {
      window.location.href = createPageUrl("Goals");
    } else {
      setQuickActionDialog(action.action);
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (quickActionDialog === "expense") {
      createExpenseMutation.mutate({
        ...quickFormData,
        amount: parseFloat(quickFormData.amount),
        month_year: quickFormData.date.slice(0, 7)
      });
    } else if (quickActionDialog === "income") {
      createIncomeMutation.mutate({
        description: quickFormData.description,
        amount: parseFloat(quickFormData.amount),
        type: quickFormData.type,
        is_active: true
      });
    }
  };

  const alerts = [];

  // Sugestão automática do Modo Mês Apertado
  if ((spentPercentage > 85 || tranquilityIndex < 40) && totalIncome > 0) {
    alerts.push({
      type: "action",
      message: `Esse mês tá pedindo mais cuidado. Quer que eu te ajude a reorganizar?`,
      icon: Shield,
      action: {
        label: "Reorganizar Finanças",
        page: "TightMonth"
      }
    });
  } else if (spentPercentage > 90) {
    alerts.push({
      type: "danger",
      message: "Você tá bem perto do limite. Mas ainda dá tempo de ajustar.",
      icon: AlertCircle
    });
  }

  if (emergencyProgress < 30 && totalIncome > 0 && tranquilityIndex >= 40) {
    const monthsToSafety = emergencyGoal > 0 ? Math.ceil(emergencyGoal / (totalIncome * 0.15)) : 0;
    alerts.push({
      type: "warning",
      message: `Seu colchão tá crescendo. ${monthsToSafety > 0 ? `Se você guardar 15% por mês, em ${monthsToSafety} meses você chega lá.` : 'Continue guardando aos poucos.'}`,
      icon: Shield
    });
  }
  if (totalIncome === 0) {
    alerts.push({
      type: "info",
      message: "Vamos começar? Me conta quanto entra por mês que eu te ajudo a organizar.",
      icon: Info
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Como você está?</h1>
        <p className="text-slate-500 mt-1">Veja de forma simples como andam as coisas</p>
      </motion.div>

      {/* Método Aury - Compacto e Elegante */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-2xl border border-[#5FBDBD]/20">
          <div className="w-10 h-10 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#1B3A52] text-sm">Método Aury</h3>
            <p className="text-xs text-slate-600">Segurança • Clareza • Ação</p>
          </div>
        </div>
      </motion.div>

      {/* Upgrade Banner para usuários free */}
      {!isPremium && <UpgradeBanner message="Desbloqueie Simulações, Análises e muito mais com o Premium" />}

      {/* Aury Flow - bloqueado para free */}
      {isPremium ? <AuryFlow /> : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onClick={() => handlePremiumAction("Aury Flow (entrada por voz)")}
          className="cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[#5FBDBD]/40 bg-gradient-to-br from-[#5FBDBD]/5 to-[#1B3A52]/5 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center opacity-60">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-500">Aury Flow</h3>
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-sm text-slate-400">Registre gastos por voz, foto ou texto — Premium</p>
            </div>
            <button className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-md">
              <Crown className="w-3 h-3 inline mr-1" />
              Premium
            </button>
          </div>
        </motion.div>
      )}

      {/* Índice de Tranquilidade Financeira */}
      {isPremium ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] text-white shadow-aury"
        >
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
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => handlePremiumAction("Índice de Tranquilidade")}
          className="cursor-pointer relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 select-none"
        >
          <div className="absolute inset-0 backdrop-blur-[2px]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4" />
              <p className="text-xs font-medium">Tranquilidade Financeira</p>
              <PremiumBadge className="ml-auto" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold blur-sm">72</h2>
              <span className="text-lg font-light">/100</span>
              <span className="ml-2 text-sm font-semibold px-3 py-1 rounded-full bg-slate-400/30 blur-sm">
                Tranquilo
              </span>
            </div>
            <p className="text-sm mt-3 font-semibold text-slate-600">Toque para desbloquear →</p>
          </div>
        </motion.div>
      )}

      {/* Main Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-3xl p-8 text-white shadow-xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/90 text-sm mb-2">
              {availableBalance > 0 ? "Você ainda tem" : availableBalance < 0 ? "Você passou" : "Está no zero"}
            </p>
            <h2 className="text-5xl font-bold">{formatCurrency(Math.abs(availableBalance))}</h2>
            <p className="text-white/70 text-xs mt-2">
              {availableBalance > 0 
                ? "Isso é o que sobrou pra você até o fim do mês"
                : availableBalance < 0
                ? "Tá tudo bem. A gente ajusta no próximo mês"
                : "Você usou exatamente o que tinha disponível"}
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
            <span>
              {spentPercentage <= 70 ? "Você tá controlando bem" : 
               spentPercentage <= 90 ? "Já gastou a maior parte" : 
               spentPercentage <= 100 ? "Quase no limite" : 
               "Passou do previsto"}
            </span>
            <span className="font-semibold">{spentPercentage.toFixed(0)}%</span>
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
              action: "bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 border-[#5FBDBD] text-[#1B3A52]",
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
                <div className="flex-1">
                  <p className="text-sm leading-relaxed mb-3">{alert.message}</p>
                  {alert.action && (
                    <Link to={createPageUrl(alert.action.page)}>
                      <Button size="sm" className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] shadow-md">
                        {alert.action.label}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
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
          <Card className="hover:shadow-aury transition-all border border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-xl shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-[#1B3A52]">Caixinha</p>
              </div>
              <p className="text-3xl font-bold text-[#1B3A52] mb-2">{emergencyProgress.toFixed(0)}%</p>
              <Progress value={emergencyProgress} className="h-2 mb-2" />
              <p className="text-xs text-slate-500">
                {emergencyProgress < 30 ? "Você tá começando a construir" :
                 emergencyProgress < 70 ? "Tá crescendo. Continue" :
                 emergencyProgress < 100 ? "Tá quase seguro" :
                 "Você se protegeu"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="hover:shadow-aury transition-all border border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-[#2A4A62] to-[#1B3A52] rounded-xl shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-[#1B3A52]">Metas Ativas</p>
              </div>
              <p className="text-3xl font-bold text-[#1B3A52] mb-2">{goals.length}</p>
              <p className="text-xs text-slate-500">
                {goals.length === 0 ? 'Que tal definir um objetivo?' : 
                 goals.length === 1 ? 'Um sonho que você tá perseguindo' :
                 `${goals.length} coisas que você quer conquistar`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:shadow-aury transition-all border border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-[#4FA9A5] to-[#2A4A62] rounded-xl shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-[#1B3A52]">Este Mês</p>
              </div>
              <p className="text-3xl font-bold text-[#1B3A52] mb-2">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-slate-500">
                {expenses.length === 0 ? "Nenhum gasto anotado ainda" :
                 expenses.length === 1 ? "Um gasto registrado" :
                 `${expenses.length} gastos que você anotou`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-[#1B3A52] text-lg mb-4">O que você quer fazer agora?</h3>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isLocked = action.premium && !isPremium;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="group"
                onClick={() => handleQuickAction(action)}
              >
                <Card className={`cursor-pointer hover:shadow-aury transition-all border border-slate-200 hover:border-[#5FBDBD]/50 bg-white relative ${isLocked ? 'opacity-80' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 bg-gradient-to-br ${isLocked ? 'from-slate-200 to-slate-300' : action.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                      {isLocked ? <Lock className="w-7 h-7 text-slate-400" /> : <Icon className="w-7 h-7 text-white" />}
                    </div>
                    <p className="font-semibold text-[#1B3A52] text-sm">{action.label}</p>
                    {isLocked && <Crown className="w-3.5 h-3.5 text-amber-500 mx-auto mt-1" />}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Expense Dialog */}
      <Dialog open={quickActionDialog === "expense"} onOpenChange={() => setQuickActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Registrar Gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Almoço"
                value={quickFormData.description}
                onChange={(e) => setQuickFormData({ ...quickFormData, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={quickFormData.amount}
                  onChange={(e) => setQuickFormData({ ...quickFormData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={quickFormData.date}
                  onChange={(e) => setQuickFormData({ ...quickFormData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={quickFormData.category}
                onValueChange={(value) => setQuickFormData({ ...quickFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Gastos Fixos</SelectItem>
                  <SelectItem value="essential">Essenciais</SelectItem>
                  <SelectItem value="superfluous">Supérfluos</SelectItem>
                  <SelectItem value="emergency">Reserva</SelectItem>
                  <SelectItem value="investment">Investimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickActionDialog(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-rose-500 to-red-500">
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature={upgradeFeature} />

      {/* Quick Income Dialog */}
      <Dialog open={quickActionDialog === "income"} onOpenChange={() => setQuickActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Adicionar Renda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Salário, Freelance"
                value={quickFormData.description}
                onChange={(e) => setQuickFormData({ ...quickFormData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={quickFormData.amount}
                onChange={(e) => setQuickFormData({ ...quickFormData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={quickFormData.type}
                onValueChange={(value) => setQuickFormData({ ...quickFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salário</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                  <SelectItem value="rental">Aluguel</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickActionDialog(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
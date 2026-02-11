import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Plus,
  Wallet,
  TrendingDown,
  TrendingUp,
  Shield,
  Target,
  ChevronRight,
  Info,
  Heart,
  PieChart,
  BarChart3,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProfileSelector from "@/components/onboarding/ProfileSelector";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const PROFILE_DISTRIBUTIONS = {
  essential: {
    fixed_percentage: 50,
    essential_percentage: 25,
    superfluous_percentage: 15,
    emergency_percentage: 7,
    investment_percentage: 3
  },
  balanced: {
    fixed_percentage: 50,
    essential_percentage: 20,
    superfluous_percentage: 15,
    emergency_percentage: 10,
    investment_percentage: 5
  },
  focused: {
    fixed_percentage: 50,
    essential_percentage: 15,
    superfluous_percentage: 10,
    emergency_percentage: 15,
    investment_percentage: 10
  }
};

export default function Dashboard() {
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const { data: settings = null, isLoading: settingsLoading } = useQuery({
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
      setShowProfileSelector(false);
    }
  });

  const createSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.UserSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setShowProfileSelector(false);
    }
  });

  // Show profile selector if no settings exist
  useEffect(() => {
    if (!settingsLoading && !settings) {
      const hasSelectedProfile = localStorage.getItem("rendy_profile_selected");
      if (!hasSelectedProfile) {
        setShowProfileSelector(true);
      }
    }
  }, [settings, settingsLoading]);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.filter({ is_completed: false })
  });

  // Fetch historical data for trends (last 6 months)
  const { data: historicalExpenses = [] } = useQuery({
    queryKey: ['historical-expenses'],
    queryFn: async () => {
      const expenses = await base44.entities.Expense.list();
      return expenses;
    }
  });

  // Calculate totals
  const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  const expensesByCategory = {
    fixed: expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + (e.amount || 0), 0),
    essential: expenses.filter(e => e.category === 'essential').reduce((s, e) => s + (e.amount || 0), 0),
    superfluous: expenses.filter(e => e.category === 'superfluous').reduce((s, e) => s + (e.amount || 0), 0),
    emergency: expenses.filter(e => e.category === 'emergency').reduce((s, e) => s + (e.amount || 0), 0),
    investment: expenses.filter(e => e.category === 'investment').reduce((s, e) => s + (e.amount || 0), 0)
  };

  // Default percentages
  const defaultSettings = {
    fixed_percentage: 50,
    essential_percentage: 15,
    superfluous_percentage: 10,
    emergency_percentage: 15,
    investment_percentage: 10,
    current_emergency_fund: 0,
    emergency_fund_goal_months: 6
  };

  const currentSettings = settings || defaultSettings;

  // Calculate total contributed to emergency fund from expenses
  const emergencyFundContributions = expensesByCategory.emergency;
  const totalEmergencyFund = (currentSettings.current_emergency_fund || 0) + emergencyFundContributions;

  const handleProfileSelect = async (profileId) => {
    localStorage.setItem("rendy_profile_selected", profileId);
    const distribution = PROFILE_DISTRIBUTIONS[profileId];
    
    const data = {
      risk_profile: profileId,
      ...distribution,
      emergency_fund_goal_months: 6,
      current_emergency_fund: currentSettings.current_emergency_fund || 0,
      notifications_enabled: true
    };

    if (settings) {
      updateSettingsMutation.mutate({ id: settings.id, data });
    } else {
      createSettingsMutation.mutate(data);
    }
  };

  // Calculate limits based on income and percentages
  const limits = {
    fixed: totalIncome * (currentSettings.fixed_percentage / 100),
    superfluous: totalIncome * (currentSettings.superfluous_percentage / 100),
    emergency: totalIncome * (currentSettings.emergency_percentage / 100)
  };

  // Calculate available for the month
  const totalSpent = totalExpenses;
  const availableBalance = totalIncome - totalSpent;
  const spentPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;

  // Emergency fund progress
  const emergencyGoal = expensesByCategory.fixed * currentSettings.emergency_fund_goal_months;
  const emergencyProgress = emergencyGoal > 0 
    ? Math.min((totalEmergencyFund / emergencyGoal) * 100, 100) 
    : 0;

  // Get profile info
  const getProfileInfo = () => {
    const profiles = {
      essential: { name: "Essencial", emoji: "🛡️", color: "from-[#1B3A52] to-[#0A2540]", savings: "~10%" },
      balanced: { name: "Equilibrado", emoji: "⚖️", color: "from-[#5FBDBD] to-[#4FA9A5]", savings: "~15%" },
      focused: { name: "Focado", emoji: "⚡", color: "from-[#4FA9A5] to-[#1B3A52]", savings: "~25%" }
    };
    return profiles[currentSettings.risk_profile] || profiles.balanced;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Cálculo do Índice de Tranquilidade Financeira (0-100)
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
    if (tranquilityIndex >= 70) return { label: "Tranquilo", color: "from-green-500 to-green-600", bgColor: "bg-green-50" };
    if (tranquilityIndex >= 40) return { label: "Atenção", color: "from-[#1B3A52] to-[#0A2540]", bgColor: "bg-[#1B3A52]/10" };
    return { label: "Risco", color: "from-red-500 to-red-600", bgColor: "bg-red-50" };
  };

  const tranquilityStatus = getTranquilityStatus();

  const profileInfo = getProfileInfo();

  // Prepare data for charts - Aury color palette
  const categoryData = [
    { name: "Fixos", value: expensesByCategory.fixed, color: "#1B3A52" },
    { name: "Essenciais", value: expensesByCategory.essential, color: "#5FBDBD" },
    { name: "Supérfluos", value: expensesByCategory.superfluous, color: "#7FCFCF" },
    { name: "Emergência", value: expensesByCategory.emergency, color: "#4FA9A5" },
    { name: "Investimentos", value: expensesByCategory.investment, color: "#2A4A62" }
  ].filter(item => item.value > 0);

  // Income vs Expenses over time (last 6 months)
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  };

  const monthlyTrends = getLast6Months().map(monthYear => {
    const monthExpenses = historicalExpenses
      .filter(e => e.month_year === monthYear)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const monthLabel = new Date(monthYear + "-01").toLocaleDateString('pt-BR', { 
      month: 'short' 
    }).replace('.', '');

    return {
      month: monthLabel,
      receitas: totalIncome,
      despesas: monthExpenses,
      saldo: totalIncome - monthExpenses
    };
  });

  // Net Worth calculation
  const netWorth = totalIncome - totalExpenses + totalEmergencyFund + 
    goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);

  // Goals progress data
  const goalsProgressData = goals.slice(0, 5).map(goal => ({
    name: goal.title.length > 20 ? goal.title.substring(0, 20) + '...' : goal.title,
    progress: goal.target_amount > 0 
      ? Math.round((goal.current_amount / goal.target_amount) * 100) 
      : 0,
    current: goal.current_amount,
    target: goal.target_amount
  }));

  // Show profile selector overlay
  if (showProfileSelector) {
    return <ProfileSelector onSelect={handleProfileSelect} />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-[#1B3A52]">Sua Saúde Financeira</h1>
        <p className="text-slate-600 mt-1">Um panorama do que importa</p>
      </div>

      {/* Tranquilidade Financeira */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${tranquilityStatus.color} text-white shadow-xl`}
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

      {/* Profile Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setShowProfileSelector(true)}
          className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${profileInfo.color} text-white font-medium shadow-lg hover:shadow-xl transition-all group`}
        >
          <span className="text-2xl">{profileInfo.emoji}</span>
          <div className="text-left">
            <p className="text-sm opacity-90">Seu perfil</p>
            <p className="font-semibold">{profileInfo.name} {profileInfo.savings}</p>
          </div>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-3xl p-8 text-white shadow-xl"
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
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {/* Progress bar */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to={createPageUrl("Expenses")}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Plus className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-semibold text-slate-800">Novo Gasto</h3>
            </div>
            <p className="text-sm text-slate-500">Anotar um gasto</p>
          </motion.div>
        </Link>

        <Link to={createPageUrl("Incomes")}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-800">Nova Renda</h3>
            </div>
            <p className="text-sm text-slate-500">Registrar entrada</p>
          </motion.div>
        </Link>
      </div>

      {/* Emergency Fund */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Reserva de Emergência</h3>
              <p className="text-sm text-slate-500">
                {formatCurrency(totalEmergencyFund)} de {formatCurrency(emergencyGoal)}
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-600">
            {emergencyProgress.toFixed(0)}%
          </span>
        </div>
        <Progress value={emergencyProgress} className="h-2" />
      </motion.div>

      {/* Goals Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Suas Metas</h3>
          </div>
          <Link to={createPageUrl("Goals")}>
            <Button variant="ghost" size="sm" className="text-[#5FBDBD] hover:text-[#4FA9A5]">
              Ver todas
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          {goals.length === 0 
            ? "Nenhuma meta ainda. Que tal começar?"
            : `${goals.length} ${goals.length === 1 ? 'meta em andamento' : 'metas em andamento'}`
          }
        </p>
      </motion.div>

      {/* Net Worth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-[#5FBDBD] bg-gradient-to-br from-white to-[#5FBDBD]/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#5FBDBD]/10 rounded-xl">
                  <DollarSign className="w-5 h-5 text-[#5FBDBD]" />
                </div>
                <div>
                  <CardTitle className="text-[#1B3A52]">Patrimônio Líquido</CardTitle>
                  <CardDescription>Saldo + Reservas + Metas</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#1B3A52]">
                  {formatCurrency(netWorth)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {netWorth >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3 h-3" /> Positivo
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1 justify-end">
                      <TrendingDown className="w-3 h-3" /> Negativo
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#5FBDBD]" />
                <CardTitle className="text-[#1B3A52]">Gastos por Categoria</CardTitle>
              </div>
              <CardDescription>Para onde seu dinheiro está indo</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 truncate">{item.name}</p>
                          <p className="text-sm font-semibold text-[#1B3A52]">
                            {formatCurrency(item.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Ainda sem gastos este mês</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Income vs Expenses Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#5FBDBD]" />
                <CardTitle className="text-[#1B3A52]">Receitas vs Despesas</CardTitle>
              </div>
              <CardDescription>Como você está se saindo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receitas" 
                    name="Receitas"
                    stroke="#4FA9A5" 
                    strokeWidth={3}
                    dot={{ fill: '#4FA9A5', r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="despesas" 
                    name="Despesas"
                    stroke="#1B3A52" 
                    strokeWidth={3}
                    dot={{ fill: '#1B3A52', r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Saldo"
                    stroke="#5FBDBD" 
                    strokeWidth={3}
                    dot={{ fill: '#5FBDBD', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goals Progress Chart */}
      {goalsProgressData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#5FBDBD]" />
                <CardTitle className="text-[#1B3A52]">Progresso das Metas</CardTitle>
              </div>
              <CardDescription>O que você está construindo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goalsProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'progress') return `${value}%`;
                      return formatCurrency(value);
                    }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="#5FBDBD"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid gap-2">
                {goalsProgressData.map((goal, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">{goal.name}</span>
                    <span className="font-semibold text-[#1B3A52]">
                      {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Banner */}
      {totalIncome === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Por onde começar?</h4>
              <p className="text-sm text-blue-600">
                Adicione sua renda primeiro. Não precisa ser exato, a gente ajusta junto depois.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
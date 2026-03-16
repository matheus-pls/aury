import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Sparkles, Shield, Target, TrendingUp, Wallet, Receipt,
  ChevronRight, AlertCircle, TrendingDown, Info, Heart,
  FileText, Plus, DollarSign, PieChart, BarChart3, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Crown } from "lucide-react";
import { toast } from "sonner";
import UpgradeModal from "@/components/UpgradeModal";
import PremiumBadge from "@/components/PremiumBadge";
import PullToRefresh from "@/components/PullToRefresh";

const PROFILE_DISTRIBUTIONS = {
  essential: { fixed_percentage: 50, essential_percentage: 25, superfluous_percentage: 15, emergency_percentage: 7, investment_percentage: 3 },
  balanced:  { fixed_percentage: 50, essential_percentage: 20, superfluous_percentage: 15, emergency_percentage: 10, investment_percentage: 5 },
  focused:   { fixed_percentage: 50, essential_percentage: 15, superfluous_percentage: 10, emergency_percentage: 15, investment_percentage: 10 }
};

export default function Overview() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [quickActionDialog, setQuickActionDialog] = useState(null);
  const [quickFormData, setQuickFormData] = useState({
    description: "", amount: "", category: "essential",
    date: new Date().toISOString().slice(0, 10), type: "salary"
  });

  const isPremium = true;

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

  const { data: historicalExpenses = [] } = useQuery({
    queryKey: ['historical-expenses'],
    queryFn: () => base44.entities.Expense.list()
  });

  // Redirect to DailyCheckIn if not done today
  useEffect(() => {
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

  const currentSettings = settings || { fixed_percentage: 50, essential_percentage: 15, superfluous_percentage: 10, emergency_percentage: 15, investment_percentage: 10, current_emergency_fund: 0, emergency_fund_goal_months: 6 };
  const expensesByCategory = {
    fixed:       expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + (e.amount || 0), 0),
    essential:   expenses.filter(e => e.category === 'essential').reduce((s, e) => s + (e.amount || 0), 0),
    superfluous: expenses.filter(e => e.category === 'superfluous').reduce((s, e) => s + (e.amount || 0), 0),
    emergency:   expenses.filter(e => e.category === 'emergency').reduce((s, e) => s + (e.amount || 0), 0),
    investment:  expenses.filter(e => e.category === 'investment').reduce((s, e) => s + (e.amount || 0), 0),
  };

  const emergencyGoal = expensesByCategory.fixed * (currentSettings.emergency_fund_goal_months || 6);
  const totalEmergencyFund = (currentSettings.current_emergency_fund || 0) + expensesByCategory.emergency;
  const emergencyProgress = emergencyGoal > 0 ? Math.min((totalEmergencyFund / emergencyGoal) * 100, 100) : 0;

  const netWorth = totalIncome - totalExpenses + totalEmergencyFund + goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);

  const calculateTranquilityIndex = () => {
    let score = 0;
    score += Math.min(emergencyProgress, 100) * 0.4;
    if (spentPercentage <= 70) score += 40;
    else if (spentPercentage <= 85) score += 25;
    else if (spentPercentage <= 100) score += 15;
    if (availableBalance > 0) score += Math.min((availableBalance / Math.max(totalIncome, 1)) * 100, 20);
    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const tranquilityIndex = calculateTranquilityIndex();
  const getTranquilityStatus = () => {
    if (tranquilityIndex >= 70) return { label: "Tranquilo", color: "from-green-500 to-green-600" };
    if (tranquilityIndex >= 40) return { label: "Atenção",   color: "from-[#1B3A52] to-[#0A2540]" };
    return { label: "Risco", color: "from-red-500 to-red-600" };
  };
  const tranquilityStatus = getTranquilityStatus();

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Charts data
  const categoryData = [
    { name: "Fixos",        value: expensesByCategory.fixed,       color: "#1B3A52" },
    { name: "Essenciais",   value: expensesByCategory.essential,   color: "#5FBDBD" },
    { name: "Supérfluos",   value: expensesByCategory.superfluous, color: "#7FCFCF" },
    { name: "Emergência",   value: expensesByCategory.emergency,   color: "#4FA9A5" },
    { name: "Investimentos",value: expensesByCategory.investment,  color: "#2A4A62" }
  ].filter(i => i.value > 0);

  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  };

  const monthlyTrends = getLast6Months().map(my => {
    const monthExpenses = historicalExpenses.filter(e => e.month_year === my).reduce((s, e) => s + (e.amount || 0), 0);
    const monthLabel = new Date(my + "-01").toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    return { month: monthLabel, receitas: totalIncome, despesas: monthExpenses, saldo: totalIncome - monthExpenses };
  });

  const goalsProgressData = goals.slice(0, 5).map(g => ({
    name: g.title.length > 20 ? g.title.substring(0, 20) + '...' : g.title,
    progress: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
    current: g.current_amount, target: g.target_amount
  }));

  // Quick Actions
  const quickActions = [
    { label: "Registrar Gasto", icon: Receipt,    action: "expense", color: "from-[#5FBDBD] to-[#4FA9A5]" },
    { label: "Adicionar Renda", icon: TrendingUp,  action: "income",  color: "from-[#2A4A62] to-[#1B3A52]" },
    { label: "Criar Meta",      icon: Target,      action: "goal",    color: "from-[#1B3A52] to-[#0A2540]" },
    { label: "Ver Análises",    icon: Sparkles,    page: "Analysis",  color: "from-[#5FBDBD] to-[#2A4A62]", premium: true },
    { label: "Resumo Mensal",   icon: FileText,    page: "MonthlyReport", color: "from-[#4FA9A5] to-[#1B3A52]" }
  ];

  const handleQuickAction = (action) => {
    if (action.premium && !isPremium) { setUpgradeFeature(action.label); setShowUpgradeModal(true); return; }
    if (action.page) { window.location.href = createPageUrl(action.page); }
    else if (action.action === "goal") { window.location.href = createPageUrl("Goals"); }
    else { setQuickActionDialog(action.action); }
  };

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); toast.success("Gasto registrado!"); setQuickActionDialog(null); setQuickFormData({ description: "", amount: "", category: "essential", date: new Date().toISOString().slice(0, 10), type: "salary" }); }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['incomes']); toast.success("Renda adicionada!"); setQuickActionDialog(null); setQuickFormData({ description: "", amount: "", category: "essential", date: new Date().toISOString().slice(0, 10), type: "salary" }); }
  });

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (quickActionDialog === "expense") {
      createExpenseMutation.mutate({ ...quickFormData, amount: parseFloat(quickFormData.amount), month_year: quickFormData.date.slice(0, 7) });
    } else if (quickActionDialog === "income") {
      createIncomeMutation.mutate({ description: quickFormData.description, amount: parseFloat(quickFormData.amount), type: quickFormData.type, is_active: true });
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">Como está seu mês agora?</h1>
        <p className="text-muted-foreground mt-1">Aqui você vê se está no controle ou precisa ajustar</p>
      </div>

      {/* Método Aury */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.03 }}>
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-2xl border border-[#5FBDBD]/20">
          <div className="w-10 h-10 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm">Método Aury</h3>
            <p className="text-xs text-muted-foreground">Segurança • Clareza • Ação</p>
          </div>
        </div>
      </motion.div>

      {/* Tranquilidade Financeira */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${tranquilityStatus.color} text-white shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-white/90" />
          <p className="text-white/80 text-xs font-medium">Você está aqui</p>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-4xl font-bold">{tranquilityIndex}</h2>
          <span className="text-lg font-light text-white/80">/100</span>
          <span className="ml-2 text-sm font-semibold px-3 py-1 rounded-full bg-white/20">{tranquilityStatus.label}</span>
        </div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-3xl p-8 text-white shadow-xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm mb-2">
              {availableBalance > 0 ? "Sobrou esse mês" : availableBalance < 0 ? "Você passou do limite" : "Está no zero a zero"}
            </p>
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
            <span>
              {spentPercentage <= 70 ? "Você está indo bem" : spentPercentage <= 90 ? "Já gastou bastante" : spentPercentage <= 100 ? "Cuidado, tá no limite" : "Passou do que entrou"}
            </span>
            <span className="font-semibold">{spentPercentage.toFixed(0)}% gasto</span>
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

      {/* Emergency Fund */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Reserva de Emergência</h3>
              <p className="text-sm text-muted-foreground">
                {emergencyProgress < 30 ? "Ainda tá começando" : emergencyProgress < 70 ? "Você já tem uma base" : emergencyProgress < 100 ? "Tá quase lá!" : "Você está protegido"}
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{emergencyProgress.toFixed(0)}%</span>
        </div>
        <Progress value={emergencyProgress} className="h-2" />
      </motion.div>

      {/* Goals Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-foreground">Suas Metas</h3>
          </div>
          <Link to={createPageUrl("Goals")}>
            <Button variant="ghost" size="sm" className="text-[#5FBDBD] hover:text-[#4FA9A5]">
              Ver todas <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {goals.length === 0 ? "Você ainda não definiu nenhum sonho pra ir atrás"
            : goals.length === 1 ? "Você tem 1 objetivo que está construindo"
            : `Você tá correndo atrás de ${goals.length} coisas ao mesmo tempo`}
        </p>
      </motion.div>

      {/* Net Worth */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-[#5FBDBD] bg-gradient-to-br from-card to-[#5FBDBD]/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#5FBDBD]/10 rounded-xl">
                  <DollarSign className="w-5 h-5 text-[#5FBDBD]" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Patrimônio Líquido</CardTitle>
                  <CardDescription>Saldo + Reservas + Metas</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{formatCurrency(netWorth)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {netWorth >= 0
                    ? <span className="text-green-500 flex items-center gap-1 justify-end"><TrendingUp className="w-3 h-3" /> Positivo</span>
                    : <span className="text-red-500 flex items-center gap-1 justify-end"><TrendingDown className="w-3 h-3" /> Negativo</span>}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#5FBDBD]" />
                <CardTitle className="text-foreground">Gastos por Categoria</CardTitle>
              </div>
              <CardDescription>Pra onde seu dinheiro foi esse mês</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <RechartsPieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                          <p className="text-sm font-bold text-foreground">{formatCurrency(item.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-56 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Ainda sem gastos este mês</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#5FBDBD]" />
                <CardTitle className="text-foreground">Receitas vs Despesas</CardTitle>
              </div>
              <CardDescription>Você está gastando mais ou menos que antes?</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#4FA9A5" strokeWidth={3} dot={{ fill: '#4FA9A5', r: 4 }} />
                  <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#1B3A52" strokeWidth={3} dot={{ fill: '#1B3A52', r: 4 }} />
                  <Line type="monotone" dataKey="saldo"    name="Saldo"    stroke="#5FBDBD" strokeWidth={3} dot={{ fill: '#5FBDBD', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goals Progress Chart */}
      {goalsProgressData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#5FBDBD]" />
                <CardTitle className="text-foreground">Progresso das Metas</CardTitle>
              </div>
              <CardDescription>Seus sonhos tão chegando?</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={goalsProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-foreground mb-1">{d.name}</p>
                          <p className="text-sm text-muted-foreground">Progresso: <span className="font-bold text-[#5FBDBD]">{d.progress}%</span></p>
                          <p className="text-sm text-muted-foreground">Economizado: <span className="font-bold text-foreground">{formatCurrency(d.current)}</span></p>
                          <p className="text-sm text-muted-foreground">Meta: <span className="font-semibold text-foreground">{formatCurrency(d.target)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="progress" fill="#5FBDBD" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* O que você quer fazer agora? */}
      <div>
        <h3 className="font-semibold text-foreground text-lg mb-4">O que você quer fazer agora?</h3>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isLocked = action.premium && !isPremium;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="group"
                onClick={() => handleQuickAction(action)}
              >
                <Card className={`cursor-pointer hover:shadow-lg transition-all border border-border hover:border-[#5FBDBD]/50 bg-card relative ${isLocked ? 'opacity-80' : ''}`}>
                  <CardContent className="p-5 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${isLocked ? 'from-muted to-muted' : action.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                      {isLocked ? <Lock className="w-6 h-6 text-muted-foreground" /> : <Icon className="w-6 h-6 text-white" />}
                    </div>
                    <p className="font-semibold text-foreground text-xs">{action.label}</p>
                    {isLocked && <Crown className="w-3 h-3 text-amber-500 mx-auto mt-1" />}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info Banner */}
      {totalIncome === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-400 mb-1">Vamos começar do começo</h4>
              <p className="text-sm text-blue-400/80">Primeiro me conta: quanto entra por mês? Não precisa ser exato, depois a gente ajusta.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Expense Dialog */}
      <Dialog open={quickActionDialog === "expense"} onOpenChange={() => setQuickActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
          <form onSubmit={handleQuickSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Almoço" value={quickFormData.description} onChange={(e) => setQuickFormData({ ...quickFormData, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={quickFormData.amount} onChange={(e) => setQuickFormData({ ...quickFormData, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={quickFormData.date} onChange={(e) => setQuickFormData({ ...quickFormData, date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={quickFormData.category} onValueChange={(v) => setQuickFormData({ ...quickFormData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickActionDialog(null)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-rose-500 to-red-500" disabled={createExpenseMutation.isPending}>Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Income Dialog */}
      <Dialog open={quickActionDialog === "income"} onOpenChange={() => setQuickActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adicionar Renda</DialogTitle></DialogHeader>
          <form onSubmit={handleQuickSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Salário, Freelance" value={quickFormData.description} onChange={(e) => setQuickFormData({ ...quickFormData, description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={quickFormData.amount} onChange={(e) => setQuickFormData({ ...quickFormData, amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={quickFormData.type} onValueChange={(v) => setQuickFormData({ ...quickFormData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickActionDialog(null)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500" disabled={createIncomeMutation.isPending}>Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature={upgradeFeature} />
    </div>
    </PullToRefresh>
  );
}
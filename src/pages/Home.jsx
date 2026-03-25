import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, Heart,
  PieChart, Plus, Receipt, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import PullToRefresh from "@/components/PullToRefresh";
import { usePremium } from "@/lib/PremiumContext";
import { useAuth } from "@/lib/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import SmartAlert from "@/components/home/SmartAlert";
import MonthProgress from "@/components/home/MonthProgress";
import RecentTransactions from "@/components/home/RecentTransactions";
import MicroInsights from "@/components/home/MicroInsights";
import PremiumPreview from "@/components/home/PremiumPreview";
import MonthSituationCard from "@/components/home/MonthSituationCard";

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Home() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const { isPremium } = usePremium();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { isLoading: isLoadingOnboarding, onboardingCompleted } = useOnboardingStatus();
  const navigate = useNavigate();

  const [quickDialog, setQuickDialog] = useState(null); // "expense" | "income"
  const [formData, setFormData] = useState({
    description: "", amount: "", category: "essential",
    date: new Date().toISOString().slice(0, 10), type: "salary"
  });

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [isAuthenticated, isLoadingAuth]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (isLoadingAuth || isLoadingOnboarding) return;
    if (isAuthenticated && !onboardingCompleted) {
      navigate(createPageUrl("Welcome"), { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingOnboarding, onboardingCompleted, navigate]);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    enabled: isAuthenticated,
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => base44.entities.Income.filter({ is_active: true }),
    enabled: isAuthenticated && onboardingCompleted,
  });

  const prevMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth }),
    enabled: isAuthenticated && onboardingCompleted,
  });

  const { data: prevExpenses = [] } = useQuery({
    queryKey: ["expenses", prevMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: prevMonth }),
    enabled: isAuthenticated && onboardingCompleted,
  });

  const allExpenses = [...expenses, ...prevExpenses];

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const r = await base44.entities.UserSettings.list();
      return r[0] || null;
    },
    enabled: isAuthenticated && onboardingCompleted,
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Gasto registrado!");
      setQuickDialog(null);
      setFormData({ description: "", amount: "", category: "essential", date: new Date().toISOString().slice(0, 10), type: "salary" });
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast.success("Renda adicionada!");
      setQuickDialog(null);
      setFormData({ description: "", amount: "", category: "essential", date: new Date().toISOString().slice(0, 10), type: "salary" });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quickDialog === "expense") {
      createExpenseMutation.mutate({ ...formData, amount: parseFloat(formData.amount), month_year: formData.date.slice(0, 7) });
    } else {
      createIncomeMutation.mutate({ description: formData.description, amount: parseFloat(formData.amount), type: formData.type, is_active: true });
    }
  };

  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalIncome - totalExpenses;
  const spentPct = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const expensesByCategory = {
    fixed:       expenses.filter(e => e.category === "fixed").reduce((s, e) => s + e.amount, 0),
    essential:   expenses.filter(e => e.category === "essential").reduce((s, e) => s + e.amount, 0),
    superfluous: expenses.filter(e => e.category === "superfluous").reduce((s, e) => s + e.amount, 0),
    emergency:   expenses.filter(e => e.category === "emergency").reduce((s, e) => s + e.amount, 0),
    investment:  expenses.filter(e => e.category === "investment").reduce((s, e) => s + e.amount, 0),
  };

  const categoryData = [
    { name: "Fixos",        value: expensesByCategory.fixed,       color: "#1B3A52" },
    { name: "Essenciais",   value: expensesByCategory.essential,   color: "#5FBDBD" },
    { name: "Supérfluos",   value: expensesByCategory.superfluous, color: "#7FCFCF" },
    { name: "Emergência",   value: expensesByCategory.emergency,   color: "#4FA9A5" },
    { name: "Investimentos",value: expensesByCategory.investment,  color: "#2A4A62" },
  ].filter(i => i.value > 0);

  const currentSettings = settings || { emergency_fund_goal_months: 6, current_emergency_fund: 0 };
  const emergencyBase = expensesByCategory.fixed;
  const emergencyGoal = emergencyBase * (currentSettings.emergency_fund_goal_months || 6);
  const totalEmergency = (currentSettings.current_emergency_fund || 0) + expensesByCategory.emergency;
  const emergencyPct = emergencyGoal > 0 ? Math.min((totalEmergency / emergencyGoal) * 100, 100) : 0;

  // Tranquility index
  let score = 0;
  score += Math.min(emergencyPct, 100) * 0.4;
  if (spentPct <= 70) score += 40;
  else if (spentPct <= 85) score += 25;
  else if (spentPct <= 100) score += 15;
  if (balance > 0) score += Math.min((balance / Math.max(totalIncome, 1)) * 100, 20);
  const tranquilityIndex = Math.round(Math.max(0, Math.min(100, score)));
  const tranquilityStatus =
    tranquilityIndex >= 70 ? { label: "Tranquilo", color: "from-green-500 to-green-600" }
    : tranquilityIndex >= 40 ? { label: "Atenção", color: "from-[#1B3A52] to-[#0A2540]" }
    : { label: "Risco", color: "from-red-500 to-red-600" };

  const greeting = () => {
    const h = new Date().getHours();
    const name = user?.full_name?.split(" ")[0] || "";
    if (h < 12) return `Bom dia${name ? ", " + name : ""} ☀️`;
    if (h < 18) return `Boa tarde${name ? ", " + name : ""} 👋`;
    return `Boa noite${name ? ", " + name : ""} 🌙`;
  };

  const handleRefresh = async () => { await queryClient.invalidateQueries(); };

  // Show loading while checking auth/onboarding
  if (isLoadingAuth || isLoadingOnboarding) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#5FBDBD] rounded-full animate-spin" />
      </div>
    );
  }

  // Should not render if not authenticated or onboarding not done (redirects handled above)
  if (!isAuthenticated || !onboardingCompleted) return null;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6 pb-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">{greeting()}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </motion.div>

      {/* Tranquility */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className={`relative overflow-hidden rounded-2xl px-6 py-4 bg-gradient-to-br ${tranquilityStatus.color} text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-white/80" />
            <p className="text-white/80 text-xs font-medium">Índice de Tranquilidade</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{tranquilityIndex}</span>
            <span className="text-sm text-white/70">/100</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">{tranquilityStatus.label}</span>
          </div>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-3xl p-7 text-white shadow-xl"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-white/70 text-sm mb-1">
              {balance > 0 ? "Sobrou esse mês" : balance < 0 ? "Você passou do limite" : "No zero a zero"}
            </p>
            <h2 className="text-4xl font-bold tabular-nums">{formatCurrency(balance)}</h2>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20 mb-4">
          <div>
            <p className="text-white/60 text-xs mb-0.5">Entradas</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-0.5">Saídas</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-white/60 mb-1.5">
            <span>{spentPct <= 70 ? "Você está indo bem" : spentPct <= 100 ? "Atenção nos gastos" : "Passou do limite"}</span>
            <span className="font-semibold">{spentPct.toFixed(0)}% gasto</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spentPct, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${spentPct > 100 ? "bg-red-400" : "bg-white"}`}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setQuickDialog("expense")}
            className="h-12 bg-rose-500 hover:bg-rose-600 text-white gap-2 rounded-xl"
          >
            <Receipt className="w-4 h-4" /> Registrar Gasto
          </Button>
          <Button
            onClick={() => setQuickDialog("income")}
            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Adicionar Renda
          </Button>
        </div>
      </motion.div>

      {/* Category Distribution */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#5FBDBD]" />
              <CardTitle className="text-base">Gastos por Categoria</CardTitle>
            </div>
            <CardDescription>Para onde seu dinheiro foi esse mês</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
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
              <div className="h-40 flex items-center justify-center text-center">
                <div>
                  <PieChart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">Sem gastos registrados esse mês</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Emergency Fund Preview */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Shield className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Caixinha</p>
                  <p className="text-xs text-muted-foreground">
                    {emergencyPct < 30 ? "Ainda tá começando" : emergencyPct < 70 ? "Você já tem uma base" : emergencyPct < 100 ? "Quase lá!" : "Você está protegido!"}
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-600">{emergencyPct.toFixed(0)}%</span>
            </div>
            <Progress value={emergencyPct} className="h-1.5" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Alert */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <SmartAlert spentPct={spentPct} expensesByCategory={expensesByCategory} totalIncome={totalIncome} balance={balance} isPremium={isPremium} />
      </motion.div>

      {/* Month Progress */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <MonthProgress balance={balance} totalIncome={totalIncome} />
      </motion.div>

      {/* Micro Insights */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
        <MicroInsights expenses={allExpenses} totalIncome={totalIncome} />
      </motion.div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <RecentTransactions expenses={expenses} />
      </motion.div>

      {/* Premium Preview */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
        <PremiumPreview isPremium={isPremium} />
      </motion.div>

      {/* Info Banner for empty state */}
      {totalIncome === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-400 text-sm mb-1">Vamos começar!</p>
              <p className="text-xs text-blue-400/80">Registre sua renda mensal para eu te ajudar a organizar as finanças.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Expense Dialog */}
      <Dialog open={quickDialog === "expense"} onOpenChange={() => setQuickDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Almoço" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickDialog(null)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600" disabled={createExpenseMutation.isPending}>Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Income Dialog */}
      <Dialog open={quickDialog === "income"} onOpenChange={() => setQuickDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adicionar Renda</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Salário" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickDialog(null)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={createIncomeMutation.isPending}>Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
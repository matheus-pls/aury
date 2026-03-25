/**
 * EmergencyFundInline — wraps the full EmergencyFund page for inline use
 * inside NewPlanning. Hides the BackButton / page title since the tab bar
 * already provides context and navigation.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, TrendingUp, TrendingDown, Calendar,
  CheckCircle2, DollarSign, ChevronDown, ChevronUp,
  Target, Zap, Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function EmergencyFundInline() {
  const [showDetails, setShowDetails] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const currentMonth = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes', userId],
    queryFn: () => base44.entities.Income.filter({ is_active: true }),
    enabled: !!userId,
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', userId, currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth }),
    enabled: !!userId,
  });
  const { data: settings } = useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => { const r = await base44.entities.UserSettings.list(); return r[0] || null; },
    enabled: !!userId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      if (showAddDialog) toast.success("Valor adicionado à caixinha!");
      else if (showWithdrawDialog) toast.success("Valor retirado da caixinha");
      setShowAddDialog(false);
      setShowWithdrawDialog(false);
      setAddAmount("");
      setWithdrawAmount("");
      setWithdrawConfirm(false);
    }
  });

  const defaultSettings = { fixed_percentage: 50, essential_percentage: 20, superfluous_percentage: 15, emergency_percentage: 10, investment_percentage: 5, emergency_fund_goal_months: 6, current_emergency_fund: 0 };
  const s = settings || defaultSettings;

  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const fixedExpenses = expenses.filter(e => e.category === 'fixed').reduce((sum, e) => sum + (e.amount || 0), 0);
  const emergencyContributions = expenses.filter(e => e.category === 'emergency').reduce((sum, e) => sum + (e.amount || 0), 0);
  const emergencyGoalMonths = s.emergency_fund_goal_months || 6;
  const idealEmergencyFund = fixedExpenses * emergencyGoalMonths;
  const currentEmergencyFund = (s.current_emergency_fund || 0) + emergencyContributions;
  const remainingToGoal = Math.max(0, idealEmergencyFund - currentEmergencyFund);
  const progressPercentage = idealEmergencyFund > 0 ? Math.min((currentEmergencyFund / idealEmergencyFund) * 100, 100) : 0;
  const monthsOfSurvival = fixedExpenses > 0 ? currentEmergencyFund / fixedExpenses : 0;
  const monthlyContribution = totalIncome * (s.emergency_percentage / 100);
  const monthsToComplete = remainingToGoal > 0 && monthlyContribution > 0 ? Math.ceil(remainingToGoal / monthlyContribution) : 0;

  const getStatus = () => {
    if (progressPercentage >= 100) return { level: "Completa", gradient: "from-[#5FBDBD] via-[#4FA9A5] to-[#2A4A62]", icon: CheckCircle2, message: "Você construiu sua proteção. Essa reserva te dá tranquilidade." };
    if (progressPercentage >= 50) return { level: "Crescendo", gradient: "from-[#5FBDBD] to-[#4FA9A5]", icon: TrendingUp, message: "Você está no caminho certo. Continue nesse ritmo." };
    if (progressPercentage >= 25) return { level: "Começando", gradient: "from-[#4FA9A5] to-[#2A4A62]", icon: Shield, message: "Todo início conta. Cada quantia fortalece sua segurança." };
    return { level: "Em Construção", gradient: "from-[#2A4A62] to-[#1B3A52]", icon: Shield, message: "Sua caixinha está te esperando. Comece com o que puder." };
  };
  const status = getStatus();
  const StatusIcon = status.icon;

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  const fmtD = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleAdd = () => {
    if (!addAmount || parseFloat(addAmount) <= 0) return;
    const data = { ...s, current_emergency_fund: currentEmergencyFund + parseFloat(addAmount) };
    if (settings) updateSettingsMutation.mutate({ id: settings.id, data });
  };
  const handleWithdraw = () => {
    if (!withdrawConfirm || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    const data = { ...s, current_emergency_fund: Math.max(0, currentEmergencyFund - parseFloat(withdrawAmount)) };
    if (settings) updateSettingsMutation.mutate({ id: settings.id, data });
  };

  return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] shadow-md flex-1">
          <TrendingUp className="w-4 h-4 mr-2" />Adicionar
        </Button>
        <Button onClick={() => setShowWithdrawDialog(true)} variant="outline" className="flex-1">
          <TrendingDown className="w-4 h-4 mr-2" />Retirar
        </Button>
      </div>

      {/* Progress card */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${status.gradient} rounded-3xl p-7 text-white shadow-lg`}>
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-xs">Sua Caixinha</p>
                <p className="text-xl font-bold">{status.level}</p>
              </div>
            </div>
            <p className="text-3xl font-bold">{progressPercentage.toFixed(0)}%</p>
          </div>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <div>
                <p className="text-white/70 text-xs mb-0.5">Guardado</p>
                <p className="text-2xl font-bold tabular-nums">{fmt(currentEmergencyFund)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs mb-0.5">Meta</p>
                <p className="text-lg font-semibold tabular-nums">{fmt(idealEmergencyFund)}</p>
              </div>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-white/70 text-xs mt-1.5">{emergencyGoalMonths} meses de proteção</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-white/90 text-xs leading-relaxed">{status.message}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Proteção", value: `${monthsOfSurvival.toFixed(1)} meses`, icon: Clock },
          { label: "Falta", value: fmt(remainingToGoal), icon: Target },
          { label: "Para zerar", value: monthsToComplete > 0 ? `${monthsToComplete}m` : "✓", icon: Zap },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl p-4 border border-border text-center">
            <Icon className="w-4 h-4 text-[#5FBDBD] mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-foreground text-sm tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Details expandable */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button onClick={() => setShowDetails(!showDetails)} className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <span className="font-semibold text-foreground text-sm">Ver detalhes completos</span>
          {showDetails ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
              <div className="p-5 space-y-4 text-sm">
                <div className="space-y-2">
                  {[
                    ["Gastos fixos mensais", fmtD(fixedExpenses)],
                    ["Meta de cobertura", `${emergencyGoalMonths} meses`],
                    ["Reserva ideal", fmtD(idealEmergencyFund)],
                    ["Contribuição mensal", fmtD(monthlyContribution)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#5FBDBD]/10 border border-[#5FBDBD]/20 rounded-xl p-4">
                  <p className="text-xs text-[#5FBDBD] font-medium mb-1">💡 Onde guardar</p>
                  <p className="text-xs text-muted-foreground">CDB com liquidez diária, Tesouro Selic ou poupança são boas opções.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adicionar à Caixinha</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Caixinha atual</p>
              <p className="text-2xl font-bold tabular-nums">{fmt(currentEmergencyFund)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Valor do Aporte</Label>
              <Input type="number" placeholder="0,00" value={addAmount} onChange={e => setAddAmount(e.target.value)} autoFocus />
            </div>
            {addAmount && parseFloat(addAmount) > 0 && (
              <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
                <p className="text-xs text-emerald-400 mb-1">Nova caixinha</p>
                <p className="text-xl font-bold text-emerald-300 tabular-nums">{fmt(currentEmergencyFund + parseFloat(addAmount))}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button onClick={handleAdd} className="flex-1 bg-emerald-500 hover:bg-emerald-600" disabled={!addAmount || parseFloat(addAmount) <= 0 || updateSettingsMutation.isPending}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={(o) => { setShowWithdrawDialog(o); if (!o) { setWithdrawConfirm(false); setWithdrawAmount(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Retirar da Caixinha</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30 flex gap-2">
              <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/90">A caixinha é sua segurança. Tem certeza que deseja retirar?</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Caixinha atual</p>
              <p className="text-2xl font-bold tabular-nums">{fmt(currentEmergencyFund)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Valor a Retirar</Label>
              <Input type="number" placeholder="0,00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} autoFocus />
            </div>
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/30">
                <p className="text-xs text-rose-400 mb-1">Nova caixinha</p>
                <p className="text-xl font-bold text-rose-300 tabular-nums">{fmt(Math.max(0, currentEmergencyFund - parseFloat(withdrawAmount)))}</p>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input type="checkbox" id="wc" checked={withdrawConfirm} onChange={e => setWithdrawConfirm(e.target.checked)} className="w-4 h-4 rounded" />
              <Label htmlFor="wc" className="text-sm text-muted-foreground cursor-pointer">Confirmo que quero retirar</Label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowWithdrawDialog(false)}>Cancelar</Button>
              <Button onClick={handleWithdraw} className="flex-1 bg-rose-500 hover:bg-rose-600" disabled={!withdrawConfirm || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || updateSettingsMutation.isPending}>Retirar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
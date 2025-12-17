import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Plus,
  Wallet,
  TrendingDown,
  Shield,
  Target,
  ChevronRight,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProfileSelector from "@/components/onboarding/ProfileSelector";

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

  // Calculate total contributed to emergency fund from expenses
  const emergencyFundContributions = expensesByCategory.emergency;
  const totalEmergencyFund = (currentSettings.current_emergency_fund || 0) + emergencyFundContributions;

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
      essential: { name: "Essencial", emoji: "🛡️", color: "from-blue-500 to-blue-600", savings: "~10%" },
      balanced: { name: "Equilibrado", emoji: "⚖️", color: "from-[#00A8A0] to-[#008F88]", savings: "~15%" },
      focused: { name: "Focado", emoji: "⚡", color: "from-purple-500 to-purple-600", savings: "~25%" }
    };
    return profiles[currentSettings.risk_profile] || profiles.balanced;
  };

  const profileInfo = getProfileInfo();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Show profile selector overlay
  if (showProfileSelector) {
    return <ProfileSelector onSelect={handleProfileSelect} />;
  }

  return (
    <div className="space-y-6 pb-8">
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
            <p className="text-sm text-slate-500">Registrar uma despesa</p>
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
            <p className="text-sm text-slate-500">Adicionar fonte de renda</p>
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
            <Button variant="ghost" size="sm" className="text-[#00A8A0]">
              Ver todas
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          {goals.length === 0 
            ? "Você ainda não tem metas. Crie sua primeira meta!"
            : `${goals.length} ${goals.length === 1 ? 'meta ativa' : 'metas ativas'}`
          }
        </p>
      </motion.div>

      {/* Info Banner */}
      {totalIncome === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Comece cadastrando sua renda</h4>
              <p className="text-sm text-blue-600">
                Para aproveitar todos os recursos do Rendy, cadastre suas fontes de renda primeiro.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
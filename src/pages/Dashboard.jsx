import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Home, 
  ShoppingCart, 
  Sparkles, 
  Shield, 
  TrendingUp,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import QuickStats from "@/components/dashboard/QuickStats";
import CategoryCard from "@/components/dashboard/CategoryCard";
import DistributionChart from "@/components/dashboard/DistributionChart";
import AlertCard from "@/components/dashboard/AlertCard";
import EmergencyFundProgress from "@/components/dashboard/EmergencyFundProgress";
import HealthIndicator from "@/components/dashboard/HealthIndicator";

export default function Dashboard() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const { data: settings = null } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

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

  // Calculate limits based on income and percentages
  const limits = {
    fixed: totalIncome * (currentSettings.fixed_percentage / 100),
    essential: totalIncome * (currentSettings.essential_percentage / 100),
    superfluous: totalIncome * (currentSettings.superfluous_percentage / 100),
    emergency: totalIncome * (currentSettings.emergency_percentage / 100),
    investment: totalIncome * (currentSettings.investment_percentage / 100)
  };

  // Calculate suggested distribution
  const suggestedDistribution = {
    fixed: limits.fixed,
    essential: limits.essential,
    superfluous: limits.superfluous,
    emergency: limits.emergency,
    investment: limits.investment
  };

  // Generate alerts
  const generateAlerts = () => {
    const alerts = [];
    
    if (expensesByCategory.fixed > limits.fixed) {
      alerts.push({
        type: "danger",
        title: "Gastos fixos acima do limite",
        message: `Você gastou ${((expensesByCategory.fixed / limits.fixed - 1) * 100).toFixed(0)}% a mais do que o recomendado.`
      });
    }
    
    if (expensesByCategory.superfluous > limits.superfluous) {
      alerts.push({
        type: "warning",
        title: "Atenção com gastos supérfluos",
        message: "Considere reduzir gastos não essenciais este mês."
      });
    }
    
    if (totalExpenses > totalIncome) {
      alerts.push({
        type: "danger",
        title: "Gastos excedem a renda!",
        message: "Seus gastos totais ultrapassaram sua renda mensal."
      });
    }

    const emergencyGoal = expensesByCategory.fixed * currentSettings.emergency_fund_goal_months;
    if (currentSettings.current_emergency_fund < emergencyGoal * 0.5) {
      alerts.push({
        type: "warning",
        title: "Reserva de emergência baixa",
        message: "Priorize completar sua reserva de emergência."
      });
    }

    return alerts;
  };

  // Calculate health score
  const calculateHealthScore = () => {
    let score = 100;
    
    // Deduct points for over-budget categories
    if (expensesByCategory.fixed > limits.fixed) score -= 20;
    if (expensesByCategory.superfluous > limits.superfluous) score -= 15;
    if (totalExpenses > totalIncome) score -= 30;
    
    // Add points for good habits
    const emergencyGoal = expensesByCategory.fixed * currentSettings.emergency_fund_goal_months;
    if (currentSettings.current_emergency_fund >= emergencyGoal) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const getHealthStatus = () => {
    if (healthScore >= 80) return "excellent";
    if (healthScore >= 60) return "good";
    if (healthScore >= 40) return "warning";
    return "danger";
  };

  const stats = {
    totalIncome,
    totalExpenses,
    availableBalance: totalIncome - totalExpenses,
    emergencyFund: currentSettings.current_emergency_fund,
    expensesTrend: -5,
    emergencyProgress: ((currentSettings.current_emergency_fund / (expensesByCategory.fixed * 6)) * 100).toFixed(0)
  };

  const categoryCards = [
    { 
      title: "Gastos Fixos", 
      icon: Home, 
      current: expensesByCategory.fixed, 
      limit: limits.fixed,
      color: "text-[#0A1A3A]",
      bgColor: "bg-slate-100"
    },
    { 
      title: "Essenciais Variáveis", 
      icon: ShoppingCart, 
      current: expensesByCategory.essential, 
      limit: limits.essential,
      color: "text-[#00A8A0]",
      bgColor: "bg-[#00A8A0]/10"
    },
    { 
      title: "Supérfluos", 
      icon: Sparkles, 
      current: expensesByCategory.superfluous, 
      limit: limits.superfluous,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    { 
      title: "Investimentos", 
      icon: TrendingUp, 
      current: expensesByCategory.investment, 
      limit: limits.investment,
      color: "text-violet-500",
      bgColor: "bg-violet-50"
    }
  ];

  const formatCurrency = (value) => {
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
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Olá! 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Aqui está o resumo das suas finanças de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Categories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryCards.map((card, index) => (
              <CategoryCard key={index} {...card} />
            ))}
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistributionChart data={suggestedDistribution} type="suggested" />
            <DistributionChart data={expensesByCategory} type="current" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Health Score */}
          <HealthIndicator 
            score={healthScore} 
            label="Saúde Financeira" 
            status={getHealthStatus()} 
          />

          {/* Alerts */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertas</h3>
            <AlertCard alerts={generateAlerts()} />
          </div>

          {/* Emergency Fund */}
          <EmergencyFundProgress 
            current={currentSettings.current_emergency_fund}
            goal={expensesByCategory.fixed * currentSettings.emergency_fund_goal_months}
            monthlyFixed={expensesByCategory.fixed || limits.fixed}
          />

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#00A8A0] to-[#008F88] rounded-2xl p-5 text-white">
            <h3 className="text-lg font-semibold mb-3">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link 
                to={createPageUrl("Expenses")}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm">Adicionar gasto</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to={createPageUrl("Goals")}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm">Ver metas</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to={createPageUrl("Simulation")}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm">Simular cenários</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
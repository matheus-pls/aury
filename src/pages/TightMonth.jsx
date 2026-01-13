import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Calendar,
  Heart,
  Home,
  Utensils,
  Car,
  Activity,
  Sparkles,
  Coffee,
  ShoppingBag,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";

export default function TightMonth() {
  const [showDetails, setShowDetails] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const available = totalIncome - totalSpent;

  const expensesByCategory = {
    fixed: expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + e.amount, 0),
    essential: expenses.filter(e => e.category === 'essential').reduce((s, e) => s + e.amount, 0),
    superfluous: expenses.filter(e => e.category === 'superfluous').reduce((s, e) => s + e.amount, 0)
  };

  const unavoidableExpenses = expensesByCategory.fixed + expensesByCategory.essential;
  const reducibleExpenses = expensesByCategory.superfluous;
  const cuttableExpenses = expenses
    .filter(e => e.subcategory && ['streaming', 'delivery', 'impulso'].some(k => e.subcategory.toLowerCase().includes(k)))
    .reduce((s, e) => s + e.amount, 0);

  const weeklyLimit = available > 0 ? available / Math.ceil(daysRemaining / 7) : 0;
  const dailyLimit = available > 0 ? available / daysRemaining : 0;
  const emergencyReserve = totalIncome * 0.05;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const unavoidableItems = [
    { label: "Moradia", icon: Home, amount: expensesByCategory.fixed * 0.6 },
    { label: "Alimentação", icon: Utensils, amount: expensesByCategory.essential * 0.5 },
    { label: "Transporte", icon: Car, amount: expensesByCategory.essential * 0.3 },
    { label: "Saúde", icon: Activity, amount: expensesByCategory.essential * 0.2 }
  ];

  const reducibleItems = [
    { label: "Lazer", icon: Coffee, amount: reducibleExpenses * 0.4 },
    { label: "Delivery", icon: Utensils, amount: reducibleExpenses * 0.35 },
    { label: "Compras", icon: ShoppingBag, amount: reducibleExpenses * 0.25 }
  ];

  const cuttableItems = [
    { label: "Assinaturas", icon: Sparkles, savings: cuttableExpenses * 0.6 },
    { label: "Impulso", icon: Zap, savings: cuttableExpenses * 0.4 }
  ];

  const potentialSavings = reducibleExpenses * 0.4 + cuttableExpenses;

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Planning")} />
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Mês Apertado</h1>
            <p className="text-slate-500 text-sm">Esse mês é sobre equilíbrio, não perfeição</p>
          </div>
        </div>
      </motion.div>

      {/* Main Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] text-white shadow-aury"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5" />
            <p className="text-white/90 text-sm">Você está fazendo o melhor com o que tem</p>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-white/80 text-base mb-2">Você ainda tem</p>
            <h2 className="text-5xl font-bold mb-2 tabular-nums">{formatCurrency(available)}</h2>
            <p className="text-white/70 text-sm">para os próximos {daysRemaining} dias</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs mb-1">Por semana</p>
              <p className="text-xl font-bold tabular-nums">{formatCurrency(weeklyLimit)}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1">Por dia</p>
              <p className="text-xl font-bold tabular-nums">{formatCurrency(dailyLimit)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gentle Alert */}
      {available < emergencyReserve && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 mb-1">Esse gasto pode comprometer o mês</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Ainda dá tempo de ajustar. Se você reduzir {formatCurrency(potentialSavings * 0.5)} em gastos reduzíveis, passa o mês sem se endividar.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Classification Cards */}
      <div className="space-y-3">
        {/* Unavoidable */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1B3A52]" />
              Inadiáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#1B3A52] mb-3">{formatCurrency(unavoidableExpenses)}</p>
            <div className="space-y-2">
              {unavoidableItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reducible */}
        <Card className="border-amber-200 shadow-sm bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              Reduzíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-900 mb-3">{formatCurrency(reducibleExpenses)}</p>
            <div className="space-y-2">
              {reducibleItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-800">{item.label}</span>
                    </div>
                    <span className="font-semibold text-amber-900">{formatCurrency(item.amount)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs text-amber-700">
                💡 Se reduzir em 40%, economiza {formatCurrency(reducibleExpenses * 0.4)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cuttable */}
        {cuttableExpenses > 0 && (
          <Card className="border-rose-200 shadow-sm bg-rose-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-rose-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600" />
                Cortáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-900 mb-3">{formatCurrency(cuttableExpenses)}</p>
              <div className="space-y-2">
                {cuttableItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-rose-500" />
                        <span className="text-rose-800">{item.label}</span>
                      </div>
                      <span className="font-semibold text-rose-900">
                        Economiza {formatCurrency(item.savings)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Survival Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-[#1B3A52]">Plano de sobrevivência completo</span>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100"
            >
              <div className="p-6 space-y-5">
                <div className="bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl p-4 border border-[#5FBDBD]/20">
                  <h4 className="font-semibold text-[#1B3A52] mb-3">🎯 Objetivo do mês</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Não se endividar</li>
                    <li>• Pagar o essencial</li>
                    <li>• Atravessar o mês com dignidade</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💪 Vai passar</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Esse mês é atípico. Com ajustes simples nos gastos reduzíveis, 
                    você passa sem se endividar e mantém sua tranquilidade.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
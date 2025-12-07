import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Home, 
  ShoppingCart, 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Calculator,
  Settings,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import PremiumGate, { PremiumFeatureCard } from "@/components/PremiumGate";

const CATEGORY_CONFIG = {
  fixed: { name: "Gastos Fixos", color: "#0A1A3A", icon: Home },
  essential: { name: "Essenciais", color: "#00A8A0", icon: ShoppingCart },
  superfluous: { name: "Supérfluos", color: "#F59E0B", icon: Sparkles }
};

// Distribuição básica fixa da versão free
const BASIC_DISTRIBUTION = {
  fixed: 50,      // 50%
  essential: 20,  // 20%
  superfluous: 10, // 10%
  savings: 20     // 20% (reserva + investimentos agrupados)
};

export default function Dashboard() {
  const [premiumGateOpen, setPremiumGateOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: incomeData } = useQuery({
    queryKey: ['income'],
    queryFn: async () => {
      const result = await base44.entities.Income.list();
      return result[0] || null;
    }
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth })
  });

  const monthlyIncome = incomeData?.monthly_amount || 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Calcular gastos por categoria
  const expensesByCategory = {
    fixed: expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + (e.amount || 0), 0),
    essential: expenses.filter(e => e.category === 'essential').reduce((s, e) => s + (e.amount || 0), 0),
    superfluous: expenses.filter(e => e.category === 'superfluous').reduce((s, e) => s + (e.amount || 0), 0)
  };

  // Calcular limites baseado na distribuição fixa
  const limits = {
    fixed: monthlyIncome * (BASIC_DISTRIBUTION.fixed / 100),
    essential: monthlyIncome * (BASIC_DISTRIBUTION.essential / 100),
    superfluous: monthlyIncome * (BASIC_DISTRIBUTION.superfluous / 100),
    savings: monthlyIncome * (BASIC_DISTRIBUTION.savings / 100)
  };

  // Gerar alertas
  const alerts = [];
  if (expensesByCategory.fixed > limits.fixed) {
    alerts.push({
      type: "danger",
      message: `Gastos fixos ultrapassaram o limite recomendado de ${formatCurrency(limits.fixed)}`
    });
  }
  if (expensesByCategory.superfluous > limits.superfluous) {
    alerts.push({
      type: "warning",
      message: "Atenção com gastos supérfluos! Considere reduzir."
    });
  }
  if (totalExpenses > monthlyIncome * 0.9) {
    alerts.push({
      type: "warning",
      message: "Você já gastou mais de 90% da sua renda este mês."
    });
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Dados para o gráfico de pizza
  const chartData = [
    { name: 'Gastos Fixos', value: expensesByCategory.fixed, color: CATEGORY_CONFIG.fixed.color },
    { name: 'Essenciais', value: expensesByCategory.essential, color: CATEGORY_CONFIG.essential.color },
    { name: 'Supérfluos', value: expensesByCategory.superfluous, color: CATEGORY_CONFIG.superfluous.color },
    { name: 'Disponível', value: Math.max(0, monthlyIncome - totalExpenses), color: '#10B981' }
  ].filter(item => item.value > 0);

  const saldoDisponivel = monthlyIncome - totalExpenses;

  const premiumFeatures = [
    {
      title: "Metas Financeiras",
      description: "Crie metas e acompanhe seu progresso",
      icon: Target,
      benefits: [
        "Criar metas ilimitadas com prazos",
        "Acompanhar progresso em tempo real",
        "Sugestões automáticas de economia",
        "Notificações de conquistas"
      ]
    },
    {
      title: "Simulação Avançada",
      description: "Simule cenários e planeje o futuro",
      icon: Calculator,
      benefits: [
        "Simular novas rendas",
        "Testar redução de gastos",
        "Ver projeção de economia futura",
        "Gráficos de crescimento patrimonial"
      ]
    },
    {
      title: "Configurações Personalizadas",
      description: "Ajuste as porcentagens do seu jeito",
      icon: Settings,
      benefits: [
        "Personalizar distribuição da renda",
        "Criar categorias customizadas",
        "Definir perfil de risco",
        "Configurar reserva de emergência detalhada"
      ]
    }
  ];

  const openPremiumGate = (feature) => {
    setSelectedFeature(feature);
    setPremiumGateOpen(true);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-medium text-slate-800">{payload[0].name}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!incomeData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#00A8A0] to-[#008F88] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Bem-vindo ao Rendy!
          </h2>
          <p className="text-slate-600 mb-6">
            Vamos começar organizando suas finanças. Primeiro, cadastre sua renda mensal.
          </p>
          <Link to={createPageUrl("Income")}>
            <button className="px-6 py-3 bg-gradient-to-r from-[#00A8A0] to-[#008F88] text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Cadastrar Minha Renda
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
          Olá! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Veja o resumo das suas finanças de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
        >
          <p className="text-sm text-slate-500 mb-1">Renda do Mês</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlyIncome)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
        >
          <p className="text-sm text-slate-500 mb-1">Já Gastei</p>
          <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-white rounded-xl p-5 shadow-sm border ${
            saldoDisponivel >= 0 ? 'border-emerald-200' : 'border-red-200'
          }`}
        >
          <p className="text-sm text-slate-500 mb-1">Saldo Disponível</p>
          <p className={`text-2xl font-bold ${saldoDisponivel >= 0 ? 'text-[#00A8A0]' : 'text-red-500'}`}>
            {formatCurrency(saldoDisponivel)}
          </p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Distribuição da Renda
            </h3>
            
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Adicione gastos para ver a distribuição
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Quanto Você Pode Gastar
            </h3>
            
            <div className="space-y-5">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const spent = expensesByCategory[key];
                const limit = limits[key];
                const remaining = Math.max(0, limit - spent);
                const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                const isOverLimit = spent > limit;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                        <span className="text-sm font-medium text-slate-700">{config.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${isOverLimit ? 'text-red-500' : 'text-slate-600'}`}>
                        {formatCurrency(spent)} / {formatCurrency(limit)}
                      </span>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: isOverLimit ? '#EF4444' : config.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {isOverLimit 
                        ? `Você passou ${formatCurrency(spent - limit)} do limite` 
                        : `Restam ${formatCurrency(remaining)} disponíveis`
                      }
                    </p>
                  </div>
                );
              })}

              {/* Savings */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-slate-700">Reserva + Investimentos</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(limits.savings)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  20% da sua renda para construir patrimônio
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertas</h3>
            
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">Tudo certo!</p>
                  <p className="text-xs text-emerald-600">Continue assim</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      alert.type === 'danger' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                      alert.type === 'danger' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <p className={`text-sm ${
                      alert.type === 'danger' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-[#00A8A0] to-[#008F88] rounded-2xl p-5 text-white"
          >
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
                to={createPageUrl("Income")}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm">Atualizar renda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Premium Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-600 px-1">
              Recursos Premium
            </h3>
            {premiumFeatures.map((feature, index) => (
              <PremiumFeatureCard
                key={index}
                {...feature}
                onClick={() => openPremiumGate(feature)}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Premium Gate */}
      <PremiumGate
        isOpen={premiumGateOpen}
        onClose={() => setPremiumGateOpen(false)}
        feature={selectedFeature?.title}
        description={selectedFeature?.description}
        benefits={selectedFeature?.benefits}
      />
    </div>
  );
}
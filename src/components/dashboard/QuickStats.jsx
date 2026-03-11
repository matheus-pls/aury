import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

export default function QuickStats({ stats }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statItems = [
    {
      label: "Renda Total",
      value: stats.totalIncome,
      icon: Wallet,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      trend: null
    },
    {
      label: "Gastos do Mês",
      value: stats.totalExpenses,
      icon: TrendingDown,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
      trend: stats.expensesTrend
    },
    {
      label: "Saldo Disponível",
      value: stats.availableBalance,
      icon: TrendingUp,
      color: stats.availableBalance >= 0 ? "text-[#00A8A0]" : "text-red-500",
      bgColor: stats.availableBalance >= 0 ? "bg-[#00A8A0]/10" : "bg-red-50",
      trend: null
    },
    {
      label: "Reserva de Emergência",
      value: stats.emergencyFund,
      icon: PiggyBank,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      trend: stats.emergencyProgress
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl p-5 shadow-sm border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${item.bgColor}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              {item.trend !== null && (
                <span className={`text-xs font-medium ${item.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.trend >= 0 ? '+' : ''}{item.trend}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-xl font-bold ${item.color === "text-red-500" ? "text-red-500" : "text-foreground"}`}>
              {formatCurrency(item.value)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
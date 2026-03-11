import React from "react";
import { motion } from "framer-motion";
import { Shield, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function EmergencyFundProgress({ current, goal, monthlyFixed }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const monthsCovered = monthlyFixed > 0 ? Math.floor(current / monthlyFixed) : 0;
  const remaining = Math.max(goal - current, 0);

  const getStatusColor = () => {
    if (percentage >= 100) return "#00A8A0";
    if (percentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const getStatusText = () => {
    if (percentage >= 100) return "Meta atingida!";
    if (percentage >= 75) return "Quase lá!";
    if (percentage >= 50) return "Metade do caminho";
    if (percentage >= 25) return "Bom progresso";
    return "Comece a construir";
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Reserva de Emergência</h3>
            <p className="text-sm text-slate-500">Sua proteção financeira</p>
          </div>
        </div>
        <span 
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{ 
            backgroundColor: `${getStatusColor()}15`,
            color: getStatusColor()
          }}
        >
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Progresso</span>
            <span className="font-semibold" style={{ color: getStatusColor() }}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={percentage} className="h-3" />
            <div 
              className="absolute top-0 left-0 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: getStatusColor()
              }}
            />
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Atual</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(current)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Meta</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(goal)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Falta</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(remaining)}</p>
          </div>
        </div>

        {/* Months Covered */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-slate-600">Meses de despesas cobertos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600">{monthsCovered}</span>
            <span className="text-sm text-slate-500">/ 6 meses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
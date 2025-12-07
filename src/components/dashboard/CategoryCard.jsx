import React from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function CategoryCard({ 
  title, 
  icon: Icon, 
  current, 
  limit, 
  color, 
  bgColor 
}) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isOverLimit = current > limit;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isOverLimit ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-800 mb-3">
        {formatCurrency(current)}
      </p>
      
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className={`h-2 ${isOverLimit ? '[&>div]:bg-red-500' : ''}`}
          style={{
            '--progress-color': isOverLimit ? '#EF4444' : color.replace('text-', '')
          }}
        />
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Limite: {formatCurrency(limit)}</span>
          <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-slate-400'}>
            {isOverLimit ? `Excedido em ${formatCurrency(current - limit)}` : `Restam ${formatCurrency(limit - current)}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
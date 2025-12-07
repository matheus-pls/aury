import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function HealthIndicator({ score, label, status }) {
  const getStatusConfig = () => {
    switch (status) {
      case "excellent":
        return { color: "#00A8A0", icon: CheckCircle2, bg: "bg-emerald-50", text: "Excelente" };
      case "good":
        return { color: "#22C55E", icon: TrendingUp, bg: "bg-green-50", text: "Bom" };
      case "warning":
        return { color: "#F59E0B", icon: AlertTriangle, bg: "bg-amber-50", text: "Atenção" };
      case "danger":
        return { color: "#EF4444", icon: TrendingDown, bg: "bg-red-50", text: "Crítico" };
      default:
        return { color: "#64748B", icon: CheckCircle2, bg: "bg-slate-50", text: "Normal" };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`${config.bg} rounded-2xl p-6 relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" style={{ color: config.color }} />
            <span className="text-lg font-bold" style={{ color: config.color }}>
              {config.text}
            </span>
          </div>
        </div>
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke={config.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 35}
              initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
              animate={{ strokeDashoffset: (2 * Math.PI * 35) - (score / 100) * (2 * Math.PI * 35) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-700">{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
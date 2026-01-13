import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, AlertTriangle, TrendingUp, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DailyCheckIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch data
  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const allExpenses = await base44.entities.Expense.list();
      return allExpenses.filter(e => e.month_year === currentMonth);
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || {
        fixed_percentage: 50,
        essential_percentage: 15,
        superfluous_percentage: 10,
        emergency_percentage: 15,
        investment_percentage: 10,
        current_emergency_fund: 0,
        emergency_fund_goal_months: 6
      };
    }
  });

  // Calculations
  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalIncome - totalSpent;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay + 1;

  const canSpendToday = remaining > 0 ? remaining / daysRemaining : 0;
  const spendingPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;

  // Financial Status
  let status = {
    label: "Tranquilo",
    icon: Shield,
    color: "from-green-500 to-green-600",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    message: "Sua situação financeira está estável"
  };

  if (spendingPercentage > 85) {
    status = {
      label: "Risco",
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      message: "Atenção aos gastos deste mês"
    };
  } else if (spendingPercentage > 70) {
    status = {
      label: "Atenção",
      icon: TrendingUp,
      color: "from-yellow-500 to-yellow-600",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      message: "Fique atento ao seu orçamento"
    };
  }

  const StatusIcon = status.icon;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Save check-in timestamp in user settings
    try {
      if (settings?.id) {
        await base44.entities.UserSettings.update(settings.id, {
          ...settings,
          last_checkin_date: new Date().toISOString().split('T')[0]
        });
      } else {
        await base44.entities.UserSettings.create({
          ...settings,
          last_checkin_date: new Date().toISOString().split('T')[0]
        });
      }
      queryClient.invalidateQueries(['settings']);
      setTimeout(() => {
        navigate(createPageUrl("Overview"));
      }, 300);
    } catch (error) {
      setIsCompleting(false);
    }
  };

  const handleAuryFlow = () => {
    navigate(createPageUrl("Overview"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-block"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
              alt="Aury" 
              className="h-12 mx-auto mb-4"
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#1B3A52] mb-2">Bom dia! ☀️</h1>
          <p className="text-slate-500">Seu check-in financeiro de hoje</p>
        </div>

        {/* Main Card */}
        <Card className="border-2 border-slate-200 shadow-aury mb-6">
          <CardContent className="p-8">
            {/* Status */}
            <div className={`${status.bgColor} rounded-2xl p-6 mb-6`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${status.color} rounded-xl flex items-center justify-center shadow-md`}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Hoje você está:</p>
                  <p className={`text-lg font-bold ${status.textColor}`}>{status.label}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">{status.message}</p>
            </div>

            {/* Can Spend Today */}
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 mb-2">Você pode gastar hoje:</p>
              <motion.p
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-[#1B3A52]"
              >
                {formatCurrency(canSpendToday)}
              </motion.p>
              <p className="text-xs text-slate-400 mt-2">
                {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'} no mês
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleAuryFlow}
                className="w-full bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] text-white shadow-md h-12"
              >
                <Mic className="w-5 h-5 mr-2" />
                Registrar com Aury Flow
              </Button>
              
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-50"
              >
                {isCompleting ? "Carregando..." : "Continuar para o app"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Check-in diário • 10 segundos para clareza financeira
        </p>
      </motion.div>
    </div>
  );
}
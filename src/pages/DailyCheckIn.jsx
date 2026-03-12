import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, AlertTriangle, TrendingUp, ChevronLeft, Edit3, Receipt, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuryFlowInline from "@/components/overview/AuryFlowInline";

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

  // Financial Status - Intelligent logic
   let status = {
     label: "Tranquilo",
     icon: Shield,
     color: "from-green-500 to-green-600",
     textColor: "text-green-400",
     bgColor: "bg-green-500/10",
     borderColor: "border-green-500/30",
     message: "Tá tudo certo por aqui"
   };

   // Check if overspent (spent more than income)
   if (remaining < 0) {
     status = {
       label: "Risco",
       icon: AlertTriangle,
       color: "from-red-500 to-red-600",
       textColor: "text-red-400",
       bgColor: "bg-red-500/10",
       borderColor: "border-red-500/30",
       message: "Vamos ajustar isso juntos"
     };
   } else if (spendingPercentage > 85) {
     status = {
       label: "Risco",
       icon: AlertTriangle,
       color: "from-red-500 to-red-600",
       textColor: "text-red-400",
       bgColor: "bg-red-500/10",
       borderColor: "border-red-500/30",
       message: "Vamos com calma até o fim do mês"
     };
   } else if (spendingPercentage > 70) {
     status = {
       label: "Atenção",
       icon: TrendingUp,
       color: "from-[#1B3A52] to-[#0A2540]",
       textColor: "text-amber-400",
       bgColor: "bg-amber-500/10",
       borderColor: "border-amber-500/30",
       message: "Hora de ir com mais cuidado"
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
        navigate(createPageUrl("Dashboard"));
      }, 300);
    } catch (error) {
      setIsCompleting(false);
    }
  };

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: "Bom dia", emoji: "☀️" };
    } else if (hour >= 12 && hour < 18) {
      return { text: "Boa tarde", emoji: "🌤️" };
    } else {
      return { text: "Boa noite", emoji: "🌙" };
    }
  };

  const [showAuryFlow, setShowAuryFlow] = useState(false);
   const [showManualEntry, setShowManualEntry] = useState(false);
   const [entryType, setEntryType] = useState("expense");
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "essential",
    date: new Date().toISOString().slice(0, 10),
    type: "salary"
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setShowManualEntry(false);
      setFormData({
        description: "",
        amount: "",
        category: "essential",
        date: new Date().toISOString().slice(0, 10),
        type: "salary"
      });
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      setShowManualEntry(false);
      setFormData({
        description: "",
        amount: "",
        category: "essential",
        date: new Date().toISOString().slice(0, 10),
        type: "salary"
      });
    }
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (entryType === "expense") {
      createExpenseMutation.mutate({
        ...formData,
        amount: parseFloat(formData.amount),
        month_year: formData.date.slice(0, 7)
      });
    } else {
      createIncomeMutation.mutate({
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        is_active: true
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
           <h1 className="text-2xl font-bold text-foreground mb-2">{getGreeting().text}! {getGreeting().emoji}</h1>
           <p className="text-muted-foreground">Como estão suas finanças hoje?</p>
         </div>

         {/* Main Card */}
         <Card className="border-2 border-[#5FBDBD]/20 shadow-aury mb-6">
          <CardContent className="p-8">
            {/* Status */}
            <div className={`${status.bgColor} border ${status.borderColor} rounded-2xl p-6 mb-6`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${status.color} rounded-xl flex items-center justify-center shadow-md`}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoje você está:</p>
                  <p className={`text-lg font-bold ${status.textColor}`}>{status.label}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{status.message}</p>
            </div>

            {/* Can Spend Today */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-2">Você pode gastar hoje:</p>
              <motion.p
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-foreground"
              >
                {formatCurrency(canSpendToday)}
              </motion.p>
              <p className="text-xs text-muted-foreground mt-2">
                {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'} no mês
              </p>
            </div>

            {/* Actions */}
            <AnimatePresence mode="wait">
              {!showAuryFlow ? (
                <motion.div
                  key="buttons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <Button
                     onClick={() => {
                       setEntryType("expense");
                       setShowManualEntry(true);
                     }}
                     className="w-full bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] text-white shadow-md h-12"
                   >
                     <Edit3 className="w-5 h-5 mr-2" />
                     Registrar Gasto
                   </Button>

                   <Button
                     onClick={() => {
                       setEntryType("income");
                       setShowManualEntry(true);
                     }}
                     variant="outline"
                     className="w-full border-[#5FBDBD] text-[#5FBDBD] hover:bg-[#5FBDBD]/5 h-12"
                   >
                     <TrendingUpIcon className="w-5 h-5 mr-2" />
                     Registrar Renda
                   </Button>
                  
                  <Button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-700"
                  >
                    {isCompleting ? "Carregando..." : "Continuar para o app"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="auryflow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  <Button
                    variant="ghost"
                      onClick={() => setShowAuryFlow(false)}
                      className="w-full text-muted-foreground hover:text-foreground mb-2"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setEntryType("expense");
                        setShowManualEntry(true);
                        setShowAuryFlow(false);
                      }}
                      className="w-full bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] text-white shadow-md h-12"
                    >
                      <Edit3 className="w-5 h-5 mr-2" />
                      Registrar Gasto
                    </Button>
                    <Button
                      onClick={() => {
                        setEntryType("income");
                        setShowManualEntry(true);
                        setShowAuryFlow(false);
                      }}
                      variant="outline"
                      className="w-full border-[#5FBDBD] text-[#5FBDBD] hover:bg-[#5FBDBD]/5 h-12"
                    >
                      <TrendingUpIcon className="w-5 h-5 mr-2" />
                      Registrar Renda
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
         Seu momento diário de clareza • 10 segundos
        </p>
      </motion.div>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">
              {entryType === "expense" ? "Registrar Gasto" : "Registrar Renda"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setEntryType("expense")}
              variant={entryType === "expense" ? "default" : "outline"}
              className={entryType === "expense" ? "flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] text-white" : "flex-1 border-[#5FBDBD] text-[#5FBDBD] hover:bg-[#5FBDBD]/5"}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Gasto
            </Button>
            <Button
              onClick={() => setEntryType("income")}
              variant={entryType === "income" ? "default" : "outline"}
              className={entryType === "income" ? "flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] text-white" : "flex-1 border-[#5FBDBD] text-[#5FBDBD] hover:bg-[#5FBDBD]/5"}
            >
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              Renda
            </Button>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder={entryType === "expense" ? "Ex: Almoço" : "Ex: Salário"}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              {entryType === "expense" && (
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            {entryType === "expense" ? (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Gastos Fixos</SelectItem>
                    <SelectItem value="essential">Essenciais</SelectItem>
                    <SelectItem value="superfluous">Supérfluos</SelectItem>
                    <SelectItem value="emergency">Reserva</SelectItem>
                    <SelectItem value="investment">Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salário</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="rental">Aluguel</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowManualEntry(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] text-white"
              >
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
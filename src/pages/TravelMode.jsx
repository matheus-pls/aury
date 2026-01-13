import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  Plane,
  Plus,
  Home as Hotel,
  UtensilsCrossed,
  Car,
  Camera,
  ShoppingBag,
  MoreHorizontal,
  TrendingDown,
  Calendar,
  AlertCircle,
  Check,
  Pencil,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";

const TRAVEL_CATEGORIES = {
  accommodation: { label: "Hospedagem", icon: Hotel, color: "bg-blue-500" },
  food: { label: "Alimentação", icon: UtensilsCrossed, color: "bg-orange-500" },
  transport: { label: "Transporte", icon: Car, color: "bg-green-500" },
  activities: { label: "Passeios", icon: Camera, color: "bg-purple-500" },
  shopping: { label: "Compras", icon: ShoppingBag, color: "bg-pink-500" },
  other: { label: "Outros", icon: MoreHorizontal, color: "bg-slate-500" }
};

const CURRENCIES = {
  BRL: { symbol: "R$", rate: 1, flag: "🇧🇷" },
  USD: { symbol: "$", rate: 5.0, flag: "🇺🇸" },
  EUR: { symbol: "€", rate: 5.4, flag: "🇪🇺" },
  GBP: { symbol: "£", rate: 6.3, flag: "🇬🇧" },
  ARS: { symbol: "$", rate: 0.0055, flag: "🇦🇷" },
  CLP: { symbol: "$", rate: 0.0056, flag: "🇨🇱" }
};

export default function TravelMode() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    currency: "BRL",
    category: "food",
    date: new Date().toISOString().slice(0, 10)
  });

  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.filter({ 
      category: 'travel', 
      is_completed: false 
    })
  });

  const activeTrip = goals.find(g => g.travel_active);

  const { data: expenses = [] } = useQuery({
    queryKey: ['travel-expenses', activeTrip?.id],
    queryFn: () => activeTrip 
      ? base44.entities.TravelExpense.filter({ goal_id: activeTrip.id }, '-date')
      : [],
    enabled: !!activeTrip
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TravelExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-expenses']);
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TravelExpense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-expenses']);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TravelExpense.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['travel-expenses'])
  });

  const handleOpenDialog = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category,
        date: expense.date
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: "",
        amount: "",
        currency: activeTrip?.travel_currency || "BRL",
        category: "food",
        date: new Date().toISOString().slice(0, 10)
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const rate = CURRENCIES[formData.currency].rate;
    const amountBRL = formData.currency === "BRL" ? amount : amount * rate;

    const data = {
      ...formData,
      goal_id: activeTrip.id,
      amount,
      amount_brl: amountBRL
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (value, currency = "BRL") => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  if (!activeTrip) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Nenhuma viagem ativa
          </h2>
          <p className="text-slate-500 mb-4">
            Ative o modo viagem em uma meta de viagem para começar
          </p>
        </div>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount_brl || 0), 0);
  const budget = activeTrip.travel_budget || activeTrip.target_amount;
  const remaining = budget - totalSpent;
  const spentPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const expensesByCategory = Object.keys(TRAVEL_CATEGORIES).reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount_brl || 0), 0);
    return acc;
  }, {});

  const daysRemaining = activeTrip.travel_end_date 
    ? Math.ceil((new Date(activeTrip.travel_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const dailyBudget = daysRemaining && daysRemaining > 0 ? remaining / daysRemaining : remaining;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Goals")} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1B3A52]">{activeTrip.title}</h1>
                <p className="text-sm text-slate-500">Modo Viagem Ativo</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-[#5FBDBD] hover:bg-[#4FA9A5]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Gasto
          </Button>
        </div>
      </motion.div>

      {/* Budget Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${
          spentPercentage > 100 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : spentPercentage > 80
              ? 'bg-gradient-to-br from-amber-500 to-orange-500'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
        } text-white shadow-xl`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 text-sm mb-1">Ainda posso gastar</p>
            <h2 className="text-4xl font-bold">
              {formatCurrency(remaining)}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Orçamento</p>
            <p className="text-xl font-semibold">{formatCurrency(budget)}</p>
          </div>
        </div>

        <Progress 
          value={Math.min(spentPercentage, 100)} 
          className="h-2 bg-white/20 mb-4"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/70 text-xs mb-1">Já gastei</p>
            <p className="text-lg font-semibold">{formatCurrency(totalSpent)}</p>
          </div>
          {daysRemaining !== null && daysRemaining > 0 && (
            <div>
              <p className="text-white/70 text-xs mb-1">Por dia</p>
              <p className="text-lg font-semibold">{formatCurrency(dailyBudget)}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Trip Info */}
      {(activeTrip.travel_start_date || activeTrip.travel_end_date) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-slate-500">Período da viagem</p>
                <p className="font-semibold text-slate-800">
                  {activeTrip.travel_start_date && new Date(activeTrip.travel_start_date).toLocaleDateString('pt-BR')}
                  {activeTrip.travel_end_date && ` até ${new Date(activeTrip.travel_end_date).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>
            {daysRemaining !== null && (
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{daysRemaining}</p>
                <p className="text-xs text-slate-500">dias restantes</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Alerts */}
      {spentPercentage > 90 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-start gap-3 p-4 rounded-xl ${
            spentPercentage > 100 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            spentPercentage > 100 ? 'text-red-500' : 'text-amber-500'
          }`} />
          <div>
            <h4 className={`font-semibold ${
              spentPercentage > 100 ? 'text-red-800' : 'text-amber-800'
            }`}>
              {spentPercentage > 100 ? 'Orçamento estourado!' : 'Atenção ao orçamento!'}
            </h4>
            <p className={`text-sm ${
              spentPercentage > 100 ? 'text-red-600' : 'text-amber-600'
            }`}>
              {spentPercentage > 100 
                ? `Você gastou ${formatCurrency(totalSpent - budget)} a mais que o planejado.`
                : `Você já usou ${spentPercentage.toFixed(0)}% do orçamento. Fique atento!`
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Categories Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {Object.entries(TRAVEL_CATEGORIES).map(([key, config]) => {
          const Icon = config.icon;
          const amount = expensesByCategory[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-3 border border-slate-100 text-center"
            >
              <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-slate-500 mb-1">{config.label}</p>
              <p className="text-sm font-bold text-slate-800">
                {formatCurrency(amount)}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">Gastos Recentes</h3>
        {expenses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
            <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum gasto registrado ainda</p>
            <Button 
              onClick={() => handleOpenDialog()}
              variant="outline"
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar primeiro gasto
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {expenses.map((expense, index) => {
              const categoryConfig = TRAVEL_CATEGORIES[expense.category];
              const Icon = categoryConfig.icon;
              const currencyInfo = CURRENCIES[expense.currency];

              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryConfig.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{expense.description}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{categoryConfig.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-slate-800">
                          {currencyInfo.flag} {currencyInfo.symbol}{expense.amount.toFixed(2)}
                        </p>
                        {expense.currency !== "BRL" && (
                          <p className="text-xs text-slate-500">
                            {formatCurrency(expense.amount_brl)}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(expense.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar Gasto' : 'Novo Gasto de Viagem'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Jantar no restaurante"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCIES).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {info.flag} {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    {Object.entries(TRAVEL_CATEGORIES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.currency !== "BRL" && formData.amount && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Valor convertido (aprox.)</p>
                <p className="text-lg font-bold text-blue-800">
                  {formatCurrency(parseFloat(formData.amount) * CURRENCIES[formData.currency].rate)}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingExpense ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Home, 
  ShoppingCart, 
  Sparkles, 
  Shield, 
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  Calendar,
  Search
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const EXPENSE_CATEGORIES = {
  fixed: { label: "Gastos Fixos", icon: Home, color: "bg-[#0A1A3A]", textColor: "text-[#0A1A3A]" },
  essential: { label: "Essenciais Variáveis", icon: ShoppingCart, color: "bg-[#00A8A0]", textColor: "text-[#00A8A0]" },
  superfluous: { label: "Supérfluos", icon: Sparkles, color: "bg-amber-500", textColor: "text-amber-500" },
  emergency: { label: "Caixinha", icon: Shield, color: "bg-green-500", textColor: "text-green-500" },
  investment: { label: "Investimentos", icon: TrendingUp, color: "bg-violet-500", textColor: "text-violet-500" }
};

export default function Expenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "essential",
    subcategory: "",
    date: new Date().toISOString().slice(0, 10),
    is_recurring: false,
    recurrence_type: "months",
    recurrence_interval: 1
  });

  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', selectedMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: selectedMonth }, '-date')
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries(['expenses', selectedMonth]);
      const prev = queryClient.getQueryData(['expenses', selectedMonth]);
      queryClient.setQueryData(['expenses', selectedMonth], (old = []) => [
        { ...newExpense, id: `temp-${Date.now()}` }, ...old
      ]);
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(['expenses', selectedMonth], ctx.prev),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); handleCloseDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['expenses', selectedMonth]);
      const prev = queryClient.getQueryData(['expenses', selectedMonth]);
      queryClient.setQueryData(['expenses', selectedMonth], (old = []) =>
        old.map(e => e.id === id ? { ...e, ...data } : e)
      );
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(['expenses', selectedMonth], ctx.prev),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); handleCloseDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['expenses', selectedMonth]);
      const prev = queryClient.getQueryData(['expenses', selectedMonth]);
      queryClient.setQueryData(['expenses', selectedMonth], (old = []) => old.filter(e => e.id !== id));
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(['expenses', selectedMonth], ctx.prev),
    onSuccess: () => queryClient.invalidateQueries(['expenses'])
  });

  const handleOpenDialog = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        subcategory: expense.subcategory || "",
        date: expense.date,
        is_recurring: expense.is_recurring || false,
        recurrence_type: expense.recurrence_type || "months",
        recurrence_interval: expense.recurrence_interval || 1
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: "",
        amount: "",
        category: "essential",
        subcategory: "",
        date: new Date().toISOString().slice(0, 10),
        is_recurring: false,
        recurrence_type: "months",
        recurrence_interval: 1
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
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      month_year: formData.date.slice(0, 7)
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const expensesByCategory = Object.keys(EXPENSE_CATEGORIES).reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
    return acc;
  }, {});

  // Generate months for selector
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push({
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gastos</h1>
          <p className="text-muted-foreground mt-1">Controle seus gastos mensais</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#00A8A0] hover:bg-[#008F88] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Gasto
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 shadow-sm border border-border"
        >
          <p className="text-sm text-muted-foreground mb-1">Renda do Mês</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 shadow-sm border border-border"
        >
          <p className="text-sm text-muted-foreground mb-1">Total de Gastos</p>
          <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-5 shadow-sm border border-border"
        >
          <p className="text-sm text-muted-foreground mb-1">Saldo Restante</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-[#00A8A0]' : 'text-red-500'}`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </motion.div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedCategory === key 
                  ? `${config.color} text-white shadow-lg` 
                  : 'bg-card border border-border hover:border-border/80'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${selectedCategory === key ? 'text-white' : config.textColor}`} />
              <p className={`text-xs ${selectedCategory === key ? 'text-white/80' : 'text-muted-foreground'}`}>
                {config.label}
              </p>
              <p className={`text-lg font-bold ${selectedCategory === key ? 'text-white' : 'text-foreground'}`}>
                {formatCurrency(expensesByCategory[key])}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar gastos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(month => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl p-8 text-center border border-border"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum gasto encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "all" 
                ? "Tente ajustar os filtros" 
                : "Registre seu primeiro gasto"}
            </p>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-[#00A8A0] hover:bg-[#008F88]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Gasto
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredExpenses.map((expense, index) => {
              const categoryConfig = EXPENSE_CATEGORIES[expense.category];
              const Icon = categoryConfig?.icon || ShoppingCart;
              
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${categoryConfig?.color || 'bg-slate-500'}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{expense.description}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                          </span>
                          {expense.is_recurring && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full">
                              Recorrente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(expense.amount)}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
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
              {editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Aluguel, Supermercado..."
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
                  placeholder="0,00"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
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
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria (opcional)</Label>
              <Input
                id="subcategory"
                placeholder="Ex: Alimentação, Transporte..."
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_recurring">Gasto recorrente</Label>
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Repetir a cada</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select
                      value={formData.recurrence_type}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Dias</SelectItem>
                        <SelectItem value="weeks">Semanas</SelectItem>
                        <SelectItem value="months">Meses</SelectItem>
                        <SelectItem value="years">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este gasto se repetirá a cada {formData.recurrence_interval} {
                    formData.recurrence_type === "days" ? "dia(s)" :
                    formData.recurrence_type === "weeks" ? "semana(s)" :
                    formData.recurrence_type === "months" ? "mês(es)" :
                    "ano(s)"
                  }
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
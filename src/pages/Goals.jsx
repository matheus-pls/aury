import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  Target, 
  Plane, 
  ShoppingBag, 
  GraduationCap, 
  Shield, 
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Calendar,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

const GOAL_CATEGORIES = {
  travel: { label: "Viagem", icon: Plane, color: "bg-blue-500", bgLight: "bg-blue-50" },
  purchase: { label: "Compra", icon: ShoppingBag, color: "bg-pink-500", bgLight: "bg-pink-50" },
  education: { label: "Educação", icon: GraduationCap, color: "bg-purple-500", bgLight: "bg-purple-50" },
  emergency_fund: { label: "Reserva Emergência", icon: Shield, color: "bg-green-500", bgLight: "bg-green-50" },
  investment: { label: "Investimento", icon: TrendingUp, color: "bg-amber-500", bgLight: "bg-amber-50" },
  other: { label: "Outros", icon: Target, color: "bg-slate-500", bgLight: "bg-slate-50" }
};

const PRIORITIES = {
  low: { label: "Baixa", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Média", color: "bg-amber-100 text-amber-600" },
  high: { label: "Alta", color: "bg-red-100 text-red-600" }
};

export default function Goals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [selectedGoalForMoney, setSelectedGoalForMoney] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
    current_amount: "0",
    deadline: "",
    category: "other",
    priority: "medium",
    travel_budget: "",
    travel_currency: "BRL",
    travel_start_date: "",
    travel_end_date: "",
    travel_active: false
  });

  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success("Meta criada com sucesso!");
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinancialGoal.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['goals']);
      if (isAddingMoney) {
        toast.success("Dinheiro adicionado à meta!");
      } else {
        toast.success("Meta atualizada com sucesso!");
      }
      handleCloseDialog();
      setIsAddingMoney(false);
      setSelectedGoalForMoney(null);
      setAddAmount("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success("Meta excluída");
    }
  });

  const handleOpenDialog = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount?.toString() || "0",
        deadline: goal.deadline || "",
        category: goal.category,
        priority: goal.priority || "medium",
        travel_budget: goal.travel_budget?.toString() || "",
        travel_currency: goal.travel_currency || "BRL",
        travel_start_date: goal.travel_start_date || "",
        travel_end_date: goal.travel_end_date || "",
        travel_active: goal.travel_active || false
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: "",
        target_amount: "",
        current_amount: "0",
        deadline: "",
        category: "other",
        priority: "medium",
        travel_budget: "",
        travel_currency: "BRL",
        travel_start_date: "",
        travel_end_date: "",
        travel_active: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      is_completed: parseFloat(formData.current_amount) >= parseFloat(formData.target_amount)
    };

    if (formData.category === 'travel' && formData.travel_budget) {
      data.travel_budget = parseFloat(formData.travel_budget);
    }

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleTravelMode = (goal) => {
    updateMutation.mutate({
      id: goal.id,
      data: { ...goal, travel_active: !goal.travel_active }
    });
  };

  const handleAddMoney = (goal) => {
    const newAmount = (goal.current_amount || 0) + parseFloat(addAmount);
    updateMutation.mutate({
      id: goal.id,
      data: {
        ...goal,
        current_amount: newAmount,
        is_completed: newAmount >= goal.target_amount
      }
    });
  };

  const markAsCompleted = (goal) => {
    updateMutation.mutate({
      id: goal.id,
      data: { ...goal, is_completed: true, current_amount: goal.target_amount }
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  const totalTarget = activeGoals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const totalCurrent = activeGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);

  const calculateDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateMonthlySaving = (goal) => {
    const remaining = goal.target_amount - (goal.current_amount || 0);
    const days = calculateDaysRemaining(goal.deadline);
    if (!days || days <= 0) return remaining;
    const months = Math.ceil(days / 30);
    return remaining / months;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Overview")} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Metas Financeiras</h1>
            <p className="text-slate-500 mt-1">Acompanhe e alcance seus objetivos</p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-[#5FBDBD] hover:bg-[#4FA9A5] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
        >
          <p className="text-sm text-slate-500 mb-1">Total das Metas</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalTarget)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
        >
          <p className="text-sm text-slate-500 mb-1">Já Economizado</p>
          <p className="text-2xl font-bold text-[#00A8A0]">{formatCurrency(totalCurrent)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
        >
          <p className="text-sm text-slate-500 mb-1">Falta Economizar</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalTarget - totalCurrent)}</p>
        </motion.div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Metas em Andamento</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-8 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-8 text-center border border-slate-100"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Nenhuma meta ativa
            </h3>
            <p className="text-slate-500 mb-4">
              Defina suas metas financeiras e comece a economizar
            </p>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-[#00A8A0] hover:bg-[#008F88]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Meta
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeGoals.map((goal, index) => {
                const categoryConfig = GOAL_CATEGORIES[goal.category];
                const Icon = categoryConfig?.icon || Target;
                const progress = goal.target_amount > 0 
                  ? Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100) 
                  : 0;
                const daysRemaining = calculateDaysRemaining(goal.deadline);
                const monthlySaving = calculateMonthlySaving(goal);
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${categoryConfig?.color || 'bg-slate-500'}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800">{goal.title}</h3>
                            {goal.category === 'travel' && goal.travel_active && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                                <Plane className="w-3 h-3" />
                                Ativa
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITIES[goal.priority]?.color || 'bg-slate-100 text-slate-600'}`}>
                            Prioridade {PRIORITIES[goal.priority]?.label || 'Média'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {goal.category === 'travel' && (
                            <DropdownMenuItem onClick={() => toggleTravelMode(goal)}>
                              <Plane className="w-4 h-4 mr-2" />
                              {goal.travel_active ? 'Desativar' : 'Ativar'} Modo Viagem
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedGoalForMoney(goal);
                            setIsAddingMoney(true);
                          }}>
                            <Coins className="w-4 h-4 mr-2" />
                            Adicionar Dinheiro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(goal)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markAsCompleted(goal)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Marcar Concluída
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(goal.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-500">Economizado</p>
                          <p className="text-xl font-bold text-[#00A8A0]">
                            {formatCurrency(goal.current_amount || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Meta</p>
                          <p className="text-lg font-semibold text-slate-600">
                            {formatCurrency(goal.target_amount)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Progresso</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-100">
                        {daysRemaining !== null && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo expirado'}</span>
                          </div>
                        )}
                        {monthlySaving > 0 && (
                          <div className="text-xs text-amber-600 font-medium">
                            Economize {formatCurrency(monthlySaving)}/mês
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Metas Concluídas 🎉</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => {
              const categoryConfig = GOAL_CATEGORIES[goal.category];
              const Icon = categoryConfig?.icon || Target;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">{goal.title}</h3>
                      <p className="text-sm text-emerald-600 font-semibold">
                        {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(goal.id)}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[#1B3A52] font-semibold">
                <Target className="w-4 h-4 text-[#5FBDBD]" />
                Categoria *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger className="border-[#5FBDBD]/30 focus:border-[#5FBDBD]">
                  <SelectValue placeholder="Escolha a categoria da sua meta" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_CATEGORIES).map(([key, { label, icon: Icon }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                A categoria ajuda a organizar e priorizar suas metas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título da Meta *</Label>
              <Input
                id="title"
                placeholder="Ex: Viagem para Europa"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="target_amount">Valor da Meta *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_amount">Já Economizado</Label>
                <Input
                  id="current_amount"
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="deadline">Data Limite</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITIES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.category === 'travel' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Configurações da Viagem
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="travel_budget">Orçamento da Viagem</Label>
                    <Input
                      id="travel_budget"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.travel_budget}
                      onChange={(e) => setFormData({ ...formData, travel_budget: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moeda Principal</Label>
                    <Select
                      value={formData.travel_currency}
                      onValueChange={(value) => setFormData({ ...formData, travel_currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                        <SelectItem value="ARS">🇦🇷 ARS</SelectItem>
                        <SelectItem value="CLP">🇨🇱 CLP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="travel_start_date">Início da Viagem</Label>
                    <Input
                      id="travel_start_date"
                      type="date"
                      value={formData.travel_start_date}
                      onChange={(e) => setFormData({ ...formData, travel_start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travel_end_date">Fim da Viagem</Label>
                    <Input
                      id="travel_end_date"
                      type="date"
                      value={formData.travel_end_date}
                      onChange={(e) => setFormData({ ...formData, travel_end_date: e.target.value })}
                    />
                  </div>
                </div>
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
                {editingGoal ? 'Salvar' : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={isAddingMoney} onOpenChange={setIsAddingMoney}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Dinheiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Adicionar à meta: <span className="font-semibold">{selectedGoalForMoney?.title}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="addAmount">Valor</Label>
              <Input
                id="addAmount"
                type="number"
                placeholder="0,00"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsAddingMoney(false);
                  setSelectedGoalForMoney(null);
                  setAddAmount("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
                onClick={() => handleAddMoney(selectedGoalForMoney)}
                disabled={!addAmount || updateMutation.isPending}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  Users,
  Plus,
  UserPlus,
  Trash2,
  Heart,
  TrendingDown,
  Target,
  Coins,
  Home,
  ShoppingCart,
  Sparkles,
  Shield,
  TrendingUp as TrendingUpIcon,
  Mail,
  DollarSign,
  ChevronRight
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";

const EXPENSE_CATEGORIES = {
  fixed: { label: "Gastos Fixos", icon: Home, color: "from-[#1B3A52] to-[#0A2540]" },
  essential: { label: "Essenciais", icon: ShoppingCart, color: "from-[#5FBDBD] to-[#4FA9A5]" },
  superfluous: { label: "Supérfluos", icon: Sparkles, color: "from-[#4FA9A5] to-[#2A4A62]" },
  emergency: { label: "Reserva", icon: Shield, color: "from-[#2A4A62] to-[#1B3A52]" },
  investment: { label: "Investimentos", icon: TrendingUpIcon, color: "from-[#5FBDBD] via-[#4FA9A5] to-[#2A4A62]" }
};

export default function FamilyMode() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isGoalDetailsOpen, setIsGoalDetailsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [groupName, setGroupName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "essential",
    date: new Date().toISOString().slice(0, 10)
  });

  const [goalForm, setGoalForm] = useState({
    title: "",
    target_amount: "",
    current_amount: "0",
    deadline: "",
    category: "other",
    responsibilities: {}
  });

  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['family-groups', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allGroups = await base44.entities.FamilyGroup.list();
      return allGroups.filter(g => 
        g.admin_email === user.email || g.members?.includes(user.email)
      );
    },
    enabled: !!user
  });

  const activeGroup = groups.find(g => g.active);

  const { data: sharedExpenses = [] } = useQuery({
    queryKey: ['shared-expenses', activeGroup?.id],
    queryFn: () => activeGroup 
      ? base44.entities.SharedExpense.filter({ 
          family_group_id: activeGroup.id,
          month_year: new Date().toISOString().slice(0, 7)
        }, '-date')
      : [],
    enabled: !!activeGroup
  });

  const { data: sharedGoals = [] } = useQuery({
    queryKey: ['shared-goals', activeGroup?.id],
    queryFn: () => activeGroup
      ? base44.entities.SharedGoal.filter({ 
          family_group_id: activeGroup.id,
          is_completed: false
        })
      : [],
    enabled: !!activeGroup
  });

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.FamilyGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['family-groups']);
      setIsCreateGroupOpen(false);
      setGroupName("");
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, members }) => 
      base44.entities.FamilyGroup.update(groupId, { members }),
    onSuccess: () => {
      queryClient.invalidateQueries(['family-groups']);
      setIsAddMemberOpen(false);
      setNewMemberEmail("");
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-expenses']);
      setIsAddExpenseOpen(false);
      setExpenseForm({
        description: "",
        amount: "",
        category: "essential",
        date: new Date().toISOString().slice(0, 10)
      });
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-goals']);
      setIsAddGoalOpen(false);
      setGoalForm({
        title: "",
        target_amount: "",
        current_amount: "0",
        deadline: "",
        category: "other",
        responsibilities: {}
      });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SharedGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-goals']);
      setIsGoalDetailsOpen(false);
      setSelectedGoal(null);
      setContributionAmount("");
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedExpense.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['shared-expenses'])
  });

  const handleCreateGroup = () => {
    createGroupMutation.mutate({
      name: groupName,
      admin_email: user.email,
      members: [user.email],
      active: true
    });
  };

  const handleAddMember = () => {
    if (!activeGroup || !newMemberEmail) return;
    const updatedMembers = [...(activeGroup.members || []), newMemberEmail];
    addMemberMutation.mutate({
      groupId: activeGroup.id,
      members: updatedMembers
    });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      family_group_id: activeGroup.id,
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      paid_by: user.email,
      month_year: expenseForm.date.slice(0, 7)
    });
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const responsibilities = {};
    activeGroup.members?.forEach(email => {
      responsibilities[email] = goalForm.responsibilities[email] || 0;
    });
    
    createGoalMutation.mutate({
      family_group_id: activeGroup.id,
      ...goalForm,
      target_amount: parseFloat(goalForm.target_amount),
      current_amount: parseFloat(goalForm.current_amount) || 0,
      contributions: {},
      responsibilities
    });
  };

  const handleContribute = () => {
    if (!selectedGoal || !contributionAmount) return;
    
    const contributions = selectedGoal.contributions || {};
    contributions[user.email] = (contributions[user.email] || 0) + parseFloat(contributionAmount);
    
    const newCurrentAmount = (selectedGoal.current_amount || 0) + parseFloat(contributionAmount);
    
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      data: {
        ...selectedGoal,
        contributions,
        current_amount: newCurrentAmount,
        is_completed: newCurrentAmount >= selectedGoal.target_amount
      }
    });
  };

  const openGoalDetails = (goal) => {
    setSelectedGoal(goal);
    setIsGoalDetailsOpen(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMemberInitials = (email) => {
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  const getMemberName = (email) => {
    return email.split('@')[0];
  };

  if (userLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5FBDBD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-aury">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B3A52] mb-2">
            Família
          </h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            Finanças compartilhadas com clareza e equilíbrio
          </p>
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:from-[#4FA9A5] hover:to-[#5FBDBD] shadow-md"
          >
            <Users className="w-4 h-4 mr-2" />
            Criar Grupo Familiar
          </Button>

          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#1B3A52]">Criar Grupo Familiar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-[#1B3A52]">Nome do Grupo</Label>
                  <Input
                    id="groupName"
                    placeholder="Ex: Família Silva"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="border-slate-200 focus:border-[#5FBDBD]"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200"
                    onClick={() => setIsCreateGroupOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5]"
                    onClick={handleCreateGroup}
                    disabled={!groupName || createGroupMutation.isPending}
                  >
                    Criar Grupo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  const totalSharedExpenses = sharedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const expensesByCategory = Object.keys(EXPENSE_CATEGORIES).reduce((acc, cat) => {
    acc[cat] = sharedExpenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
    return acc;
  }, {});

  const expensesByMember = sharedExpenses.reduce((acc, e) => {
    acc[e.paid_by] = (acc[e.paid_by] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Overview")} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1B3A52]">{activeGroup.name}</h1>
              <p className="text-sm text-slate-500">Finanças compartilhadas com clareza</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddMemberOpen(true)}
              className="border-slate-200 hover:border-[#5FBDBD]/30 hover:bg-[#5FBDBD]/5"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar
            </Button>
            <Button
              onClick={() => setIsAddExpenseOpen(true)}
              className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Gasto
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tranquilidade da Família - Eixo Central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] text-white shadow-aury mb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-white/90" />
              <p className="text-white/80 text-sm font-medium">Harmonia Financeira</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">
                {totalSharedExpenses > 0 ? "Equilibrado" : "Iniciando"}
              </h2>
            </div>
            <p className="text-white/70 text-sm mt-2">
              {sharedGoals.length > 0 
                ? `${sharedGoals.length} meta${sharedGoals.length > 1 ? 's' : ''} em progresso juntos`
                : "Organize suas finanças em família"
              }
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="text-3xl">💚</div>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Visão Geral Familiar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-aury transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#5FBDBD]" />
              Gastos Coletivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1B3A52] mb-2">
              {formatCurrency(totalSharedExpenses)}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Organização compartilhada, não fiscalização
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-aury transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#5FBDBD]" />
                Metas Compartilhadas
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddGoalOpen(true)}
                className="h-8 w-8 p-0 hover:bg-[#5FBDBD]/10"
              >
                <Plus className="w-4 h-4 text-[#5FBDBD]" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#5FBDBD] mb-4">
              {sharedGoals.length}
            </p>
            {sharedGoals.length > 0 ? (
              <div className="space-y-3">
                {sharedGoals.slice(0, 2).map(goal => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  const remaining = goal.target_amount - (goal.current_amount || 0);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => openGoalDetails(goal)}
                      className="w-full text-left space-y-2 p-3 rounded-xl hover:bg-[#5FBDBD]/5 transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#1B3A52] group-hover:text-[#5FBDBD] transition-colors">{goal.title}</span>
                        <span className="text-xs font-semibold text-[#5FBDBD]">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-emerald-600 font-medium">
                        Juntos faltam {formatCurrency(remaining)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Crie sua primeira meta compartilhada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membros - Foco em Colaboração */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#5FBDBD]" />
            Nossa Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            {activeGroup.members?.length || 0} {activeGroup.members?.length === 1 ? 'pessoa' : 'pessoas'} colaborando juntas
          </p>
          <div className="flex flex-wrap gap-3">
            {activeGroup.members?.map((email, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-[#5FBDBD]/30 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white">
                  {getMemberInitials(email)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1B3A52]">{getMemberName(email)}</p>
                  {email === activeGroup.admin_email && (
                    <span className="text-xs px-2 py-0.5 bg-[#5FBDBD] text-white rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gastos por Categoria */}
      <div>
        <h3 className="font-semibold text-[#1B3A52] mb-3 text-lg">Gastos por Categoria</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Card key={key} className="border-slate-200 hover:shadow-aury transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{config.label}</p>
                  <p className="text-sm font-bold text-[#1B3A52]">
                    {formatCurrency(expensesByCategory[key])}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Gastos Recentes */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[#1B3A52] text-lg">Gastos Recentes</h3>
        {sharedExpenses.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum gasto compartilhado ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sharedExpenses.slice(0, 10).map(expense => {
              const categoryConfig = EXPENSE_CATEGORIES[expense.category];
              const Icon = categoryConfig.icon;
              return (
                <Card key={expense.id} className="border-slate-200 hover:border-[#5FBDBD]/30 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${categoryConfig.color} shadow-md`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[#1B3A52] text-sm">{expense.description}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(expense.date).toLocaleDateString('pt-BR')} • {getMemberName(expense.paid_by)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1B3A52] text-sm">
                          {formatCurrency(expense.amount)}
                        </p>
                        {user?.email === expense.paid_by && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            className="h-8 w-8 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Adicione o email de quem você quer convidar para o grupo
            </p>
            <div className="space-y-2">
              <Label htmlFor="memberEmail" className="text-[#1B3A52]">Email</Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="border-slate-200 focus:border-[#5FBDBD]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-200"
                onClick={() => setIsAddMemberOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5]"
                onClick={handleAddMember}
                disabled={!newMemberEmail || addMemberMutation.isPending}
              >
                Convidar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Novo Gasto Compartilhado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#1B3A52]">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Supermercado"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                required
                className="border-slate-200 focus:border-[#5FBDBD]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[#1B3A52]">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#5FBDBD]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[#1B3A52]">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#5FBDBD]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1B3A52]">Categoria</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-200"
                onClick={() => setIsAddExpenseOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5]"
                disabled={createExpenseMutation.isPending}
              >
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Nova Meta Compartilhada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="goalTitle" className="text-[#1B3A52]">Título</Label>
              <Input
                id="goalTitle"
                placeholder="Ex: Viagem em família"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                required
                className="border-slate-200 focus:border-[#5FBDBD]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="targetAmount" className="text-[#1B3A52]">Valor da Meta</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#5FBDBD]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount" className="text-[#1B3A52]">Já economizado</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={goalForm.current_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                  className="border-slate-200 focus:border-[#5FBDBD]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-[#1B3A52]">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                className="border-slate-200 focus:border-[#5FBDBD]"
              />
            </div>

            <div className="space-y-3 p-4 bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl border border-[#5FBDBD]/20">
              <Label className="flex items-center gap-2 text-[#1B3A52]">
                <Users className="w-4 h-4" />
                Responsabilidades (% de contribuição)
              </Label>
              <p className="text-xs text-slate-500 mb-2">
                Defina quanto cada membro deve contribuir para essa meta
              </p>
              {activeGroup.members?.map(email => (
                <div key={email} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 flex-1">{getMemberName(email)}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={goalForm.responsibilities[email] || ''}
                      onChange={(e) => setGoalForm({
                        ...goalForm,
                        responsibilities: {
                          ...goalForm.responsibilities,
                          [email]: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="w-20 border-slate-200"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-200"
                onClick={() => setIsAddGoalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5]"
                disabled={createGoalMutation.isPending}
              >
                Criar Meta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Details Dialog */}
      <Dialog open={isGoalDetailsOpen} onOpenChange={setIsGoalDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">{selectedGoal?.title}</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-6 mt-4">
              {/* Progress Overview */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500">Economizado</p>
                    <p className="text-2xl font-bold text-[#5FBDBD]">
                      {formatCurrency(selectedGoal.current_amount || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Meta</p>
                    <p className="text-lg font-semibold text-slate-600">
                      {formatCurrency(selectedGoal.target_amount)}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={(selectedGoal.current_amount / selectedGoal.target_amount) * 100} 
                  className="h-3"
                />
                <p className="text-xs text-slate-500 text-center">
                  Faltam {formatCurrency(selectedGoal.target_amount - (selectedGoal.current_amount || 0))}
                </p>
              </div>

              {/* Contributions by Member */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[#1B3A52]">
                  <Users className="w-4 h-4" />
                  Contribuições dos Membros
                </Label>
                <div className="space-y-2">
                  {activeGroup.members?.map(email => {
                    const contribution = selectedGoal.contributions?.[email] || 0;
                    const responsibility = selectedGoal.responsibilities?.[email] || 0;
                    const expectedAmount = (selectedGoal.target_amount * responsibility) / 100;
                    const contributionProgress = expectedAmount > 0 ? (contribution / expectedAmount) * 100 : 0;
                    
                    return (
                      <div key={email} className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {getMemberInitials(email)}
                            </div>
                            <span className="text-sm font-medium text-[#1B3A52]">{getMemberName(email)}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#1B3A52]">{formatCurrency(contribution)}</p>
                            {responsibility > 0 && (
                              <p className="text-xs text-slate-500">
                                de {formatCurrency(expectedAmount)} ({responsibility}%)
                              </p>
                            )}
                          </div>
                        </div>
                        {responsibility > 0 && (
                          <Progress value={Math.min(contributionProgress, 100)} className="h-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Contribution */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl border border-[#5FBDBD]/20">
                <Label htmlFor="contribution" className="flex items-center gap-2 text-[#1B3A52]">
                  <Coins className="w-4 h-4" />
                  Adicionar Contribuição
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="contribution"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="border-slate-200 focus:border-[#5FBDBD]"
                  />
                  <Button
                    onClick={handleContribute}
                    disabled={!contributionAmount || updateGoalMutation.isPending}
                    className="bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Contribuir
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-slate-200"
                onClick={() => setIsGoalDetailsOpen(false)}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
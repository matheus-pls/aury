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

  const getMemberAvatar = (email) => {
    // Gera uma cor de avatar consistente baseada no email
    const colors = [
      "from-[#5FBDBD] to-[#4FA9A5]",
      "from-[#1B3A52] to-[#2A4A62]",
      "from-emerald-500 to-teal-600",
      "from-violet-500 to-purple-600",
      "from-amber-500 to-orange-600"
    ];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
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

      {/* Harmonia Financeira Premium */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-[#5FBDBD] via-[#4FA9A5] to-[#1B3A52] text-white shadow-aury-lg"
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <p className="text-white/90 text-sm font-medium">Harmonia Financeira</p>
              </div>
              <h2 className="text-4xl font-bold mb-2">
                {totalSharedExpenses > 0 ? "Equilibrado" : "Pronto para começar"}
              </h2>
              <p className="text-white/80 text-base leading-relaxed">
                {sharedGoals.length > 0 
                  ? `${sharedGoals.length} ${sharedGoals.length === 1 ? 'objetivo' : 'objetivos'} construindo o futuro juntos`
                  : "Organizem as finanças com clareza e cooperação"
                }
              </p>
            </div>
          </div>
          
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs mb-1">Membros</p>
              <p className="text-2xl font-bold">{activeGroup.members?.length || 0}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1">Gastos</p>
              <p className="text-2xl font-bold">{sharedExpenses.length}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1">Metas</p>
              <p className="text-2xl font-bold">{sharedGoals.length}</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Visão Geral Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-100 shadow-sm hover:shadow-aury transition-all group">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              Gastos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#1B3A52] mb-3">
              {formatCurrency(totalSharedExpenses)}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Transparência para todos, sem julgamentos
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-aury transition-all group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                Objetivos Comuns
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddGoalOpen(true)}
                className="h-8 w-8 p-0 hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-600 mb-4">
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
                      className="w-full text-left space-y-2 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-100 transition-all group/goal"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-[#1B3A52] group-hover/goal:text-emerald-700 transition-colors">{goal.title}</span>
                        <span className="text-xs font-bold text-emerald-600 px-2 py-1 bg-white rounded-full">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-white" />
                      <p className="text-xs text-emerald-700 font-medium">
                        Juntos faltam {formatCurrency(remaining)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Comecem com um sonho em comum</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membros Premium */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#1B3A52] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              Quem Está Junto
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddMemberOpen(true)}
              className="h-8 border-slate-200 hover:bg-violet-50 hover:border-violet-200"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              <span className="text-xs">Adicionar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            {activeGroup.members?.length === 1 
              ? 'Você está começando. Convide mais pessoas!' 
              : `${activeGroup.members?.length} pessoas construindo juntas`
            }
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeGroup.members?.map((email, index) => {
              const memberExpenses = sharedExpenses.filter(e => e.paid_by === email).reduce((s, e) => s + e.amount, 0);
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 hover:border-[#5FBDBD]/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getMemberAvatar(email)} rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md`}>
                      {getMemberInitials(email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1B3A52] truncate">{getMemberName(email)}</p>
                      {email === activeGroup.admin_email ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] text-white rounded-full font-medium">
                          <Shield className="w-3 h-3" />
                          Responsável
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Membro</span>
                      )}
                    </div>
                  </div>
                  {memberExpenses > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Contribuição este mês</p>
                      <p className="text-sm font-bold text-[#1B3A52]">{formatCurrency(memberExpenses)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição dos Gastos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1B3A52] text-lg">Como Estão Gastando</h3>
          <p className="text-xs text-slate-500">Visão clara, sem cobranças</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => {
            const Icon = config.icon;
            const categoryTotal = expensesByCategory[key];
            const percentage = totalSharedExpenses > 0 ? (categoryTotal / totalSharedExpenses) * 100 : 0;
            return (
              <Card key={key} className="border-slate-100 hover:shadow-aury transition-all group">
                <CardContent className="p-5 text-center">
                  <div className={`w-14 h-14 bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-2">{config.label}</p>
                  <p className="text-base font-bold text-[#1B3A52] mb-1">
                    {formatCurrency(categoryTotal)}
                  </p>
                  {percentage > 0 && (
                    <p className="text-xs text-slate-500">{percentage.toFixed(0)}% do total</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Histórico Compartilhado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1B3A52] text-lg">Histórico Compartilhado</h3>
          <p className="text-xs text-slate-500">{sharedExpenses.length} {sharedExpenses.length === 1 ? 'registro' : 'registros'}</p>
        </div>
        {sharedExpenses.length === 0 ? (
          <Card className="border-slate-100">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="font-semibold text-[#1B3A52] mb-2">Tudo tranquilo por aqui</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Registre o primeiro gasto compartilhado e acompanhem juntos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sharedExpenses.slice(0, 10).map(expense => {
              const categoryConfig = EXPENSE_CATEGORIES[expense.category];
              const Icon = categoryConfig.icon;
              const isCurrentUser = user?.email === expense.paid_by;
              return (
                <Card key={expense.id} className="border-slate-100 hover:border-[#5FBDBD]/30 hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryConfig.color} shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1B3A52] text-sm mb-1">{expense.description}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getMemberAvatar(expense.paid_by)} flex items-center justify-center`}>
                                <span className="text-[8px] font-bold text-white">{getMemberInitials(expense.paid_by)}</span>
                              </div>
                              <span className="font-medium">{getMemberName(expense.paid_by)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-[#1B3A52] text-base">
                          {formatCurrency(expense.amount)}
                        </p>
                        {isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all"
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

      {/* Add Member Dialog Premium */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52] text-xl font-bold">Convidar Alguém</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
              <p className="text-sm text-slate-700 leading-relaxed">
                Adicione o email de quem você quer incluir no grupo. Vocês compartilharão gastos e metas, sempre com transparência.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberEmail" className="text-[#1B3A52] font-medium">Email da pessoa</Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="nome@email.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="border-slate-200 focus:border-[#5FBDBD] h-11"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-200 h-11"
                onClick={() => setIsAddMemberOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md h-11"
                onClick={handleAddMember}
                disabled={!newMemberEmail || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? "Convidando..." : "Enviar Convite"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog Premium */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52] text-xl font-bold">Registrar Gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#1B3A52] font-medium">O que foi?</Label>
              <Input
                id="description"
                placeholder="Ex: Compras do mês"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                required
                className="border-slate-200 focus:border-[#5FBDBD] h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[#1B3A52] font-medium">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#5FBDBD] h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[#1B3A52] font-medium">Quando</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#5FBDBD] h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1B3A52] font-medium">Categoria</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
              >
                <SelectTrigger className="border-slate-200 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl border border-[#5FBDBD]/20">
              <p className="text-xs text-slate-600 leading-relaxed">
                Este gasto será visível para todos os membros do grupo, mantendo a transparência financeira.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-200 h-11"
                onClick={() => setIsAddExpenseOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] shadow-md h-11"
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog Premium */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52] text-xl font-bold">Criar Objetivo Comum</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-5 mt-4">
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

            <div className="space-y-3 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <Label className="flex items-center gap-2 text-[#1B3A52] font-medium">
                <Users className="w-4 h-4 text-emerald-600" />
                Contribuição de Cada Um
              </Label>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Não é obrigação, é um combinado. Definam juntos quanto cada um pode contribuir.
              </p>
              {activeGroup.members?.map(email => (
                <div key={email} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getMemberAvatar(email)} flex items-center justify-center text-white font-semibold text-xs`}>
                    {getMemberInitials(email)}
                  </div>
                  <span className="text-sm font-medium text-slate-700 flex-1">{getMemberName(email)}</span>
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
                      className="w-20 border-slate-200 h-10"
                    />
                    <span className="text-sm font-medium text-emerald-600">%</span>
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
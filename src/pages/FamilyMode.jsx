import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
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
  Star
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
  superfluous: { label: "Supérfluos", icon: Sparkles, color: "from-rose-400 to-pink-500" },
  emergency: { label: "Reserva", icon: Shield, color: "from-[#2A4A62] to-[#1B3A52]" },
  investment: { label: "Investimentos", icon: TrendingUpIcon, color: "from-[#5FBDBD] via-[#4FA9A5] to-[#2A4A62]" }
};

export default function CoupleMode() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isGoalDetailsOpen, setIsGoalDetailsOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [editGoalForm, setEditGoalForm] = useState({});
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
      setExpenseForm({ description: "", amount: "", category: "essential", date: new Date().toISOString().slice(0, 10) });
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-goals']);
      setIsAddGoalOpen(false);
      setGoalForm({ title: "", target_amount: "", current_amount: "0", deadline: "", category: "other", responsibilities: {} });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SharedGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-goals']);
      setIsGoalDetailsOpen(false);
      setIsEditGoalOpen(false);
      setSelectedGoal(null);
      setContributionAmount("");
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shared-goals']);
      setIsGoalDetailsOpen(false);
      setSelectedGoal(null);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedExpense.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['shared-expenses'])
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, members }) =>
      base44.entities.FamilyGroup.update(groupId, { members }),
    onSuccess: () => queryClient.invalidateQueries(['family-groups'])
  });

  const handleRemoveMember = (email) => {
    if (email === user?.email) return;
    if (window.confirm(`Remover ${getMemberName(email)} do Modo Casal?`)) {
      const updatedMembers = activeGroup.members.filter(m => m !== email);
      removeMemberMutation.mutate({ groupId: activeGroup.id, members: updatedMembers });
    }
  };

  const handleCreateGroup = () => {
    createGroupMutation.mutate({ name: groupName, admin_email: user.email, members: [user.email], active: true });
  };

  const handleAddMember = () => {
    if (!activeGroup || !newMemberEmail) return;
    addMemberMutation.mutate({ groupId: activeGroup.id, members: [...(activeGroup.members || []), newMemberEmail] });
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
    activeGroup.members?.forEach(email => { responsibilities[email] = goalForm.responsibilities[email] || 0; });
    createGoalMutation.mutate({
      family_group_id: activeGroup.id,
      ...goalForm,
      target_amount: parseFloat(goalForm.target_amount),
      current_amount: parseFloat(goalForm.current_amount) || 0,
      contributions: {},
      responsibilities
    });
  };

  const handleContribute = (isAdding = true) => {
    if (!selectedGoal || !contributionAmount) return;
    const amount = parseFloat(contributionAmount);
    const contributions = selectedGoal.contributions || {};
    const currentUserContribution = contributions[user.email] || 0;
    const newContribution = isAdding ? currentUserContribution + amount : Math.max(0, currentUserContribution - amount);
    contributions[user.email] = newContribution;
    const changeAmount = isAdding ? amount : -Math.min(amount, currentUserContribution);
    const newCurrentAmount = Math.max(0, (selectedGoal.current_amount || 0) + changeAmount);
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      data: { ...selectedGoal, contributions, current_amount: newCurrentAmount, is_completed: newCurrentAmount >= selectedGoal.target_amount }
    });
  };

  const openGoalDetails = (goal) => { setSelectedGoal(goal); setIsGoalDetailsOpen(true); };
  const openEditGoal = (goal) => {
    setEditGoalForm({ title: goal.title, target_amount: goal.target_amount.toString(), deadline: goal.deadline || "", category: goal.category, responsibilities: goal.responsibilities || {} });
    setIsGoalDetailsOpen(false);
    setIsEditGoalOpen(true);
  };

  const handleEditGoal = (e) => {
    e.preventDefault();
    if (!selectedGoal) return;
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      data: { ...selectedGoal, title: editGoalForm.title, target_amount: parseFloat(editGoalForm.target_amount), deadline: editGoalForm.deadline, category: editGoalForm.category, responsibilities: editGoalForm.responsibilities }
    });
  };

  const handleDeleteGoal = () => {
    if (!selectedGoal) return;
    if (window.confirm(`Deseja excluir o sonho "${selectedGoal.title}"?`)) deleteGoalMutation.mutate(selectedGoal.id);
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getMemberInitials = (email) => email.split('@')[0].substring(0, 2).toUpperCase();
  const getMemberName = (email) => email.split('@')[0];
  const getMemberAvatar = (email) => {
    const colors = ["from-rose-400 to-pink-500", "from-[#5FBDBD] to-[#4FA9A5]", "from-violet-500 to-purple-600", "from-amber-500 to-orange-500"];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (userLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-600 rounded-3xl shadow-lg shadow-rose-200 flex items-center justify-center">
              <Heart className="w-14 h-14 text-white fill-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-full flex items-center justify-center shadow-md">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#1B3A52] mb-2">Modo Casal</h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            Um espaço só de vocês dois para organizar as finanças juntos — sem julgamento, com muito mais harmonia.
          </p>
          <div className="flex flex-col gap-2 mb-8">
            {["💳 Gastos compartilhados sem surpresas", "🎯 Sonhos que vocês constroem juntos", "📊 Transparência total entre vocês dois"].map((item, i) => (
              <div key={i} className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-sm text-rose-800 font-medium text-left">{item}</div>
            ))}
          </div>
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 shadow-lg shadow-rose-200 text-white px-8 h-12 text-base"
          >
            <Heart className="w-4 h-4 mr-2 fill-white" />
            Começar Nossa Jornada
          </Button>

          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#1B3A52] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Criar nosso espaço
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-slate-500">Dê um nome que represente vocês dois.</p>
                <div className="space-y-2">
                  <Label className="text-[#1B3A52]">Nome da parceria</Label>
                  <Input placeholder="Ex: João e Ana ❤️" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="border-slate-200 focus:border-rose-400 h-11" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCreateGroupOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white" onClick={handleCreateGroup} disabled={!groupName || createGroupMutation.isPending}>Criar</Button>
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
  const partner = activeGroup.members?.find(m => m !== user?.email);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <BackButton to={createPageUrl("Overview")} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1B3A52]">{activeGroup.name}</h1>
              <p className="text-sm text-slate-500">Vocês dois, no mesmo caminho 💕</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!partner && (
              <Button variant="outline" onClick={() => setIsAddMemberOpen(true)} className="border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600">
                <UserPlus className="w-4 h-4 mr-2" /> Convidar parceiro(a)
              </Button>
            )}
            <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Novo Gasto
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, #e11d48 0%, #be185d 40%, #1B3A52 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <p className="text-white/90 text-sm font-medium">Harmonia Financeira do Casal</p>
          </div>
          <h2 className="text-3xl font-bold mb-1">
            {totalSharedExpenses > 0 ? "Vocês estão juntos" : "Prontos para começar"}
          </h2>
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            {sharedGoals.length > 0
              ? `${sharedGoals.length} ${sharedGoals.length === 1 ? 'sonho' : 'sonhos'} construindo juntos`
              : "Cada decisão tomada juntos fortalece a relação"}
          </p>

          {/* Avatares do casal */}
          <div className="flex items-center gap-3 mb-6">
            {activeGroup.members?.slice(0, 2).map((email) => (
              <div key={email} className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMemberAvatar(email)} flex items-center justify-center text-white font-bold text-xs`}>
                  {getMemberInitials(email)}
                </div>
                <span className="text-white text-sm font-medium">{getMemberName(email)}</span>
              </div>
            ))}
            {activeGroup.members?.length === 1 && (
              <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-2 bg-white/10 border border-white/20 border-dashed rounded-xl px-3 py-2 hover:bg-white/20 transition-all">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white/70" />
                </div>
                <span className="text-white/70 text-sm">Convidar</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
            <div><p className="text-white/70 text-xs mb-1">Gastos juntos</p><p className="text-xl font-bold">{formatCurrency(totalSharedExpenses)}</p></div>
            <div><p className="text-white/70 text-xs mb-1">Registros</p><p className="text-xl font-bold">{sharedExpenses.length}</p></div>
            <div><p className="text-white/70 text-xs mb-1">Sonhos</p><p className="text-xl font-bold">{sharedGoals.length}</p></div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-rose-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              Gastos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#1B3A52] mb-2">{formatCurrency(totalSharedExpenses)}</p>
            <p className="text-sm text-slate-500">O que vocês gastaram juntos esse mês</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1B3A52] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                Sonhos em Comum
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setIsAddGoalOpen(true)} className="h-8 w-8 p-0 hover:bg-rose-50">
                <Plus className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-rose-500 mb-3">{sharedGoals.length}</p>
            {sharedGoals.length > 0 ? (
              <div className="space-y-3">
                {sharedGoals.slice(0, 2).map(goal => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  return (
                    <button key={goal.id} onClick={() => openGoalDetails(goal)} className="w-full text-left space-y-2 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-[#1B3A52]">{goal.title}</span>
                        <span className="text-xs font-bold text-rose-500 px-2 py-0.5 bg-white rounded-full">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-rose-600">Faltam {formatCurrency(goal.target_amount - (goal.current_amount || 0))}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Qual sonho vocês têm juntos? ✨</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vocês Dois */}
      <Card className="border-rose-100 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#1B3A52] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              Vocês Dois
            </CardTitle>
            {!partner && (
              <Button size="sm" variant="outline" onClick={() => setIsAddMemberOpen(true)} className="h-8 border-rose-200 hover:bg-rose-50 text-rose-600 text-xs">
                <UserPlus className="w-3 h-3 mr-1" /> Convidar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeGroup.members?.length === 1 && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 mb-4 text-center">
              <p className="text-sm text-rose-700">💌 Convide seu(sua) parceiro(a) para gerenciar juntos</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeGroup.members?.map((email, index) => {
              const memberExpenses = sharedExpenses.filter(e => e.paid_by === email).reduce((s, e) => s + e.amount, 0);
              const isMe = email === user?.email;
              return (
                <div key={index} className="rounded-2xl p-4 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-14 h-14 bg-gradient-to-br ${getMemberAvatar(email)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {getMemberInitials(email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1B3A52] truncate">{getMemberName(email)}</p>
                      <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-medium">{isMe ? "Você" : "Parceiro(a)"}</span>
                    </div>
                    {!isMe && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(email)} className="h-7 w-7 hover:bg-rose-100 opacity-60 hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    )}
                  </div>
                  {memberExpenses > 0 && (
                    <div className="pt-3 border-t border-rose-100">
                      <p className="text-xs text-slate-500 mb-0.5">Pagou este mês</p>
                      <p className="text-base font-bold text-[#1B3A52]">{formatCurrency(memberExpenses)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1B3A52] text-lg">Pra onde foi o dinheiro</h3>
          <p className="text-xs text-slate-500">Sem julgamento, só clareza</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => {
            const Icon = config.icon;
            const categoryTotal = expensesByCategory[key];
            const percentage = totalSharedExpenses > 0 ? (categoryTotal / totalSharedExpenses) * 100 : 0;
            return (
              <Card key={key} className="border-slate-100 hover:shadow-md transition-all group">
                <CardContent className="p-5 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-1">{config.label}</p>
                  <p className="text-sm font-bold text-[#1B3A52]">{formatCurrency(categoryTotal)}</p>
                  {percentage > 0 && <p className="text-xs text-slate-400">{percentage.toFixed(0)}%</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Histórico */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1B3A52] text-lg">Histórico de Gastos</h3>
          <p className="text-xs text-slate-500">{sharedExpenses.length} {sharedExpenses.length === 1 ? 'registro' : 'registros'}</p>
        </div>
        {sharedExpenses.length === 0 ? (
          <Card className="border-rose-100">
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">💳</div>
              <h4 className="font-semibold text-[#1B3A52] mb-2">Nenhum gasto ainda</h4>
              <p className="text-sm text-slate-500">Quando um de vocês registrar, aparece aqui</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sharedExpenses.slice(0, 10).map(expense => {
              const categoryConfig = EXPENSE_CATEGORIES[expense.category];
              const Icon = categoryConfig.icon;
              const isCurrentUser = user?.email === expense.paid_by;
              return (
                <Card key={expense.id} className="border-slate-100 hover:border-rose-200 transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${categoryConfig.color} shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1B3A52] text-sm mb-0.5">{expense.description}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${getMemberAvatar(expense.paid_by)} flex items-center justify-center`}>
                                <span className="text-[7px] font-bold text-white">{getMemberInitials(expense.paid_by)}</span>
                              </div>
                              <span>{isCurrentUser ? "Você" : getMemberName(expense.paid_by)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1B3A52]">{formatCurrency(expense.amount)}</p>
                        {isCurrentUser && (
                          <Button variant="ghost" size="icon" onClick={() => deleteExpenseMutation.mutate(expense.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
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

      {/* Dialog: Convidar */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52] flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Convidar parceiro(a)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-sm text-slate-700 leading-relaxed">Juntos, vocês vão ver gastos, metas e progresso em tempo real. 💕</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1B3A52] font-medium">Email do(a) parceiro(a)</Label>
              <Input type="email" placeholder="parceiro@email.com" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="border-slate-200 focus:border-rose-400 h-11" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setIsAddMemberOpen(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white h-11" onClick={handleAddMember} disabled={!newMemberEmail || addMemberMutation.isPending}>
                {addMemberMutation.isPending ? "Enviando..." : "💌 Enviar Convite"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gasto */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52]">Registrar Gasto do Casal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#1B3A52] font-medium">O que foi?</Label>
              <Input placeholder="Ex: Jantar, Mercado, Conta de luz..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} required className="border-slate-200 focus:border-rose-400 h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#1B3A52] font-medium">Valor</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required className="border-slate-200 focus:border-rose-400 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1B3A52] font-medium">Quando</Label>
                <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required className="border-slate-200 focus:border-rose-400 h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1B3A52] font-medium">Categoria</Label>
              <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                <SelectTrigger className="border-slate-200 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs text-rose-700">💕 Os dois vão ver esse gasto. Transparência é amor também.</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddExpenseOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white h-11" disabled={createExpenseMutation.isPending}>
                {createExpenseMutation.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Sonho */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A52] flex items-center gap-2">
              <Star className="w-5 h-5 text-rose-500 fill-rose-500" /> Criar Sonho em Comum
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#1B3A52]">Qual é o sonho?</Label>
              <Input placeholder="Ex: Viagem a dois, Casa própria, Casamento..." value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required className="border-slate-200 focus:border-rose-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#1B3A52]">Valor necessário</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={goalForm.target_amount} onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })} required className="border-slate-200 focus:border-rose-400" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1B3A52]">Já guardado</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={goalForm.current_amount} onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })} className="border-slate-200 focus:border-rose-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1B3A52]">Prazo (opcional)</Label>
              <Input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} className="border-slate-200 focus:border-rose-400" />
            </div>
            <div className="space-y-3 p-5 bg-rose-50 rounded-xl border border-rose-100">
              <Label className="flex items-center gap-2 text-[#1B3A52] font-medium">
                <Heart className="w-4 h-4 text-rose-500" /> Quanto cada um vai contribuir?
              </Label>
              <p className="text-xs text-slate-500">Não é cobrança — é um combinado de vocês dois.</p>
              {activeGroup.members?.map(email => {
                const isMe = email === user?.email;
                return (
                  <div key={email} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMemberAvatar(email)} flex items-center justify-center text-white font-semibold text-xs`}>{getMemberInitials(email)}</div>
                    <span className="text-sm font-medium text-slate-700 flex-1">{isMe ? "Você" : getMemberName(email)}</span>
                    <Input type="number" min="0" max="100" placeholder="0" value={goalForm.responsibilities[email] || ''} onChange={(e) => setGoalForm({ ...goalForm, responsibilities: { ...goalForm.responsibilities, [email]: parseFloat(e.target.value) || 0 } })} className="w-20 border-slate-200 h-9" />
                    <span className="text-sm font-medium text-rose-500">%</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddGoalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white" disabled={createGoalMutation.isPending}>Criar Sonho ✨</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Sonho */}
      <Dialog open={isGoalDetailsOpen} onOpenChange={setIsGoalDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[#1B3A52]">{selectedGoal?.title}</DialogTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEditGoal(selectedGoal)} className="h-8 w-8 hover:bg-rose-50"><Sparkles className="w-4 h-4 text-rose-400" /></Button>
                <Button variant="ghost" size="icon" onClick={handleDeleteGoal} className="h-8 w-8 hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-500" /></Button>
              </div>
            </div>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div><p className="text-xs text-slate-500">Guardado</p><p className="text-2xl font-bold text-rose-500">{formatCurrency(selectedGoal.current_amount || 0)}</p></div>
                  <div className="text-right"><p className="text-xs text-slate-500">Meta</p><p className="text-lg font-semibold text-slate-600">{formatCurrency(selectedGoal.target_amount)}</p></div>
                </div>
                <Progress value={(selectedGoal.current_amount / selectedGoal.target_amount) * 100} className="h-3" />
                <p className="text-xs text-slate-500 text-center">Faltam {formatCurrency(selectedGoal.target_amount - (selectedGoal.current_amount || 0))} pra esse sonho se tornar real 💕</p>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[#1B3A52]"><Heart className="w-4 h-4 text-rose-500" /> Contribuição de cada um</Label>
                {activeGroup.members?.map(email => {
                  const contribution = selectedGoal.contributions?.[email] || 0;
                  const responsibility = selectedGoal.responsibilities?.[email] || 0;
                  const expectedAmount = (selectedGoal.target_amount * responsibility) / 100;
                  const contributionProgress = expectedAmount > 0 ? (contribution / expectedAmount) * 100 : 0;
                  const isMe = email === user?.email;
                  return (
                    <div key={email} className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMemberAvatar(email)} flex items-center justify-center text-white font-semibold text-xs`}>{getMemberInitials(email)}</div>
                          <span className="text-sm font-medium text-[#1B3A52]">{isMe ? "Você" : getMemberName(email)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#1B3A52]">{formatCurrency(contribution)}</p>
                          {responsibility > 0 && <p className="text-xs text-slate-400">de {formatCurrency(expectedAmount)} ({responsibility}%)</p>}
                        </div>
                      </div>
                      {responsibility > 0 && <Progress value={Math.min(contributionProgress, 100)} className="h-1.5" />}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                <Label className="flex items-center gap-2 text-[#1B3A52]"><Coins className="w-4 h-4 text-rose-500" /> Movimentar valor</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="0,00" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="border-slate-200 focus:border-rose-400" />
                  <Button onClick={() => handleContribute(false)} disabled={!contributionAmount || updateGoalMutation.isPending} variant="outline" className="border-rose-200 hover:bg-rose-50 text-rose-600">Retirar</Button>
                  <Button onClick={() => handleContribute(true)} disabled={!contributionAmount || updateGoalMutation.isPending} className="bg-gradient-to-r from-rose-400 to-pink-500 text-white">Adicionar</Button>
                </div>
              </div>
              <Button variant="outline" className="w-full border-slate-200" onClick={() => setIsGoalDetailsOpen(false)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Sonho */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#1B3A52]">Editar Sonho</DialogTitle></DialogHeader>
          <form onSubmit={handleEditGoal} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#1B3A52]">Título</Label>
              <Input value={editGoalForm.title} onChange={(e) => setEditGoalForm({ ...editGoalForm, title: e.target.value })} required className="border-slate-200 focus:border-rose-400 h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#1B3A52]">Valor da Meta</Label>
                <Input type="number" step="0.01" value={editGoalForm.target_amount} onChange={(e) => setEditGoalForm({ ...editGoalForm, target_amount: e.target.value })} required className="border-slate-200 focus:border-rose-400 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1B3A52]">Prazo</Label>
                <Input type="date" value={editGoalForm.deadline} onChange={(e) => setEditGoalForm({ ...editGoalForm, deadline: e.target.value })} className="border-slate-200 focus:border-rose-400 h-11" />
              </div>
            </div>
            <div className="space-y-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <Label className="text-[#1B3A52] font-medium">Contribuição de cada um</Label>
              {activeGroup.members?.map(email => {
                const isMe = email === user?.email;
                return (
                  <div key={email} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMemberAvatar(email)} flex items-center justify-center text-white font-semibold text-xs`}>{getMemberInitials(email)}</div>
                    <span className="text-sm font-medium text-slate-700 flex-1">{isMe ? "Você" : getMemberName(email)}</span>
                    <Input type="number" min="0" max="100" placeholder="0" value={editGoalForm.responsibilities?.[email] || ''} onChange={(e) => setEditGoalForm({ ...editGoalForm, responsibilities: { ...editGoalForm.responsibilities, [email]: parseFloat(e.target.value) || 0 } })} className="w-20 border-slate-200 h-9" />
                    <span className="text-sm text-rose-500">%</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsEditGoalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white h-11" disabled={updateGoalMutation.isPending}>
                {updateGoalMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
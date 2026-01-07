import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Settings,
  Mail
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

const EXPENSE_CATEGORIES = {
  fixed: { label: "Gastos Fixos", icon: Home, color: "bg-[#0A1A3A]" },
  essential: { label: "Essenciais", icon: ShoppingCart, color: "bg-[#00A8A0]" },
  superfluous: { label: "Supérfluos", icon: Sparkles, color: "bg-amber-500" },
  emergency: { label: "Reserva", icon: Shield, color: "bg-green-500" },
  investment: { label: "Investimentos", icon: TrendingUpIcon, color: "bg-violet-500" }
};

export default function FamilyMode() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
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
    category: "other"
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
        category: "other"
      });
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
    createGoalMutation.mutate({
      family_group_id: activeGroup.id,
      ...goalForm,
      target_amount: parseFloat(goalForm.target_amount),
      current_amount: parseFloat(goalForm.current_amount) || 0
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (userLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00A8A0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Modo Família
          </h2>
          <p className="text-slate-500 mb-6">
            Compartilhe finanças com seu casal ou família. Juntos, vocês podem gerenciar gastos e metas compartilhadas.
          </p>
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            className="bg-[#00A8A0] hover:bg-[#008F88]"
          >
            <Users className="w-4 h-4 mr-2" />
            Criar Grupo Familiar
          </Button>

          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Grupo Familiar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nome do Grupo</Label>
                  <Input
                    id="groupName"
                    placeholder="Ex: Família Silva, Casal João e Maria"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreateGroupOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{activeGroup.name}</h1>
              <p className="text-sm text-slate-500">{activeGroup.members?.length || 0} membros</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAddMemberOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar
          </Button>
          <Button
            onClick={() => setIsAddExpenseOpen(true)}
            className="bg-[#00A8A0] hover:bg-[#008F88]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Gasto
          </Button>
        </div>
      </motion.div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Membros do Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {activeGroup.members?.map((email, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg"
              >
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{email}</span>
                {email === activeGroup.admin_email && (
                  <span className="text-xs px-2 py-0.5 bg-[#00A8A0] text-white rounded-full">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-500 mb-4">
              {formatCurrency(totalSharedExpenses)}
            </p>
            <div className="space-y-2">
              {Object.entries(expensesByMember).map(([email, amount]) => (
                <div key={email} className="flex justify-between text-sm">
                  <span className="text-slate-600">{email.split('@')[0]}</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Metas Compartilhadas</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddGoalOpen(true)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#00A8A0] mb-4">
              {sharedGoals.length}
            </p>
            {sharedGoals.length > 0 && (
              <div className="space-y-2">
                {sharedGoals.slice(0, 2).map(goal => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{goal.title}</span>
                        <span className="font-semibold text-slate-800">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-1" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-slate-500 mb-1">{config.label}</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatCurrency(expensesByCategory[key])}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Expenses */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">Gastos Recentes</h3>
        {sharedExpenses.length === 0 ? (
          <Card>
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
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${categoryConfig.color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{expense.description}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(expense.date).toLocaleDateString('pt-BR')} • Pago por {expense.paid_by.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">
                          {formatCurrency(expense.amount)}
                        </p>
                        {user?.email === expense.paid_by && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          >
                            <Trash2 className="w-4 h-4 text-slate-400" />
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
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Adicione o email de quem você quer convidar para o grupo
            </p>
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email</Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddMemberOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
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
            <DialogTitle>Novo Gasto Compartilhado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Supermercado"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
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
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddExpenseOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Meta Compartilhada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="goalTitle">Título</Label>
              <Input
                id="goalTitle"
                placeholder="Ex: Viagem em família"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Meta</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Já tem</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={goalForm.current_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddGoalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
                disabled={createGoalMutation.isPending}
              >
                Criar Meta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
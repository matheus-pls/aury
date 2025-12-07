import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Wallet, 
  Briefcase, 
  TrendingUp, 
  Home, 
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Check
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

const INCOME_TYPES = {
  salary: { label: "Salário", icon: Briefcase, color: "bg-blue-500" },
  freelance: { label: "Freelance", icon: Wallet, color: "bg-purple-500" },
  investment: { label: "Investimento", icon: TrendingUp, color: "bg-green-500" },
  rental: { label: "Aluguel", icon: Home, color: "bg-amber-500" },
  other: { label: "Outros", icon: Wallet, color: "bg-slate-500" }
};

export default function Incomes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "salary",
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: incomes = [], isLoading } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Income.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Income.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['incomes'])
  });

  const handleOpenDialog = (income = null) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        description: income.description,
        amount: income.amount.toString(),
        type: income.type,
        is_active: income.is_active
      });
    } else {
      setEditingIncome(null);
      setFormData({
        description: "",
        amount: "",
        type: "salary",
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIncome(null);
    setFormData({
      description: "",
      amount: "",
      type: "salary",
      is_active: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleActive = (income) => {
    updateMutation.mutate({
      id: income.id,
      data: { ...income, is_active: !income.is_active }
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalIncome = incomes
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const activeIncomes = incomes.filter(i => i.is_active);
  const inactiveIncomes = incomes.filter(i => !i.is_active);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Rendas</h1>
          <p className="text-slate-500 mt-1">Gerencie suas fontes de renda</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#00A8A0] hover:bg-[#008F88] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Renda
        </Button>
      </motion.div>

      {/* Total Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#00A8A0] to-[#008F88] rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm mb-1">Renda Total Mensal</p>
            <p className="text-3xl lg:text-4xl font-bold">{formatCurrency(totalIncome)}</p>
            <p className="text-white/60 text-sm mt-2">
              {activeIncomes.length} {activeIncomes.length === 1 ? 'fonte ativa' : 'fontes ativas'}
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl">
            <Wallet className="w-10 h-10 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Income List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Fontes de Renda</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : incomes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-8 text-center border border-slate-100"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Nenhuma renda cadastrada
            </h3>
            <p className="text-slate-500 mb-4">
              Comece adicionando sua primeira fonte de renda
            </p>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-[#00A8A0] hover:bg-[#008F88]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Renda
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {activeIncomes.map((income, index) => {
              const typeConfig = INCOME_TYPES[income.type];
              const Icon = typeConfig?.icon || Wallet;
              
              return (
                <motion.div
                  key={income.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${typeConfig?.color || 'bg-slate-500'}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{income.description}</h3>
                        <p className="text-sm text-slate-500">{typeConfig?.label || 'Outros'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-slate-800">
                        {formatCurrency(income.amount)}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(income)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(income)}>
                            <X className="w-4 h-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(income.id)}
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

        {/* Inactive Incomes */}
        {inactiveIncomes.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Rendas Inativas</h3>
            <div className="space-y-3 opacity-60">
              {inactiveIncomes.map((income) => {
                const typeConfig = INCOME_TYPES[income.type];
                const Icon = typeConfig?.icon || Wallet;
                
                return (
                  <div
                    key={income.id}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-slate-300">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-600">{income.description}</h3>
                          <p className="text-sm text-slate-400">{typeConfig?.label || 'Outros'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-medium text-slate-500">
                          {formatCurrency(income.amount)}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleActive(income)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Ativar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIncome ? 'Editar Renda' : 'Nova Renda'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Salário da empresa"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Mensal</Label>
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
              <Label>Tipo de Renda</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INCOME_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Renda ativa</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

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
                {editingIncome ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Edit, 
  Save,
  TrendingUp,
  Calendar,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Income() {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState("");

  const queryClient = useQueryClient();

  const { data: incomeData, isLoading } = useQuery({
    queryKey: ['income'],
    queryFn: async () => {
      const result = await base44.entities.Income.list();
      return result[0] || null;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      setIsEditing(false);
      setAmount("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Income.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      setIsEditing(false);
      setAmount("");
    }
  });

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const data = {
      monthly_amount: parsedAmount,
      last_updated: new Date().toISOString().slice(0, 10)
    };

    if (incomeData) {
      updateMutation.mutate({ id: incomeData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEditing = () => {
    setAmount(incomeData?.monthly_amount?.toString() || "");
    setIsEditing(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Minha Renda</h1>
        <p className="text-slate-500 mt-1">
          {incomeData ? "Mantenha sua renda atualizada" : "Configure sua renda mensal"}
        </p>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">Versão Gratuita</p>
          <p className="text-sm text-blue-700 mt-1">
            Na versão gratuita você pode cadastrar uma única renda mensal. 
            <span className="font-semibold"> Com o Premium</span>, você pode adicionar múltiplas fontes de renda (salário, freelance, investimentos, etc.).
          </p>
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        {!incomeData ? (
          // No income yet - First time setup
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00A8A0] to-[#008F88] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Cadastre sua Renda Mensal
              </h2>
              <p className="text-slate-600">
                Informe sua renda mensal para começar a organizar suas finanças
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="income">Renda Mensal (R$)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">
                  Digite o valor total que você recebe por mês
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={!amount || createMutation.isPending}
                className="w-full bg-gradient-to-r from-[#00A8A0] to-[#008F88] hover:shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Renda
              </Button>
            </div>
          </div>
        ) : (
          // Has income - Show and allow editing
          <>
            <div className="bg-gradient-to-br from-[#00A8A0] to-[#008F88] p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-white/80 text-sm mb-1">Renda Mensal</p>
                  <p className="text-3xl lg:text-4xl font-bold">
                    {formatCurrency(incomeData.monthly_amount)}
                  </p>
                  {incomeData.last_updated && (
                    <div className="flex items-center gap-2 mt-3 text-white/70 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>Atualizado em {formatDate(incomeData.last_updated)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white/10 rounded-2xl">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            <div className="p-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Por dia (útil)</p>
                      <p className="text-lg font-semibold text-slate-800">
                        {formatCurrency(incomeData.monthly_amount / 22)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Por semana</p>
                      <p className="text-lg font-semibold text-slate-800">
                        {formatCurrency(incomeData.monthly_amount / 4)}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={startEditing}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Atualizar Renda
                  </Button>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      Como sua renda será distribuída
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">💰 Gastos Fixos (50%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(incomeData.monthly_amount * 0.5)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">🛒 Essenciais (20%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(incomeData.monthly_amount * 0.2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">✨ Supérfluos (10%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(incomeData.monthly_amount * 0.1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-slate-600">💎 Reserva + Investimentos (20%)</span>
                        <span className="font-bold text-[#00A8A0]">
                          {formatCurrency(incomeData.monthly_amount * 0.2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newIncome">Nova Renda Mensal (R$)</Label>
                    <Input
                      id="newIncome"
                      type="number"
                      placeholder="0,00"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setAmount("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!amount || updateMutation.isPending}
                      className="flex-1 bg-[#00A8A0] hover:bg-[#008F88]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200"
      >
        <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
          <span>💡</span> Dica
        </h3>
        <p className="text-sm text-emerald-700">
          Atualize sua renda sempre que houver mudanças (aumento, bônus, nova fonte). 
          Isso garante que suas metas e limites de gastos fiquem sempre precisos.
        </p>
      </motion.div>
    </div>
  );
}
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Flag, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function MilestoneManager({ milestones = [], onUpdate, targetAmount, currentAmount }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    target_amount: "",
    target_date: ""
  });

  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.target_amount || !newMilestone.target_date) {
      toast.error("Preencha todos os campos");
      return;
    }

    const amount = parseFloat(newMilestone.target_amount);
    if (amount <= 0 || amount > targetAmount) {
      toast.error("Valor deve ser entre 0 e " + targetAmount);
      return;
    }

    const updatedMilestones = [
      ...milestones,
      {
        id: Date.now().toString(),
        title: newMilestone.title,
        target_amount: amount,
        target_date: newMilestone.target_date,
        is_completed: false,
        completed_date: null
      }
    ];

    onUpdate(updatedMilestones);
    setNewMilestone({ title: "", target_amount: "", target_date: "" });
    setIsAdding(false);
    toast.success("Milestone adicionado!");
  };

  const handleRemoveMilestone = (id) => {
    onUpdate(milestones.filter(m => m.id !== id));
    toast.success("Milestone removido");
  };

  const handleCompleteMilestone = (id) => {
    const updated = milestones.map(m =>
      m.id === id 
        ? { ...m, is_completed: true, completed_date: new Date().toISOString().split('T')[0] }
        : m
    );
    onUpdate(updated);
    toast.success("Milestone marcado como concluído!");
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.target_date) - new Date(b.target_date)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateProgressToMilestone = (milestone) => {
    return Math.min(((currentAmount || 0) / milestone.target_amount) * 100, 100);
  };

  const daysUntilMilestone = (date) => {
    const today = new Date();
    const target = new Date(date);
    const diff = target - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Flag className="w-5 h-5 text-[#5FBDBD]" />
          Milestones
        </h3>
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl p-4 border border-[#5FBDBD]/20"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Título do Milestone</Label>
                <Input
                  placeholder="Ex: Primeira etapa (25% da meta)"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Valor Alvo</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    step="0.01"
                    value={newMilestone.target_amount}
                    onChange={(e) => setNewMilestone({ ...newMilestone, target_amount: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Data Alvo</Label>
                  <Input
                    type="date"
                    value={newMilestone.target_date}
                    onChange={(e) => setNewMilestone({ ...newMilestone, target_date: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9"
                  onClick={() => {
                    setIsAdding(false);
                    setNewMilestone({ title: "", target_amount: "", target_date: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 bg-[#5FBDBD] hover:bg-[#4FA9A5]"
                  onClick={handleAddMilestone}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sortedMilestones.length > 0 ? (
        <div className="space-y-3">
          {sortedMilestones.map((milestone, index) => {
            const progress = calculateProgressToMilestone(milestone);
            const days = daysUntilMilestone(milestone.target_date);
            
            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`rounded-lg p-4 border transition-all ${
                  milestone.is_completed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200 hover:border-[#5FBDBD]/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Etapa {index + 1}
                      </span>
                      {milestone.is_completed && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completo
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-slate-800 text-sm">{milestone.title}</h4>
                  </div>
                  {!milestone.is_completed && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-100"
                        onClick={() => handleCompleteMilestone(milestone.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:bg-red-100"
                        onClick={() => handleRemoveMilestone(milestone.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">
                      {formatCurrency(currentAmount || 0)} / {formatCurrency(milestone.target_amount)}
                    </span>
                    <span className="font-semibold text-slate-700">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {milestone.is_completed 
                        ? `Completo em ${new Date(milestone.completed_date).toLocaleDateString('pt-BR')}`
                        : days > 0 
                          ? `${days} dias`
                          : "Prazo expirado"
                      }
                    </span>
                  </div>
                  {!milestone.is_completed && days > 0 && (
                    <span className="text-xs font-medium text-amber-600">
                      {formatCurrency((milestone.target_amount - (currentAmount || 0)) / Math.max(days, 1))}/dia
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum milestone adicionado ainda. Crie etapas para acompanhar melhor seu progresso!
        </p>
      )}
    </div>
  );
}
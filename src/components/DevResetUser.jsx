import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DevResetUser() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();

  // Apenas mostrar em desenvolvimento
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const handleReset = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Reset UserSettings
      const settings = await base44.entities.UserSettings.list();
      if (settings.length > 0) {
        await base44.entities.UserSettings.update(settings[0].id, {
          onboarding_completed: false,
          last_checkin_date: null,
        });
      }

      // 2. Limpar dados financeiros
      const expenses = await base44.entities.Expense.list();
      for (const exp of expenses) {
        await base44.entities.Expense.delete(exp.id);
      }

      const incomes = await base44.entities.Income.list();
      for (const inc of incomes) {
        await base44.entities.Income.delete(inc.id);
      }

      const goals = await base44.entities.FinancialGoal.list();
      for (const goal of goals) {
        await base44.entities.FinancialGoal.delete(goal.id);
      }

      // 3. Limpar trial/premium
      localStorage.removeItem(`aury_premiumUntil_${userId}`);
      localStorage.removeItem(`aury_onboarding_${userId}`);

      // 4. Invalidar caches React Query
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      queryClient.invalidateQueries({ queryKey: ['settings-onboarding', userId] });
      queryClient.invalidateQueries({ queryKey: ['incomes', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });

      setOpen(false);
      window.location.href = '/Welcome';
    } catch (error) {
      console.error('Reset error:', error);
      alert('Erro ao resetar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Simular usuário novo
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <AlertDialogTitle>Resetar usuário de teste?</AlertDialogTitle>
                <AlertDialogDescription className="mt-2 space-y-1">
                  <p>Isso vai:</p>
                  <ul className="list-disc list-inside text-xs space-y-1 ml-1">
                    <li>Marcar onboarding como não concluído</li>
                    <li>Deletar todas as despesas</li>
                    <li>Deletar todas as receitas</li>
                    <li>Deletar todas as metas</li>
                    <li>Limpar trial/premium de teste</li>
                  </ul>
                  <p className="text-orange-600 font-semibold mt-3">Isso é irreversível.</p>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Resetando...' : 'Resetar'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
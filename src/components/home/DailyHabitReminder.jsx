import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DailyHabitReminder({ hasRegisteredToday, onOpenExpenseDialog }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-4 border flex items-center gap-3 transition-all ${
        hasRegisteredToday
          ? 'bg-emerald-500/8 border-emerald-500/20'
          : 'bg-amber-500/8 border-amber-500/20'
      }`}
    >
      {hasRegisteredToday ? (
        <>
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Boa! Você está no controle hoje</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hábito mantido 🔥</p>
          </div>
        </>
      ) : (
        <>
          <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Registre seus gastos hoje</p>
            <p className="text-xs text-muted-foreground mt-0.5">Mantenha seu hábito ativo</p>
          </div>
          <motion.div whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.02 }}>
            <Button
              onClick={onOpenExpenseDialog}
              size="sm"
              className="h-8 px-3 text-xs font-semibold text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }}
            >
              Registrar
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Componente invisível que gera notificações em background
export default function NotificationGenerator() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const { userId, user } = useCurrentUser();

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes', userId],
    queryFn: () => base44.entities.Income.filter({ is_active: true }),
    enabled: !!userId
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', userId, currentMonth],
    queryFn: () => base44.entities.Expense.filter({ month_year: currentMonth }),
    enabled: !!userId
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => base44.entities.FinancialGoal.filter({ is_completed: false }),
    enabled: !!userId
  });

  const { data: settings } = useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    },
    enabled: !!userId
  });

  const { data: existingNotifications = [] } = useQuery({
    queryKey: ['notifications', userId, today],
    queryFn: () => base44.entities.Notification.filter({ 
      created_by: user?.email,
      date: today
    }),
    enabled: !!userId && !!user?.email
  });

  useEffect(() => {
    if (!userId || !user) return;

    const generateNotifications = async () => {
      const notifications = [];

      // 1. Contas próximas do vencimento (gastos recorrentes)
      const recurringExpenses = expenses.filter(e => e.is_recurring);
      const upcomingBills = recurringExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        const daysUntil = Math.ceil((expenseDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 3;
      });

      for (const bill of upcomingBills) {
        const daysUntil = Math.ceil((new Date(bill.date) - new Date()) / (1000 * 60 * 60 * 24));
        const alreadyExists = existingNotifications.some(
          n => n.related_entity_id === bill.id && n.type === 'bill_due'
        );
        
        if (!alreadyExists) {
          notifications.push({
            title: daysUntil === 0 ? "Conta vence hoje" : `Conta vence em ${daysUntil} dias`,
            message: `${bill.description}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}`,
            type: "bill_due",
            priority: daysUntil === 0 ? "high" : "medium",
            action_url: createPageUrl("Expenses"),
            related_entity_id: bill.id,
            related_entity_type: "Expense",
            date: today,
            read: false
          });
        }
      }

      // 2. Alertas de orçamento (gastos acima de 80%)
      const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const spentPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

      if (spentPercentage > 80 && spentPercentage <= 100) {
        const alreadyExists = existingNotifications.some(
          n => n.type === 'budget_alert' && n.message.includes('80%')
        );
        
        if (!alreadyExists) {
          notifications.push({
            title: "Atenção ao orçamento",
            message: `Você já utilizou ${spentPercentage.toFixed(0)}% do seu orçamento mensal. Considere ajustar gastos supérfluos.`,
            type: "budget_alert",
            priority: "medium",
            action_url: createPageUrl("BehaviorAnalysis"),
            date: today,
            read: false
          });
        }
      } else if (spentPercentage > 100) {
        const alreadyExists = existingNotifications.some(
          n => n.type === 'budget_alert' && n.message.includes('ultrapassou')
        );
        
        if (!alreadyExists) {
          notifications.push({
            title: "Orçamento ultrapassado",
            message: `Seus gastos estão ${(spentPercentage - 100).toFixed(0)}% acima do planejado. O Modo Mês Apertado pode ajudar.`,
            type: "budget_alert",
            priority: "high",
            action_url: createPageUrl("TightMonth"),
            date: today,
            read: false
          });
        }
      }

      // 3. Lembretes de metas (progresso estagnado há 7+ dias)
      for (const goal of goals) {
        const daysSinceUpdate = Math.ceil((new Date() - new Date(goal.updated_date)) / (1000 * 60 * 60 * 24));
        const progress = (goal.current_amount / goal.target_amount) * 100;
        
        if (daysSinceUpdate >= 7 && progress < 100) {
          const alreadyExists = existingNotifications.some(
            n => n.related_entity_id === goal.id && n.type === 'goal_reminder' && 
            new Date(n.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          
          if (!alreadyExists) {
            const remaining = goal.target_amount - goal.current_amount;
            notifications.push({
              title: `${goal.title} está te esperando`,
              message: `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)} para alcançar sua meta. Que tal adicionar algo hoje?`,
              type: "goal_reminder",
              priority: "low",
              action_url: createPageUrl("Goals"),
              related_entity_id: goal.id,
              related_entity_type: "FinancialGoal",
              date: today,
              read: false
            });
          }
        }
      }

      // 4. Lembrete de caixinha (se < 30% e há mais de 10 dias sem contribuição)
      if (settings) {
        const fixedExpenses = expenses.filter(e => e.category === 'fixed').reduce((s, e) => s + (e.amount || 0), 0);
        const emergencyGoal = fixedExpenses * (settings.emergency_fund_goal_months || 6);
        const currentEmergencyFund = settings.current_emergency_fund || 0;
        const emergencyProgress = emergencyGoal > 0 ? (currentEmergencyFund / emergencyGoal) * 100 : 0;

        if (emergencyProgress < 30) {
          const daysSinceUpdate = Math.ceil((new Date() - new Date(settings.updated_date)) / (1000 * 60 * 60 * 24));
          
          if (daysSinceUpdate >= 10) {
            const alreadyExists = existingNotifications.some(
              n => n.type === 'emergency_fund' && 
              new Date(n.created_date) > new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            );
            
            if (!alreadyExists) {
              const monthlyContribution = totalIncome * 0.15;
              notifications.push({
                title: "Fortaleça sua caixinha",
                message: `Sua reserva está em ${emergencyProgress.toFixed(0)}%. Adicionar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyContribution)} por mês constrói sua segurança.`,
                type: "emergency_fund",
                priority: "medium",
                action_url: createPageUrl("EmergencyFund"),
                date: today,
                read: false
              });
            }
          }
        }
      }

      // 5. Insights inteligentes (início do mês)
      const dayOfMonth = new Date().getDate();
      if (dayOfMonth >= 1 && dayOfMonth <= 3 && totalIncome > 0) {
        const alreadyExists = existingNotifications.some(
          n => n.type === 'insight' && n.title.includes('Novo mês')
        );
        
        if (!alreadyExists) {
          const lastMonthExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const avgDailySpending = lastMonthExpenses / new Date().getDate();
          
          notifications.push({
            title: "Novo mês, nova chance",
            message: `No mês passado, você gastou em média ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgDailySpending)} por dia. Use o planejamento para otimizar este mês.`,
            type: "insight",
            priority: "low",
            action_url: createPageUrl("Planning"),
            date: today,
            read: false
          });
        }
      }

      // Criar notificações que não existem ainda
      for (const notification of notifications) {
        try {
          await base44.entities.Notification.create(notification);
        } catch (error) {
          console.error('Erro ao criar notificação:', error);
        }
      }
    };

    // Gerar notificações após 2 segundos (dar tempo para queries carregarem)
    const timer = setTimeout(generateNotifications, 2000);
    return () => clearTimeout(timer);
  }, [userId, user, expenses, goals, settings, incomes, existingNotifications, today]);

  return null; // Componente invisível
}
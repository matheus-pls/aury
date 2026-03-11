import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Bell, 
  X, 
  Calendar,
  TrendingDown,
  Target,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NOTIFICATION_ICONS = {
  bill_due: Calendar,
  budget_alert: TrendingDown,
  goal_reminder: Target,
  emergency_fund: Shield,
  insight: Sparkles
};

const NOTIFICATION_COLORS = {
  bill_due: "from-[#5FBDBD] to-[#4FA9A5]",
  budget_alert: "from-[#4FA9A5] to-[#2A4A62]",
  goal_reminder: "from-[#2A4A62] to-[#1B3A52]",
  emergency_fund: "from-[#5FBDBD] to-[#1B3A52]",
  insight: "from-[#5FBDBD] via-[#4FA9A5] to-[#2A4A62]"
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ 
      created_by: user?.email 
    }, '-created_date', 20),
    enabled: !!user
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsReadMutation.mutate(n.id));
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsReadMutation.mutate(notification.id);
    if (notification.action_url) {
      window.location.href = notification.action_url;
      setIsOpen(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-full flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1B3A52]">Notificações</h3>
            {unreadCount > 0 && (
              <Badge className="bg-[#5FBDBD] text-white">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Nenhuma notificação por enquanto</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Sparkles;
                  const isUnread = !notification.read;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                        isUnread ? 'bg-[#5FBDBD]/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {isUnread && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#5FBDBD] rounded-full" />
                      )}
                      
                      <div className="flex gap-3 pl-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${NOTIFICATION_COLORS[notification.type]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-semibold text-[#1B3A52] ${isUnread ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              <X className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(notification.created_date)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-slate-600"
              onClick={markAllAsRead}
            >
              <CheckCircle2 className="w-3 h-3 mr-2" />
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
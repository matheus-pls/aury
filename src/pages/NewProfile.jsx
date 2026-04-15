import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, Heart, TrendingUp, Shield,
  ChevronRight, LogOut, Bell, Crown, Star, Lock, Pencil
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/lib/PremiumContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const MENU_ITEMS = [
  {
    group: "Conta",
    items: [
      { label: "Configurações", icon: Settings, page: "Settings", color: "text-[#5FBDBD]", bg: "bg-[#5FBDBD]/10" },
      { label: "Notificações", icon: Bell, page: "Settings", color: "text-violet-500", bg: "bg-violet-500/10" },
    ]
  },
  {
    group: "Finanças",
    items: [
      { label: "Modo Casal", icon: Heart, page: "FamilyMode", color: "text-rose-500", bg: "bg-rose-500/10" },
      { label: "Análise de Comportamento", icon: TrendingUp, page: "BehaviorAnalysis", color: "text-amber-500", bg: "bg-amber-500/10", premium: true },
      { label: "Caixinha", icon: Shield, page: "EmergencyFund", color: "text-emerald-500", bg: "bg-emerald-500/10", premium: true },
    ]
  }
];

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function NewProfile() {
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const { user: authUser, userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [localName, setLocalName] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["current-user", userId],
    queryFn: () => base44.auth.me(),
    enabled: !!userId,
    initialData: authUser || undefined,
  });

  const displayName = localName !== null ? localName : (user?.full_name || authUser?.full_name || "");

  const handleOpenEditName = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setNewName(displayName);
    setEditNameOpen(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    await base44.auth.updateMe({ full_name: newName.trim() });
    setLocalName(newName.trim());
    queryClient.invalidateQueries({ queryKey: ["current-user"] });
    setSavingName(false);
    setEditNameOpen(false);
  };

  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes", userId],
    queryFn: () => base44.entities.Income.filter({ is_active: true }),
    enabled: !!userId,
  });

  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const initials = displayName.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "??";

  const handleLogout = () => { base44.auth.logout(); };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-3xl p-7 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            {editNameOpen ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditNameOpen(false);
                  }}
                  autoFocus
                  className="w-full bg-white/20 text-white placeholder-white/50 rounded-xl px-3 py-1.5 text-base font-bold outline-none border border-white/30 focus:border-white/70"
                  placeholder="Seu nome"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditNameOpen(false)}
                    className="flex-1 text-xs text-white/60 bg-white/10 rounded-lg py-1 hover:bg-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={!newName.trim() || savingName}
                    className="flex-1 text-xs text-white font-semibold bg-white/25 rounded-lg py-1 hover:bg-white/35 transition-colors disabled:opacity-50"
                  >
                    {savingName ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{displayName || "Carregando..."}</h2>
                <button
                  type="button"
                  onClick={handleOpenEditName}
                  style={{ zIndex: 10, position: "relative" }}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors touch-manipulation"
                >
                  <Pencil className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
            {!editNameOpen && <p className="text-white/70 text-sm">{user?.email || authUser?.email}</p>}
          </div>
        </div>
        <div className="pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-xs mb-0.5">Renda Mensal</p>
            <p className="font-bold tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-0.5">Plano Atual</p>
            <div className="flex items-center gap-1">
              <p className="font-bold">{isPremium ? "Premium" : "Gratuito"}</p>
              <Crown className={`w-3.5 h-3.5 ${isPremium ? "text-amber-300 fill-amber-300/50" : "text-white/50"}`} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`border rounded-2xl p-4 ${isPremium ? "bg-amber-500/10 border-amber-500/30" : "bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/30"}`}
      >
        {isPremium ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-500 fill-amber-500/50" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-500 text-sm">Premium ativo ✨</p>
              <p className="text-xs text-amber-500/80 mt-0.5">Você tem acesso a todos os recursos</p>
            </div>
            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-500 text-xs h-8" onClick={() => navigate(createPageUrl("Upgrade"))}>
              Gerenciar
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-500 text-sm">Upgrade para Premium</p>
              <p className="text-xs text-amber-500/80 mt-0.5">Desbloqueie simulações, IA e muito mais</p>
            </div>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8" onClick={() => navigate(createPageUrl("Upgrade"))}>
              Ver Planos
            </Button>
          </div>
        )}
      </motion.div>

      {/* Menu Groups */}
      {MENU_ITEMS.map((group, gi) => (
        <motion.div
          key={group.group}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + gi * 0.08 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{group.group}</p>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {group.items.map((item) => {
                const Icon = item.icon;
                const locked = item.premium && !isPremium;
                if (locked) {
                  return (
                    <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors opacity-60" onClick={() => navigate(createPageUrl("Upgrade"))}>
                      <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="flex-1 font-medium text-foreground text-sm text-left">{item.label}</span>
                      <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        PRO
                      </span>
                    </button>
                  );
                }
                return (
                  <Link key={item.label} to={createPageUrl(item.page)}>
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors">
                      <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="flex-1 font-medium text-foreground text-sm">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Logout */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Button
          variant="outline"
          className="w-full h-12 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da conta
        </Button>
      </motion.div>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground pb-2">Aury v2.0 · Feito com 💙</p>


    </div>
  );
}
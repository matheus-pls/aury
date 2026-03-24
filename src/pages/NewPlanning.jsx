import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, Calculator, Sparkles,
  Target, Lock, Crown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePremium } from "@/lib/PremiumContext";

// Inline page components (no navigation away, no BackButton headers)
import Goals from "./Goals";
import EmergencyFundInline from "@/components/planning/EmergencyFundInline";
import Simulations from "./Simulations";
import AutoPlanning from "./AutoPlanning";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "goals",
    label: "Metas",
    icon: Target,
    color: "from-purple-500 to-violet-600",
    description: "Defina e acompanhe seus objetivos financeiros",
    premium: false,
    Component: Goals,
  },
  {
    id: "emergency",
    label: "Caixinha",
    icon: Shield,
    color: "from-[#5FBDBD] to-[#4FA9A5]",
    description: "Construa sua reserva de emergência",
    premium: false,
    Component: EmergencyFundInline,
  },
  {
    id: "simulations",
    label: "Simulações",
    icon: Calculator,
    color: "from-[#5FBDBD] to-[#2A4A62]",
    description: "E se eu cortasse isso? E se ganhasse mais?",
    premium: true,
    Component: () => <Simulations inline />,
  },
  {
    id: "autoplan",
    label: "Plano do Mês",
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
    description: "Quanto posso gastar hoje sem comprometer o mês",
    premium: true,
    Component: () => <AutoPlanning inline />,
  },
];

// ─── Locked preview card ──────────────────────────────────────────────────────

function LockedCard({ tab, onUnlock }) {
  const Icon = tab.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-amber-500/30 p-5 flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-foreground">{tab.label}</h3>
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-[10px] flex-shrink-0">
            <Crown className="w-2.5 h-2.5 mr-1" />Premium
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{tab.description}</p>
        <button
          onClick={onUnlock}
          className="text-xs text-amber-500 mt-2 font-semibold hover:underline"
        >
          Desbloquear Premium ✨
        </button>
      </div>
    </motion.div>
  );
}

// ─── Tab selector pill ────────────────────────────────────────────────────────

function TabPill({ tab, isActive, isLocked, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
        isActive
          ? "bg-[#5FBDBD]/15 text-[#5FBDBD]"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {isLocked && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
            <Lock className="w-1.5 h-1.5 text-white" />
          </span>
        )}
      </div>
      <span className="leading-tight whitespace-nowrap">{tab.label}</span>
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#5FBDBD] rounded-full" />
      )}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewPlanning() {
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("goals");

  const goToUpgrade = () => navigate(createPageUrl("Upgrade"));

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
  const isCurrentLocked = currentTab.premium && !isPremium;

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Planejamento</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Organize seu futuro financeiro</p>
          </div>
          {isPremium && (
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-1">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/50" />
              <span className="text-xs font-semibold text-amber-500">Premium</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upgrade banner (free only) */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-500">Desbloqueie Simulações e Plano do Mês</p>
              <p className="text-xs text-amber-500/80">Recursos Premium disponíveis para você</p>
            </div>
            <Button
              size="sm"
              onClick={goToUpgrade}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-3 flex-shrink-0"
            >
              Upgrade
            </Button>
          </div>
        </motion.div>
      )}

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
      >
        {TABS.map((tab) => (
          <TabPill
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            isLocked={tab.premium && !isPremium}
            onClick={() => handleTabClick(tab)}
          />
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (isPremium ? "-premium" : "-free")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {isCurrentLocked ? (
            <div className="space-y-4">
              <LockedCard tab={currentTab} onUnlock={goToUpgrade} />
              {/* Full-page CTA */}
              <div className="rounded-2xl border border-border p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Acesso Premium necessário</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assine o Premium para desbloquear <strong>{currentTab.label}</strong> e todos os outros recursos avançados.
                  </p>
                </div>
                <Button
                  onClick={goToUpgrade}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-11 px-8 font-semibold rounded-xl"
                >
                  Ver planos Premium
                </Button>
              </div>
            </div>
          ) : (
            <currentTab.Component />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
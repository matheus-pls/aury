import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, Calculator, Heart, Sparkles,
  Target, Lock, Crown, ChevronRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Goals from "./Goals";

// Global premium flag — change to true to unlock all features
const IS_PREMIUM = false;

const SECTIONS = [
  {
    id: "goals",
    label: "Metas",
    icon: Target,
    color: "from-purple-500 to-violet-600",
    description: "Defina e acompanhe seus objetivos financeiros",
    premium: false,
  },
  {
    id: "emergency",
    label: "Caixinha",
    icon: Shield,
    color: "from-[#5FBDBD] to-[#4FA9A5]",
    description: "Construa sua reserva de emergência",
    premium: false,
    page: "EmergencyFund",
  },
  {
    id: "tightmonth",
    label: "Mês Apertado",
    icon: Heart,
    color: "from-rose-400 to-pink-500",
    description: "Quando tá difícil, eu te ajudo a priorizar",
    premium: false,
    page: "TightMonth",
  },
  {
    id: "simulations",
    label: "Simulações",
    icon: Calculator,
    color: "from-[#5FBDBD] to-[#2A4A62]",
    description: "E se eu cortasse isso? E se ganhasse mais?",
    premium: true,
    page: "Simulations",
  },
  {
    id: "autoplan",
    label: "Planejamento Auto",
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
    description: "Deixa que eu monto seu plano do mês",
    premium: true,
    page: "AutoPlanning",
  },
];

function PremiumLockedCard({ section }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border p-6 opacity-80">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground">{section.label}</h3>
            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-[10px]">
              <Crown className="w-2.5 h-2.5 mr-1" />Premium
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>
          <p className="text-xs text-amber-500 mt-2 font-medium">Desbloqueie no plano Premium ✨</p>
        </div>
      </div>
      {/* Blurred preview overlay */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] rounded-2xl pointer-events-none" />
    </div>
  );
}

export default function NewPlanning() {
  const [activeSection, setActiveSection] = useState("goals");
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(!IS_PREMIUM);

  const handleSectionClick = (section) => {
    if (section.premium && !IS_PREMIUM) return; // locked
    if (section.id === "goals") {
      setActiveSection("goals");
    } else if (section.page) {
      window.location.href = createPageUrl(section.page);
    }
  };

  const freeModules = SECTIONS.filter(s => !s.premium);
  const premiumModules = SECTIONS.filter(s => s.premium);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Planejamento</h1>
        <p className="text-muted-foreground mt-1 text-sm">Organize seu futuro financeiro</p>
      </motion.div>

      {/* Premium Banner */}
      {showUpgradeBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-500">Desbloqueie o plano completo</p>
              <p className="text-xs text-amber-500/80">Simulações e Planejamento Automático disponíveis no Premium</p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-3 flex-shrink-0"
            >
              Desbloquear
            </Button>
          </div>
        </motion.div>
      )}

      {/* Free Modules */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Disponível</h2>
        {freeModules.map((section, i) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id && section.id === "goals";
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => handleSectionClick(section)}
            >
              <Card className={`cursor-pointer transition-all border group hover:shadow-md ${isActive ? "border-[#5FBDBD] bg-[#5FBDBD]/5" : "border-border hover:border-[#5FBDBD]/50"}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{section.label}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-all ${isActive ? "text-[#5FBDBD] translate-x-0.5" : "text-muted-foreground group-hover:text-[#5FBDBD] group-hover:translate-x-0.5"}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Goals Section (inline) */}
      {activeSection === "goals" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border pt-4"
        >
          <Goals />
        </motion.div>
      )}

      {/* Premium Modules */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Premium</h2>
          <Crown className="w-3.5 h-3.5 text-amber-500" />
        </div>
        {premiumModules.map((section, i) =>
          IS_PREMIUM ? (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => handleSectionClick(section)}
            >
              <Card className="cursor-pointer transition-all border group border-border hover:border-amber-500/50 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{section.label}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <PremiumLockedCard section={section} />
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}
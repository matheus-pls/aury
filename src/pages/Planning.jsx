import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles,
  Shield,
  Calculator,
  ChevronRight,
  Heart,
  Lock,
  Crown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import UpgradeModal from "@/components/UpgradeModal";
import PremiumBadge from "@/components/PremiumBadge";

const PLANNING_MODULES = [
  {
    id: "emergency",
    title: "Caixinha",
    description: "Construa seu colchão de segurança aos poucos",
    icon: Shield,
    color: "from-[#2A4A62] to-[#1B3A52]",
    page: "EmergencyFund",
    premium: false
  },
  {
    id: "tight_month",
    title: "Mês Apertado",
    description: "Quando tá difícil, eu te ajudo a priorizar",
    icon: Heart,
    color: "from-[#1B3A52] to-[#0A2540]",
    page: "TightMonth",
    premium: false
  },
  {
    id: "auto",
    title: "Planejamento Automático",
    description: "Deixa que eu monto seu plano do mês pra você",
    icon: Sparkles,
    color: "from-[#5FBDBD] to-[#4FA9A5]",
    page: "AutoPlanning",
    premium: true
  },
  {
    id: "simulations",
    title: "Simulações de Futuro",
    description: "E se eu cortasse isso? E se eu ganhasse mais?",
    icon: Calculator,
    color: "from-[#5FBDBD] to-[#2A4A62]",
    page: "Simulations",
    premium: true
  },
];

export default function Planning() {
  const [isPremium, setIsPremium] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lockedFeature, setLockedFeature] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => setIsPremium(true /* u?.is_premium || false */)).catch(() => setIsPremium(true));
  }, []);

  const handleClick = (module) => {
    if (isPremium === null) return;
    if (module.premium && !isPremium) {
      setLockedFeature(module.title);
      setShowModal(true);
    } else {
      window.location.href = createPageUrl(module.page);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <BackButton to={createPageUrl("Overview")} className="mb-4" />
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Como você quer se organizar?</h1>
        <p className="text-slate-500 mt-1">Escolha o que faz sentido pro seu momento</p>
      </motion.div>

      {isPremium === false && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              <strong>2 módulos</strong> disponíveis no plano gratuito. Faça upgrade para desbloquear todos.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANNING_MODULES.map((module, index) => {
          const Icon = module.icon;
          const isLocked = module.premium && isPremium === false;
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(module)}
            >
              <Card className={`cursor-pointer transition-all border group bg-white ${isLocked ? 'border-dashed border-slate-200 opacity-80' : 'border-slate-200 hover:shadow-aury hover:border-[#5FBDBD]'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${isLocked ? 'from-slate-200 to-slate-300' : module.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                      {isLocked ? <Lock className="w-8 h-8 text-slate-400" /> : <Icon className="w-8 h-8 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-[#1B3A52]">{module.title}</h3>
                        {isLocked && <PremiumBadge />}
                      </div>
                      <p className="text-sm text-slate-600">{module.description}</p>
                    </div>
                    {isLocked
                      ? <Crown className="w-5 h-5 text-amber-500" />
                      : <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5FBDBD] group-hover:translate-x-1 transition-all" />
                    }
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} feature={lockedFeature} />
    </div>
  );
}
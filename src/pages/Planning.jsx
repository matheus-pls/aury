import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles,
  Calendar,
  Shield,
  Calculator,
  TrendingUp,
  ChevronRight,
  Heart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/BackButton";

const PLANNING_MODULES = [
  {
    id: "auto",
    title: "Planejamento Automático",
    description: "Seu plano financeiro mensal completo e automatizado",
    icon: Sparkles,
    color: "from-[#5FBDBD] to-[#4FA9A5]",
    page: "AutoPlanning"
  },
  {
    id: "tight_month",
    title: "Mês Apertado",
    description: "Plano de sobrevivência financeira com empatia",
    icon: Heart,
    color: "from-[#1B3A52] to-[#0A2540]",
    page: "TightMonth"
  },
  {
    id: "emergency",
    title: "Caixinha",
    description: "Sua segurança para imprevistos",
    icon: Shield,
    color: "from-[#2A4A62] to-[#1B3A52]",
    page: "EmergencyFund"
  },

];

export default function Planning() {
  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton to={createPageUrl("Overview")} className="mb-4" />
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Planejamento</h1>
        <p className="text-slate-500 mt-1">Organize suas finanças de forma inteligente</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANNING_MODULES.map((module, index) => {
          const Icon = module.icon;
          return (
            <Link key={module.id} to={createPageUrl(module.page)}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer hover:shadow-aury transition-all border border-slate-200 hover:border-[#5FBDBD] group bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#1B3A52] mb-1">
                          {module.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {module.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5FBDBD] group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
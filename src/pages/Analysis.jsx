import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  Activity,
  PieChart,
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ANALYSIS_SECTIONS = [
  {
    id: "smart",
    title: "Análise Inteligente",
    description: "Resumo automatizado com destaques e pontos de atenção",
    icon: Sparkles,
    page: "SmartAnalysis",
    gradient: "from-[#5FBDBD] to-[#4FA9A5]"
  },
  {
    id: "behavior",
    title: "Comportamento Financeiro",
    description: "Hábitos, frequências e padrões de comportamento",
    icon: Activity,
    page: "BehaviorAnalysis",
    gradient: "from-[#5FBDBD] to-[#4FA9A5]"
  },
  {
    id: "categories",
    title: "Para onde vai meu dinheiro",
    description: "Veja exatamente quanto você gasta em cada área da sua vida",
    icon: PieChart,
    page: "CategoryDistribution",
    gradient: "from-[#1B3A52] to-[#0A2540]"
  },
  {
    id: "trends",
    title: "Tendências Mensais",
    description: "Evolução mês a mês e projeções futuras",
    icon: TrendingUp,
    page: "MonthlyTrends",
    gradient: "from-[#2A4A62] to-[#1B3A52]"
  },
  {
    id: "patterns",
    title: "Padrões de Consumo",
    description: "Gastos recorrentes e repetições ocultas",
    icon: Calendar,
    page: "ConsumptionPatterns",
    gradient: "from-[#4FA9A5] to-[#2A4A62]"
  }
];

export default function Analysis() {
  return (
    <div className="space-y-8 pb-8">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-aury">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1B3A52]">Análises</h1>
            <p className="text-slate-500 text-sm">Entenda seus padrões financeiros</p>
          </div>
        </div>
      </motion.div>



      {/* Analysis Sections - Compact & Elegant */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1B3A52]">Suas Análises</h2>
        <div className="grid grid-cols-1 gap-3">
          {ANALYSIS_SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link key={section.id} to={createPageUrl(section.page)}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card className="group cursor-pointer hover:shadow-aury transition-all duration-300 border border-slate-200 hover:border-[#5FBDBD]/30 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        {/* Icon with gradient */}
                        <div className={`w-14 h-14 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#1B3A52] text-base mb-1 group-hover:text-[#5FBDBD] transition-colors">
                            {section.title}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            {section.description}
                          </p>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#5FBDBD] group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-8" />
    </div>
  );
}
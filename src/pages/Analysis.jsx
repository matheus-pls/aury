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
    id: "behavior",
    title: "Como eu me comporto",
    description: "Seus hábitos e tendências com dinheiro",
    icon: Activity,
    page: "BehaviorAnalysis",
    gradient: "from-[#667eea] to-[#764ba2]"
  },
  {
    id: "categories",
    title: "Para onde vai meu dinheiro",
    description: "Quanto você gasta em cada área da vida",
    icon: PieChart,
    page: "CategoryDistribution",
    gradient: "from-[#5FBDBD] to-[#4FA9A5]"
  },
  {
    id: "trends",
    title: "Estou melhorando?",
    description: "Sua evolução ao longo do tempo",
    icon: TrendingUp,
    page: "MonthlyTrends",
    gradient: "from-[#f093fb] to-[#f5576c]"
  },
  {
    id: "patterns",
    title: "Quando eu gasto mais",
    description: "Padrões de timing e repetição",
    icon: Calendar,
    page: "ConsumptionPatterns",
    gradient: "from-[#4facfe] to-[#00f2fe]"
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
            <p className="text-slate-500 text-sm">Entenda como você lida com dinheiro</p>
          </div>
        </div>
      </motion.div>



      {/* Analysis Sections - Compact & Elegant */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1B3A52]">O que você quer entender?</h2>
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
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-slate-300 bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Icon with gradient */}
                        <div className={`w-12 h-12 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#1B3A52] mb-0.5 group-hover:text-slate-900 transition-colors">
                            {section.title}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {section.description}
                          </p>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
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
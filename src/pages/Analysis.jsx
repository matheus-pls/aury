import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ANALYSIS_MODULES = [
  {
    id: "behavior",
    title: "Análise de Comportamento",
    description: "Insights sobre seus hábitos financeiros e padrões de gastos",
    icon: TrendingUp,
    color: "from-emerald-500 to-green-600",
    page: "BehaviorAnalysis"
  }
];

export default function Analysis() {
  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Análises</h1>
        <p className="text-slate-500 mt-1">Entenda melhor suas finanças</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ANALYSIS_MODULES.map((module, index) => {
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
                <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#00A8A0] group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                          {module.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {module.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#00A8A0] group-hover:translate-x-1 transition-all" />
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
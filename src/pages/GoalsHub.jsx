import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Target,
  Plane,
  Calculator,
  ChevronRight,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function GoalsHub() {
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.FinancialGoal.filter({ 
      category: 'travel', 
      is_completed: false,
      travel_active: true
    })
  });

  const modules = [
    {
      id: "goals",
      title: "Metas Financeiras",
      description: "Defina e acompanhe seus objetivos financeiros",
      icon: Target,
      color: "from-purple-500 to-purple-600",
      page: "Goals"
    }
  ];

  if (goals.length > 0) {
    modules.push({
      id: "travel",
      title: "Modo Viagem",
      description: "Gerencie gastos da sua viagem ativa",
      icon: Plane,
      color: "from-blue-500 to-blue-600",
      page: "TravelMode",
      badge: "Ativa"
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Metas</h1>
        <p className="text-slate-500 mt-1">Alcance seus objetivos financeiros</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module, index) => {
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-800">
                            {module.title}
                          </h3>
                          {module.badge && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                              {module.badge}
                            </span>
                          )}
                        </div>
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
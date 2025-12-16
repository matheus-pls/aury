import React from "react";
import { motion } from "framer-motion";
import { Shield, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROFILES = [
  {
    id: "conservative",
    name: "Conservador",
    emoji: "🛡️",
    icon: Shield,
    description: "Prioriza segurança e reserva de emergência",
    color: "from-blue-500 to-blue-600",
    features: [
      "20% para reserva de emergência",
      "Foco em estabilidade",
      "Baixo risco"
    ]
  },
  {
    id: "moderate",
    name: "Moderado",
    emoji: "⚖️",
    icon: TrendingUp,
    description: "Equilíbrio entre segurança e crescimento",
    color: "from-[#00A8A0] to-[#008F88]",
    features: [
      "15% para reserva + 10% investimentos",
      "Equilíbrio ideal",
      "Risco moderado"
    ],
    recommended: true
  },
  {
    id: "aggressive",
    name: "Agressivo",
    emoji: "🚀",
    icon: Zap,
    description: "Foco em investimentos e crescimento",
    color: "from-purple-500 to-purple-600",
    features: [
      "20% para investimentos",
      "Máximo crescimento",
      "Maior risco"
    ]
  }
];

export default function ProfileSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
            Escolha seu perfil financeiro
          </h1>
          <p className="text-lg text-slate-600">
            Vamos personalizar o Rendy de acordo com seu estilo
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROFILES.map((profile, index) => {
            const Icon = profile.icon;
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                {profile.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      ⭐ Recomendado
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => onSelect(profile.id)}
                  className={`w-full bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-[#00A8A0] transition-all shadow-sm hover:shadow-xl group ${
                    profile.recommended ? "ring-2 ring-amber-400 ring-offset-4" : ""
                  }`}
                >
                  {/* Header */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profile.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {profile.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {profile.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-left">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00A8A0] mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <div className={`w-full py-3 rounded-xl bg-gradient-to-r ${profile.color} text-white font-semibold flex items-center justify-center gap-2 group-hover:shadow-lg transition-shadow`}>
                    Escolher {profile.name}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 mt-8"
        >
          Não se preocupe, você pode mudar isso depois nas configurações
        </motion.p>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpgradeBanner({ message = "Desbloqueie todo o potencial do Aury", compact = false }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium truncate">{message}</p>
        </div>
        <Button
          size="sm"
          className="h-7 px-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 flex-shrink-0"
        >
          Upgrade
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] rounded-2xl p-6 overflow-hidden shadow-xl"
    >
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div className="relative flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-white font-bold text-lg">Upgrade para Premium</h3>
          </div>
          <p className="text-white/90 text-sm mb-4">{message}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {["Simulações ilimitadas", "Análises avançadas", "Modo Família"].map((tag) => (
              <span key={tag} className="bg-white/20 text-white px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Button
          className="bg-white text-[#1B3A52] hover:bg-white/90 shadow-lg group flex-shrink-0"
        >
          <Crown className="w-4 h-4 mr-2" />
          Ativar Agora
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
}
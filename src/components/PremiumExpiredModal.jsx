import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Brain, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LOCKED_BENEFITS = [
  { icon: Sparkles, label: "Planejamento automático" },
  { icon: TrendingUp, label: "Simulações de futuro" },
  { icon: Brain, label: "Sugestões inteligentes com IA" },
];

export default function PremiumExpiredModal({ open, onClose }) {
  const navigate = useNavigate();

  const handleSeeUpgrade = () => {
    onClose();
    navigate(createPageUrl("Upgrade"));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-6 z-50 max-w-sm mx-auto sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full"
          >
            <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
              {/* Header premium gradient */}
              <div
                className="relative px-6 pt-6 pb-5 text-white"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #1B3A52 100%)" }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Crown className="w-4.5 h-4.5 text-white fill-white/70" />
                  </div>
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Aury Premium</span>
                </div>
                <h2 className="text-xl font-bold leading-snug">Seu teste premium terminou</h2>
                <p className="text-white/75 text-sm mt-1.5 leading-relaxed">
                  Você experimentou os recursos mais avançados da Aury.
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Continue usando a versão gratuita e desbloqueie tudo quando a versão oficial estiver disponível.
                </p>

                {/* Benefícios bloqueados */}
                <div className="space-y-2">
                  {LOCKED_BENEFITS.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 border border-border rounded-xl opacity-60"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <span className="text-sm text-foreground font-medium flex-1">{label}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        PRO
                      </span>
                    </div>
                  ))}
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    className="w-full h-11 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-md shadow-amber-500/20"
                    onClick={handleSeeUpgrade}
                  >
                    Ver benefícios do Premium
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-10 text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={onClose}
                  >
                    Entendi
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
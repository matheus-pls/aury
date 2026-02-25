import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Sparkles, Zap, Shield, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UpgradeModal({ isOpen, onClose, feature = "este recurso" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <Card className="w-full max-w-lg pointer-events-auto relative overflow-hidden border-2 border-[#5FBDBD]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5FBDBD]/5 to-[#1B3A52]/5" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <CardContent className="p-8 relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                >
                  <Crown className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-center text-[#1B3A52] mb-3">
                  Recurso Premium
                </h2>
                
                <p className="text-center text-slate-600 mb-6">
                  <strong>{feature}</strong> está disponível apenas no plano Premium
                </p>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 mb-6">
                  <p className="text-sm font-semibold text-[#1B3A52] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5FBDBD]" />
                    Com Premium você desbloqueia:
                  </p>
                  <div className="space-y-2">
                    {[
                      "Simulações de Futuro ilimitadas",
                      "Índice de Tranquilidade",
                      "Análise de Comportamento",
                      "Modo Família",
                      "Planejamento Automático",
                      "Suporte Prioritário"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      window.location.href = '/upgrade'; // ou redirecionar para página de pagamento
                    }}
                    className="w-full h-12 bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-lg hover:shadow-xl transition-all group"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Ativar Premium Agora
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-700"
                  >
                    Continuar com versão gratuita
                  </Button>
                </div>

                <p className="text-xs text-center text-slate-500 mt-4">
                  A partir de R$ 19,90/mês
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
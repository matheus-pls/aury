import React from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function PremiumGate({ 
  isOpen, 
  onClose, 
  feature,
  description,
  benefits = []
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Recurso Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            {feature || "Este recurso está disponível na versão Premium"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {description && (
            <p className="text-center text-slate-600">{description}</p>
          )}

          {benefits.length > 0 && (
            <div className="bg-gradient-to-br from-[#00A8A0]/5 to-emerald-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00A8A0]" />
                Com o Premium você pode:
              </p>
              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00A8A0] mt-1.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Voltar
            </Button>
            <Link to={createPageUrl("Premium")} className="flex-1">
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                Ver Premium
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente para mostrar badge "Premium" em recursos bloqueados
export function PremiumBadge({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold rounded-full hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm"
    >
      <Crown className="w-3 h-3" />
      Premium
    </button>
  );
}

// Componente para card de recurso bloqueado
export function PremiumFeatureCard({ title, description, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl p-5 border-2 border-dashed border-slate-200 hover:border-amber-400 transition-all group w-full text-left overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-start gap-4">
        <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-amber-100 transition-colors">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-700">{title}</h3>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
      </div>
    </button>
  );
}
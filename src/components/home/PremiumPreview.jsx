import React from "react";
import { Lock, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumPreview({ isPremium }) {
  const navigate = useNavigate();

  if (isPremium) return null;

  return (
    <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden p-5">
      {/* Blurred preview items */}
      <div className="space-y-3 mb-4 select-none pointer-events-none">
        <div className="flex items-center gap-3 opacity-40 blur-[2px]">
          <div className="p-1.5 bg-[#5FBDBD]/20 rounded-lg">
            <TrendingUp className="w-4 h-4 text-[#5FBDBD]" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-foreground/20 rounded-full w-40 mb-1.5" />
            <div className="h-2.5 bg-foreground/10 rounded-full w-24" />
          </div>
          <div className="h-5 bg-emerald-500/30 rounded w-16" />
        </div>
        <div className="flex items-center gap-3 opacity-30 blur-[2px]">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-foreground/20 rounded-full w-48 mb-1.5" />
            <div className="h-2.5 bg-foreground/10 rounded-full w-32" />
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Lock className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Análise Completa</p>
          <p className="text-xs text-muted-foreground">Previsão, sugestões e planejamento automático</p>
        </div>
      </div>

      <Button
        onClick={() => navigate(createPageUrl("Upgrade"))}
        className="w-full h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl"
      >
        <Sparkles className="w-4 h-4 mr-1.5" />
        Ver análise completa
      </Button>
    </div>
  );
}
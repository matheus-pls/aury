import React from "react";
import { Lock, TrendingUp, BarChart2, Sparkles, ArrowRight, Target, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const FEATURES = [
  { icon: TrendingUp, color: "#5FBDBD", label: "Projeção do mês", sub: "Veja quanto vai sobrar ou faltar" },
  { icon: BarChart2, color: "#A78BFA", label: "Análise por categoria", sub: "Onde exatamente seu dinheiro vai" },
  { icon: Target,    color: "#34D399", label: "Simulação de metas", sub: "Quanto guardar pra conquistar o que quer" },
  { icon: Zap,       color: "#FBBF24", label: "Alertas antecipados", sub: "Aviso antes de você estourar o orçamento" },
];

export default function PremiumPreview({ isPremium }) {
  const navigate = useNavigate();

  if (isPremium) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "hsl(220,13%,11%)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Premium</span>
        </div>
        <p className="text-base font-bold text-foreground">Veja o que você está perdendo</p>
        <p className="text-xs text-muted-foreground mt-0.5">Recursos que te ajudam a nunca fechar o mês no vermelho</p>
      </div>

      {/* Feature list — blur nos últimos */}
      <div className="px-5 space-y-3 mb-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const isBlurred = i >= 2;
          return (
            <div
              key={i}
              className="flex items-center gap-3 relative"
              style={{ opacity: isBlurred ? 0.45 : 1, filter: isBlurred ? "blur(2px)" : "none" }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${f.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.sub}</p>
              </div>
              {!isBlurred && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: `${f.color}18`, color: f.color }}>
                  Ver →
                </div>
              )}
            </div>
          );
        })}

        {/* Overlay lock nos últimos */}
        <div className="flex items-center gap-2 pt-1">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400 font-semibold">+2 recursos disponíveis no Premium</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={() => navigate(createPageUrl("Upgrade"))}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          <Sparkles className="w-4 h-4" />
          Simular meu mês com Premium
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">Cancele quando quiser · Sem complicação</p>
      </div>
    </div>
  );
}
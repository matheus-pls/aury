import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente reutilizável para bloquear insights premium
 * Mostra conteúdo borrado + overlay elegante
 */
export default function PremiumInsightLock({ 
  isPremium, 
  children, 
  label = 'Análise avançada',
  blurAmount = 'blur-[4px]'
}) {
  const navigate = useNavigate();

  if (isPremium) {
    return children;
  }

  return (
    <div className="relative">
      <div className={blurAmount + ' select-none pointer-events-none'}>
        {children}
      </div>
      
      <button
        onClick={() => navigate('/Upgrade')}
        className="absolute inset-0 flex items-center justify-center group"
      >
        <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/60 hover:border-border transition-all group-hover:bg-background">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{label}</span>
        </div>
      </button>
    </div>
  );
}
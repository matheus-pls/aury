import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useTheme } from "next-themes";
import { 
  Settings as SettingsIcon, 
  Save, 
  Percent,
  Bell,
  User,
  ChevronRight,
  AlertCircle,
  Share2,
  Star,
  HelpCircle,
  Instagram,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

const RISK_PROFILES = {
  essential: {
    label: "Essencial",
    emoji: "🛡️",
    description: "Para quem prefere ir com calma — Poupa ~10%",
    distribution: { fixed: 50, essential: 25, superfluous: 15, emergency: 7, investment: 3 }
  },
  balanced: {
    label: "Equilibrado",
    emoji: "⚖️",
    description: "Organização sem abrir mão da vida — Poupa ~15%",
    distribution: { fixed: 50, essential: 20, superfluous: 15, emergency: 10, investment: 5 }
  },
  focused: {
    label: "Focado",
    emoji: "⚡",
    description: "Para quem quer avançar mais rápido — Poupa ~25%",
    distribution: { fixed: 50, essential: 15, superfluous: 10, emergency: 15, investment: 10 }
  }
};

const DISTRIBUTION_ITEMS = [
  { key: "fixed_percentage",      label: "Gastos Fixos",           sub: "Aluguel, contas, empréstimos",          color: "bg-[#1B3A52]",   track: "[&>span]:bg-[#1B3A52]" },
  { key: "essential_percentage",  label: "Essenciais Variáveis",   sub: "Alimentação, transporte, saúde",        color: "bg-[#5FBDBD]",   track: "[&>span]:bg-[#5FBDBD]" },
  { key: "superfluous_percentage",label: "Supérfluos",             sub: "Lazer, entretenimento, compras",        color: "bg-amber-500",   track: "[&>span]:bg-amber-500" },
  { key: "emergency_percentage",  label: "Reserva de Emergência",  sub: "Fundo para imprevistos",                color: "bg-emerald-500", track: "[&>span]:bg-emerald-500" },
  { key: "investment_percentage", label: "Investimentos",          sub: "Poupança, ações, fundos",               color: "bg-violet-500",  track: "[&>span]:bg-violet-500" },
];

// Section wrapper with luxurious styling
function Section({ icon: Icon, iconGradient, title, description, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden"
    >
      <div className="px-7 pt-7 pb-5 border-b border-border flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-md flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-foreground text-lg leading-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-7 py-6">{children}</div>
    </motion.div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    risk_profile: "balanced",
    fixed_percentage: 50,
    essential_percentage: 20,
    superfluous_percentage: 15,
    emergency_percentage: 10,
    investment_percentage: 5,
    emergency_fund_goal_months: 6,
    current_emergency_fund: 0,
    notifications_enabled: true
  });

  const [hasChanges, setHasChanges] = useState(false);

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: async () => (await base44.entities.Income.list()) || []
  });

  const totalIncome = incomes.filter(i => i.is_active).reduce((s, i) => s + (i.amount || 0), 0);

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings({
        risk_profile: existingSettings.risk_profile || "balanced",
        fixed_percentage: existingSettings.fixed_percentage || 50,
        essential_percentage: existingSettings.essential_percentage || 20,
        superfluous_percentage: existingSettings.superfluous_percentage || 15,
        emergency_percentage: existingSettings.emergency_percentage || 10,
        investment_percentage: existingSettings.investment_percentage || 5,
        emergency_fund_goal_months: existingSettings.emergency_fund_goal_months || 6,
        current_emergency_fund: existingSettings.current_emergency_fund || 0,
        notifications_enabled: existingSettings.notifications_enabled ?? true
      });
    }
  }, [existingSettings]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserSettings.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['settings']); toast.success("Configurações salvas!"); setHasChanges(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserSettings.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['settings']); toast.success("Configurações atualizadas!"); setHasChanges(false); }
  });

  const handleSave = () => {
    if (existingSettings) updateMutation.mutate({ id: existingSettings.id, data: settings });
    else createMutation.mutate(settings);
  };

  const handlePercentageChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleRiskProfileChange = (profile) => {
    const d = RISK_PROFILES[profile].distribution;
    setSettings(prev => ({ ...prev, risk_profile: profile, fixed_percentage: d.fixed, essential_percentage: d.essential, superfluous_percentage: d.superfluous, emergency_percentage: d.emergency, investment_percentage: d.investment }));
    setHasChanges(true);
  };

  const totalPercentage = settings.fixed_percentage + settings.essential_percentage + settings.superfluous_percentage + settings.emergency_percentage + settings.investment_percentage;
  const isValidDistribution = totalPercentage === 100;

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse max-w-3xl mx-auto">
        <div className="h-10 bg-muted rounded-2xl w-1/3" />
        <div className="h-52 bg-muted rounded-3xl" />
        <div className="h-72 bg-muted rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <BackButton to={createPageUrl("Overview")} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] flex items-center justify-center shadow-lg shadow-[#5FBDBD]/20">
              <SettingsIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Personalize sua experiência financeira</p>
            </div>
          </div>

          {hasChanges && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={handleSave}
                disabled={!isValidDistribution || createMutation.isPending || updateMutation.isPending}
                className="h-10 px-5 bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-lg shadow-[#5FBDBD]/20 hover:opacity-90 transition-opacity"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Perfil de Risco ── */}
      <Section icon={User} iconGradient="from-violet-500 to-purple-600" title="Perfil de Risco" description="Escolha seu perfil — ajustaremos a distribuição automaticamente" delay={0.05}>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 flex gap-3">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-500/90">
            Ao selecionar um perfil, todos os percentuais são ajustados automaticamente. Você pode personalizar depois.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(RISK_PROFILES).map(([key, profile]) => {
            const active = settings.risk_profile === key;
            return (
              <button
                key={key}
                onClick={() => handleRiskProfileChange(key)}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  active
                    ? 'border-[#5FBDBD] bg-gradient-to-br from-[#5FBDBD]/8 to-[#1B3A52]/5 shadow-lg shadow-[#5FBDBD]/10'
                    : 'border-border bg-muted hover:border-border/80 hover:bg-accent'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-[#5FBDBD] rounded-full shadow-sm" />
                )}
                <div className="text-2xl mb-2">{profile.emoji}</div>
                <p className={`font-bold text-base mb-1 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {profile.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{profile.description}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Distribuição da Renda ── */}
      <Section icon={Percent} iconGradient="from-[#5FBDBD] to-[#1B3A52]" title="Distribuição da Renda" description="Defina quanto da sua renda vai para cada categoria" delay={0.1}>

        {/* Total badge */}
        <div className="flex justify-end mb-5">
          <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${
            isValidDistribution
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              : 'bg-red-500/15 text-red-500 border-red-500/30'
          }`}>
            Total: {totalPercentage}%
          </span>
        </div>

        {!isValidDistribution && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-5">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-500">A soma deve ser exatamente 100%</p>
          </div>
        )}

        {/* Visual distribution bar */}
        <div className="flex h-2 rounded-full overflow-hidden mb-7 gap-px">
          {DISTRIBUTION_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`${item.color} transition-all duration-300`}
              style={{ width: `${settings[item.key]}%` }}
            />
          ))}
        </div>

        <div className="space-y-7">
          {DISTRIBUTION_ITEMS.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <Label className="font-semibold text-foreground">{item.label}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">{settings[item.key]}%</span>
                  {totalIncome > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {fmt((totalIncome * settings[item.key]) / 100)}
                    </span>
                  )}
                </div>
              </div>
              <Slider
                value={[settings[item.key]]}
                onValueChange={([value]) => handlePercentageChange(item.key, value)}
                max={100}
                step={1}
                className={item.track}
              />
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Aparência ── */}
      <Section icon={Moon} iconGradient="from-slate-600 to-slate-800" title="Aparência" description="Escolha entre tema claro ou escuro" delay={0.12}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <p className="font-semibold text-foreground">Tema escuro</p>
              <p className="text-sm text-muted-foreground mt-0.5">{theme === "dark" ? "Modo escuro ativado" : "Modo claro ativado"}</p>
            </div>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </Section>

      {/* ── Notificações ── */}
      <Section icon={Bell} iconGradient="from-blue-500 to-indigo-600" title="Notificações" description="Configure alertas e lembretes inteligentes" delay={0.15}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Alertas de limite</p>
            <p className="text-sm text-muted-foreground mt-0.5">Avisos quando ultrapassar limites de categoria</p>
          </div>
          <Switch
            checked={settings.notifications_enabled}
            onCheckedChange={(checked) => {
              setSettings(prev => ({ ...prev, notifications_enabled: checked }));
              setHasChanges(true);
            }}
          />
        </div>
      </Section>

      {/* ── Compartilhar e Suporte ── */}
      <Section icon={Share2} iconGradient="from-[#5FBDBD] to-teal-600" title="Compartilhar e Suporte" description="Conecte-se, compartilhe e obtenha ajuda" delay={0.2}>
        <div className="space-y-2">
          {[
            {
              label: "Convidar Amigos",
              sub: "Compartilhe o Aury",
              icon: Share2,
              gradient: "from-[#5FBDBD] to-[#4FA9A5]",
              hoverBorder: "hover:border-[#5FBDBD]/50",
              hoverIcon: "group-hover:text-[#5FBDBD]",
              onClick: () => {
                const text = "Estou usando o Aury para organizar minhas finanças! Experimente: " + window.location.origin;
                if (navigator.share) {
                  navigator.share({ title: 'Aury', text, url: window.location.origin }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text);
                  toast.success("Link copiado!");
                }
              }
            },
            {
              label: "Avaliar o App",
              sub: "Deixe sua opinião",
              icon: Star,
              gradient: "from-amber-400 to-orange-500",
              hoverBorder: "hover:border-amber-300",
              hoverIcon: "group-hover:text-amber-500",
              href: "https://www.google.com/search?q=avalie+nosso+app",
              external: true
            },
            {
              label: "Ajuda & Suporte",
              sub: "Entre em contato conosco",
              icon: HelpCircle,
              gradient: "from-blue-400 to-blue-600",
              hoverBorder: "hover:border-blue-300",
              hoverIcon: "group-hover:text-blue-500",
              href: "mailto:suporte@aury.app?subject=Preciso de ajuda com o Aury"
            }
          ].map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div className={`w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white ${item.hoverBorder} transition-all group cursor-pointer`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
                {item.external
                  ? <ExternalLink className={`w-4 h-4 text-slate-300 ${item.hoverIcon} transition-colors`} />
                  : <ChevronRight className={`w-4 h-4 text-slate-300 ${item.hoverIcon} transition-colors`} />
                }
              </div>
            );
            if (item.onClick) return <button key={i} onClick={item.onClick} className="w-full">{inner}</button>;
            return <a key={i} href={item.href} target={item.external ? "_blank" : undefined} rel="noopener noreferrer">{inner}</a>;
          })}
        </div>
      </Section>

      {/* ── Redes Sociais ── */}
      <Section icon={Instagram} iconGradient="from-pink-500 to-purple-600" title="Redes Sociais" description="Siga-nos e fique por dentro das novidades" delay={0.25}>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://instagram.com/auryapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40 hover:shadow-md transition-all group"
          >
            <Instagram className="w-5 h-5 text-pink-600 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-pink-700">Instagram</span>
          </a>
          <a
            href="https://wa.me/5511999999999?text=Olá,%20vim%20do%20app%20Aury!"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-green-500/20 bg-green-500/5 hover:border-green-500/40 hover:shadow-md transition-all group"
          >
            <MessageCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-green-700">WhatsApp</span>
          </a>
        </div>
      </Section>

      {/* ── Mobile Save ── */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 lg:hidden z-50"
        >
          <Button
            onClick={handleSave}
            className="w-full h-14 bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-2xl shadow-[#5FBDBD]/30 rounded-2xl text-base"
            disabled={!isValidDistribution || createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar Alterações
          </Button>
        </motion.div>
      )}
    </div>
  );
}
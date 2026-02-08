import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw,
  Percent,
  Shield,
  Bell,
  User,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

const RISK_PROFILES = {
  essential: {
    label: "Essencial",
    emoji: "🛡️",
    description: "Para quem prefere ir com calma - Poupa ~10%",
    distribution: { fixed: 50, essential: 25, superfluous: 15, emergency: 7, investment: 3 }
  },
  balanced: {
    label: "Equilibrado",
    emoji: "⚖️",
    description: "Organização sem abrir mão da vida - Poupa ~15%",
    distribution: { fixed: 50, essential: 20, superfluous: 15, emergency: 10, investment: 5 }
  },
  focused: {
    label: "Focado",
    emoji: "⚡",
    description: "Para quem quer avançar mais rápido - Poupa ~25%",
    distribution: { fixed: 50, essential: 15, superfluous: 10, emergency: 15, investment: 10 }
  }
};

export default function Settings() {
  const queryClient = useQueryClient();
  
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

  // Fetch total income
  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: async () => {
      const result = await base44.entities.Income.list();
      return result || [];
    }
  });

  const totalIncome = incomes
    .filter(income => income.is_active)
    .reduce((sum, income) => sum + (income.amount || 0), 0);

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
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success("Configurações salvas com sucesso!");
      setHasChanges(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success("Configurações atualizadas!");
      setHasChanges(false);
    }
  });

  const handleSave = () => {
    if (existingSettings) {
      updateMutation.mutate({ id: existingSettings.id, data: settings });
    } else {
      createMutation.mutate(settings);
    }
  };

  const handlePercentageChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleRiskProfileChange = (profile) => {
    const distribution = RISK_PROFILES[profile].distribution;
    setSettings(prev => ({
      ...prev,
      risk_profile: profile,
      fixed_percentage: distribution.fixed,
      essential_percentage: distribution.essential,
      superfluous_percentage: distribution.superfluous,
      emergency_percentage: distribution.emergency,
      investment_percentage: distribution.investment
    }));
    setHasChanges(true);
  };

  const totalPercentage = 
    settings.fixed_percentage + 
    settings.essential_percentage + 
    settings.superfluous_percentage + 
    settings.emergency_percentage + 
    settings.investment_percentage;

  const isValidDistribution = totalPercentage === 100;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to={createPageUrl("Overview")} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Configurações</h1>
            <p className="text-slate-500 mt-1">Personalize suas preferências financeiras</p>
          </div>
        {hasChanges && (
          <Button 
            onClick={handleSave}
            className="bg-[#5FBDBD] hover:bg-[#4FA9A5]"
            disabled={!isValidDistribution || createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        )}
        </div>
        </motion.div>

      {/* Risk Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#00A8A0]" />
              Perfil de Risco
            </CardTitle>
            <CardDescription>
              Escolha seu perfil e ajustaremos automaticamente a distribuição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                💡 <strong>Dica:</strong> Ao selecionar um perfil, todas as porcentagens abaixo serão ajustadas automaticamente. Você pode personalizá-las depois se quiser.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() => handleRiskProfileChange(key)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    settings.risk_profile === key
                      ? 'border-[#00A8A0] bg-[#00A8A0]/5 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{profile.emoji}</span>
                    <p className={`font-semibold text-lg ${
                      settings.risk_profile === key ? 'text-[#00A8A0]' : 'text-slate-700'
                    }`}>
                      {profile.label}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-[#00A8A0]" />
                  Distribuição da Renda
                </CardTitle>
                <CardDescription>
                  Ajuste as porcentagens para cada categoria
                </CardDescription>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isValidDistribution 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                Total: {totalPercentage}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isValidDistribution && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  A soma das porcentagens deve ser igual a 100%
                </p>
              </div>
            )}

            {/* Fixed */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Gastos Fixos</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{settings.fixed_percentage}%</span>
                  {totalIncome > 0 && (
                    <span className="text-xs text-slate-500">
                      ({formatCurrency((totalIncome * settings.fixed_percentage) / 100)})
                    </span>
                  )}
                </div>
              </div>
              <Slider
                value={[settings.fixed_percentage]}
                onValueChange={([value]) => handlePercentageChange('fixed_percentage', value)}
                max={100}
                step={1}
                className="[&>span]:bg-[#0A1A3A]"
              />
              <p className="text-xs text-slate-500">Aluguel, contas fixas, empréstimos</p>
            </div>

            {/* Essential */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Essenciais Variáveis</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{settings.essential_percentage}%</span>
                  {totalIncome > 0 && (
                    <span className="text-xs text-slate-500">
                      ({formatCurrency((totalIncome * settings.essential_percentage) / 100)})
                    </span>
                  )}
                </div>
              </div>
              <Slider
                value={[settings.essential_percentage]}
                onValueChange={([value]) => handlePercentageChange('essential_percentage', value)}
                max={100}
                step={1}
                className="[&>span]:bg-[#00A8A0]"
              />
              <p className="text-xs text-slate-500">Alimentação, transporte, saúde</p>
            </div>

            {/* Superfluous */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Supérfluos</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{settings.superfluous_percentage}%</span>
                  {totalIncome > 0 && (
                    <span className="text-xs text-slate-500">
                      ({formatCurrency((totalIncome * settings.superfluous_percentage) / 100)})
                    </span>
                  )}
                </div>
              </div>
              <Slider
                value={[settings.superfluous_percentage]}
                onValueChange={([value]) => handlePercentageChange('superfluous_percentage', value)}
                max={100}
                step={1}
                className="[&>span]:bg-amber-500"
              />
              <p className="text-xs text-slate-500">Lazer, entretenimento, compras não essenciais</p>
            </div>

            {/* Emergency */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Reserva de Emergência</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{settings.emergency_percentage}%</span>
                  {totalIncome > 0 && (
                    <span className="text-xs text-slate-500">
                      ({formatCurrency((totalIncome * settings.emergency_percentage) / 100)})
                    </span>
                  )}
                </div>
              </div>
              <Slider
                value={[settings.emergency_percentage]}
                onValueChange={([value]) => handlePercentageChange('emergency_percentage', value)}
                max={100}
                step={1}
                className="[&>span]:bg-green-500"
              />
              <p className="text-xs text-slate-500">Fundo para imprevistos</p>
            </div>

            {/* Investment */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Investimentos</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{settings.investment_percentage}%</span>
                  {totalIncome > 0 && (
                    <span className="text-xs text-slate-500">
                      ({formatCurrency((totalIncome * settings.investment_percentage) / 100)})
                    </span>
                  )}
                </div>
              </div>
              <Slider
                value={[settings.investment_percentage]}
                onValueChange={([value]) => handlePercentageChange('investment_percentage', value)}
                max={100}
                step={1}
                className="[&>span]:bg-violet-500"
              />
              <p className="text-xs text-slate-500">Poupança, ações, fundos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>



      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#00A8A0]" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure alertas e lembretes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Alertas de limite</p>
                <p className="text-sm text-slate-500">Receba avisos quando ultrapassar limites</p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({ ...prev, notifications_enabled: checked }));
                  setHasChanges(true);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button (Mobile) */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 lg:hidden"
        >
          <Button 
            onClick={handleSave}
            className="w-full bg-[#00A8A0] hover:bg-[#008F88] shadow-lg"
            disabled={!isValidDistribution || createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </motion.div>
      )}
    </div>
  );
}
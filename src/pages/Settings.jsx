import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

const RISK_PROFILES = {
  conservative: {
    label: "Conservador",
    description: "Prioriza segurança e reserva de emergência",
    distribution: { fixed: 50, essential: 20, superfluous: 5, emergency: 20, investment: 5 }
  },
  moderate: {
    label: "Moderado",
    description: "Equilíbrio entre segurança e crescimento",
    distribution: { fixed: 50, essential: 15, superfluous: 10, emergency: 15, investment: 10 }
  },
  aggressive: {
    label: "Agressivo",
    description: "Foco em investimentos e crescimento",
    distribution: { fixed: 45, essential: 15, superfluous: 10, emergency: 10, investment: 20 }
  }
};

export default function Settings() {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    risk_profile: "moderate",
    fixed_percentage: 50,
    essential_percentage: 15,
    superfluous_percentage: 10,
    emergency_percentage: 15,
    investment_percentage: 10,
    emergency_fund_goal_months: 6,
    current_emergency_fund: 0,
    notifications_enabled: true
  });

  const [hasChanges, setHasChanges] = useState(false);

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
        risk_profile: existingSettings.risk_profile || "moderate",
        fixed_percentage: existingSettings.fixed_percentage || 50,
        essential_percentage: existingSettings.essential_percentage || 15,
        superfluous_percentage: existingSettings.superfluous_percentage || 10,
        emergency_percentage: existingSettings.emergency_percentage || 15,
        investment_percentage: existingSettings.investment_percentage || 10,
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
      ...distribution
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500 mt-1">Personalize suas preferências financeiras</p>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSave}
            className="bg-[#00A8A0] hover:bg-[#008F88]"
            disabled={!isValidDistribution || createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() => handleRiskProfileChange(key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.risk_profile === key
                      ? 'border-[#00A8A0] bg-[#00A8A0]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className={`font-semibold ${
                    settings.risk_profile === key ? 'text-[#00A8A0]' : 'text-slate-700'
                  }`}>
                    {profile.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{profile.description}</p>
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
              <div className="flex justify-between">
                <Label>Gastos Fixos</Label>
                <span className="text-sm font-semibold text-slate-700">{settings.fixed_percentage}%</span>
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
              <div className="flex justify-between">
                <Label>Essenciais Variáveis</Label>
                <span className="text-sm font-semibold text-slate-700">{settings.essential_percentage}%</span>
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
              <div className="flex justify-between">
                <Label>Supérfluos</Label>
                <span className="text-sm font-semibold text-slate-700">{settings.superfluous_percentage}%</span>
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
              <div className="flex justify-between">
                <Label>Reserva de Emergência</Label>
                <span className="text-sm font-semibold text-slate-700">{settings.emergency_percentage}%</span>
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
              <div className="flex justify-between">
                <Label>Investimentos</Label>
                <span className="text-sm font-semibold text-slate-700">{settings.investment_percentage}%</span>
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

      {/* Emergency Fund Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00A8A0]" />
              Reserva de Emergência
            </CardTitle>
            <CardDescription>
              Configure sua meta de reserva de emergência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta em meses de despesas</Label>
                <Select
                  value={settings.emergency_fund_goal_months.toString()}
                  onValueChange={(value) => {
                    setSettings(prev => ({ ...prev, emergency_fund_goal_months: parseInt(value) }));
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12].map(months => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} meses
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Recomendado: 6 meses de gastos fixos
                </p>
              </div>
              <div className="space-y-2">
                <Label>Valor atual da reserva</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={settings.current_emergency_fund}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, current_emergency_fund: parseFloat(e.target.value) || 0 }));
                    setHasChanges(true);
                  }}
                />
                <p className="text-xs text-slate-500">
                  Quanto você já tem guardado
                </p>
              </div>
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
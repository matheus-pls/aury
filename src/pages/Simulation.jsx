import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Target,
  PiggyBank,
  LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function Simulation() {
  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.UserSettings.list();
      return result[0] || null;
    }
  });

  const currentIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  const [simulation, setSimulation] = useState({
    newIncome: currentIncome,
    fixedReduction: 0,
    superfluousReduction: 0,
    savingsMonths: 12
  });

  useEffect(() => {
    if (currentIncome > 0) {
      setSimulation(prev => ({ ...prev, newIncome: currentIncome }));
    }
  }, [currentIncome]);

  const defaultSettings = {
    fixed_percentage: 50,
    essential_percentage: 15,
    superfluous_percentage: 10,
    emergency_percentage: 15,
    investment_percentage: 10
  };

  const activeSettings = settings || defaultSettings;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate current distribution
  const calculateDistribution = (income) => {
    return {
      fixed: income * (activeSettings.fixed_percentage / 100),
      essential: income * (activeSettings.essential_percentage / 100),
      superfluous: income * (activeSettings.superfluous_percentage / 100),
      emergency: income * (activeSettings.emergency_percentage / 100),
      investment: income * (activeSettings.investment_percentage / 100)
    };
  };

  const currentDistribution = calculateDistribution(currentIncome);
  const simulatedDistribution = calculateDistribution(simulation.newIncome);

  // Calculate with reductions
  const adjustedFixed = simulatedDistribution.fixed * (1 - simulation.fixedReduction / 100);
  const adjustedSuperfluous = simulatedDistribution.superfluous * (1 - simulation.superfluousReduction / 100);
  const savings = (simulatedDistribution.fixed - adjustedFixed) + (simulatedDistribution.superfluous - adjustedSuperfluous);

  // Project savings over time
  const projectedSavings = [];
  let accumulated = 0;
  for (let i = 1; i <= simulation.savingsMonths; i++) {
    accumulated += (simulatedDistribution.emergency + simulatedDistribution.investment + savings);
    projectedSavings.push({
      month: `Mês ${i}`,
      value: accumulated,
      emergency: simulatedDistribution.emergency * i,
      investment: (simulatedDistribution.investment + savings) * i
    });
  }

  const incomeDiff = simulation.newIncome - currentIncome;
  const incomeDiffPercentage = currentIncome > 0 ? ((incomeDiff / currentIncome) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Simulação</h1>
        <p className="text-slate-500 mt-1">Simule cenários e planeje seu futuro financeiro</p>
      </motion.div>

      <Tabs defaultValue="income" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="income">Renda</TabsTrigger>
          <TabsTrigger value="reduction">Economia</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
        </TabsList>

        {/* Income Simulation */}
        <TabsContent value="income" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#00A8A0]" />
                    Simular Nova Renda
                  </CardTitle>
                  <CardDescription>
                    Veja como ficaria sua distribuição com uma renda diferente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Renda Atual</Label>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800">{formatCurrency(currentIncome)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newIncome">Nova Renda</Label>
                    <Input
                      id="newIncome"
                      type="number"
                      value={simulation.newIncome}
                      onChange={(e) => setSimulation({ ...simulation, newIncome: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  {incomeDiff !== 0 && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      incomeDiff > 0 ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {incomeDiff > 0 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className={`font-semibold ${incomeDiff > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {incomeDiff > 0 ? '+' : ''}{formatCurrency(incomeDiff)}
                        </p>
                        <p className={`text-xs ${incomeDiff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {incomeDiffPercentage > 0 ? '+' : ''}{incomeDiffPercentage.toFixed(1)}% de variação
                        </p>
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={() => setSimulation({ ...simulation, newIncome: currentIncome })}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resetar para Renda Atual
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo de Distribuição</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Gastos Fixos", key: "fixed", color: "bg-[#0A1A3A]" },
                      { label: "Essenciais", key: "essential", color: "bg-[#00A8A0]" },
                      { label: "Supérfluos", key: "superfluous", color: "bg-amber-500" },
                      { label: "Reserva", key: "emergency", color: "bg-green-500" },
                      { label: "Investimentos", key: "investment", color: "bg-violet-500" }
                    ].map(item => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm text-slate-600">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">{formatCurrency(currentDistribution[item.key])}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className={`font-semibold ${
                              simulatedDistribution[item.key] > currentDistribution[item.key] 
                                ? 'text-emerald-600' 
                                : simulatedDistribution[item.key] < currentDistribution[item.key]
                                  ? 'text-red-600'
                                  : 'text-slate-700'
                            }`}>
                              {formatCurrency(simulatedDistribution[item.key])}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Reduction Simulation */}
        <TabsContent value="reduction" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00A8A0]" />
                    Simular Redução de Gastos
                  </CardTitle>
                  <CardDescription>
                    Veja quanto você pode economizar reduzindo gastos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Reduzir Gastos Fixos</Label>
                        <span className="text-sm font-semibold text-slate-700">{simulation.fixedReduction}%</span>
                      </div>
                      <Slider
                        value={[simulation.fixedReduction]}
                        onValueChange={([value]) => setSimulation({ ...simulation, fixedReduction: value })}
                        max={50}
                        step={1}
                      />
                      <p className="text-xs text-slate-500">
                        Economia: {formatCurrency(simulatedDistribution.fixed * simulation.fixedReduction / 100)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Reduzir Supérfluos</Label>
                        <span className="text-sm font-semibold text-slate-700">{simulation.superfluousReduction}%</span>
                      </div>
                      <Slider
                        value={[simulation.superfluousReduction]}
                        onValueChange={([value]) => setSimulation({ ...simulation, superfluousReduction: value })}
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-slate-500">
                        Economia: {formatCurrency(simulatedDistribution.superfluous * simulation.superfluousReduction / 100)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <PiggyBank className="w-5 h-5" />
                    Potencial de Economia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-sm text-emerald-600 mb-2">Economia Mensal Extra</p>
                    <p className="text-4xl font-bold text-emerald-700">{formatCurrency(savings)}</p>
                    <p className="text-sm text-emerald-600 mt-4">
                      Em 12 meses: <span className="font-semibold">{formatCurrency(savings * 12)}</span>
                    </p>
                  </div>

                  <div className="border-t border-emerald-200 pt-4 mt-4">
                    <h4 className="font-medium text-emerald-800 mb-3">Nova Distribuição</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Gastos Fixos</span>
                        <span className="font-medium">{formatCurrency(adjustedFixed)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Supérfluos</span>
                        <span className="font-medium">{formatCurrency(adjustedSuperfluous)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Disponível p/ Investir</span>
                        <span className="font-bold text-emerald-800">
                          {formatCurrency(simulatedDistribution.emergency + simulatedDistribution.investment + savings)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Projection */}
        <TabsContent value="projection" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-[#00A8A0]" />
                      Projeção de Economia
                    </CardTitle>
                    <CardDescription>
                      Veja como seu patrimônio pode crescer ao longo do tempo
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Período:</Label>
                    <select
                      value={simulation.savingsMonths}
                      onChange={(e) => setSimulation({ ...simulation, savingsMonths: parseInt(e.target.value) })}
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                      <option value={24}>24 meses</option>
                      <option value={36}>36 meses</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectedSavings}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A8A0" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00A8A0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        labelStyle={{ color: '#64748B' }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#00A8A0"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        name="Total Acumulado"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Em 6 meses</p>
                    <p className="text-lg font-bold text-slate-800">
                      {formatCurrency((simulatedDistribution.emergency + simulatedDistribution.investment + savings) * 6)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Em 1 ano</p>
                    <p className="text-lg font-bold text-[#00A8A0]">
                      {formatCurrency((simulatedDistribution.emergency + simulatedDistribution.investment + savings) * 12)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Em 2 anos</p>
                    <p className="text-lg font-bold text-slate-800">
                      {formatCurrency((simulatedDistribution.emergency + simulatedDistribution.investment + savings) * 24)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
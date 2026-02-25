import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Scissors, TrendingUp, TrendingDown, Clock,
  Target, ArrowRight, ChevronLeft, Zap, BarChart3,
  Heart, Calendar, Lightbulb, ArrowUpRight, Coins, AlertTriangle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";
import { createPageUrl } from "@/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ─── Sub-sim definitions ─────────────────────────────────────────────────────

const ADJUSTMENT_SIMS = [
  {
    id: "cost_of_time",
    title: "Quanto vale meu tempo?",
    description: "Converta um gasto em horas reais de trabalho",
    icon: Clock,
    color: "from-violet-500 to-purple-600",
    light: "bg-violet-50",
    border: "border-violet-200",
    prompt: "Quanto é o gasto que você quer analisar?",
    placeholder: "Ex: 350",
    hint: "Vou mostrar quantas horas da sua vida você trocou por isso"
  },
  {
    id: "cut_specific",
    title: "Cortar um gasto",
    description: "Veja o impacto real de eliminar algo específico",
    icon: Scissors,
    color: "from-rose-500 to-pink-600",
    light: "bg-rose-50",
    border: "border-rose-200",
    prompt: "Quanto é esse gasto por mês?",
    placeholder: "Ex: 80",
    hint: "Ex: streaming, delivery, assinatura"
  },
  {
    id: "reduce_category",
    title: "Reduzir supérfluos",
    description: "Escolha um % de corte e veja o que muda",
    icon: TrendingDown,
    color: "from-amber-500 to-orange-500",
    light: "bg-amber-50",
    border: "border-amber-200",
    prompt: "Quanto % você quer cortar dos supérfluos?",
    placeholder: "Ex: 30",
    hint: "Um número entre 1 e 100"
  }
];

const EVOLUTION_SIMS = [
  {
    id: "new_income",
    title: "E se eu ganhasse mais?",
    description: "Veja como uma renda maior muda seus próximos anos",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-600",
    light: "bg-emerald-50",
    border: "border-emerald-200",
    prompt: "Qual seria sua nova renda mensal?",
    placeholder: "Ex: 7500",
    hint: "Coloque o valor total mensal com o aumento"
  },
  {
    id: "inverse_goal",
    title: "Meta Inversa",
    description: "Defina quanto quer sobrar. Eu calculo o que muda.",
    icon: Target,
    color: "from-[#5FBDBD] to-[#1B3A52]",
    light: "bg-teal-50",
    border: "border-teal-200",
    prompt: "Quanto você quer sobrar por mês?",
    placeholder: "Ex: 1500",
    hint: "Defina seu sobra ideal e veja o que precisa mudar"
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Simulations() {
  const [activeBlock, setActiveBlock] = useState(null); // 'projection' | 'adjustments' | 'evolution'
  const [activeSim, setActiveSim] = useState(null);
  const [simValue, setSimValue] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [result, setResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.Expense.list() });
  const { data: income = [] } = useQuery({ queryKey: ["incomes"], queryFn: () => base44.entities.Income.list() });
  const { data: goals = [] } = useQuery({ queryKey: ["goals"], queryFn: () => base44.entities.FinancialGoal.list() });

  const activeGoals = goals.filter((g) => !g.is_completed);

  // ─── Computed base data ───────────────────────────────────────────────────

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const monthlyIncome = income.filter((i) => i.is_active).reduce((s, i) => s + (i.amount || 0), 0);
  const monthlyExpenses = expenses.filter((e) => e.month_year === currentMonth).reduce((s, e) => s + (e.amount || 0), 0);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const superfluousExpenses = expenses.filter((e) => e.month_year === currentMonth && e.category === "superfluous").reduce((s, e) => s + (e.amount || 0), 0);
  const hourlyRate = monthlyIncome / 176; // 22 dias x 8h
  const spentPct = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

  // ─── Block preview data ───────────────────────────────────────────────────

  const projectionPreview = monthlySavings > 0
    ? `Você pode acumular ${fmt(monthlySavings * 12)} em 1 ano`
    : monthlyIncome === 0 ? "Adicione sua renda para ver a projeção" : "Controle os gastos para ter sobra";

  const adjustmentPreview = superfluousExpenses > 0
    ? `Reduzindo 30% dos supérfluos: +${fmt(superfluousExpenses * 0.3 * 12)}/ano`
    : "Calcule o impacto de cada corte";

  const evolutionPreview = monthlyIncome > 0
    ? `+10% de renda = ${fmt(monthlyIncome * 0.1 * 12)} extras por ano`
    : "Simule cenários de crescimento";

  // ─── Simulators ──────────────────────────────────────────────────────────

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const val = parseFloat(simValue) || 0;
      let res = null;

      if (activeSim.id === "cost_of_time") {
        const hours = val / hourlyRate;
        const days = hours / 8;
        const weeks = days / 5;
        const annualOccurrences = 12;
        const annualCost = val * annualOccurrences;
        const annualHours = (annualCost / hourlyRate);
        const annualDays = annualHours / 8;

        let timeStr = "";
        let phrase = "";
        if (hours < 1) { timeStr = `${Math.round(hours * 60)} minutos`; phrase = "É rápido, mas no acumulado pesa."; }
        else if (hours < 8) { timeStr = `${hours.toFixed(1)} horas`; phrase = "Vale a pena? Você decide."; }
        else if (days < 22) { timeStr = `${days.toFixed(1)} dias de trabalho`; phrase = days > 7 ? "Mais de uma semana da sua vida. Pense nisso." : "Vários dias para pagar isso."; }
        else { timeStr = `${weeks.toFixed(1)} semanas`; phrase = "Quase um mês de trabalho vai para isso todo ano."; }

        res = {
          simId: "cost_of_time",
          headline: `${fmt(val)} = ${timeStr}`,
          phrase,
          impact: days > 7 ? "high" : days > 2 ? "medium" : "low",
          timeline: [
            { label: "1 ano gastando isso", value: fmt(annualCost), sub: `${annualDays.toFixed(0)} dias de trabalho`, highlight: true },
            { label: "Em 3 anos", value: fmt(annualCost * 3), sub: `${(annualDays * 3).toFixed(0)} dias trabalhando só pra isso` },
            { label: "Em 5 anos", value: fmt(annualCost * 5), sub: `${(annualDays * 5 / 5).toFixed(0)} semanas por ano` }
          ],
          extras: [
            { label: "Sua hora vale", value: fmt(hourlyRate) },
            { label: "Horas neste gasto", value: `${hours.toFixed(1)}h` },
            { label: "Dias de trabalho", value: `${days.toFixed(1)}` },
            { label: "Semanas de trabalho", value: `${weeks.toFixed(2)}` }
          ]
        };
      }

      if (activeSim.id === "cut_specific") {
        const savedYear1 = val * 12;
        const savedYear3 = val * 36;
        const savedYear5 = val * 60;
        const newSavings = monthlySavings + val;
        const pctOfIncome = monthlyIncome > 0 ? (val / monthlyIncome) * 100 : 0;
        const phrase = val > monthlyIncome * 0.1
          ? "Esse corte muda o jogo. Vale muito a pena."
          : val > 0 ? `Pode parecer pouco, mas acumula ${fmt(savedYear1)} em 1 ano.`
          : "Coloque um valor pra ver o impacto";

        res = {
          simId: "cut_specific",
          headline: `Cortando ${fmt(val)}/mês`,
          phrase,
          impact: val > monthlyIncome * 0.15 ? "high" : val > monthlyIncome * 0.05 ? "medium" : "low",
          timeline: [
            { label: "Em 1 ano", value: fmt(savedYear1), sub: `Nova sobra mensal: ${fmt(newSavings)}`, highlight: true },
            { label: "Em 3 anos", value: fmt(savedYear3), sub: `${pctOfIncome.toFixed(1)}% da sua renda liberada` },
            { label: "Em 5 anos", value: fmt(savedYear5), sub: "Acumulado com disciplina" }
          ],
          extras: [
            { label: "Economia mensal", value: fmt(val) },
            { label: "Nova sobra/mês", value: fmt(newSavings) },
            { label: "% da renda", value: `${pctOfIncome.toFixed(1)}%` }
          ],
          goalId: selectedGoal
        };
      }

      if (activeSim.id === "reduce_category") {
        const pct = val;
        const saved = superfluousExpenses * (pct / 100);
        const newSavings = monthlySavings + saved;
        const phrase = pct >= 50
          ? "Cortar metade dos supérfluos é desafiador, mas transforma."
          : pct >= 25 ? "Uma redução equilibrada. Dá pra viver bem assim."
          : pct > 0 ? "Pequenos cortes já constroem hábitos melhores."
          : "Escolha uma porcentagem";

        res = {
          simId: "reduce_category",
          headline: `−${pct}% dos supérfluos`,
          phrase,
          impact: pct >= 40 ? "high" : pct >= 20 ? "medium" : "low",
          timeline: [
            { label: "Em 1 ano", value: fmt(saved * 12), sub: `Nova sobra: ${fmt(newSavings)}/mês`, highlight: true },
            { label: "Em 3 anos", value: fmt(saved * 36), sub: `Cortando ${fmt(saved)}/mês consistentemente` },
            { label: "Em 5 anos", value: fmt(saved * 60), sub: "A disciplina vira patrimônio" }
          ],
          extras: [
            { label: "Supérfluos atuais", value: fmt(superfluousExpenses) },
            { label: "Economia/mês", value: fmt(saved) },
            { label: "Nova sobra/mês", value: fmt(newSavings) }
          ],
          goalId: selectedGoal
        };
      }

      if (activeSim.id === "new_income") {
        const newInc = val;
        const increase = newInc - monthlyIncome;
        const newSavings = newInc - monthlyExpenses;
        const pct = monthlyIncome > 0 ? (increase / monthlyIncome) * 100 : 0;
        const phrase = pct > 30
          ? "Isso muda tudo. Uma nova fase da sua vida."
          : pct > 15 ? "Um salto real. O longo prazo te agradece."
          : pct > 0 ? "Toda renda extra conta. É um avanço."
          : "Coloque a nova renda para simular";

        res = {
          simId: "new_income",
          headline: `Ganhando ${fmt(newInc)}/mês`,
          phrase,
          impact: pct > 30 ? "high" : pct > 15 ? "medium" : "low",
          timeline: [
            { label: "Em 1 ano", value: fmt(newSavings * 12), sub: `+${fmt(increase * 12)} em relação à renda atual`, highlight: true },
            { label: "Em 3 anos", value: fmt(newSavings * 36), sub: `Aumento de ${pct.toFixed(0)}% na renda` },
            { label: "Em 5 anos", value: fmt(newSavings * 60), sub: "Com os mesmos hábitos de hoje" }
          ],
          extras: [
            { label: "Aumento mensal", value: fmt(increase) },
            { label: "Nova sobra/mês", value: fmt(newSavings) },
            { label: "Crescimento", value: `+${pct.toFixed(0)}%` }
          ],
          goalId: selectedGoal
        };
      }

      if (activeSim.id === "inverse_goal") {
        const desired = val;
        const gap = desired - monthlySavings;
        const needsCut = gap > 0 && monthlyExpenses > 0;
        const phrase = gap <= 0
          ? "Você já está sobrando isso. Que tal aumentar a meta?"
          : gap < monthlyIncome * 0.1 ? "Pequeno ajuste. Totalmente viável."
          : gap < monthlyIncome * 0.25 ? "Precisa de atenção, mas é possível."
          : "Vai exigir esforço real. Mas você pode chegar lá.";

        res = {
          simId: "inverse_goal",
          headline: `Sobrar ${fmt(desired)}/mês`,
          phrase,
          impact: gap > monthlyIncome * 0.25 ? "high" : gap > monthlyIncome * 0.1 ? "medium" : "low",
          inverseData: {
            currentSavings: monthlySavings,
            desired,
            gap,
            cutNeeded: gap > 0 ? gap : 0,
            incomeNeeded: gap > 0 ? monthlyIncome + gap : monthlyIncome,
            feasibilityPct: monthlyIncome > 0 ? Math.min((desired / monthlyIncome) * 100, 100) : 0
          },
          timeline: [
            { label: "Meta por mês", value: fmt(desired), sub: `Você sobra hoje: ${fmt(monthlySavings)}`, highlight: true },
            { label: "Em 1 ano sobrando isso", value: fmt(desired * 12), sub: "Acumulado anual" },
            { label: "Em 3 anos", value: fmt(desired * 36), sub: "Com disciplina constante" }
          ],
          extras: []
        };
      }

      setResult(res);
      setIsSimulating(false);
    }, 1400);
  };

  const reset = (clearBlock = false) => {
    setResult(null);
    setSimValue("");
    setSelectedGoal("");
    setActiveSim(null);
    if (clearBlock) setActiveBlock(null);
  };

  // ─── Goal impact helper ───────────────────────────────────────────────────

  const getGoalImpact = (monthlyExtra) => {
    if (!selectedGoal || !monthlyExtra) return null;
    const goal = activeGoals.find((g) => g.id === selectedGoal);
    if (!goal) return null;
    const remaining = goal.target_amount - (goal.current_amount || 0);
    const before = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
    const after = (monthlySavings + monthlyExtra) > 0 ? Math.ceil(remaining / (monthlySavings + monthlyExtra)) : null;
    return { title: goal.title, before, after, saved: before && after ? before - after : 0 };
  };

  // ─── Projection Block (inline, no sub-sim) ────────────────────────────────

  const ProjectionView = () => {
    const rows = [
      { label: "Em 3 meses", multiplier: 3, color: "text-[#5FBDBD]" },
      { label: "Em 6 meses", multiplier: 6, color: "text-emerald-600" },
      { label: "Em 12 meses", multiplier: 12, color: "text-[#1B3A52]" }
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveBlock(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#1B3A52]">Projeção Atual</h2>
            <p className="text-sm text-slate-500">Mantendo o padrão de hoje</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-2xl p-5 border border-[#5FBDBD]/20">
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">Renda/mês</p>
              <p className="font-bold text-[#1B3A52]">{fmt(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Gastos/mês</p>
              <p className="font-bold text-rose-600">{fmt(monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Sobra/mês</p>
              <p className={`font-bold ${monthlySavings >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(monthlySavings)}</p>
            </div>
          </div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{spentPct.toFixed(0)}% da renda gasto</span>
            <span>{(100 - spentPct).toFixed(0)}% sobrando</span>
          </div>
          <Progress value={Math.min(spentPct, 100)} className="h-2" />
        </div>

        <div className="space-y-3">
          {rows.map(({ label, multiplier, color }, i) => {
            const accumulated = monthlySavings * multiplier;
            const totalExpenses = monthlyExpenses * multiplier;
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                  <span className={`text-xl font-bold ${accumulated >= 0 ? color : "text-red-500"}`}>
                    {fmt(accumulated)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>Gastos acumulados: <span className="font-semibold text-slate-700">{fmt(totalExpenses)}</span></div>
                  <div className="text-right">Entrada total: <span className="font-semibold text-slate-700">{fmt(monthlyIncome * multiplier)}</span></div>
                </div>
                {accumulated > 0 && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    {multiplier === 3 ? "Um bom começo de reserva" : multiplier === 6 ? "Meio ano de disciplina vale isso" : "Um ano construindo o seu futuro"}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {monthlySavings <= 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Os gastos superam a renda</p>
              <p className="text-xs text-amber-700 mt-1">Use "Ajustes Inteligentes" para simular cortes e mudar esse cenário.</p>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ─── Sub-sim selector view ───────────────────────────────────────────────

  const SubSimSelector = ({ sims, blockTitle, blockDesc }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setActiveBlock(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#1B3A52]">{blockTitle}</h2>
          <p className="text-sm text-slate-500">{blockDesc}</p>
        </div>
      </div>
      <div className="space-y-3">
        {sims.map((sim, i) => {
          const Icon = sim.icon;
          return (
            <motion.div
              key={sim.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveSim(sim)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-[#5FBDBD]/40 cursor-pointer transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sim.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1B3A52] mb-1">{sim.title}</h3>
                  <p className="text-sm text-slate-500">{sim.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  // ─── Input view ───────────────────────────────────────────────────────────

  const InputView = () => {
    const Icon = activeSim.icon;
    const showGoalSelector = activeSim.id !== "cost_of_time" && activeSim.id !== "inverse_goal" && activeGoals.length > 0;
    const isInverse = activeSim.id === "inverse_goal";

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveSim(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeSim.color} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[#1B3A52]">{activeSim.title}</h2>
            <p className="text-xs text-slate-500">{activeSim.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{activeSim.prompt}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {activeSim.id === "reduce_category" ? "%" : "R$"}
              </span>
              <Input
                type="number"
                placeholder={activeSim.placeholder}
                value={simValue}
                onChange={(e) => setSimValue(e.target.value)}
                className="h-13 text-lg pl-10 border-slate-200 focus:border-[#5FBDBD]"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{activeSim.hint}</p>
          </div>

          {activeSim.id === "cost_of_time" && monthlyIncome > 0 && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
              <p className="text-xs text-violet-700 font-medium mb-1">Sua hora vale</p>
              <p className="text-xl font-bold text-violet-900">{fmt(hourlyRate)}</p>
              <p className="text-xs text-violet-600 mt-1">Baseado em 176h/mês de trabalho</p>
            </div>
          )}

          {activeSim.id === "reduce_category" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs text-amber-700 font-medium mb-1">Seus supérfluos este mês</p>
              <p className="text-xl font-bold text-amber-900">{fmt(superfluousExpenses)}</p>
              {simValue && superfluousExpenses > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {parseFloat(simValue)}% = economia de {fmt(superfluousExpenses * (parseFloat(simValue) / 100))}/mês
                </p>
              )}
            </div>
          )}

          {activeSim.id === "new_income" && monthlyIncome > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs text-emerald-700 font-medium mb-1">Sua renda atual</p>
              <p className="text-xl font-bold text-emerald-900">{fmt(monthlyIncome)}</p>
              {simValue && parseFloat(simValue) > monthlyIncome && (
                <p className="text-xs text-emerald-600 mt-1">
                  Aumento de {((parseFloat(simValue) - monthlyIncome) / monthlyIncome * 100).toFixed(1)}%
                </p>
              )}
            </div>
          )}

          {isInverse && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-xs text-teal-700 font-medium mb-1">Você sobra hoje</p>
              <p className={`text-xl font-bold ${monthlySavings >= 0 ? "text-teal-900" : "text-red-700"}`}>{fmt(monthlySavings)}</p>
              {simValue && parseFloat(simValue) > 0 && (
                <p className="text-xs text-teal-600 mt-1">
                  Diferença: {fmt(parseFloat(simValue) - monthlySavings)}
                </p>
              )}
            </div>
          )}

          {showGoalSelector && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Vincular a uma meta (opcional)</label>
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione uma meta para ver o impacto" />
                </SelectTrigger>
                <SelectContent>
                  {activeGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.title} — {fmt(g.target_amount)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveSim(null)} className="flex-1 h-12">Voltar</Button>
          <Button
            onClick={runSimulation}
            disabled={isSimulating || !simValue}
            className="flex-1 h-12 bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white"
          >
            {isSimulating ? (
              <><Zap className="w-4 h-4 mr-2 animate-pulse" />Calculando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Simular</>
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  // ─── Result view ──────────────────────────────────────────────────────────

  const ResultView = () => {
    const impactColors = {
      high: "from-rose-500 to-orange-500",
      medium: "from-amber-500 to-yellow-500",
      low: "from-emerald-500 to-teal-500"
    };
    const gradientColor = impactColors[result.impact] || "from-[#5FBDBD] to-[#1B3A52]";

    const extraFromSim = result.simId === "cut_specific" ? parseFloat(simValue) || 0
      : result.simId === "reduce_category" ? (superfluousExpenses * (parseFloat(simValue) / 100)) || 0
      : result.simId === "new_income" ? ((parseFloat(simValue) || 0) - monthlyIncome)
      : 0;

    const goalImpact = (result.simId !== "cost_of_time" && result.simId !== "inverse_goal")
      ? getGoalImpact(extraFromSim)
      : null;

    return (
      <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
        {/* Header card */}
        <div className={`bg-gradient-to-br ${gradientColor} rounded-3xl p-6 text-white shadow-xl`}>
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Resultado da Simulação</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">{result.headline}</h2>
          <div className="bg-white/20 rounded-2xl px-4 py-3 flex items-start gap-3">
            <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{result.phrase}</p>
          </div>
        </div>

        {/* Timeline — 1, 3, 5 anos */}
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Impacto no tempo</p>
          <div className="space-y-3">
            {result.timeline?.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center justify-between gap-4 ${row.highlight ? "border-[#5FBDBD]/50 shadow-[#5FBDBD]/10" : "border-slate-100"}`}
              >
                <div>
                  <p className={`text-xs font-semibold mb-0.5 ${row.highlight ? "text-[#5FBDBD]" : "text-slate-500"}`}>{row.label}</p>
                  <p className="text-xs text-slate-400">{row.sub}</p>
                </div>
                <p className={`text-xl font-bold flex-shrink-0 ${row.highlight ? "text-[#1B3A52]" : "text-slate-700"}`}>{row.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Meta Inversa special section */}
        {result.inverseData && (
          <div className="bg-white rounded-2xl p-5 border border-teal-200 shadow-sm space-y-4">
            <h3 className="font-bold text-[#1B3A52] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#5FBDBD]" />
              O que precisa mudar
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Você sobra hoje</p>
                <p className={`text-lg font-bold ${result.inverseData.currentSavings >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {fmt(result.inverseData.currentSavings)}
                </p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="text-xs text-teal-600 mb-1">Sua meta de sobra</p>
                <p className="text-lg font-bold text-teal-800">{fmt(result.inverseData.desired)}</p>
              </div>
            </div>
            {result.inverseData.gap > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-medium">Para chegar lá, você pode:</p>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-xs text-rose-600 mb-1">Opção 1 — Cortar gastos</p>
                  <p className="text-lg font-bold text-rose-700">−{fmt(result.inverseData.cutNeeded)}/mês</p>
                  <p className="text-xs text-rose-500 mt-1">Equivale a {(result.inverseData.cutNeeded / (monthlyExpenses || 1) * 100).toFixed(1)}% dos seus gastos</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 mb-1">Opção 2 — Aumentar renda</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(result.inverseData.incomeNeeded)}/mês</p>
                  <p className="text-xs text-emerald-500 mt-1">+{fmt(result.inverseData.gap)} em relação à renda atual</p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-semibold">Você já sobra mais que isso! 🎉</p>
                <p className="text-sm text-emerald-600 mt-1">Que tal aumentar a meta?</p>
              </div>
            )}
          </div>
        )}

        {/* Extras */}
        {result.extras?.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {result.extras.map((e, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">{e.label}</p>
                <p className="font-bold text-[#1B3A52]">{e.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Goal impact */}
        {goalImpact && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900">Impacto na meta: {goalImpact.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-emerald-600 mb-1">Sem mudanças</p>
                <p className="text-xl font-bold text-emerald-900">
                  {goalImpact.before ? `${goalImpact.before} meses` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 mb-1">Com esta mudança</p>
                <p className="text-xl font-bold text-emerald-600">
                  {goalImpact.after ? `${goalImpact.after} meses` : "—"}
                </p>
              </div>
            </div>
            {goalImpact.saved > 0 && (
              <div className="bg-white/60 rounded-xl p-3 flex items-center gap-3">
                <Clock className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-900">{goalImpact.saved} meses mais rápido</p>
              </div>
            )}
          </motion.div>
        )}

        <Button onClick={() => reset(false)} variant="outline" className="w-full h-12">
          Nova Simulação
        </Button>
      </motion.div>
    );
  };

  // ─── Main blocks (home) ───────────────────────────────────────────────────

  const BLOCKS = [
    {
      id: "projection",
      title: "Projeção Atual",
      subtitle: "Para onde você vai se não mudar nada?",
      icon: BarChart3,
      color: "from-[#5FBDBD] to-[#4FA9A5]",
      preview: projectionPreview,
      badge: monthlySavings > 0 ? `+${fmt(monthlySavings * 12)}/ano` : null,
      badgeColor: "bg-emerald-100 text-emerald-700"
    },
    {
      id: "adjustments",
      title: "Ajustes Inteligentes",
      subtitle: "O que muda se você cortar algo específico?",
      icon: Scissors,
      color: "from-violet-500 to-rose-500",
      preview: adjustmentPreview,
      badge: superfluousExpenses > 0 ? `${fmt(superfluousExpenses)} em supérfluos` : null,
      badgeColor: "bg-amber-100 text-amber-700"
    },
    {
      id: "evolution",
      title: "Plano de Evolução",
      subtitle: "Como você quer que o futuro seja diferente?",
      icon: ArrowUpRight,
      color: "from-[#1B3A52] to-[#5FBDBD]",
      preview: evolutionPreview,
      badge: monthlyIncome > 0 ? `Renda atual ${fmt(monthlyIncome)}` : null,
      badgeColor: "bg-blue-100 text-blue-700"
    }
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <BackButton to={createPageUrl("Planning")} className="mb-4" />
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-2xl flex items-center justify-center shadow-md">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Simulações de Futuro</h1>
            <p className="text-slate-500 text-sm">Veja como suas decisões de hoje moldam seus próximos meses.</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Home — 3 blocks */}
        {!activeBlock && !result && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {BLOCKS.map((block, i) => {
              const Icon = block.icon;
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveBlock(block.id)}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-[#5FBDBD]/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${block.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1B3A52] text-lg mb-0.5">{block.title}</h3>
                      <p className="text-sm text-slate-500 mb-3">{block.subtitle}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{block.preview}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#5FBDBD] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                  {block.badge && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${block.badgeColor}`}>
                        {block.badge}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Block 1: Projection (inline, no sub-sim selection) */}
        {activeBlock === "projection" && !activeSim && !result && (
          <motion.div key="projection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProjectionView />
          </motion.div>
        )}

        {/* Block 2: Adjustments */}
        {activeBlock === "adjustments" && !activeSim && !result && (
          <motion.div key="adjustments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SubSimSelector
              sims={ADJUSTMENT_SIMS}
              blockTitle="Ajustes Inteligentes"
              blockDesc="Simule o impacto de cada corte"
            />
          </motion.div>
        )}

        {/* Block 3: Evolution */}
        {activeBlock === "evolution" && !activeSim && !result && (
          <motion.div key="evolution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SubSimSelector
              sims={EVOLUTION_SIMS}
              blockTitle="Plano de Evolução"
              blockDesc="Simule como crescer sua situação financeira"
            />
          </motion.div>
        )}

        {/* Input view */}
        {activeSim && !result && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InputView />
          </motion.div>
        )}

        {/* Result view */}
        {result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
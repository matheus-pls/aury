import React from "react";
import { motion } from "framer-motion";
import { 
  Crown,
  Check,
  Target,
  Calculator,
  Settings,
  LineChart,
  PieChart,
  Bell,
  FileText,
  Wallet,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PREMIUM_FEATURES = [
  {
    icon: Wallet,
    title: "Múltiplas Fontes de Renda",
    description: "Cadastre salário, freelances, investimentos e outras rendas separadamente"
  },
  {
    icon: Settings,
    title: "Personalização Total",
    description: "Ajuste as porcentagens de distribuição do seu jeito e crie categorias customizadas"
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    description: "Crie metas ilimitadas, acompanhe progresso e receba sugestões automáticas de economia"
  },
  {
    icon: Calculator,
    title: "Simulador Avançado",
    description: "Simule novos cenários de renda, reduções de gastos e veja projeções futuras"
  },
  {
    icon: PieChart,
    title: "Reserva de Emergência Detalhada",
    description: "Configure meta personalizada e acompanhe evolução mês a mês"
  },
  {
    icon: LineChart,
    title: "Gráficos e Relatórios",
    description: "Visualize evolução financeira com gráficos avançados e relatórios detalhados"
  },
  {
    icon: Bell,
    title: "Notificações Inteligentes",
    description: "Alertas personalizados sobre limites, metas e oportunidades de economia"
  },
  {
    icon: FileText,
    title: "Exportação de Dados",
    description: "Exporte relatórios mensais em PDF e planilhas Excel"
  }
];

const COMPARISON = [
  { feature: "Cadastro de Renda", free: "1 renda única", premium: "Múltiplas fontes" },
  { feature: "Categorias de Gastos", free: "3 básicas", premium: "Ilimitadas + customizadas" },
  { feature: "Distribuição da Renda", free: "Fixa (50/20/10/20)", premium: "Totalmente personalizável" },
  { feature: "Dashboard", free: "Básico", premium: "Completo com gráficos avançados" },
  { feature: "Metas Financeiras", free: "✗", premium: "✓ Ilimitadas" },
  { feature: "Simulação", free: "✗", premium: "✓ Avançada" },
  { feature: "Reserva de Emergência", free: "Visualização simples", premium: "Controle detalhado" },
  { feature: "Relatórios e Exportação", free: "✗", premium: "✓ PDF e Excel" }
];

export default function Premium() {
  return (
    <div className="pb-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 rounded-3xl p-12 border-2 border-amber-200"
      >
        <div className="absolute top-10 right-10 opacity-10">
          <Crown className="w-64 h-64 text-amber-600" />
        </div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mb-6 shadow-xl"
        >
          <Crown className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
          Rendy <span className="text-amber-600">Premium</span>
        </h1>
        <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto">
          Desbloqueie todo o potencial do Rendy e tenha controle total sobre suas finanças
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="bg-white rounded-2xl px-8 py-4 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Por apenas</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-amber-600">R$ 19,90</span>
              <span className="text-slate-500">/mês</span>
            </div>
          </div>
          
          <Button 
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            <Zap className="w-5 h-5 mr-2" />
            Assinar Premium Agora
          </Button>
        </div>

        <p className="text-sm text-slate-600 mt-4">
          💳 Cancele quando quiser • ✓ 7 dias de garantia
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="mb-16">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold text-slate-800 mb-8 text-center"
        >
          Tudo que você tem com o Premium
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PREMIUM_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-amber-200 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
          Compare as Versões
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
          <div className="grid grid-cols-3 bg-slate-50 border-b">
            <div className="p-4 font-semibold text-slate-700">Recurso</div>
            <div className="p-4 font-semibold text-slate-700 border-l text-center">Gratuito</div>
            <div className="p-4 font-semibold text-amber-700 border-l text-center bg-amber-50">
              Premium
            </div>
          </div>

          {COMPARISON.map((row, index) => (
            <div 
              key={index}
              className={`grid grid-cols-3 ${index !== COMPARISON.length - 1 ? 'border-b' : ''}`}
            >
              <div className="p-4 text-sm text-slate-700">{row.feature}</div>
              <div className="p-4 text-sm text-slate-600 border-l text-center">
                {row.free}
              </div>
              <div className="p-4 text-sm font-medium text-amber-700 border-l text-center bg-amber-50/30">
                {row.premium}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-12 border border-emerald-200 mb-12"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
          Por que escolher o Premium?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Controle Total</h3>
            <p className="text-sm text-slate-600">
              Personalize cada aspecto das suas finanças do seu jeito
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Alcance Metas</h3>
            <p className="text-sm text-slate-600">
              Crie metas e receba orientações para conquistá-las
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LineChart className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Visão do Futuro</h3>
            <p className="text-sm text-slate-600">
              Simule cenários e veja como suas finanças evoluirão
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA Final */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-[#00A8A0] to-[#008F88] rounded-3xl p-12 text-center text-white"
      >
        <h2 className="text-3xl font-bold mb-4">
          Pronto para transformar suas finanças?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de pessoas que já estão no controle do seu dinheiro com o Rendy Premium
        </p>
        
        <Button 
          size="lg"
          className="bg-white text-[#00A8A0] hover:bg-slate-100 px-8 py-6 text-lg shadow-xl font-semibold"
        >
          <Crown className="w-5 h-5 mr-2" />
          Começar Período de Teste
        </Button>

        <div className="flex items-center justify-center gap-8 mt-8 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>7 dias grátis</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Cancele quando quiser</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Suporte prioritário</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
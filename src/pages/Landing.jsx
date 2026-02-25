import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Sparkles, Target, TrendingUp, Zap, Heart, Shield, 
  Crown, Check, X, ArrowRight, Star, Lock, Unlock,
  BarChart3, Calendar, Users, Lightbulb, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      icon: Heart,
      title: "Índice de Tranquilidade",
      description: "Saiba se você está no controle ou precisa ajustar",
      color: "from-rose-500 to-pink-500"
    },
    {
      icon: Lightbulb,
      title: "Simulações de Futuro",
      description: "Veja como suas decisões moldam os próximos meses",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Target,
      title: "Metas Inteligentes",
      description: "Acompanhe progresso e tempo restante automaticamente",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: TrendingUp,
      title: "Análise de Padrões",
      description: "Descubra tendências nos seus gastos",
      color: "from-violet-500 to-purple-500"
    }
  ];

  const comparisons = [
    {
      feature: "Controle de gastos",
      free: true,
      premium: true
    },
    {
      feature: "Metas financeiras",
      free: true,
      premium: true
    },
    {
      feature: "Índice de Tranquilidade",
      free: false,
      premium: true
    },
    {
      feature: "Simulações de Futuro",
      free: false,
      premium: true
    },
    {
      feature: "Análise de Comportamento",
      free: false,
      premium: true
    },
    {
      feature: "Modo Família",
      free: false,
      premium: true
    },
    {
      feature: "Planejamento Automático",
      free: false,
      premium: true
    },
    {
      feature: "Entrada por Voz (Aury Flow)",
      free: false,
      premium: true
    },
    {
      feature: "Notificações Inteligentes",
      free: false,
      premium: true
    },
    {
      feature: "Suporte Prioritário",
      free: false,
      premium: true
    }
  ];

  const premiumBenefits = [
    {
      icon: Zap,
      title: "Decisões mais rápidas",
      description: "Simulações que mostram o impacto real em 1, 3 e 5 anos",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: Shield,
      title: "Mais tranquilidade",
      title: "Mais controle",
      description: "Saiba exatamente onde você está e para onde vai",
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      icon: Crown,
      title: "Experiência completa",
      description: "Todos os recursos para transformar sua vida financeira",
      gradient: "from-violet-400 to-purple-500"
    }
  ];

  const testimonials = [
    {
      text: "Finalmente entendi para onde meu dinheiro estava indo. O Aury mudou minha relação com finanças.",
      author: "Maria S.",
      role: "Usuária Premium"
    },
    {
      text: "As simulações me ajudaram a tomar decisões melhores. Economizei R$ 8mil em 6 meses.",
      author: "Pedro H.",
      role: "Usuário Premium"
    },
    {
      text: "Nunca imaginei que controlar minhas finanças seria tão simples e até prazeroso.",
      author: "Ana C.",
      role: "Usuária Premium"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      >
        {/* Floating elements background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#5FBDBD]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5FBDBD]/10 to-[#1B3A52]/10 px-4 py-2 rounded-full mb-6 border border-[#5FBDBD]/20">
              <Sparkles className="w-4 h-4 text-[#5FBDBD]" />
              <span className="text-sm font-medium text-[#1B3A52]">Finanças pessoais sem dor de cabeça</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-[#1B3A52] mb-6 leading-tight">
              Seu dinheiro,
              <br />
              <span className="bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] bg-clip-text text-transparent">
                sua tranquilidade
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Aury te ajuda a tomar decisões melhores sobre o seu dinheiro.
              <br />
              Sem planilhas complicadas. Só você e seu futuro financeiro.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="h-14 px-8 bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white text-lg shadow-2xl shadow-[#5FBDBD]/30 hover:shadow-[#5FBDBD]/50 transition-all group"
              >
                Começar agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 text-lg border-2 border-[#5FBDBD] text-[#1B3A52] hover:bg-[#5FBDBD]/5"
              >
                Ver demonstração
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] border-2 border-white" />
                ))}
              </div>
              <span>+1.200 pessoas já estão no controle</span>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16"
          >
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-[#5FBDBD]/20 to-[#1B3A52]/20 blur-3xl" />
              <Card className="border-2 border-[#5FBDBD]/30 shadow-2xl overflow-hidden relative">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-[#5FBDBD]/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Índice de Tranquilidade</span>
                          <Heart className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold text-emerald-400">85</span>
                          <span className="text-slate-400 mb-1">/100</span>
                        </div>
                        <p className="text-xs text-emerald-400 mt-2">Você está tranquilo 🌟</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">Sobrou este mês</p>
                          <p className="text-2xl font-bold text-[#5FBDBD]">R$ 1.450</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">Meta do ano</p>
                          <p className="text-2xl font-bold text-amber-400">85%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[#5FBDBD] rounded-full flex items-start justify-center p-2">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-[#5FBDBD] rounded-full"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#1B3A52] mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-600">Simples, inteligente e feito para você</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="border-2 border-slate-100 hover:border-[#5FBDBD]/30 hover:shadow-xl transition-all h-full group">
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1B3A52] mb-2">{feature.title}</h3>
                      <p className="text-slate-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Crown className="w-4 h-4" />
              Premium
            </div>
            <h2 className="text-4xl font-bold text-[#1B3A52] mb-4">
              Por que evoluir para Premium?
            </h2>
            <p className="text-xl text-slate-600">Desbloqueia todo o potencial do Aury</p>
          </motion.div>

          {/* Visual Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Free Version */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onHoverStart={() => setHoveredPlan('free')}
              onHoverEnd={() => setHoveredPlan(null)}
            >
              <Card className={`border-2 overflow-hidden transition-all ${hoveredPlan === 'free' ? 'border-slate-300 shadow-xl' : 'border-slate-200'}`}>
                <div className="bg-slate-100 p-6 text-center">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-1">Versão Gratuita</h3>
                  <p className="text-slate-500">Controle básico</p>
                </div>
                <CardContent className="p-8">
                  <div className="aspect-video bg-slate-100 rounded-xl mb-4 flex items-center justify-center border-2 border-slate-200">
                    <div className="text-center p-6">
                      <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-sm text-slate-500">Apenas visualização básica</p>
                      <p className="text-xs text-slate-400 mt-2">Sem análises avançadas</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Controle de gastos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Metas financeiras</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <X className="w-4 h-4 text-slate-400" />
                      <span>Simulações de futuro</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <X className="w-4 h-4 text-slate-400" />
                      <span>Análises inteligentes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Version */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onHoverStart={() => setHoveredPlan('premium')}
              onHoverEnd={() => setHoveredPlan(null)}
            >
              <Card className={`border-2 overflow-hidden transition-all ${hoveredPlan === 'premium' ? 'border-[#5FBDBD] shadow-2xl shadow-[#5FBDBD]/20' : 'border-[#5FBDBD]/50'}`}>
                <div className="bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] p-6 text-center text-white relative overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"
                  />
                  <Unlock className="w-8 h-8 mx-auto mb-2 relative z-10" />
                  <h3 className="text-2xl font-bold mb-1 relative z-10">Premium</h3>
                  <p className="text-white/80 relative z-10">Experiência completa</p>
                </div>
                <CardContent className="p-8">
                  <div className="aspect-video bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-xl mb-4 flex items-center justify-center border-2 border-[#5FBDBD]/30 relative overflow-hidden">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-center p-6"
                    >
                      <Sparkles className="w-16 h-16 text-[#5FBDBD] mx-auto mb-4" />
                      <p className="text-sm font-semibold text-[#1B3A52]">Simulações + Análises</p>
                      <p className="text-xs text-slate-600 mt-2">Insights que mudam o jogo</p>
                    </motion.div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Tudo do plano gratuito</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Simulações de Futuro</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Índice de Tranquilidade</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Análise de Comportamento</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left p-4 text-[#1B3A52] font-bold">Funcionalidade</th>
                      <th className="text-center p-4 text-slate-600 font-semibold">Gratuito</th>
                      <th className="text-center p-4 bg-gradient-to-r from-[#5FBDBD]/10 to-[#1B3A52]/10 font-semibold text-[#1B3A52]">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 text-amber-500" />
                          Premium
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((comp, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 text-slate-700">{comp.feature}</td>
                        <td className="p-4 text-center">
                          {comp.free ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center bg-gradient-to-r from-[#5FBDBD]/5 to-[#1B3A52]/5">
                          {comp.premium ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 mx-auto" />
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Premium Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#1B3A52] mb-4">
              O que você ganha com Premium
            </h2>
            <p className="text-xl text-slate-600">Muito além de recursos. Resultados reais.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {premiumBenefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="border-2 border-slate-100 hover:border-[#5FBDBD]/30 hover:shadow-2xl transition-all h-full text-center group">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#1B3A52] mb-3">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#1B3A52] mb-4">
              Quem usa, aprova
            </h2>
            <p className="text-xl text-slate-600">Histórias reais de quem transformou suas finanças</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-2 border-slate-100 hover:border-[#5FBDBD]/30 hover:shadow-xl transition-all h-full">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52]" />
                      <div>
                        <p className="font-bold text-[#1B3A52]">{testimonial.author}</p>
                        <p className="text-sm text-slate-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 border-[#5FBDBD]/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10" />
              <CardContent className="p-12 text-center relative z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 bg-gradient-to-br from-[#5FBDBD] to-[#1B3A52] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                >
                  <Crown className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-4xl font-bold text-[#1B3A52] mb-4">
                  Pronto para ter mais tranquilidade?
                </h2>
                <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                  Comece agora e veja como pequenas decisões criam grandes mudanças
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="h-14 px-8 bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white text-lg shadow-2xl shadow-[#5FBDBD]/30 hover:shadow-[#5FBDBD]/50 transition-all group"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Ativar Premium
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-14 px-8 text-lg border-2 border-[#5FBDBD] text-[#1B3A52] hover:bg-[#5FBDBD]/5"
                  >
                    Começar grátis
                  </Button>
                </div>

                <p className="text-sm text-slate-500 mt-6">
                  Sem compromisso. Cancele quando quiser.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
            alt="Aury" 
            className="h-8 mx-auto mb-4"
          />
          <p className="text-slate-400 mb-6">
            Suas finanças, sua tranquilidade, seu futuro.
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Suporte</a>
          </div>
          <p className="text-slate-500 text-sm mt-6">
            © 2026 Aury. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
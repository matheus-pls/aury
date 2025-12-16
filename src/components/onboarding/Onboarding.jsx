import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_STEPS = [
  {
    emoji: "💰",
    title: "Domine suas finanças",
    description: "Vamos transformar sua relação com o dinheiro em 3 minutos. Sem planilhas chatas, sem jargões complicados.",
    buttonText: "Começar"
  },
  {
    emoji: "🤖",
    title: "Planejamento Automático",
    description: "Nosso robô financeiro analisa sua renda e sugere a distribuição ideal automaticamente. Você só precisa aprovar!",
    buttonText: "Entendi"
  },
  {
    emoji: "🚨",
    title: "Alertas Inteligentes",
    description: "Te avisamos antes de você extrapolar o orçamento. Como um amigo que lembra: 'Ei, cuidado com os gastos hoje!'",
    buttonText: "Show!"
  },
  {
    emoji: "📈",
    title: "Evolução Visível",
    description: "Veja seu progresso mês a mês. Do endividado ao investidor, cada conquista celebrada com você.",
    buttonText: "Quero ver!"
  },
  {
    emoji: "⚡",
    title: "Pronto em 60 segundos",
    description: "Responda 3 perguntinhas rápidas e já saia com seu plano financeiro personalizado. Prometemos!",
    buttonText: "Vamos lá!"
  }
];

export default function Onboarding({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" && currentStep < ONBOARDING_STEPS.length - 1) {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  // Touch/Swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      if (touchStartX - touchEndX > 50 && currentStep < ONBOARDING_STEPS.length - 1) {
        handleNext();
      }
      if (touchEndX - touchStartX > 50 && currentStep > 0) {
        handlePrevious();
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#00A8A0] to-[#008F88] flex items-center justify-center p-4">
      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="flex flex-col items-center text-center"
          >
            {/* Emoji Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-8xl mb-8 drop-shadow-lg"
            >
              {step.emoji}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              {step.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/90 mb-8 leading-relaxed px-4"
            >
              {step.description}
            </motion.p>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full px-4"
            >
              <Button
                onClick={handleNext}
                className="w-full bg-white text-[#00A8A0] hover:bg-white/90 text-lg py-6 rounded-2xl font-semibold shadow-xl"
              >
                {step.buttonText}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentStep ? 1 : -1);
                setCurrentStep(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
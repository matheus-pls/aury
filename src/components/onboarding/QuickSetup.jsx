import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QUESTIONS = [
  {
    id: "income",
    question: "Qual sua renda mensal?",
    type: "currency",
    placeholder: "Ex: 3500",
    key: "monthly_income"
  },
  {
    id: "debts",
    question: "Você tem dívidas?",
    type: "select",
    options: [
      { value: "none", label: "Não, estou limpo", emoji: "✅" },
      { value: "some", label: "Sim, algumas", emoji: "⚠️" },
      { value: "many", label: "Sim, muitas", emoji: "🚨" }
    ],
    key: "debt_status"
  },
  {
    id: "goal",
    question: "Seu objetivo principal é:",
    type: "select",
    options: [
      { value: "survive", label: "Sobreviver o mês", emoji: "💪" },
      { value: "organize", label: "Organizar as finanças", emoji: "📊" },
      { value: "reserve", label: "Criar reserva", emoji: "🏦" },
      { value: "invest", label: "Investir", emoji: "📈" }
    ],
    key: "main_goal"
  }
];

export default function QuickSetup({ onComplete, onSkip }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({
    monthly_income: "",
    debt_status: "",
    main_goal: ""
  });
  const [direction, setDirection] = useState(1);

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    const currentAnswer = answers[question.key];
    if (!currentAnswer) return;

    if (currentQuestion < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentQuestion(currentQuestion + 1);
      // Save progress
      localStorage.setItem("rendy_setup_progress", JSON.stringify({ currentQuestion: currentQuestion + 1, answers }));
    } else {
      // Save final answers
      localStorage.setItem("rendy_setup_complete", "true");
      localStorage.setItem("rendy_setup_answers", JSON.stringify(answers));
      localStorage.removeItem("rendy_setup_progress");
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSelectOption = (value) => {
    setAnswers({ ...answers, [question.key]: value });
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? `R$ ${parseInt(numbers).toLocaleString("pt-BR")}` : "";
  };

  const handleIncomeChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    setAnswers({ ...answers, monthly_income: formatted });
  };

  const canProceed = answers[question.key] !== "";

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
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {currentQuestion > 0 && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <span className="text-sm font-medium text-slate-600">
              {currentQuestion + 1} de {QUESTIONS.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Pular
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-[#00A8A0] to-[#008F88]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="space-y-8"
            >
              {/* Question */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-8">
                  {question.question}
                </h2>

                {/* Input Fields */}
                {question.type === "currency" && (
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder={question.placeholder}
                      value={answers[question.key]}
                      onChange={handleIncomeChange}
                      className="text-2xl py-6 text-center font-semibold"
                      autoFocus
                    />
                    <p className="text-sm text-slate-500 text-center">
                      Digite apenas números, formataremos para você
                    </p>
                  </div>
                )}

                {/* Select Options */}
                {question.type === "select" && (
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleSelectOption(option.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                          answers[question.key] === option.value
                            ? "border-[#00A8A0] bg-[#00A8A0]/5 shadow-md"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{option.emoji}</span>
                          <span className={`text-lg font-medium ${
                            answers[question.key] === option.value
                              ? "text-[#00A8A0]"
                              : "text-slate-700"
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className={`w-full py-6 text-lg rounded-2xl font-semibold ${
                  canProceed
                    ? "bg-[#00A8A0] hover:bg-[#008F88] text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {currentQuestion === QUESTIONS.length - 1 ? "Finalizar" : "Continuar"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
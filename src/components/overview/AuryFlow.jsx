import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Mic, 
  Send, 
  X, 
  Check, 
  Loader2,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXPENSE_CATEGORIES = {
  fixed: "Gastos Fixos",
  essential: "Essenciais",
  superfluous: "Supérfluos",
  emergency: "Reserva",
  investment: "Investimentos"
};

const INCOME_TYPES = {
  salary: "Salário",
  freelance: "Freelance",
  investment: "Investimento",
  rental: "Aluguel",
  other: "Outros"
};

export default function AuryFlow() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMode, setInputMode] = useState("idle"); // idle, text, recording, processing, confirming
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const inputRef = useRef(null);
  
  const queryClient = useQueryClient();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      resetFlow();
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      resetFlow();
    }
  });

  const resetFlow = () => {
    setIsExpanded(false);
    setInputMode("idle");
    setInputText("");
    setParsedData(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setInputMode("recording");
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      // Fallback to text mode
      setInputMode("text");
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const processAudio = async (blob) => {
    setInputMode("processing");
    
    try {
      // Upload audio file
      const file = new File([blob], "audio.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Use LLM to transcribe and parse
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente financeiro. O usuário gravou um áudio sobre uma transação financeira.
        
Analise o áudio e extraia as informações financeiras.

IMPORTANTE:
- Se for um GASTO, identifique como "expense"
- Se for uma ENTRADA/RECEITA, identifique como "income"
- Extraia o valor numérico
- Sugira uma categoria apropriada
- Extraia a descrição

CATEGORIAS DE GASTO: fixed (contas fixas como aluguel, internet), essential (alimentação, transporte, saúde), superfluous (lazer, compras não essenciais), emergency (emergências), investment (investimentos)

CATEGORIAS DE RENDA: salary (salário), freelance (trabalho extra), investment (rendimento), rental (aluguel recebido), other (outros)`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["expense", "income"] },
            amount: { type: "number" },
            description: { type: "string" },
            category: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["type", "amount", "description", "category"]
        }
      });
      
      setParsedData(result);
      setInputMode("confirming");
    } catch (error) {
      console.error("Error processing audio:", error);
      setInputMode("text");
    }
  };

  const processText = async () => {
    if (!inputText.trim()) return;
    
    setInputMode("processing");
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente financeiro. O usuário digitou: "${inputText}"

Analise o texto e extraia as informações financeiras.

IMPORTANTE:
- Se for um GASTO (gastei, paguei, comprei, etc), identifique como "expense"
- Se for uma ENTRADA/RECEITA (recebi, ganhei, entrou, etc), identifique como "income"
- Extraia o valor numérico
- Sugira uma categoria apropriada
- Extraia a descrição

CATEGORIAS DE GASTO: fixed (contas fixas como aluguel, internet), essential (alimentação, transporte, saúde), superfluous (lazer, compras não essenciais), emergency (emergências), investment (investimentos)

CATEGORIAS DE RENDA: salary (salário), freelance (trabalho extra), investment (rendimento), rental (aluguel recebido), other (outros)`,
        response_json_schema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["expense", "income"] },
            amount: { type: "number" },
            description: { type: "string" },
            category: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["type", "amount", "description", "category"]
        }
      });
      
      setParsedData(result);
      setInputMode("confirming");
    } catch (error) {
      console.error("Error processing text:", error);
      setInputMode("text");
    }
  };

  const confirmTransaction = () => {
    if (!parsedData) return;
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const monthYear = today.toISOString().slice(0, 7);
    
    if (parsedData.type === "expense") {
      createExpenseMutation.mutate({
        description: parsedData.description,
        amount: parsedData.amount,
        category: parsedData.category,
        date: dateStr,
        month_year: monthYear
      });
    } else {
      createIncomeMutation.mutate({
        description: parsedData.description,
        amount: parsedData.amount,
        type: parsedData.category,
        is_active: true
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main Card */}
      <motion.div
        layout
        className={`
          relative overflow-hidden rounded-3xl
          bg-gradient-to-br from-[#0A2540] to-[#1B3A52]
          shadow-2xl shadow-[#1B3A52]/20
          transition-all duration-500
        `}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5FBDBD]/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#5FBDBD]/20 rounded-full blur-3xl" />
        
        <AnimatePresence mode="wait">
          {/* IDLE STATE - Collapsed */}
          {inputMode === "idle" && !isExpanded && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5"
            >
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setInputMode("text");
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="w-full flex items-center gap-4 group"
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5FBDBD]/30 group-hover:scale-105 transition-transform">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-[#5FBDBD]/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold text-lg">Aury Flow</h3>
                  <p className="text-white/60 text-sm">Segure para gravar ou toque para digitar</p>
                </div>

                <Sparkles className="w-5 h-5 text-[#5FBDBD]" />
              </button>
            </motion.div>
          )}

          {/* TEXT INPUT STATE */}
          {(inputMode === "text" || isExpanded) && inputMode !== "recording" && inputMode !== "processing" && inputMode !== "confirming" && (
            <motion.div
              key="text"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">Aury Flow</h3>
                  <p className="text-white/50 text-xs">Registre rapidamente</p>
                </div>
                <button
                  onClick={resetFlow}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && processText()}
                    placeholder="Ex: Gastei 50 reais no Uber..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl pr-12"
                  />
                  <button
                    onClick={processText}
                    disabled={!inputText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#5FBDBD] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4FA9A5] transition-colors"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className="w-12 h-12 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                >
                  <Mic className="w-5 h-5 text-white" />
                </button>
              </div>

              <p className="text-white/40 text-xs mt-3 text-center">
                Digite ou segure o microfone para gravar
              </p>
            </motion.div>
          )}

          {/* RECORDING STATE */}
          {inputMode === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#5FBDBD]/40"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="w-10 h-10 text-white" />
              </motion.div>
              
              <p className="text-white font-semibold text-lg mb-1">Gravando...</p>
              <p className="text-[#5FBDBD] text-2xl font-bold tabular-nums">{formatTime(recordingTime)}</p>
              <p className="text-white/50 text-sm mt-3">Solte para processar</p>

              {/* Audio wave animation */}
              <div className="flex items-center justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[#5FBDBD] rounded-full"
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {inputMode === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-[#5FBDBD]/20 to-[#5FBDBD]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-[#5FBDBD]" />
              </motion.div>
              
              <p className="text-white font-semibold">Processando...</p>
              <p className="text-white/50 text-sm mt-1">A Aury está entendendo sua mensagem</p>
            </motion.div>
          )}

          {/* CONFIRMING STATE */}
          {inputMode === "confirming" && parsedData && (
            <motion.div
              key="confirming"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  parsedData.type === "expense" 
                    ? "bg-rose-500/20" 
                    : "bg-emerald-500/20"
                }`}>
                  {parsedData.type === "expense" 
                    ? <ArrowDownCircle className="w-6 h-6 text-rose-400" />
                    : <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
                  }
                </div>
                <div>
                  <p className="text-white/60 text-sm">
                    {parsedData.type === "expense" ? "Registrar Gasto" : "Registrar Entrada"}
                  </p>
                  <p className="text-white font-semibold text-lg">{parsedData.description}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60">Valor</span>
                  <span className={`text-2xl font-bold ${
                    parsedData.type === "expense" ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {parsedData.type === "expense" ? "-" : "+"}{formatCurrency(parsedData.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Categoria</span>
                  <span className="text-white font-medium">
                    {parsedData.type === "expense" 
                      ? EXPENSE_CATEGORIES[parsedData.category] || parsedData.category
                      : INCOME_TYPES[parsedData.category] || parsedData.category
                    }
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetFlow}
                  className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={confirmTransaction}
                  disabled={createExpenseMutation.isPending || createIncomeMutation.isPending}
                  className="flex-1 h-12 bg-gradient-to-r from-[#5FBDBD] to-[#4FA9A5] hover:opacity-90 rounded-xl text-white font-semibold"
                >
                  {(createExpenseMutation.isPending || createIncomeMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Confirmar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
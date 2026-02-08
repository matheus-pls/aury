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
  Edit3,
  Heart
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
  const [audioError, setAudioError] = useState(null);
  const [quickMode, setQuickMode] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  
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
      setAudioError(null);
      
      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta gravação de áudio");
      }

      // Request audio with specific constraints for better quality
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      
      // Check for MediaRecorder support with preferred format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Only process if we have valid audio data
        if (audioBlob.size > 0) {
          await processAudio(audioBlob);
        } else {
          setAudioError("Gravação muito curta");
          setInputMode("text");
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setAudioError("Erro ao gravar áudio");
        stopRecording();
        setInputMode("text");
      };

      mediaRecorderRef.current.start(100); // Capture in 100ms chunks for better quality
      setIsRecording(true);
      setInputMode("recording");
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop after 30 seconds
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      
      // Set user-friendly error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setAudioError("Permissão de microfone negada");
      } else if (error.name === 'NotFoundError') {
        setAudioError("Nenhum microfone encontrado");
      } else {
        setAudioError(error.message || "Erro ao acessar microfone");
      }
      
      // Fallback to text mode
      setInputMode("text");
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // Cleanup stream immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const processAudio = async (blob) => {
    setInputMode("processing");
    
    try {
      // Convert webm to mp3 using the browser's capabilities
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create a WAV file instead (more universally supported)
      const wavBlob = await audioBufferToWav(audioBuffer);
      
      // Upload audio file
      const file = new File([wavBlob], "audio.wav", { type: "audio/wav" });
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
      
      // In quick mode, auto-confirm if confidence is high
      if (quickMode && result.confidence >= 0.8) {
        setInputMode("confirming");
        // Auto-confirm after 1 second
        setTimeout(() => {
          confirmTransaction();
        }, 1000);
      } else {
        setInputMode("confirming");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setAudioError("Não consegui processar o áudio");
      setInputMode("text");
      setQuickMode(false);
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (audioBuffer) => {
    return new Promise((resolve) => {
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;
      
      const bytesPerSample = bitDepth / 8;
      const blockAlign = numberOfChannels * bytesPerSample;
      
      const data = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        data.push(audioBuffer.getChannelData(i));
      }
      
      const interleaved = interleave(data);
      const dataLength = interleaved.length * bytesPerSample;
      const buffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(buffer);
      
      // Write WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(view, 36, 'data');
      view.setUint32(40, dataLength, true);
      
      // Write audio data
      floatTo16BitPCM(view, 44, interleaved);
      
      resolve(new Blob([buffer], { type: 'audio/wav' }));
    });
  };

  const interleave = (channels) => {
    const length = channels[0].length;
    const result = new Float32Array(length * channels.length);
    let offset = 0;
    for (let i = 0; i < length; i++) {
      for (let channel of channels) {
        result[offset++] = channel[i];
      }
    }
    return result;
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (view, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
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

  // Calculate tranquility impact
  const calculateTranquilityImpact = () => {
    if (!parsedData) return 0;
    
    if (parsedData.type === "expense") {
      // Expenses reduce tranquility
      const percentOfIncome = (parsedData.amount / 3000) * 100; // Assuming avg income ~3k
      if (parsedData.category === "superfluous") return -Math.ceil(percentOfIncome * 0.5);
      if (parsedData.category === "essential") return -Math.ceil(percentOfIncome * 0.2);
      if (parsedData.category === "fixed") return -Math.ceil(percentOfIncome * 0.1);
    } else {
      // Income increases tranquility
      return Math.ceil((parsedData.amount / 1000) * 2);
    }
    return 0;
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

  const quickRecordAndConfirm = async () => {
    setQuickMode(true);
    await startRecording();
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
              <div className="space-y-3">
                {/* Quick Record Button */}
                <button
                  onMouseDown={quickRecordAndConfirm}
                  onMouseUp={stopRecording}
                  onTouchStart={quickRecordAndConfirm}
                  onTouchEnd={stopRecording}
                  className="w-full flex items-center gap-4 group bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all"
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
                    <h3 className="text-white font-semibold">Gravação Rápida</h3>
                    <p className="text-white/60 text-sm">Segure para gravar e confirmar</p>
                  </div>

                  <Sparkles className="w-5 h-5 text-[#5FBDBD]" />
                </button>

                {/* Standard Mode Button */}
                <button
                  onClick={() => {
                    setIsExpanded(true);
                    setInputMode("text");
                    setQuickMode(false);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="w-full flex items-center gap-4 text-center justify-center py-3 text-white/60 hover:text-white text-sm transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ou digite manualmente</span>
                </button>

                {audioError && (
                  <p className="text-rose-400 text-xs text-center">{audioError}</p>
                )}
              </div>
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

              <div className="flex items-center justify-center gap-2 mt-3">
                <p className="text-white/40 text-xs">Digite ou segure o microfone para gravar</p>
                {audioError && (
                  <p className="text-rose-400 text-xs">• {audioError}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* RECORDING STATE */}
          {inputMode === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 text-center relative"
            >
              {/* Recording indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 bg-rose-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-rose-400 text-xs font-semibold">REC</span>
              </div>

              {/* Animated mic circle */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  className="absolute inset-0 bg-[#5FBDBD]/20 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-2 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-full flex items-center justify-center shadow-2xl shadow-[#5FBDBD]/40"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic className="w-12 h-12 text-white" />
                </motion.div>
              </div>
              
              <motion.p 
                className="text-white font-bold text-2xl mb-2"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Escutando...
              </motion.p>
              
              <div className="bg-white/10 rounded-xl px-6 py-3 inline-block mb-4">
                <p className="text-[#5FBDBD] text-3xl font-bold tabular-nums">{formatTime(recordingTime)}</p>
              </div>
              
              <p className="text-white/60 text-sm mb-6">
                {quickMode ? "Auto-confirmando ao soltar" : "Solte para processar"}
              </p>

              {/* Audio wave animation */}
              <div className="flex items-center justify-center gap-2">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-[#5FBDBD] rounded-full"
                    animate={{ height: [12, 32, 12] }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              {/* Cancel button */}
              <button
                onClick={() => {
                  stopRecording();
                  resetFlow();
                }}
                className="mt-6 text-white/40 hover:text-white text-sm transition-colors"
              >
                Cancelar gravação
              </button>
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
              {quickMode && (
                <div className="mb-4 text-center">
                  <motion.div
                    className="inline-flex items-center gap-2 bg-[#5FBDBD]/20 text-[#5FBDBD] px-4 py-2 rounded-full text-sm"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Confirmando automaticamente...
                  </motion.div>
                </div>
              )}
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

              <div className="bg-white/5 rounded-2xl p-4 mb-4">
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

              {/* Tranquility Impact */}
              {(() => {
                const impact = calculateTranquilityImpact();
                if (impact === 0) return null;
                return (
                  <div className={`rounded-xl p-3 mb-6 flex items-center gap-3 ${
                    impact > 0 
                      ? "bg-emerald-500/10 border border-emerald-500/20" 
                      : "bg-rose-500/10 border border-rose-500/20"
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      impact > 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                    }`}>
                      <Heart className={`w-4 h-4 ${
                        impact > 0 ? "text-emerald-400" : "text-rose-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs ${
                        impact > 0 ? "text-emerald-300" : "text-rose-300"
                      }`}>
                        Impacto na Tranquilidade
                      </p>
                      <p className={`font-semibold ${
                        impact > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {impact > 0 ? "+" : ""}{impact} pontos
                      </p>
                    </div>
                  </div>
                );
              })()}

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
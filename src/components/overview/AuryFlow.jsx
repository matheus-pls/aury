import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  Heart,
  Square,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const [inputMode, setInputMode] = useState("idle"); // idle, text, recording, processing, confirming
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  
  const queryClient = useQueryClient();

  // Fetch historical expenses for ML learning
  const { data: historicalExpenses = [] } = useQuery({
    queryKey: ['expenses-history'],
    queryFn: async () => {
      const result = await base44.entities.Expense.list();
      return result || [];
    }
  });

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      toast.success("Gasto registrado com sucesso!");
      resetFlow();
    },
    onError: () => {
      toast.error("Erro ao salvar gasto");
      setErrorMessage("Erro ao salvar gasto");
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      toast.success("Renda registrada com sucesso!");
      resetFlow();
    },
    onError: () => {
      toast.error("Erro ao salvar renda");
      setErrorMessage("Erro ao salvar renda");
    }
  });

  const resetFlow = () => {
    setInputMode("idle");
    setInputText("");
    setParsedData(null);
    setRecordingTime(0);
    setErrorMessage(null);
    setIsEditingCategory(false);
    recordingStartTimeRef.current = 0;
    stopRecordingCleanup();
  };

  const stopRecordingCleanup = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping recorder:", e);
      }
    }
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Seu navegador não suporta gravação de áudio");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      
      streamRef.current = stream;
      
      // Use default browser format
      mediaRecorderRef.current = new MediaRecorder(stream);
      console.log('Recording with mimeType:', mediaRecorderRef.current.mimeType);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const actualDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        
        // Use the actual recorded format
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        console.log('Audio recorded:', audioBlob.size, 'bytes, type:', mimeType);
        
        stopRecordingCleanup();
        
        if (audioBlob.size === 0) {
          setErrorMessage("Erro na gravação. Tente novamente.");
          setInputMode("idle");
          return;
        }
        
        if (actualDuration < 0.8) {
          setErrorMessage("Gravação muito curta. Grave por pelo menos 1 segundo e fale claramente.");
          setInputMode("idle");
          return;
        }
        
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.onerror = () => {
        setErrorMessage("Erro ao gravar áudio");
        stopRecordingCleanup();
        setIsRecording(false);
        setInputMode("text");
      };

      recordingStartTimeRef.current = Date.now();
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setInputMode("recording");
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingTime(elapsed);
        
        if (elapsed >= 30) {
          stopRecording();
        }
      }, 100);
    } catch (error) {
      console.error("Error starting recording:", error);
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage("Permissão de microfone negada");
      } else if (error.name === 'NotFoundError') {
        setErrorMessage("Nenhum microfone encontrado");
      } else {
        setErrorMessage(error.message || "Erro ao acessar microfone");
      }
      
      setInputMode("text");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAudio = async (blob) => {
    setInputMode("processing");
    
    try {
      if (!blob || blob.size === 0) {
        throw new Error("Arquivo de áudio vazio");
      }

      // Convert WebM to WAV using Web Audio API
      console.log('Converting audio to WAV format...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create WAV file
      const numberOfChannels = 1; // Mono for smaller file
      const sampleRate = 16000; // 16kHz is enough for speech
      const length = audioBuffer.length * numberOfChannels * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      // WAV Header
      let pos = 0;
      const writeString = (s) => { for (let i = 0; i < s.length; i++) { view.setUint8(pos++, s.charCodeAt(i)); } };
      const writeUint32 = (d) => { view.setUint32(pos, d, true); pos += 4; };
      const writeUint16 = (d) => { view.setUint16(pos, d, true); pos += 2; };
      
      writeString('RIFF');
      writeUint32(36 + length);
      writeString('WAVE');
      writeString('fmt ');
      writeUint32(16);
      writeUint16(1);
      writeUint16(numberOfChannels);
      writeUint32(sampleRate);
      writeUint32(sampleRate * 2);
      writeUint16(2);
      writeUint16(16);
      writeString('data');
      writeUint32(length);
      
      // Audio data
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audioBuffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
      
      const wavBlob = new Blob([buffer], { type: 'audio/wav' });
      const file = new File([wavBlob], `audio_${Date.now()}.wav`, { type: 'audio/wav' });
      
      console.log('WAV created:', file.size, 'bytes');
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      if (!uploadResult?.file_url) {
        throw new Error("Falha ao fazer upload do áudio");
      }
      
      console.log('Transcribing audio...');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você está recebendo um arquivo de áudio em português brasileiro. Sua tarefa é:

1. TRANSCREVER o áudio completamente - ouça com atenção e transcreva tudo que o usuário disse
2. EXTRAIR as informações financeiras da transcrição

O usuário está falando sobre uma movimentação financeira (gasto ou entrada de dinheiro).

CLASSIFICAÇÃO:
- Se o usuário falou sobre GASTAR DINHEIRO (ex: "gastei", "paguei", "comprei", "despesa", "conta") → type: "expense"
- Se o usuário falou sobre RECEBER DINHEIRO (ex: "recebi", "ganhei", "entrou dinheiro", "renda") → type: "income"

CATEGORIAS DE GASTOS:
- fixed: contas fixas (aluguel, condomínio, internet, luz, água, celular)
- essential: necessidades básicas (mercado, farmácia, transporte, combustível, saúde)
- superfluous: lazer e compras extras (restaurante, cinema, roupas, delivery)
- emergency: emergências (médico urgente, conserto, remédio urgente)
- investment: investimentos (aplicação, ações, fundos)

CATEGORIAS DE RENDA:
- salary: salário mensal fixo
- freelance: trabalhos extras, bicos
- investment: rendimentos de investimentos
- rental: aluguel recebido
- other: outras fontes

INSTRUÇÕES IMPORTANTES:
- Extraia o VALOR exato que o usuário mencionou (pode ser em reais, "reais", "pila", "conto", etc)
- Crie uma descrição clara e objetiva do que foi dito
- A transcrição deve ser EXATAMENTE o que você ouviu no áudio
- Seja preciso na escolha da categoria baseado no contexto

ATENÇÃO: Este é um arquivo de ÁUDIO real. Você PRECISA ouvir e transcrever o que está no áudio.`,
        file_urls: [uploadResult.file_url],
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            type: { 
              type: "string", 
              enum: ["expense", "income"],
              description: "Tipo da transação baseado no que o usuário disse"
            },
            amount: { 
              type: "number",
              description: "Valor numérico mencionado pelo usuário"
            },
            description: { 
              type: "string",
              description: "Descrição curta e clara da transação"
            },
            category: { 
              type: "string",
              description: "Categoria apropriada baseada na descrição"
            },
            confidence: { 
              type: "number",
              description: "Nível de confiança na extração (0-1)"
            },
            transcription: {
              type: "string",
              description: "Transcrição do que o usuário disse"
            }
          },
          required: ["type", "amount", "description", "category"]
        }
      });
      
      if (!result?.amount || !result?.description) {
        throw new Error("Não consegui entender. Tente falar mais claramente.");
      }
      
      if (result.amount <= 0) {
        throw new Error("O valor precisa ser maior que zero.");
      }
      
      setParsedData(result);
      setInputMode("confirming");
    } catch (error) {
      console.error("Audio processing error:", error);
      
      let errorMsg = "Por favor, use o modo texto digitando manualmente";
      
      if (error.message.includes("decode")) {
        errorMsg = "Não foi possível processar o áudio. Use o modo texto.";
      } else if (error.message.includes("entender")) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setInputMode("idle");
    }
  };

  const audioBufferToWav = (audioBuffer) => {
    return new Promise((resolve) => {
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const format = 1;
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
      // Build learning context from historical data
      const recentExpenses = historicalExpenses
        .slice(-30)
        .map(e => ({
          description: e.description,
          amount: e.amount,
          category: e.category
        }));

      const learningContext = recentExpenses.length > 0 
        ? `\n\nAPRENDIZADO: Aqui estão as últimas despesas do usuário para você aprender os padrões:
${recentExpenses.map(e => `- "${e.description}" (R$ ${e.amount}) → ${e.category}`).join('\n')}

Use esses padrões para sugerir a categoria mais provável. Por exemplo:
- Se o usuário já registrou "Uber" antes como "essential", use "essential" novamente
- Se "Netflix" foi "superfluous", mantenha essa categoria
- Aprenda com os valores típicos de cada descrição`
        : '';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente financeiro inteligente com APRENDIZADO DE MÁQUINA. 

O usuário digitou: "${inputText}"

Sua missão é extrair informações financeiras e APRENDER com o histórico para sugerir a categoria mais provável.
${learningContext}

IMPORTANTE:
- Se for um GASTO (gastei, paguei, comprei, etc), identifique como "expense"
- Se for uma ENTRADA/RECEITA (recebi, ganhei, entrou, etc), identifique como "income"
- Extraia o valor numérico
- Use o histórico acima para sugerir a categoria MAIS PROVÁVEL baseada em padrões similares
- Se a descrição for similar a algo no histórico, use a MESMA categoria
- Extraia uma descrição clara

CATEGORIAS DE GASTO: 
- fixed: contas fixas (aluguel, internet, celular, condomínio)
- essential: necessidades básicas (mercado, transporte, Uber, combustível, farmácia)
- superfluous: lazer e extras (restaurante, cinema, Netflix, delivery, roupas)
- emergency: emergências (médico urgente, conserto)
- investment: investimentos

CATEGORIAS DE RENDA: salary, freelance, investment, rental, other

ATENÇÃO: Use o histórico para aumentar a precisão. Se houver padrão similar, mantenha a categoria!`,
        response_json_schema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["expense", "income"] },
            amount: { type: "number" },
            description: { type: "string" },
            category: { type: "string" },
            confidence: { 
              type: "number",
              description: "Confiança de 0-1, maior se baseada em histórico similar"
            },
            reasoning: {
              type: "string",
              description: "Breve explicação de por que escolheu essa categoria"
            }
          },
          required: ["type", "amount", "description", "category", "confidence"]
        }
      });
      
      setParsedData(result);
      setInputMode("confirming");
    } catch (error) {
      console.error("Error processing text:", error);
      setErrorMessage("Erro ao processar texto");
      setInputMode("text");
    }
  };

  const calculateTranquilityImpact = () => {
    if (!parsedData) return 0;
    
    if (parsedData.type === "expense") {
      const percentOfIncome = (parsedData.amount / 3000) * 100;
      if (parsedData.category === "superfluous") return -Math.ceil(percentOfIncome * 0.5);
      if (parsedData.category === "essential") return -Math.ceil(percentOfIncome * 0.2);
      if (parsedData.category === "fixed") return -Math.ceil(percentOfIncome * 0.1);
    } else {
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <motion.div
        layout
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] to-[#1B3A52] shadow-2xl shadow-[#1B3A52]/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#5FBDBD]/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#5FBDBD]/20 rounded-full blur-3xl" />
        
        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {inputMode === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5"
            >
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setInputMode("text");
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="w-full flex items-center gap-4 group bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all"
                >
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#5FBDBD] to-[#4FA9A5] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5FBDBD]/30 group-hover:scale-105 transition-transform">
                      <Edit3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-semibold">Registrar Movimentação</h3>
                    <p className="text-white/60 text-sm">Digite rapidamente</p>
                  </div>

                  <Sparkles className="w-5 h-5 text-[#5FBDBD]" />
                </button>

                {errorMessage && (
                  <p className="text-rose-400 text-xs text-center">{errorMessage}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* TEXT INPUT STATE */}
          {inputMode === "text" && (
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
              </div>

              <div className="flex flex-col items-center justify-center gap-1 mt-3">
                <p className="text-white/40 text-xs">Digite o valor e descrição</p>
                {errorMessage && (
                  <p className="text-rose-400 text-xs">{errorMessage}</p>
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
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 bg-rose-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-rose-400 text-xs font-semibold">REC</span>
              </div>

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
                Fale naturalmente sobre sua transação
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
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

              <Button
                onClick={toggleRecording}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Square className="w-4 h-4 mr-2" />
                Parar Gravação
              </Button>
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white/60 text-sm">
                      {parsedData.type === "expense" ? "Registrar Gasto" : "Registrar Entrada"}
                    </p>
                    {historicalExpenses.length > 5 && (
                      <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-full">
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-300 font-medium">ML</span>
                      </div>
                    )}
                  </div>
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
                
                <div className="mb-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-start">
                    <span className="text-white/60">Categoria</span>
                    {!isEditingCategory ? (
                      <button
                        onClick={() => setIsEditingCategory(true)}
                        className="flex items-center gap-2 text-white font-medium hover:text-[#5FBDBD] transition-colors"
                      >
                        <span>
                          {parsedData.type === "expense" 
                            ? EXPENSE_CATEGORIES[parsedData.category] || parsedData.category
                            : INCOME_TYPES[parsedData.category] || parsedData.category
                          }
                        </span>
                        <Edit3 className="w-3 h-3" />
                      </button>
                    ) : (
                      <select
                        value={parsedData.category}
                        onChange={(e) => {
                          setParsedData({...parsedData, category: e.target.value});
                          setIsEditingCategory(false);
                        }}
                        className="bg-white/10 text-white rounded-lg px-3 py-1 text-sm border border-white/20 focus:border-[#5FBDBD] focus:outline-none"
                      >
                        {parsedData.type === "expense" ? (
                          <>
                            <option value="fixed">Gastos Fixos</option>
                            <option value="essential">Essenciais</option>
                            <option value="superfluous">Supérfluos</option>
                            <option value="emergency">Reserva</option>
                            <option value="investment">Investimentos</option>
                          </>
                        ) : (
                          <>
                            <option value="salary">Salário</option>
                            <option value="freelance">Freelance</option>
                            <option value="investment">Investimento</option>
                            <option value="rental">Aluguel</option>
                            <option value="other">Outros</option>
                          </>
                        )}
                      </select>
                    )}
                  </div>
                </div>

                {parsedData.confidence !== undefined && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              parsedData.confidence > 0.7 ? 'bg-emerald-400' :
                              parsedData.confidence > 0.4 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${parsedData.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-white/60">
                        {Math.round(parsedData.confidence * 100)}% confiante
                      </span>
                    </div>
                    {parsedData.reasoning && (
                      <p className="text-xs text-white/50 mt-2 italic">
                        {parsedData.reasoning}
                      </p>
                    )}
                  </div>
                )}
              </div>

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
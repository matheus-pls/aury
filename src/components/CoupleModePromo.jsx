import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Crown, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const BULLETS = [
  "💳 Gastos compartilhados sem surpresas",
  "🎯 Sonhos que vocês constroem juntos",
  "📊 Transparência total entre vocês dois",
];

export default function CoupleModePromo({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim() || !user?.email) return;
    setJoinError("");
    setJoining(true);
    const results = await base44.entities.FamilyGroup.filter({ invite_code: joinCode.trim().toUpperCase() });
    if (!results || results.length === 0) {
      setJoinError("Código inválido. Verifique com seu parceiro 💔");
      setJoining(false);
      return;
    }
    const group = results[0];
    if (group.members?.includes(user.email)) {
      setJoinError("Você já faz parte desse grupo.");
      setJoining(false);
      return;
    }
    await base44.entities.FamilyGroup.update(group.id, { members: [...(group.members || []), user.email] });
    setJoinSuccess(true);
    setJoining(false);
    queryClient.invalidateQueries({ queryKey: ['family-groups'] });
    setTimeout(() => { setIsJoinOpen(false); setJoinSuccess(false); setJoinCode(""); }, 1800);
  };

  return (
    <div className="min-h-[80vh] relative overflow-hidden flex flex-col items-center justify-center px-4 py-10">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Animated heart icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="w-28 h-28 bg-gradient-to-br from-rose-400 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-500/30"
        >
          <Heart className="w-14 h-14 text-white fill-white" />
        </motion.div>
        {/* Sparkle ring */}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="absolute inset-0 rounded-3xl border-2 border-rose-400/40"
        />
      </motion.div>

      {/* Title + subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-8 max-w-sm"
      >
        <h1 className="text-4xl font-bold text-foreground mb-3">Modo Casal</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Um espaço só de vocês dois, sem julgamento e com muito mais harmonia 💕
        </p>
      </motion.div>

      {/* Two cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-8"
      >
        {/* Card 1 — Premium */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Começar Nossa Jornada</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Assine o Premium e crie o espaço do casal
            </p>
          </div>
          <p className="text-rose-500 font-bold text-base">R$ 9,90<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
          <Button
            onClick={() => navigate("/Upgrade")}
            className="w-full h-10 bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold mt-auto"
          >
            Assinar Premium <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Card 2 — Código */}
        <div className="rounded-2xl border border-rose-500/20 bg-card p-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Tenho um Código</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Meu parceiro(a) me convidou para o espaço dele(a)
            </p>
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => setIsJoinOpen(true)}
            className="w-full h-10 border-rose-300 text-rose-500 hover:bg-rose-50 text-sm font-semibold"
          >
            💌 Digitar código
          </Button>
        </div>
      </motion.div>

      {/* Bullets */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="flex flex-col gap-2 w-full max-w-sm"
      >
        {BULLETS.map((item, i) => (
          <div key={i} className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/15 text-sm text-rose-400 font-medium">
            {item}
          </div>
        ))}
      </motion.div>

      {/* Dialog: Enter code */}
      <Dialog open={isJoinOpen} onOpenChange={(v) => { setIsJoinOpen(v); setJoinError(""); setJoinCode(""); setJoinSuccess(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Entrar com código
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <AnimatePresence mode="wait">
              {joinSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center space-y-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: 2, duration: 0.4 }}
                    className="text-6xl"
                  >
                    💕
                  </motion.div>
                  <p className="text-lg font-bold text-foreground">Vocês estão conectados!</p>
                  <p className="text-sm text-muted-foreground">Entrando no espaço de vocês...</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-sm text-muted-foreground">Digite o código que seu amor compartilhou com você.</p>
                  <Input
                    placeholder="Ex: CASAL-4829"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                    className="h-14 text-center text-xl font-mono tracking-widest uppercase border-rose-300 focus:border-rose-400"
                    autoFocus
                  />
                  {joinError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-rose-500 text-center"
                    >
                      {joinError}
                    </motion.p>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-11" onClick={() => setIsJoinOpen(false)}>Cancelar</Button>
                    <Button
                      className="flex-1 h-11 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold"
                      onClick={handleJoin}
                      disabled={!joinCode.trim() || joining}
                    >
                      {joining ? "Entrando..." : "Entrar com amor 💕"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
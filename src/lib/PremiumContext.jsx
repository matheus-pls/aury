import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "premiumUntil";
const TRIAL_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function checkPremium() {
  const until = localStorage.getItem(STORAGE_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(checkPremium);
  const timerRef = useRef(null);

  // Agenda o timer de expiração com base no tempo restante
  function scheduleExpiry(until) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const remaining = Number(until) - Date.now();
    if (remaining <= 0) return;
    timerRef.current = setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY);
      setIsPremium(false);
      toast.info("Seu teste premium terminou", {
        description: "Continue explorando a Aury e desbloqueie tudo quando a versão oficial estiver disponível.",
        duration: 6000,
      });
    }, remaining);
  }

  // Na montagem, se já havia premium ativo, agenda a expiração
  useEffect(() => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (until && Date.now() < Number(until)) {
      scheduleExpiry(until);
    } else if (until) {
      // expirou enquanto o app estava fechado
      localStorage.removeItem(STORAGE_KEY);
      setIsPremium(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const activate = () => {
    const until = Date.now() + TRIAL_DURATION_MS;
    localStorage.setItem(STORAGE_KEY, String(until));
    setIsPremium(true);
    scheduleExpiry(until);
  };

  const deactivate = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsPremium(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Minutos restantes (0 se não premium)
  const minutesLeft = () => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Number(until) - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  };

  return (
    <PremiumContext.Provider value={{ isPremium, activate, deactivate, minutesLeft }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
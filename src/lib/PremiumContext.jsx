import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "premiumUntil";
const SHOWN_KEY = "premiumExpiredShown";
const TRIAL_USED_KEY = "premiumTrialUsed";
const TRIAL_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function checkPremium() {
  const until = localStorage.getItem(STORAGE_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(checkPremium);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const timerRef = useRef(null);

  function triggerExpiry() {
    localStorage.removeItem(STORAGE_KEY);
    setIsPremium(false);

    // Mostra modal apenas se ainda não foi exibido nessa sessão de expiração
    const alreadyShown = localStorage.getItem(SHOWN_KEY);
    if (!alreadyShown) {
      localStorage.setItem(SHOWN_KEY, "true");
      setShowExpiredModal(true);
    }
  }

  function scheduleExpiry(until) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const remaining = Number(until) - Date.now();
    if (remaining <= 0) return;
    timerRef.current = setTimeout(triggerExpiry, remaining);
  }

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
    // Limpa flag de "já mostrei" para que expire corretamente na próxima vez
    localStorage.removeItem(SHOWN_KEY);
    setIsPremium(true);
    scheduleExpiry(until);
  };

  const deactivate = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SHOWN_KEY);
    setIsPremium(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const dismissExpiredModal = () => setShowExpiredModal(false);

  const minutesLeft = () => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Number(until) - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  };

  return (
    <PremiumContext.Provider value={{ isPremium, activate, deactivate, minutesLeft, showExpiredModal, dismissExpiredModal }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
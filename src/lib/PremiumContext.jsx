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

function checkTrialUsed() {
  return localStorage.getItem(TRIAL_USED_KEY) === "true";
}

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(checkPremium);
  const [trialUsed, setTrialUsed] = useState(checkTrialUsed);
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
    if (checkTrialUsed()) return; // bloqueia reativação
    const until = Date.now() + TRIAL_DURATION_MS;
    localStorage.setItem(STORAGE_KEY, String(until));
    localStorage.setItem(TRIAL_USED_KEY, "true");
    localStorage.removeItem(SHOWN_KEY);
    setIsPremium(true);
    setTrialUsed(true);
    scheduleExpiry(until);
  };

  const deactivate = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SHOWN_KEY);
    // mantém TRIAL_USED_KEY para impedir nova ativação
    setIsPremium(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const dismissExpiredModal = () => setShowExpiredModal(false);

  const devResetTrial = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRIAL_USED_KEY);
    localStorage.removeItem(SHOWN_KEY);
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPremium(false);
    setTrialUsed(false);
    setShowExpiredModal(false);
  };

  const minutesLeft = () => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Number(until) - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  };

  return (
    <PremiumContext.Provider value={{ isPremium, trialUsed, activate, deactivate, minutesLeft, showExpiredModal, dismissExpiredModal }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "premiumUntil";
const SHOWN_KEY = "premiumExpiredShown";
const TRIAL_USED_KEY = "premiumTrialUsed";
const TRIAL_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function checkLocalPremium() {
  const until = localStorage.getItem(STORAGE_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function checkTrialUsed() {
  return localStorage.getItem(TRIAL_USED_KEY) === "true";
}

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(checkLocalPremium);
  const [trialUsed, setTrialUsed] = useState(checkTrialUsed);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null); // null | "active" | "canceled" | etc.
  const [userEmail, setUserEmail] = useState(null);
  const timerRef = useRef(null);

  // Busca status da assinatura no Stripe
  const checkStripeSubscription = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await base44.functions.invoke("getSubscriptionStatus", { user_email: email });
      const data = res.data;
      if (data?.is_premium) {
        setIsPremium(true);
        setStripeStatus("active");
      } else {
        setStripeStatus(data?.status || null);
        // Só remove premium se não havia trial local ativo
        if (!checkLocalPremium()) {
          setIsPremium(false);
        }
      }
    } catch (e) {
      console.error("Failed to check Stripe subscription:", e);
    }
  }, []);

  // Carrega o email do usuário autenticado
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.email) {
        setUserEmail(user.email);
        checkStripeSubscription(user.email);
      }
    }).catch(() => {});
  }, [checkStripeSubscription]);

  // Trial local timer
  function triggerExpiry() {
    localStorage.removeItem(STORAGE_KEY);
    // Se tem Stripe ativo, mantém premium
    if (stripeStatus === "active") return;
    setIsPremium(false);
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
      localStorage.removeItem(STORAGE_KEY);
      if (stripeStatus !== "active") setIsPremium(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stripeStatus]);

  // Ativa trial local (apenas se não tem Stripe)
  const activate = () => {
    if (checkTrialUsed()) return;
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
    if (stripeStatus !== "active") setIsPremium(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const dismissExpiredModal = () => setShowExpiredModal(false);

  const devResetTrial = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRIAL_USED_KEY);
    localStorage.removeItem(SHOWN_KEY);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stripeStatus !== "active") {
      setIsPremium(false);
    }
    setTrialUsed(false);
    setShowExpiredModal(false);
  };

  const minutesLeft = () => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Number(until) - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  };

  // Força recheck após checkout (chamado pela tela de Upgrade)
  const refreshSubscription = useCallback(async (email) => {
    const emailToCheck = email || userEmail;
    if (emailToCheck) await checkStripeSubscription(emailToCheck);
  }, [userEmail, checkStripeSubscription]);

  return (
    <PremiumContext.Provider value={{
      isPremium,
      trialUsed,
      stripeStatus,
      activate,
      deactivate,
      minutesLeft,
      showExpiredModal,
      dismissExpiredModal,
      devResetTrial,
      refreshSubscription,
      userEmail
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
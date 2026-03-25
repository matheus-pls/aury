import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const TRIAL_DURATION_MS = 15 * 60 * 1000; // 15 minutos

// Chaves por usuário para evitar vazamento entre contas
function storageKey(userId, suffix) {
  return `aury_${suffix}_${userId || "anon"}`;
}

function checkLocalPremium(userId) {
  const until = localStorage.getItem(storageKey(userId, "premiumUntil"));
  if (!until) return false;
  return Date.now() < Number(until);
}

function checkTrialUsed(userId) {
  return localStorage.getItem(storageKey(userId, "trialUsed")) === "true";
}

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
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
        if (!checkLocalPremium(userId)) {
          setIsPremium(false);
        }
      }
    } catch (e) {
      console.error("Failed to check Stripe subscription:", e);
    }
  }, [userId]);

  // Carrega o usuário autenticado e inicializa estado por usuário
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user) {
        const uid = user.id || user.email;
        setUserId(uid);
        setUserEmail(user.email);
        setIsPremium(checkLocalPremium(uid));
        setTrialUsed(checkTrialUsed(uid));
        checkStripeSubscription(user.email);
      }
    }).catch(() => {});
  }, [checkStripeSubscription]);

  // Trial local timer
  function triggerExpiry() {
    localStorage.removeItem(storageKey(userId, "premiumUntil"));
    // Se tem Stripe ativo, mantém premium
    if (stripeStatus === "active") return;
    setIsPremium(false);
    const shownKey = storageKey(userId, "expiredShown");
    const alreadyShown = localStorage.getItem(shownKey);
    if (!alreadyShown) {
      localStorage.setItem(shownKey, "true");
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
    if (!userId) return;
    const until = localStorage.getItem(storageKey(userId, "premiumUntil"));
    if (until && Date.now() < Number(until)) {
      scheduleExpiry(until);
    } else if (until) {
      localStorage.removeItem(storageKey(userId, "premiumUntil"));
      if (stripeStatus !== "active") setIsPremium(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stripeStatus, userId]);

  // Ativa trial local (apenas se não tem Stripe)
  const activate = () => {
    if (checkTrialUsed(userId)) return;
    const until = Date.now() + TRIAL_DURATION_MS;
    localStorage.setItem(storageKey(userId, "premiumUntil"), String(until));
    localStorage.setItem(storageKey(userId, "trialUsed"), "true");
    localStorage.removeItem(storageKey(userId, "expiredShown"));
    setIsPremium(true);
    setTrialUsed(true);
    scheduleExpiry(until);
  };

  const deactivate = () => {
    localStorage.removeItem(storageKey(userId, "premiumUntil"));
    localStorage.removeItem(storageKey(userId, "expiredShown"));
    if (stripeStatus !== "active") setIsPremium(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const dismissExpiredModal = () => setShowExpiredModal(false);

  const devResetTrial = () => {
    localStorage.removeItem(storageKey(userId, "premiumUntil"));
    localStorage.removeItem(storageKey(userId, "trialUsed"));
    localStorage.removeItem(storageKey(userId, "expiredShown"));
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stripeStatus !== "active") {
      setIsPremium(false);
    }
    setTrialUsed(false);
    setShowExpiredModal(false);
  };

  const minutesLeft = () => {
    if (!userId) return 0;
    const until = localStorage.getItem(storageKey(userId, "premiumUntil"));
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
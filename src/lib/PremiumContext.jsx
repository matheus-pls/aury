import React, { createContext, useContext, useState, useEffect } from "react";

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem("aury_is_premium") === "true";
  });

  const activate = () => {
    setIsPremium(true);
    localStorage.setItem("aury_is_premium", "true");
  };

  const deactivate = () => {
    setIsPremium(false);
    localStorage.setItem("aury_is_premium", "false");
  };

  return (
    <PremiumContext.Provider value={{ isPremium, activate, deactivate }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
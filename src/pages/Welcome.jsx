import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MinimalOnboarding from "@/components/onboarding/MinimalOnboarding";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/lib/AuthContext";

export default function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { isLoading, onboardingCompleted } = useOnboardingStatus();

  useEffect(() => {
    if (isLoadingAuth || isLoading) return;

    if (!isAuthenticated) {
      // Not logged in → go to login
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (onboardingCompleted) {
      navigate(createPageUrl("Home"), { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, isLoading, onboardingCompleted, navigate]);

  if (isLoadingAuth || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#5FBDBD] rounded-full animate-spin" />
      </div>
    );
  }

  return <MinimalOnboarding />;
}
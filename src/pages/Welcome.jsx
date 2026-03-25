import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import MinimalOnboarding from "@/components/onboarding/MinimalOnboarding";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/lib/AuthContext";

export default function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { isLoading, onboardingCompleted } = useOnboardingStatus();

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [isAuthenticated, isLoadingAuth]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#5FBDBD] rounded-full animate-spin" />
      </div>
    );
  }

  return <MinimalOnboarding />;
}
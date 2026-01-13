import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MinimalOnboarding from "@/components/onboarding/MinimalOnboarding";

export default function Welcome() {
  const navigate = useNavigate();

  // Check if user has already completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("aury_onboarding_complete");
    if (hasCompletedOnboarding) {
      navigate(createPageUrl("Overview"));
    }
  }, [navigate]);

  return <MinimalOnboarding />;
}
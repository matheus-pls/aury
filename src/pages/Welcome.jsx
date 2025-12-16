import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Onboarding from "@/components/onboarding/Onboarding";
import QuickSetup from "@/components/onboarding/QuickSetup";
import ProfileSelector from "@/components/onboarding/ProfileSelector";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PROFILE_DISTRIBUTIONS = {
  essential: {
    fixed_percentage: 50,
    essential_percentage: 25,
    superfluous_percentage: 15,
    emergency_percentage: 7,
    investment_percentage: 3
  },
  balanced: {
    fixed_percentage: 50,
    essential_percentage: 20,
    superfluous_percentage: 15,
    emergency_percentage: 10,
    investment_percentage: 5
  },
  focused: {
    fixed_percentage: 50,
    essential_percentage: 15,
    superfluous_percentage: 10,
    emergency_percentage: 15,
    investment_percentage: 10
  }
};

export default function Welcome() {
  const [step, setStep] = useState("onboarding"); // onboarding -> quicksetup -> profile -> complete
  const [setupAnswers, setSetupAnswers] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user has already completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("rendy_onboarding_complete");
    const hasCompletedSetup = localStorage.getItem("rendy_setup_complete");
    const hasSelectedProfile = localStorage.getItem("rendy_profile_selected");

    if (hasCompletedOnboarding && hasCompletedSetup && hasSelectedProfile) {
      navigate(createPageUrl("Dashboard"));
    } else if (hasCompletedOnboarding && !hasCompletedSetup) {
      setStep("quicksetup");
    } else if (hasCompletedOnboarding && hasCompletedSetup && !hasSelectedProfile) {
      setStep("profile");
    }
  }, [navigate]);

  const createSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.UserSettings.create(data)
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data)
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem("rendy_onboarding_complete", "true");
    setStep("quicksetup");
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem("rendy_onboarding_complete", "true");
    setStep("profile");
  };

  const handleSetupComplete = (answers) => {
    localStorage.setItem("rendy_setup_complete", "true");
    localStorage.setItem("rendy_setup_answers", JSON.stringify(answers));
    setSetupAnswers(answers);
    setStep("profile");
  };

  const handleSetupSkip = () => {
    localStorage.setItem("rendy_setup_complete", "true");
    setStep("profile");
  };

  const handleProfileSelect = async (profileId) => {
    localStorage.setItem("rendy_profile_selected", profileId);
    
    const distribution = PROFILE_DISTRIBUTIONS[profileId];
    
    // Create user settings
    try {
      await createSettingsMutation.mutateAsync({
        risk_profile: profileId,
        ...distribution,
        emergency_fund_goal_months: 6,
        current_emergency_fund: 0,
        notifications_enabled: true
      });

      // If user provided income during setup, create it
      if (setupAnswers && setupAnswers.monthly_income) {
        const incomeValue = setupAnswers.monthly_income.replace(/\D/g, "");
        if (incomeValue) {
          await createIncomeMutation.mutateAsync({
            description: "Renda Principal",
            amount: parseFloat(incomeValue),
            type: "salary",
            is_active: true
          });
        }
      }

      queryClient.invalidateQueries(['settings']);
      queryClient.invalidateQueries(['incomes']);
      
      // Navigate to dashboard
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving profile:", error);
      // Still navigate even if there's an error
      navigate(createPageUrl("Dashboard"));
    }
  };

  if (step === "onboarding") {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  if (step === "quicksetup") {
    return (
      <QuickSetup 
        onComplete={handleSetupComplete}
        onSkip={handleSetupSkip}
      />
    );
  }

  if (step === "profile") {
    return <ProfileSelector onSelect={handleProfileSelect} />;
  }

  return null;
}
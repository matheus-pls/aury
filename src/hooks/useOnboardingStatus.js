import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns { isLoading, onboardingCompleted }
 * - If user is not authenticated, onboardingCompleted = false
 * - Checks UserSettings.onboarding_completed in the DB
 * - Falls back to localStorage for backwards compat
 */
export function useOnboardingStatus() {
  const { isAuthenticated } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings-onboarding"],
    queryFn: async () => {
      const r = await base44.entities.UserSettings.list();
      return r[0] || null;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  if (!isAuthenticated) {
    return { isLoading: false, onboardingCompleted: false };
  }

  // While loading, keep isLoading true
  if (isLoading) {
    return { isLoading: true, onboardingCompleted: false };
  }

  // Check DB field first, fallback to localStorage for legacy users
  const dbCompleted = settings?.onboarding_completed === true;
  const localCompleted = localStorage.getItem("aury_onboarding_complete") === "true";

  return {
    isLoading: false,
    onboardingCompleted: dbCompleted || localCompleted,
    settings,
  };
}
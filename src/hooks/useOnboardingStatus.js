import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns { isLoading, onboardingCompleted }
 * - Isolado por usuário: usa user.id como parte da queryKey e do localStorage
 * - Nunca retorna dados de outro usuário
 */
export function useOnboardingStatus() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id || user?.email || null;

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings-onboarding", userId],
    queryFn: async () => {
      const r = await base44.entities.UserSettings.list();
      return r[0] || null;
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 30 * 1000,
  });

  if (!isAuthenticated || !userId) {
    return { isLoading: false, onboardingCompleted: false };
  }

  // While loading, keep isLoading true
  if (isLoading) {
    return { isLoading: true, onboardingCompleted: false };
  }

  // Check DB field first, fallback to localStorage keyed by userId
  const dbCompleted = settings?.onboarding_completed === true;
  const localKey = `aury_onboarding_complete_${userId}`;
  const localCompleted = localStorage.getItem(localKey) === "true";

  return {
    isLoading: false,
    onboardingCompleted: dbCompleted || localCompleted,
    settings,
  };
}
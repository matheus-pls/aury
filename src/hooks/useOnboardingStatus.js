import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Verifica se o onboarding foi concluído para o usuário autenticado atual.
 * Totalmente isolado por userId — nunca retorna dados de outro usuário.
 */
export function useOnboardingStatus() {
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  const userId = user?.id || user?.email || null;

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["settings-onboarding", userId],
    queryFn: async () => {
      // O SDK aplica RLS por created_by automaticamente — retorna apenas dados do usuário autenticado
      const r = await base44.entities.UserSettings.list();
      return r[0] || null;
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 30 * 1000,
  });

  // Enquanto auth ou userId ainda não resolveram, está carregando
  if (isLoadingAuth || !isAuthenticated || !userId) {
    return { isLoading: true, onboardingCompleted: false };
  }

  // Enquanto a query está carregando, está carregando
  if (isLoadingSettings) {
    return { isLoading: true, onboardingCompleted: false };
  }

  // Verifica DB primeiro — fonte de verdade
  const dbCompleted = settings?.onboarding_completed === true;

  // localStorage apenas como cache local, sempre isolado por userId (nunca sem userId)
  const localKey = userId ? `aury_onboarding_complete_${userId}` : null;
  const localCompleted = localKey ? localStorage.getItem(localKey) === "true" : false;

  return {
    isLoading: false,
    onboardingCompleted: dbCompleted || localCompleted,
    settings,
  };
}
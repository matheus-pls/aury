import { useAuth } from "@/lib/AuthContext";

/**
 * Retorna o userId do usuário autenticado atual.
 * Usado para isolar queryKeys do React Query por usuário.
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || user?.email || null;
  return { userId, isAuthenticated, user };
}
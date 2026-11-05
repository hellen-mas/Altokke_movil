import { RolUsuario, useAuthStore } from "@/features/autenticacion/store/authStore";
import { useShallow } from "zustand/react/shallow";

export const useUserId = () => useAuthStore((s) => s.userId);
export const useUserRole = () => useAuthStore((s) => s.userRole);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsLoading = () => useAuthStore((s) => s.isLoading);

export function useAuth() {
    return useAuthStore(
        useShallow((s) => ({
            isAuthenticated: s.isAuthenticated,
            isLoading: s.isLoading,
            userId: s.userId,
            userRole: s.userRole,      
            user: s.user,
            session: s.session,
            login: s.login,
            logout: s.logout,      
        }))
    );
}
export type { RolUsuario };

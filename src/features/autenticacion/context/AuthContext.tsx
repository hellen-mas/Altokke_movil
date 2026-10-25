import React, { useEffect } from "react";
import { useAuthStore, type RolUsuario } from "../store/authStore";

export type { RolUsuario };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    return useAuthStore.getState().init();
  }, []);

  return <>{children}</>;
};

export const useAuth = () => {
  const store = useAuthStore();
  return {
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    userRole: store.userRole,
    userId: store.userId,
    user: store.user,
    session: store.session,
    login: store.login,
    logout: store.logout,
  };
};

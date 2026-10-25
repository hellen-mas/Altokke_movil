import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/api/supabase";

type RolUsuario = "pasajero" | "conductor" | null;

interface TipoContextoAutenticacion {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: RolUsuario;
  userId: string | null;
  user: User | null;
  session: Session | null;
  login: (rol: RolUsuario) => void;
  logout: () => Promise<void>;
}

const ContextoAutenticacion = createContext<TipoContextoAutenticacion | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [overrideRole, setOverrideRole] = useState<RolUsuario>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ses) => {
      setSession(ses);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback((rol: RolUsuario) => {
    setOverrideRole(rol);
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Silenciar error en salida
    }
    setSession(null);
    setOverrideRole(null);
  }, []);

  const value = useMemo<TipoContextoAutenticacion>(() => {
    const user = session?.user ?? null;
    const roleFromMeta = (user?.user_metadata?.rol as RolUsuario) ?? (user ? "pasajero" : null);

    return {
      isAuthenticated: Boolean(session?.user),
      isLoading,
      userRole: overrideRole || roleFromMeta,
      userId: user?.id ?? null,
      user,
      session,
      login,
      logout,
    };
  }, [session, isLoading, overrideRole, login, logout]);

  return (
    <ContextoAutenticacion.Provider value={value}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export const useAuth = () => {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return contexto;
};

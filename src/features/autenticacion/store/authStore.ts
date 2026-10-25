import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/api/supabase";

export type RolUsuario = "pasajero" | "conductor" | null;

export interface EstadoAutenticacion {
  session: Session | null;
  user: User | null;
  userId: string | null;
  userRole: RolUsuario;
  overrideRole: RolUsuario;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (rol: RolUsuario) => void;
  logout: () => Promise<void>;
  setSession: (session: Session | null) => void;
  init: () => () => void;
}

export const useAuthStore = create<EstadoAutenticacion>((set, get) => ({
  session: null,
  user: null,
  userId: null,
  userRole: null,
  overrideRole: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (session) => {
    const user = session?.user ?? null;
    const roleFromMeta = (user?.user_metadata?.rol as RolUsuario) ?? (user ? "pasajero" : null);
    const override = get().overrideRole;
    set({
      session,
      user,
      userId: user?.id ?? null,
      userRole: override || roleFromMeta,
      isAuthenticated: Boolean(user),
      isLoading: false,
    });
  },

  login: (rol) => {
    set((state) => ({
      overrideRole: rol,
      userRole: rol || state.userRole,
    }));
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Silenciar error en desconexión
    }
    set({
      session: null,
      user: null,
      userId: null,
      userRole: null,
      overrideRole: null,
      isAuthenticated: false,
    });
  },

  init: () => {
    // Delega la sesión inicial en INITIAL_SESSION para no leerla dos veces
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, ses) => {
      get().setSession(ses);
    });

    return () => subscription.unsubscribe();
  },
}));

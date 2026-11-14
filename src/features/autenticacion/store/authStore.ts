import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/api/supabase";

type RolUsuario = "pasajero" | "conductor" | null;
export { type RolUsuario };

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
    } catch (err: unknown) {
      console.warn("Aviso al cerrar sesion en Supabase:", err);
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
    let activo = true;
    let revision = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, ses) => {
      const revisionActual = ++revision;

      if (!ses?.user) {
        get().setSession(null);
        return;
      }

      // No autorizar la navegación hasta verificar la cuenta.
      set({
        isLoading: true,
        isAuthenticated: false,
      });

      // La consulta se ejecuta fuera del callback de Supabase Auth
      // para evitar bloqueos con operaciones asíncronas.
      setTimeout(() => {
        const verificarCuenta = async () => {
          try {
            const { data: usuario, error } = await supabase
              .from("usuarios")
              .select("estado_cuenta")
              .eq("id", ses.user.id)
              .single();

            if (!activo || revisionActual !== revision) return;

            if (error || !usuario) {
              console.warn(
                "No se pudo verificar el estado de la cuenta en backend:",
                error?.message ?? error
              );

              // Si es un error de red o timeout, preservamos la sesion local para no expulsar al usuario
              const esErrorConectividad =
                !error ||
                error.message?.includes("Network request failed") ||
                error.message?.includes("Failed to fetch") ||
                error.message?.includes("timeout");

              if (esErrorConectividad) {
                get().setSession(ses);
                return;
              }

              // Si la cuenta fue eliminada o el error es de autorizacion, cerramos sesion
              get().setSession(null);
              return;
            }

            if (usuario.estado_cuenta !== "activo") {
              get().setSession(null);

              await supabase.auth.signOut({
                scope: "local",
              });

              return;
            }

            // Solo una cuenta activa obtiene acceso a la app.
            get().setSession(ses);
          } catch (error) {
            if (!activo || revisionActual !== revision) return;

            console.warn(
              "Error verificando la cuenta (preservando sesion local ante caida de red):",
              error
            );

            // Ante excepcion de red imprevista, preservamos la sesion valida
            get().setSession(ses);
          }
        };

        void verificarCuenta();
      }, 0);
    });

    return () => {
      activo = false;
      revision++;
      subscription.unsubscribe();
    };
  },
}));

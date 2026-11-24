import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/api/supabase";
import { eliminarTokenPush } from "@/features/notificaciones/services/pushTokenService";
import { useViajeStore } from "@/features/viajes/store/viajeStore";
import { useNotificacionesStore } from "@/features/notificaciones/store/notificacionesStore";
import { useRegistroConductor } from "@/features/conductores/store/registroConductorStore";
import { useRegistroPasajero } from "@/features/pasajeros/store/registroPasajeroStore";
import { detenerRastreoSegundoPlano } from "@/features/conductores/services/rastreoGpsConductor";
import { queryClient } from "@/shared/api/queryClient";

// Retira el token del dispositivo antes de cerrar la sesión.
// Si falla, el cierre de sesión continúa normalmente.
async function retirarTokenAntesDeCerrarSesion(
  usuarioId: string | null
): Promise<void> {
  if (!usuarioId) return;

  try {
    await eliminarTokenPush(usuarioId);
  } catch (error) {
    console.warn(
      "No se pudo retirar el token push del dispositivo:",
      error
    );
  }
}

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
    // Conservamos el ID antes de limpiar el estado
    const usuarioId = get().userId;

    // 1. Retirar únicamente el token de este dispositivo
    await retirarTokenAntesDeCerrarSesion(usuarioId);

    // 2. Detener cualquier rastreo GPS activo en segundo plano
    try {
      await detenerRastreoSegundoPlano();
    } catch (e) {
      console.warn("Aviso al detener rastreo GPS en logout:", e);
    }

    try {
      // 3. Cerrar solamente la sesión de este dispositivo
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        console.warn("Aviso al cerrar sesión en Supabase", error.message);
      }
    } catch (error: unknown) {
      console.warn("Error al cerrar sesión en Supabase", error);
    } finally {
      // 4. Limpiar stores Zustand de viajes, notificaciones, conductor y pasajero
      try {
        useViajeStore.getState().limpiarViaje();
        useNotificacionesStore.getState().limpiarNotificaciones();
        useRegistroConductor.getState().limpiarFormulario();
        useRegistroPasajero.getState().clearRegistro();
      } catch (e) {
        console.warn("Aviso limpiando stores en logout:", e);
      }

      // 5. Limpiar la caché de React Query
      try {
        queryClient.clear();
      } catch (e) {
        console.warn("Aviso limpiando queryClient en logout:", e);
      }

      // 6. Limpiar el estado local de auth independientemente del resultado
      set({
        session: null,
        user: null,
        userId: null,
        userRole: null,
        overrideRole: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
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
              // Retirar el token antes de cerrar la sesión
              await retirarTokenAntesDeCerrarSesion(ses.user.id);
              
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

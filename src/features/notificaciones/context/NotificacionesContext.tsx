import React, { useEffect, useMemo } from "react";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { supabase } from "@/shared/api/supabase";
import {
  useNotificacionesStore,
  type NotificacionesStore,
} from "../store/notificacionesStore";
import {
  NotificacionItem,
  PreferenciasNotificaciones,
} from "../types/notificaciones";

export interface NotificacionesContextType {
  notificaciones: NotificacionItem[];
  hayNoLeidas: boolean;
  cargando: boolean;
  preferencias: PreferenciasNotificaciones;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  actualizarPreferencia: (
    clave: keyof PreferenciasNotificaciones,
    valor: boolean
  ) => Promise<void>;
  procesarEstadoViaje: (
    viajeId: string,
    estado: string,
    metadata?: { conductorNombre?: string }
  ) => Promise<void>;
  recargarNotificaciones: () => Promise<void>;
}

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();

  // Inicialización y suscripción Realtime en segundo plano
  useEffect(() => {
    if (!userId) return;

    // Sincronizar viajes previos si no se han cargado
    const sincronizarViajesPrevios = async () => {
      try {
        const { data } = await supabase
          .from("viajes")
          .select("id, estado, creado_en")
          .eq("pasajero_id", userId)
          .order("creado_en", { ascending: false })
          .limit(8);

        if (data && data.length > 0) {
          useNotificacionesStore
            .getState()
            .inicializarHistorialNotificaciones(data);
        }
      } catch (err) {
        console.warn("Aviso al sincronizar historial de notificaciones:", err);
      }
    };

    void sincronizarViajesPrevios();

    // Suscripción Realtime a eventos de viaje
    const canal = supabase
      .channel(`canal_notificaciones_pasajero_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "viajes",
          filter: `pasajero_id=eq.${userId}`,
        },
        (payload) => {
          const viajeActualizado = payload.new as any;
          if (viajeActualizado?.id && viajeActualizado?.estado) {
            useNotificacionesStore
              .getState()
              .procesarEstadoViaje(
                viajeActualizado.id,
                viajeActualizado.estado
              );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]);

  return <>{children}</>;
}

export function useNotificaciones(): NotificacionesContextType {
  const store = useNotificacionesStore();
  const { userId } = useAuth();

  const hayNoLeidas = useMemo(
    () => store.notificaciones.some((item) => !item.leida),
    [store.notificaciones]
  );

  return {
    notificaciones: store.notificaciones,
    hayNoLeidas,
    cargando: store.cargando,
    preferencias: store.preferencias,
    marcarComoLeida: async (id: string) => store.marcarComoLeida(id),
    marcarTodasLeidas: async () => store.marcarTodasLeidas(),
    eliminarNotificacion: async (id: string) => store.eliminarNotificacion(id),
    actualizarPreferencia: async (clave, valor) =>
      store.actualizarPreferencia(clave, valor, userId),
    procesarEstadoViaje: async (viajeId, estado, metadata) =>
      store.procesarEstadoViaje(viajeId, estado, metadata),
    recargarNotificaciones: async () => {},
  };
}

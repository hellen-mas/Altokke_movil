import { useUserId } from "@/features/autenticacion/hooks/useAuth";
import { suscribirseAViajesDelPasajero } from "@/features/notificaciones/services/notificacionesService";
import { useNotificacionesStore } from "@/features/notificaciones/store/notificacionesStore";
import type { PreferenciasNotificaciones } from "@/features/notificaciones/types/notificaciones";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

// Carga el historial y escucha los cambios de viaje en tiempo real.
// Se llama una vez en el layout del pasajero (reemplaza al falso NotificacionesProvider).
export function useSincronizarNotificaciones() {
  const userId = useUserId();

  useEffect(() => {
    if (!userId) return;

    viajeService
      .obtenerViajesParaNotificaciones(userId)
      .then((viajes) => {
        if (viajes.length > 0) {
          useNotificacionesStore.getState().inicializarHistorialNotificaciones(viajes);
        }
      })
      .catch((err) =>
        console.warn("Aviso al sincronizar historial de notificaciones:", err)
      );

    return suscribirseAViajesDelPasajero(userId, (viajeId, estado) => {
      useNotificacionesStore.getState().procesarEstadoViaje(viajeId, estado);
    });
  }, [userId]);
}

// Acceso a las notificaciones con selectores: solo redibuja si cambia lo que se usa.
export function useNotificaciones() {
  const userId = useUserId();

  const { actualizarPreferencia, ...estado } = useNotificacionesStore(
    useShallow((s) => ({
      notificaciones: s.notificaciones,
      cargando: s.cargando,
      preferencias: s.preferencias,
      marcarComoLeida: s.marcarComoLeida,
      marcarTodasLeidas: s.marcarTodasLeidas,
      eliminarNotificacion: s.eliminarNotificacion,
      procesarEstadoViaje: s.procesarEstadoViaje,
      actualizarPreferencia: s.actualizarPreferencia,
    }))
  );

  const hayNoLeidas = useNotificacionesStore((s) =>
    s.notificaciones.some((item) => !item.leida)
  );

  return {
    ...estado,
    hayNoLeidas,
    actualizarPreferencia: (clave: keyof PreferenciasNotificaciones, valor: boolean) =>
      actualizarPreferencia(clave, valor, userId),
  };
}
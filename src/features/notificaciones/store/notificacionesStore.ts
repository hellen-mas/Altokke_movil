import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NotificacionItem,
  PREFERENCIAS_POR_DEFECTO,
  PreferenciasNotificaciones,
} from "../types/notificaciones";
import { pasajeroService } from "@/features/pasajeros/services/pasajeroService";

function formatearHora(fecha: Date): string {
  const horas = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

export function crearNotificacionBienvenida(): NotificacionItem {
  const ahora = new Date();
  return {
    id: "sistema_bienvenida",
    icono: "shield-checkmark-outline",
    titulo: "Bienvenido a Altokke",
    mensaje:
      "Tu cuenta de pasajero está lista para solicitar mototaxis seguros en Bagua.",
    hora: formatearHora(ahora),
    fechaIso: ahora.toISOString(),
    leida: false,
    tipo: "sistema",
  };
}

export function mapearEstadoANotificacion(
  viajeId: string,
  estado: string,
  fecha: Date = new Date(),
  conductorNombre?: string
): NotificacionItem | null {
  const hora = formatearHora(fecha);
  const fechaIso = fecha.toISOString();
  const id = `${viajeId}_${estado}`;

  switch (estado) {
    case "aceptado":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "checkmark-circle-outline",
        titulo: "Conductor asignado",
        mensaje: conductorNombre
          ? `${conductorNombre} ha aceptado tu viaje y se dirige hacia tu ubicación.`
          : "Un conductor ha aceptado tu viaje y se dirige hacia tu ubicación.",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    case "en_camino_origen":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "navigate-outline",
        titulo: "Conductor en camino",
        mensaje: "El mototaxi está en camino al punto de recogida.",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    case "esperando_pasajero":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "notifications-outline",
        titulo: "¡Tu mototaxi ha llegado!",
        mensaje: "El conductor te está esperando en el punto de encuentro.",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    case "en_viaje":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "speedometer-outline",
        titulo: "Viaje iniciado",
        mensaje: "Tu viaje ha iniciado. ¡Que tengas un recorrido seguro!",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    case "finalizado":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "flag-outline",
        titulo: "Viaje finalizado",
        mensaje: "Has llegado a tu destino. Recuerda calificar el servicio del conductor.",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    case "cancelado_conductor":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "alert-circle-outline",
        titulo: "Viaje cancelado por el conductor",
        mensaje:
          "El conductor no pudo continuar con el viaje. Puedes solicitar otro mototaxi de inmediato.",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    case "cancelado_pasajero":
      return {
        id,
        viajeId,
        estadoViaje: estado,
        icono: "close-circle-outline",
        titulo: "Viaje cancelado",
        mensaje: "Has cancelado tu solicitud de viaje exitosamente.",
        hora,
        fechaIso,
        leida: false,
        tipo: "viaje",
      };
    default:
      return null;
  }
}

export interface NotificacionesStore {
  notificaciones: NotificacionItem[];
  preferencias: PreferenciasNotificaciones;
  cargando: boolean;

  // Acciones
  setCargando: (cargando: boolean) => void;
  marcarComoLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  eliminarNotificacion: (id: string) => void;
  actualizarPreferencia: (
    clave: keyof PreferenciasNotificaciones,
    valor: boolean,
    userId?: string | null
  ) => Promise<void>;
  procesarEstadoViaje: (
    viajeId: string,
    estado: string,
    metadata?: { conductorNombre?: string }
  ) => void;
  agregarNotificacion: (notificacion: NotificacionItem) => void;
  inicializarHistorialNotificaciones: (viajes: { id: string; estado: string | null; creado_en?: string | null }[]) => void;
}

export const useNotificacionesStore = create<NotificacionesStore>()(
  persist(
    (set, get) => ({
      notificaciones: [crearNotificacionBienvenida()],
      preferencias: PREFERENCIAS_POR_DEFECTO,
      cargando: false,

      setCargando: (cargando) => set({ cargando }),

      marcarComoLeida: (id) =>
        set((state) => ({
          notificaciones: state.notificaciones.map((item) =>
            item.id === id ? { ...item, leida: true } : item
          ),
        })),

      marcarTodasLeidas: () =>
        set((state) => ({
          notificaciones: state.notificaciones.map((item) => ({
            ...item,
            leida: true,
          })),
        })),

      eliminarNotificacion: (id) =>
        set((state) => ({
          notificaciones: state.notificaciones.filter((item) => item.id !== id),
        })),

      actualizarPreferencia: async (clave, valor, userId) => {
        const nuevoEstado = {
          ...get().preferencias,
          [clave]: valor,
        };
        set({ preferencias: nuevoEstado });

        if (userId) {
          try {
            await pasajeroService.guardarPreferencias(userId, {
              notificaciones: nuevoEstado,
            });
          } catch (err) {
            console.warn("Aviso al guardar preferencias en perfil:", err);
          }
        }
      },

      agregarNotificacion: (notificacion) =>
        set((state) => {
          if (state.notificaciones.some((n) => n.id === notificacion.id)) {
            return state;
          }
          return { notificaciones: [notificacion, ...state.notificaciones] };
        }),

      procesarEstadoViaje: (viajeId, estado, metadata) => {
        const { preferencias, notificaciones } = get();

        // Verificar si las notificaciones de viaje están activadas
        if (!preferencias.viaje) {
          return;
        }

        const idEvento = `${viajeId}_${estado}`;
        if (notificaciones.some((n) => n.id === idEvento)) {
          return;
        }

        const nuevaNotificacion = mapearEstadoANotificacion(
          viajeId,
          estado,
          new Date(),
          metadata?.conductorNombre
        );

        if (!nuevaNotificacion) {
          return;
        }

        set((state) => ({
          notificaciones: [nuevaNotificacion, ...state.notificaciones],
        }));
      },

      inicializarHistorialNotificaciones: (viajes) => {
        const existentes = get().notificaciones;
        const nuevasDerivadas: NotificacionItem[] = [];

        for (const v of viajes) {
          if (!v.id || !v.estado) continue;
          const idEvento = `${v.id}_${v.estado}`;
          if (existentes.some((n) => n.id === idEvento)) continue;

          const item = mapearEstadoANotificacion(
            v.id,
            v.estado,
            v.creado_en ? new Date(v.creado_en) : new Date()
          );

          if (item) {
            item.leida = true; // Pasadas se marcan leídas
            nuevasDerivadas.push(item);
          }
        }

        if (nuevasDerivadas.length > 0) {
          set((state) => ({
            notificaciones: [...nuevasDerivadas, ...state.notificaciones],
          }));
        }
      },
    }),
    {
      name: "altokke-notificaciones-almacenadas",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notificaciones: state.notificaciones,
        preferencias: state.preferencias,
      }),
    }
  )
);

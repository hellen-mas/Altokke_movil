import { create } from "zustand";
import {
  HISTORIAL_EJEMPLO,
  ORIGEN_EJEMPLO,
  type Lugar,
  type ViajeHistorial,
} from "@/features/viajes/constants/pasajero";
import { viajeService } from "@/features/viajes/services/viajeService";
import type { PuntoMapa } from "../types/tiposMapa";

export type TipoServicio = "normal" | "express" | "reserva";
export type MetodoPago = "efectivo" | "yape" | "plin";

type ValOrFn<T> = T | ((prev: T) => T);

function resolverValor<T>(valor: ValOrFn<T>, anterior: T): T {
  return typeof valor === "function" ? (valor as (prev: T) => T)(anterior) : valor;
}

export interface ViajeStore {
  tipoServicio: TipoServicio;
  metodoPago: MetodoPago;
  origen: Lugar;
  destino: Lugar | null;
  ubicacionActual: PuntoMapa | null;
  siguiendoUbicacion: boolean;
  errorUbicacion: string | null;
  viajeActivoId: string | null;
  verificandoViajeActivo: boolean;
  historial: ViajeHistorial[];

  // Acciones con soporte para valor directo o función de actualización
  setTipoServicio: (valor: ValOrFn<TipoServicio>) => void;
  setMetodoPago: (valor: ValOrFn<MetodoPago>) => void;
  setOrigen: (valor: ValOrFn<Lugar>) => void;
  setDestino: (valor: ValOrFn<Lugar | null>) => void;
  setUbicacionActual: (valor: ValOrFn<PuntoMapa | null>) => void;
  setSiguiendoUbicacion: (valor: boolean) => void;
  setErrorUbicacion: (valor: string | null) => void;
  setViajeActivoId: (valor: ValOrFn<string | null>) => void;
  setVerificandoViajeActivo: (valor: boolean) => void;
  setHistorial: (valor: ValOrFn<ViajeHistorial[]>) => void;

  // Acciones de negocio
  limpiarViaje: () => void;
  registrarViaje: (viaje: Omit<ViajeHistorial, "id" | "fecha">) => Promise<void>;
  recargarHistorial: (userId?: string) => Promise<void>;
  recuperarViajeActivo: (userId?: string) => Promise<void>;
}

export const useViajeStore = create<ViajeStore>((set, get) => ({
  tipoServicio: "normal",
  metodoPago: "efectivo",
  origen: ORIGEN_EJEMPLO,
  destino: null,
  ubicacionActual: null,
  siguiendoUbicacion: false,
  errorUbicacion: null,
  viajeActivoId: null,
  verificandoViajeActivo: true,
  historial: HISTORIAL_EJEMPLO,

  setTipoServicio: (valor) =>
    set((state) => ({ tipoServicio: resolverValor(valor, state.tipoServicio) })),

  setMetodoPago: (valor) =>
    set((state) => ({ metodoPago: resolverValor(valor, state.metodoPago) })),

  setOrigen: (valor) =>
    set((state) => ({ origen: resolverValor(valor, state.origen) })),

  setDestino: (valor) =>
    set((state) => ({ destino: resolverValor(valor, state.destino) })),

  setUbicacionActual: (valor) =>
    set((state) => ({
      ubicacionActual: resolverValor(valor, state.ubicacionActual),
    })),

  setSiguiendoUbicacion: (siguiendoUbicacion) => set({ siguiendoUbicacion }),

  setErrorUbicacion: (errorUbicacion) => set({ errorUbicacion }),

  setViajeActivoId: (valor) =>
    set((state) => ({ viajeActivoId: resolverValor(valor, state.viajeActivoId) })),

  setVerificandoViajeActivo: (verificandoViajeActivo) =>
    set({ verificandoViajeActivo }),

  setHistorial: (valor) =>
    set((state) => ({ historial: resolverValor(valor, state.historial) })),

  limpiarViaje: () =>
    set({
      destino: null,
      viajeActivoId: null,
      errorUbicacion: null,
    }),

  registrarViaje: async (viaje) => {
    const fecha = new Date();
    const idActual = get().viajeActivoId ?? `viaje-local-${fecha.getTime()}`;

    set((state) => ({
      historial: [
        {
          ...viaje,
          id: idActual,
          fecha,
        },
        ...state.historial,
      ],
    }));
  },

  recargarHistorial: async (userId) => {
    if (!userId) return;
    try {
      const datos = await viajeService.obtenerHistorialPasajero(userId);
      if (datos && datos.length > 0) {
        set({ historial: datos });
      }
    } catch (err) {
      console.warn("Aviso al recargar historial de viajes en store:", err);
    }
  },

  recuperarViajeActivo: async (userId) => {
    set({ verificandoViajeActivo: true });

    if (!userId) {
      set({
        viajeActivoId: null,
        origen: ORIGEN_EJEMPLO,
        destino: null,
        ubicacionActual: null,
        verificandoViajeActivo: false,
      });
      return;
    }

    try {
      const viaje = await viajeService.obtenerViajeActivoPasajero(userId);

      if (!viaje) {
        set({
          viajeActivoId: null,
          destino: null,
          verificandoViajeActivo: false,
        });
        return;
      }

      const { origen_lat, origen_lng, destino_lat, destino_lng } = viaje;

      const sonCoordenadasValidas =
        typeof origen_lat === "number" &&
        Number.isFinite(origen_lat) &&
        typeof origen_lng === "number" &&
        Number.isFinite(origen_lng) &&
        typeof destino_lat === "number" &&
        Number.isFinite(destino_lat) &&
        typeof destino_lng === "number" &&
        Number.isFinite(destino_lng) &&
        Math.abs(origen_lat) <= 90 &&
        Math.abs(destino_lat) <= 90 &&
        Math.abs(origen_lng) <= 180 &&
        Math.abs(destino_lng) <= 180;

      if (!sonCoordenadasValidas) {
        console.warn("El viaje activo tiene coordenadas inválidas:", viaje.id);
        set({ verificandoViajeActivo: false });
        return;
      }

      const metodoValido =
        viaje.metodo_pago === "efectivo" ||
        viaje.metodo_pago === "yape" ||
        viaje.metodo_pago === "plin"
          ? viaje.metodo_pago
          : get().metodoPago;

      set({
        origen: {
          id: `origen-viaje-${viaje.id}`,
          nombre: viaje.origen_texto ?? "Origen registrado",
          detalle: viaje.origen_texto ?? "",
          coordenadas: {
            latitude: origen_lat,
            longitude: origen_lng,
          },
        },
        destino: {
          id: `destino-viaje-${viaje.id}`,
          nombre: viaje.destino_texto ?? "Destino registrado",
          detalle: viaje.destino_texto ?? "",
          coordenadas: {
            latitude: destino_lat,
            longitude: destino_lng,
          },
        },
        metodoPago: metodoValido,
        viajeActivoId: viaje.id,
        verificandoViajeActivo: false,
      });
    } catch (error) {
      console.warn("No se pudo recuperar el viaje activo en store:", error);
      set({ verificandoViajeActivo: false });
    }
  },
}));

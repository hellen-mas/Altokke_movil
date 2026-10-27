import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import * as Location from "expo-location";
import { AppState } from "react-native";
import {
  useViajeStore,
  type TipoServicio,
  type MetodoPago,
  type ViajeStore,
} from "../store/viajeStore";
import type { Lugar, ViajeHistorial } from "@/features/viajes/constants/pasajero";
import type { PuntoMapa } from "../types/tiposMapa";

export type { TipoServicio, MetodoPago };

export type ViajeContextType = {
  tipoServicio: TipoServicio;
  setTipoServicio: (valor: TipoServicio | ((prev: TipoServicio) => TipoServicio)) => void;
  metodoPago: MetodoPago;
  setMetodoPago: (valor: MetodoPago | ((prev: MetodoPago) => MetodoPago)) => void;
  origen: Lugar;
  setOrigen: (valor: Lugar | ((prev: Lugar) => Lugar)) => void;
  ubicacionActual: PuntoMapa | null;
  siguiendoUbicacion: boolean;
  errorUbicacion: string | null;
  destino: Lugar | null;
  setDestino: (valor: Lugar | null | ((prev: Lugar | null) => Lugar | null)) => void;
  historial: ViajeHistorial[];
  viajeActivoId: string | null;
  setViajeActivoId: (valor: string | null | ((prev: string | null) => string | null)) => void;
  verificandoViajeActivo: boolean;
  registrarViaje: (viaje: Omit<ViajeHistorial, "id" | "fecha">) => Promise<void>;
  recargarHistorial: () => Promise<void>;
};

export function ViajeProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [appActiva, setAppActiva] = useState(AppState.currentState === "active");

  const viajeActivoId = useViajeStore((s) => s.viajeActivoId);
  const recuperarViajeActivo = useViajeStore((s) => s.recuperarViajeActivo);
  const recargarHistorial = useViajeStore((s) => s.recargarHistorial);
  const setUbicacionActual = useViajeStore((s) => s.setUbicacionActual);
  const setSiguiendoUbicacion = useViajeStore((s) => s.setSiguiendoUbicacion);
  const setErrorUbicacion = useViajeStore((s) => s.setErrorUbicacion);

  // Escuchar ciclo de vida de la aplicación móvil (primer plano / segundo plano)
  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (estado) => {
      setAppActiva(estado === "active");
    });

    return () => {
      suscripcion.remove();
    };
  }, []);

  // Inicializar estado del viaje activo e historial al autenticar usuario
  useEffect(() => {
    if (userId) {
      void recuperarViajeActivo(userId);
      void recargarHistorial(userId);
    }
  }, [userId, recuperarViajeActivo, recargarHistorial]);

  // Mantener seguimiento GPS mientras exista un viaje activo
  useEffect(() => {
    if (!viajeActivoId || !userId || !appActiva) {
      setSiguiendoUbicacion(false);
      return;
    }

    let activo = true;
    let seguimiento: Location.LocationSubscription | null = null;

    const iniciarSeguimiento = async () => {
      try {
        const permisos = await Location.getForegroundPermissionsAsync();
        if (!activo) return;

        if (permisos.status !== "granted") {
          setErrorUbicacion("Activa el permiso de ubicación para seguir tu posición.");
          return;
        }

        seguimiento = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (posicion) => {
            if (!activo) return;
            setUbicacionActual({
              latitude: posicion.coords.latitude,
              longitude: posicion.coords.longitude,
            });
            setErrorUbicacion(null);
          }
        );

        if (!activo) {
          seguimiento.remove();
          return;
        }

        setSiguiendoUbicacion(true);
      } catch (error) {
        if (!activo) return;
        console.warn("No se pudo iniciar el GPS en ViajeProvider:", error);
        setErrorUbicacion("No fue posible iniciar el seguimiento de ubicación.");
      }
    };

    void iniciarSeguimiento();

    return () => {
      activo = false;
      seguimiento?.remove();
      setSiguiendoUbicacion(false);
    };
  }, [viajeActivoId, userId, appActiva, setUbicacionActual, setSiguiendoUbicacion, setErrorUbicacion]);

  return <>{children}</>;
}

export function useViaje(): ViajeContextType {
  const store = useViajeStore();

  return {
    tipoServicio: store.tipoServicio,
    setTipoServicio: store.setTipoServicio,
    metodoPago: store.metodoPago,
    setMetodoPago: store.setMetodoPago,
    origen: store.origen,
    setOrigen: store.setOrigen,
    ubicacionActual: store.ubicacionActual,
    siguiendoUbicacion: store.siguiendoUbicacion,
    errorUbicacion: store.errorUbicacion,
    destino: store.destino,
    setDestino: store.setDestino,
    historial: store.historial,
    viajeActivoId: store.viajeActivoId,
    setViajeActivoId: store.setViajeActivoId,
    verificandoViajeActivo: store.verificandoViajeActivo,
    registrarViaje: store.registrarViaje,
    recargarHistorial: () => store.recargarHistorial(),
  };
}

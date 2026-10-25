import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  HISTORIAL_EJEMPLO,
  ORIGEN_EJEMPLO,
  type Lugar,
  type ViajeHistorial,
} from "@/features/viajes/constants/pasajero";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import * as Location from "expo-location";
import { AppState } from "react-native";
import type { PuntoMapa } from "../types/tiposMapa";

export type TipoServicio = "normal" | "express" | "reserva";
export type MetodoPago = "efectivo" | "yape" | "plin";

type ViajeContextType = {
  tipoServicio: TipoServicio;
  setTipoServicio: React.Dispatch<React.SetStateAction<TipoServicio>>;
  metodoPago: MetodoPago;
  setMetodoPago: React.Dispatch<React.SetStateAction<MetodoPago>>;
  origen: Lugar;
  setOrigen: React.Dispatch<React.SetStateAction<Lugar>>;
  ubicacionActual: PuntoMapa | null;
  siguiendoUbicacion: boolean;
  errorUbicacion: string | null;
  destino: Lugar | null;
  setDestino: React.Dispatch<React.SetStateAction<Lugar | null>>;
  historial: ViajeHistorial[];
  viajeActivoId: string | null;
  setViajeActivoId: React.Dispatch<React.SetStateAction<string | null>>;
  verificandoViajeActivo: boolean;
  registrarViaje: (viaje: Omit<ViajeHistorial, "id" | "fecha">) => Promise<void>;
  recargarHistorial: () => Promise<void>;
};

const ViajeContext = createContext<ViajeContextType | undefined>(undefined);

export function ViajeProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("normal");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [origen, setOrigen] = useState<Lugar>(ORIGEN_EJEMPLO);
  const [ubicacionActual, setUbicacionActual] = useState<PuntoMapa | null>(null);
  const [siguiendoUbicacion, setSiguiendoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [appActiva, setAppActiva] = useState(
    AppState.currentState === "active"
  );
  const [destino, setDestino] = useState<Lugar | null>(null);
  const [historial, setHistorial] = useState<ViajeHistorial[]>(HISTORIAL_EJEMPLO);
  const [viajeActivoId, setViajeActivoId] = useState<string | null>(null);
  const [verificandoViajeActivo, setVerificandoViajeActivo] = useState(true);

  // Detectar si Altokke está abierta en primer plano
  useEffect(() => {
    const suscripcion = AppState.addEventListener(
      "change",
      (estado) => {
        setAppActiva(estado === "active");
      }
    );

    return () => {
      suscripcion.remove();
    };
  }, []);

  // Mantener seguimiento GPS mientras exista un viaje activo
  useEffect(() => {
    if (!viajeActivoId || !userId || !appActiva) {
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
          },
          (error) => {
            if (!activo) return;

            console.warn("Error de seguimiento GPS:", error);
            setErrorUbicacion("No se pudo actualizar tu ubicación.");
          }
        );

        if (!activo) {
          seguimiento.remove();
          return;
        }
        setSiguiendoUbicacion(true);
      } catch (error) {
        if (!activo) return;

        console.warn("No se pudo iniciar el GPS:", error);
        setErrorUbicacion(
          "No fue posible iniciar el seguimiento de ubicación."
        );
      }
    };

    void iniciarSeguimiento();

    return () => {
      activo = false;
      seguimiento?.remove();
      setSiguiendoUbicacion(false);
    };
  }, [viajeActivoId, userId, appActiva]);

  useEffect(() => {
    let cancelado = false;

    const recuperarViajeActivo = async () => {
      setVerificandoViajeActivo(true);

      if (!userId) {
        setViajeActivoId(null);
        setOrigen(ORIGEN_EJEMPLO);
        setDestino(null);
        setUbicacionActual(null);
        setVerificandoViajeActivo(false);
        return;
      }

      try {
        const viaje = await viajeService.obtenerViajeActivoPasajero(userId);

        if (cancelado) return;

        // Si no hay viajes activos, no necesitamos restaurar nada
        if (!viaje) {
          setViajeActivoId(null);
          setDestino(null);
          return;
        }

        const { 
          origen_lat,
          origen_lng,
          destino_lat,
          destino_lng
        } = viaje;

        // Validar cada coordenada
        if (
          typeof origen_lat !== "number" ||
          !Number.isFinite(origen_lat) ||
          typeof origen_lng !== "number" ||
          !Number.isFinite(origen_lng) ||
          typeof destino_lat !== "number" ||
          !Number.isFinite(destino_lat) ||
          typeof destino_lng !== "number" ||
          !Number.isFinite(destino_lng) ||
          Math.abs(origen_lat) > 90 ||
          Math.abs(destino_lat) > 90 ||
          Math.abs(origen_lng) > 180 ||
          Math.abs(destino_lng) > 180
        ) {
          console.warn(
            "El viaje activo tiene coordenadas inválidas:",
            viaje.id
          );
          return;
        }

        // Recuperar el punto de recojo original
        setOrigen({
          id: `origen-viaje-${viaje.id}`,
          nombre: viaje.origen_texto ?? "Origen registrado",
          detalle: viaje.origen_texto ?? "",
          coordenadas: {
            latitude: origen_lat,
            longitude: origen_lng,
          },
        });

        // Recuperar el destino original
        setDestino({
          id: `destino-viaje-${viaje.id}`,
          nombre: viaje.destino_texto ?? "Destino registrado",
          detalle: viaje.destino_texto ?? "",
          coordenadas: {
            latitude: destino_lat,
            longitude: destino_lng,
          },
        });

        // Recuperar el método de pago
        if (
          viaje.metodo_pago === "efectivo" ||
          viaje.metodo_pago === "yape" ||
          viaje.metodo_pago === "plin"
        ) {
          setMetodoPago(viaje.metodo_pago);
        }

        // Activar el viaje únicamente después de restaurar sus datos
        setViajeActivoId(viaje.id);
      } catch (error) {
        if (!cancelado) {
          console.warn("No se pudo recuperar el viaje activo:", error);
        }
      } finally {
        if (!cancelado) {
          setVerificandoViajeActivo(false);
        }
      }
    };

    void recuperarViajeActivo();

    return () => {
      cancelado = true;
    };
  }, [userId]);

  const recargarHistorial = async () => {
    if (!userId) return;
    try {
      const datos = await viajeService.obtenerHistorialPasajero(userId);
      if (datos && datos.length > 0) {
        setHistorial(datos);
      }
    } catch (err) {
      console.warn("Aviso al recargar historial de viajes:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    let activo  = true;

    viajeService
      .obtenerHistorialPasajero(userId)
      .then((datos) => {
        if (activo) {
          setHistorial(datos);
        }
      })
      .catch((error) => {
        console.warn("Error al cargar el historial: ", error);
      });

    return () => {
      activo = false;
    };
  }, [userId]);

  const registrarViaje = async (viaje: Omit<ViajeHistorial, "id" | "fecha">): Promise<void> => {
    const fecha = new Date();

    setHistorial((actual) => [
      {
        ...viaje,
        id: viajeActivoId ?? `viaje-local-${fecha.getTime()}`,
        fecha,
      },
      ...actual,
    ]);
  };

  return (
    <ViajeContext.Provider
      value={{
        tipoServicio,
        setTipoServicio,
        metodoPago,
        setMetodoPago,
        origen,
        setOrigen,
        ubicacionActual,
        siguiendoUbicacion,
        errorUbicacion,
        destino,
        setDestino,
        historial,
        viajeActivoId,
        setViajeActivoId,
        registrarViaje,
        recargarHistorial,
        verificandoViajeActivo,
      }}
    >
      {children}
    </ViajeContext.Provider>
  );
}

export function useViaje() {
  const context = useContext(ViajeContext);

  if (!context) {
    throw new Error("useViaje debe usarse dentro de ViajeProvider");
  }

  return context;
}

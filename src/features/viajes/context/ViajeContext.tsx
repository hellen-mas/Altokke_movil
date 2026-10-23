import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  HISTORIAL_EJEMPLO,
  type Lugar,
  type ViajeHistorial,
} from "@/features/viajes/constants/pasajero";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";

export type TipoServicio = "normal" | "express" | "reserva";
export type MetodoPago = "efectivo" | "yape" | "plin";

type ViajeContextType = {
  tipoServicio: TipoServicio;
  setTipoServicio: React.Dispatch<React.SetStateAction<TipoServicio>>;
  metodoPago: MetodoPago;
  setMetodoPago: React.Dispatch<React.SetStateAction<MetodoPago>>;
  destino: Lugar | null;
  setDestino: React.Dispatch<React.SetStateAction<Lugar | null>>;
  historial: ViajeHistorial[];
  viajeActivoId: string | null;
  setViajeActivoId: React.Dispatch<React.SetStateAction<string | null>>;
  registrarViaje: (viaje: Omit<ViajeHistorial, "id" | "fecha">) => Promise<void>;
  recargarHistorial: () => Promise<void>;
};

const ViajeContext = createContext<ViajeContextType | undefined>(undefined);

export function ViajeProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("normal");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [destino, setDestino] = useState<Lugar | null>(null);
  const [historial, setHistorial] = useState<ViajeHistorial[]>(HISTORIAL_EJEMPLO);
  const [viajeActivoId, setViajeActivoId] = useState<string | null>(null);

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
    recargarHistorial();
  }, [userId]);

  const registrarViaje = async (viaje: Omit<ViajeHistorial, "id" | "fecha">) => {
    const fecha = new Date();
    const idLocal = `viaje-${fecha.getTime()}`;

    setHistorial((actual) => [
      { ...viaje, id: idLocal, fecha },
      ...actual,
    ]);

    // Persistir en Supabase si hay sesión
    if (userId) {
      try {
        const viajeCreado = await viajeService.crearViaje({
          pasajeroId: userId,
          origenTexto: viaje.origen,
          destinoTexto: viaje.destino,
          origenLat: -5.6389,
          origenLng: -78.5302,
          destinoLat: viaje.lugarDestino?.coordenadas.latitude ?? -5.6389,
          destinoLng: viaje.lugarDestino?.coordenadas.longitude ?? -78.5302,
          distanciaKm: 2.5,
          tarifaEstimada: viaje.tarifa,
          metodoPago,
        });

        if (viajeCreado?.id) {
          setViajeActivoId(viajeCreado.id);
          if (viaje.estado === "cancelado") {
            await viajeService.cancelarViaje(viajeCreado.id);
          } else if (viaje.estado === "completado") {
            await viajeService.finalizarViaje(viajeCreado.id, viaje.tarifa);
          }
        }
      } catch (err) {
        console.warn("Aviso al registrar viaje en Supabase:", err);
      }
    }
  };

  return (
    <ViajeContext.Provider
      value={{
        tipoServicio,
        setTipoServicio,
        metodoPago,
        setMetodoPago,
        destino,
        setDestino,
        historial,
        viajeActivoId,
        setViajeActivoId,
        registrarViaje,
        recargarHistorial,
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

import { useEffect, useRef, useState, useCallback } from "react";
import * as Location from "expo-location";

export interface CoordenadasGps {
  lat: number;
  lng: number;
  rumbo: number | null;
  velocidad: number | null;
}

export interface OpcionesRastreoGps {
  activo: boolean;
  intervaloMs?: number;
  distanciaMinimaMetros?: number;
  onNuevaPosicion?: (pos: CoordenadasGps) => void;
}

export interface AltokkeRastreoGpsState {
  coordenadas: CoordenadasGps | null;
  permisoDenegado: boolean;
  servicioGpsDesactivado: boolean;
  cargando: boolean;
  reintentar: () => Promise<void>;
}

/**
 * Hook de telemetría y rastreo satelital GPS para Altokke Móvil.
 * Conducción y seguimiento en tiempo real con throttling de consumo de batería.
 */
export function useRastreoGps({
  activo,
  intervaloMs = 5000,
  distanciaMinimaMetros = 10,
  onNuevaPosicion,
}: OpcionesRastreoGps): AltokkeRastreoGpsState {
  const [coordenadas, setCoordenadas] = useState<CoordenadasGps | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [servicioGpsDesactivado, setServicioGpsDesactivado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const subscripcionRef = useRef<Location.LocationSubscription | null>(null);
  const activoRef = useRef(activo);
  activoRef.current = activo;

  const iniciarRastreo = useCallback(async () => {
    if (!activoRef.current) return;
    setCargando(true);
    setPermisoDenegado(false);
    setServicioGpsDesactivado(false);

    try {
      const habilitado = await Location.hasServicesEnabledAsync();
      if (!habilitado) {
        setServicioGpsDesactivado(true);
        setCargando(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermisoDenegado(true);
        setCargando(false);
        return;
      }

      // Obtener posición inicial balanceada
      const inicial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const posInicial: CoordenadasGps = {
        lat: inicial.coords.latitude,
        lng: inicial.coords.longitude,
        rumbo: inicial.coords.heading,
        velocidad: inicial.coords.speed,
      };

      setCoordenadas(posInicial);
      onNuevaPosicion?.(posInicial);

      // Limpiar suscripción previa si existía
      if (subscripcionRef.current) {
        subscripcionRef.current.remove();
        subscripcionRef.current = null;
      }

      // Iniciar suscripción continua
      subscripcionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: intervaloMs,
          distanceInterval: distanciaMinimaMetros,
        },
        (loc) => {
          const nuevaPos: CoordenadasGps = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            rumbo: loc.coords.heading,
            velocidad: loc.coords.speed,
          };
          setCoordenadas(nuevaPos);
          onNuevaPosicion?.(nuevaPos);
        }
      );
    } catch (err: unknown) {
      console.warn("Aviso en el subsistema de rastreo GPS:", err);
      setServicioGpsDesactivado(true);
    } finally {
      setCargando(false);
    }
  }, [intervaloMs, distanciaMinimaMetros, onNuevaPosicion]);

  useEffect(() => {
    if (activo) {
      void iniciarRastreo();
    } else {
      if (subscripcionRef.current) {
        subscripcionRef.current.remove();
        subscripcionRef.current = null;
      }
    }

    return () => {
      if (subscripcionRef.current) {
        subscripcionRef.current.remove();
        subscripcionRef.current = null;
      }
    };
  }, [activo, iniciarRastreo]);

  return {
    coordenadas,
    permisoDenegado,
    servicioGpsDesactivado,
    cargando,
    reintentar: iniciarRastreo,
  };
}

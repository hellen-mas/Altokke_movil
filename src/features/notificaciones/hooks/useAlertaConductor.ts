import { useEffect, useRef, useState } from "react";
import { AppState, Vibration } from "react-native";
import * as Location from "expo-location";
import { useUserId } from "@/features/autenticacion/hooks/useAuth";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { supabase } from "@/shared/api/supabase";

/** Radio inicial para considerar cercana una solicitud de viaje. */
export const RADIO_SOLICITUDES_CERCANAS_KM = 3;

const ESTADOS_VIAJE_ACTIVO = [
  "aceptado",
  "en_camino_origen",
  "esperando_pasajero",
  "en_viaje",
] as const;

type Coordenadas = {
  latitude: number;
  longitude: number;
};

type EventoViajeRealtime = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  commit_timestamp?: string;
};

function obtenerNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/** Calcula la distancia en línea recta entre dos coordenadas (fórmula Haversine). */
function calcularDistanciaKm(origen: Coordenadas, destino: Coordenadas): number {
  const radioTierraKm = 6371;
  const gradosARadianes = (grados: number) => (grados * Math.PI) / 180;

  const diferenciaLatitud = gradosARadianes(destino.latitude - origen.latitude);
  const diferenciaLongitud = gradosARadianes(destino.longitude - origen.longitude);
  const latitudOrigen = gradosARadianes(origen.latitude);
  const latitudDestino = gradosARadianes(destino.latitude);

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(latitudOrigen) *
      Math.cos(latitudDestino) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  return 2 * radioTierraKm * Math.asin(Math.sqrt(a));
}

interface OpcionesAlertaConductor {
    radioKm?: number;
    habilitado?: boolean;
}

/**
 * Escucha nuevas solicitudes mientras el conductor está en línea y sin un viaje activo.
 * La alerta utiliza vibración nativa y funciona con la aplicación en primer plano.
 */
export function useAlertaConductor({
  radioKm = RADIO_SOLICITUDES_CERCANAS_KM,
  habilitado = true,
}: OpcionesAlertaConductor = {}) {
  const userId = useUserId();
  const { perfil } = usePerfilConductor();
  const enLinea = perfil.enLinea;

  const ubicacionRef = useRef<Coordenadas | null>(null);
  const viajeActivoRef = useRef(false);
  const eventosProcesadosRef = useRef<Set<string>>(new Set());

  const [escuchando, setEscuchando] = useState(false);
  const [ubicacionDisponible, setUbicacionDisponible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaSolicitudId, setUltimaSolicitudId] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado || !userId || !enLinea) {
      ubicacionRef.current = null;
      queueMicrotask(() => {
        setEscuchando(false);
        setUbicacionDisponible(false);
      });
      return;
    }

    let efectoActivo = true;
    let seguimiento: Location.LocationSubscription | null = null;
    let iniciandoSeguimiento = false;
    const solicitudesPendientes: EventoViajeRealtime[] = [];
    let procesarPendientes = () => {};

    const radioConfigurado =
      Number.isFinite(radioKm) && radioKm > 0
        ? radioKm
        : RADIO_SOLICITUDES_CERCANAS_KM;

    const detenerSeguimiento = () => {
      seguimiento?.remove();
      seguimiento = null;
      ubicacionRef.current = null;
      setUbicacionDisponible(false);
    };

    const iniciarSeguimiento = async () => {
        if (
            !efectoActivo ||
            !enLinea ||
            viajeActivoRef.current ||
            seguimiento ||
            iniciandoSeguimiento
        ) { return; }

        iniciandoSeguimiento = true;

        try {
            let permiso = await Location.getForegroundPermissionsAsync();
            if (permiso.status !== "granted") {
                permiso = await Location.requestForegroundPermissionsAsync();
            }

            if (!efectoActivo) return;

            if (permiso.status !== "granted") {
                setUbicacionDisponible(false);
                setError(
                    "Activa el permiso de ubicación para recibir alertas de solicitudes cercanas."
                );
                return;
            }

            const posicionInicial = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            if (!efectoActivo || viajeActivoRef.current) return;

            ubicacionRef.current = {
                latitude: posicionInicial.coords.latitude,
                longitude: posicionInicial.coords.longitude,
            };
            setUbicacionDisponible(true);
            setError(null);
            procesarPendientes();

            const nuevaSuscripcion = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 15000,
                    distanceInterval: 30,
                },
                (posicion) => {
                    if (!efectoActivo) return;

                    ubicacionRef.current = {
                    latitude: posicion.coords.latitude,
                    longitude: posicion.coords.longitude,
                    };
                    setUbicacionDisponible(true);
                    procesarPendientes();
                }
            );

            if (!efectoActivo || viajeActivoRef.current || !enLinea) {
                nuevaSuscripcion.remove();
                return;
            }

            seguimiento = nuevaSuscripcion;
        } catch (errorUbicacion) {
            if (!efectoActivo) return;
            console.warn("No se pudo iniciar la ubicación para alertas.", errorUbicacion);
            setUbicacionDisponible(false);
            setError("No fue posible obtener tu ubicación. Comprueba el GPS e inténtalo otra vez.");
        } finally {
            iniciandoSeguimiento = false;
        }
    };

    // Devuleve true/false si pudo consultar el viaje activo. Devuelve null ante un error para fallar de forma segura y no emitir una alerta incorrecta.
    const consultarSiTieneViajeActivo = async (): Promise<boolean | null> => {
      const { data, error: errorConsulta } = await supabase
        .from("viajes")
        .select("id")
        .eq("conductor_id", userId)
        .in("estado", [...ESTADOS_VIAJE_ACTIVO])
        .limit(1)
        .maybeSingle();

      if (errorConsulta) {
        console.warn("No se pudo verificar el viaje activo del conductor:", errorConsulta.message);
        if (efectoActivo) {
          setError("No se pudo verificar si tienes un viaje en curso. Las alertas están pausadas.");
        }
        return null;
      }

      return Boolean(data);
    };

    const procesarSolicitud = async (evento: EventoViajeRealtime) => {
      const viaje = evento.new;
      const viajeId = typeof viaje.id === "string" ? viaje.id : null;
      if (!viajeId || !efectoActivo || !enLinea) return;

      // No volver a avisar al conductor que acaba de cancelar ese mismo viaje.
      if (viaje.cancelado_por === userId) return;

      if (viajeActivoRef.current) return;

      const ubicacion = ubicacionRef.current;
      if (!ubicacion) {
        if (!solicitudesPendientes.some((pendiente) => pendiente.new.id === viajeId)) {
          if (solicitudesPendientes.length >= 25) solicitudesPendientes.shift();
          solicitudesPendientes.push(evento);
        }
        return;
      }

      const latitudOrigen = obtenerNumero(viaje.origen_lat);
      const longitudOrigen = obtenerNumero(viaje.origen_lng);
      if (latitudOrigen === null || longitudOrigen === null) return;
      if (latitudOrigen < -90 || latitudOrigen > 90) return;
      if (longitudOrigen < -180 || longitudOrigen > 180) return;

      // Se vuelve a consultar para no depender únicamente del estado local del hook.
      const tieneViajeActivo = await consultarSiTieneViajeActivo();
      if (!efectoActivo || tieneViajeActivo !== false) return;
      viajeActivoRef.current = false;

      const distanciaKm = calcularDistanciaKm(ubicacion, {
        latitude: latitudOrigen,
        longitude: longitudOrigen,
      });

      if (distanciaKm > radioConfigurado) return;

      // commit_timestamp distingue una solicitud reabierta de un evento duplicado.
      const selloEvento = evento.commit_timestamp ?? String(viaje.creado_en ?? "");
      const claveEvento = `${viajeId}:${selloEvento || evento.eventType}`;
      if (eventosProcesadosRef.current.has(claveEvento)) return;

      if (eventosProcesadosRef.current.size >= 200) {
        eventosProcesadosRef.current.clear();
      }
      eventosProcesadosRef.current.add(claveEvento);

      // No se intenta vibrar si el sistema tiene la aplicación en segundo plano.
      if (AppState.currentState === "active") {
        Vibration.vibrate([0, 350, 150, 350]);
        setUltimaSolicitudId(viajeId);
      }
    };

    procesarPendientes = () => {
        if (!ubicacionRef.current || solicitudesPendientes.length === 0) return;
        const pendientes = solicitudesPendientes.splice(0);
        pendientes.forEach((evento) => void procesarSolicitud(evento));
    };

    const canal = supabase
        .channel(`alertas_conductor_${userId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "viajes",
            },
            (payload) => {
                if (!efectoActivo) return;

                const evento = payload as unknown as EventoViajeRealtime;
                const viaje = evento.new ?? {};
                const estado = viaje.estado;
                const conductorId = viaje.conductor_id;

                // Actualiza el bloqueo cuando cambia el viaje asignado a este conductor
                if (conductorId === userId) {
                    const tieneViajeActivo = ESTADOS_VIAJE_ACTIVO.includes(
                        estado as (typeof ESTADOS_VIAJE_ACTIVO)[number]
                    );
                    viajeActivoRef.current = tieneViajeActivo;

                    if (tieneViajeActivo) {
                        detenerSeguimiento();
                    } else if (enLinea) {
                        void iniciarSeguimiento();
                    }
                }

                if (evento.eventType !== "INSERT" && evento.eventType !== "UPDATE") return;

                // Si este conductor canceló, el viaje vuelve a buscando pero no debe
                // aparecerle como una nueva oferta a la misma persona
                if (
                    estado === "buscando" &&
                    conductorId === null &&
                    viaje.cancelado_por === userId
                ) {
                    viajeActivoRef.current = false;
                    if (enLinea) void iniciarSeguimiento();
                    return;
                }

                if (estado !== "buscando" || conductorId !== null) return;
                void procesarSolicitud(evento);
            }
        )
        .subscribe((estado) => {
            if (!efectoActivo) return;
            if (estado === "SUBSCRIBED") {
                setEscuchando(true);
            } else if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
                setEscuchando(false);
                setError("No se pudo establecer la conexión en tiempo real para las alertas.")
            }
        });
    
    const inicializar = async () => {
      const tieneViajeActivo = await consultarSiTieneViajeActivo();
      if (!efectoActivo) return;

      // Si no se pudo consultar, se bloquean alertas por seguridad.
      viajeActivoRef.current = tieneViajeActivo !== false;

      if (!viajeActivoRef.current) {
        await iniciarSeguimiento();
      }
    };

    void inicializar();

    return () => {
      efectoActivo = false;
      seguimiento?.remove();
      seguimiento = null;
      ubicacionRef.current = null;
      Vibration.cancel();
      void supabase.removeChannel(canal);
    };
    }, [userId, enLinea, radioKm, habilitado]);

    return {
        escuchando: habilitado && Boolean(userId) && enLinea && escuchando,
        ubicacionDisponible: habilitado && Boolean(userId) && enLinea && ubicacionDisponible,
        error,
        ultimaSolicitudId,
    };
}

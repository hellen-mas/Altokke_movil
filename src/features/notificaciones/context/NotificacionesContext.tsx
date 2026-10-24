import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { supabase } from "@/shared/api/supabase";
import { pasajeroService } from "@/features/pasajeros/services/pasajeroService";
import {
  NotificacionItem,
  PREFERENCIAS_POR_DEFECTO,
  PreferenciasNotificaciones,
} from "../types/notificaciones";

interface NotificacionesContextType {
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

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(
  undefined
);

const CLAVE_STORAGE_NOTIFS = (userId: string) => `@altokke_notificaciones_${userId}`;
const CLAVE_STORAGE_PREFS = (userId: string) => `@altokke_pref_notificaciones_${userId}`;

function formatearHora(fecha: Date): string {
  const horas = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

function crearNotificacionBienvenida(): NotificacionItem {
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

function mapearEstadoANotificacion(
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

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones>(
    PREFERENCIAS_POR_DEFECTO
  );
  const [cargando, setCargando] = useState(true);

  // Referencia para evitar closures obsoletos en suscripciones en tiempo real
  const preferenciasRef = useRef(preferencias);
  useEffect(() => {
    preferenciasRef.current = preferencias;
  }, [preferencias]);

  const notificacionesRef = useRef(notificaciones);
  useEffect(() => {
    notificacionesRef.current = notificaciones;
  }, [notificaciones]);

  // Guardar en AsyncStorage
  const persistirNotificaciones = useCallback(
    async (nuevas: NotificacionItem[]) => {
      if (!userId) return;
      try {
        await AsyncStorage.setItem(
          CLAVE_STORAGE_NOTIFS(userId),
          JSON.stringify(nuevas)
        );
      } catch (err) {
        console.warn("Aviso al guardar notificaciones en almacenamiento:", err);
      }
    },
    [userId]
  );

  const persistirPreferencias = useCallback(
    async (nuevas: PreferenciasNotificaciones) => {
      if (!userId) return;
      try {
        await AsyncStorage.setItem(
          CLAVE_STORAGE_PREFS(userId),
          JSON.stringify(nuevas)
        );
      } catch (err) {
        console.warn("Aviso al guardar preferencias en almacenamiento:", err);
      }
    },
    [userId]
  );

  // Carga inicial y derivación de viajes existentes
  useEffect(() => {
    let montado = true;

    const inicializar = async () => {
      if (!userId) {
        if (montado) {
          setNotificaciones([]);
          setCargando(false);
        }
        return;
      }

      try {
        // 1. Cargar preferencias locales
        const prefsGuardadas = await AsyncStorage.getItem(CLAVE_STORAGE_PREFS(userId));
        if (prefsGuardadas && montado) {
          try {
            const parsed = JSON.parse(prefsGuardadas);
            setPreferencias((prev) => ({ ...prev, ...parsed }));
          } catch {
            // Ignorar JSON corrupto
          }
        }

        // 2. Cargar notificaciones almacenadas
        const guardadas = await AsyncStorage.getItem(CLAVE_STORAGE_NOTIFS(userId));
        if (guardadas && montado) {
          try {
            const parsed: NotificacionItem[] = JSON.parse(guardadas);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNotificaciones(parsed);
              setCargando(false);
              return;
            }
          } catch {
            // Si está corrupto, derivar de Supabase
          }
        }

        // 3. Si no hay notificaciones previas guardadas, derivar de los viajes de Supabase
        const listaDerivada: NotificacionItem[] = [];

        try {
          const { data: viajesPrevios } = await supabase
            .from("viajes")
            .select("id, estado, creado_en")
            .eq("pasajero_id", userId)
            .order("creado_en", { ascending: false })
            .limit(8);

          if (viajesPrevios && viajesPrevios.length > 0) {
            for (const v of viajesPrevios) {
              if (!v.id || !v.estado) continue;
              const item = mapearEstadoANotificacion(
                v.id,
                v.estado,
                v.creado_en ? new Date(v.creado_en) : new Date()
              );
              if (item) {
                // Notificaciones derivadas del pasado se marcan como leídas para no saturar
                item.leida = true;
                listaDerivada.push(item);
              }
            }
          }
        } catch (err) {
          console.warn("Aviso al derivar notificaciones iniciales:", err);
        }

        // Añadir bienvenida al final
        listaDerivada.push(crearNotificacionBienvenida());

        if (montado) {
          setNotificaciones(listaDerivada);
          setCargando(false);
          await persistirNotificaciones(listaDerivada);
        }
      } catch (err) {
        console.warn("Aviso al inicializar notificaciones:", err);
        if (montado) {
          setNotificaciones([crearNotificacionBienvenida()]);
          setCargando(false);
        }
      }
    };

    void inicializar();

    return () => {
      montado = false;
    };
  }, [userId, persistirNotificaciones]);

  const recargarNotificaciones = useCallback(async () => {
    if (!userId) return;
    try {
      const guardadas = await AsyncStorage.getItem(CLAVE_STORAGE_NOTIFS(userId));
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed)) {
          setNotificaciones(parsed);
        }
      }
    } catch (err) {
      console.warn("Aviso al recargar notificaciones:", err);
    }
  }, [userId]);

  // Procesar evento de cambio de estado de un viaje
  const procesarEstadoViaje = useCallback(
    async (
      viajeId: string,
      estado: string,
      metadata?: { conductorNombre?: string }
    ) => {
      // Verificar si las notificaciones de viaje están activas en preferencias
      if (!preferenciasRef.current.viaje) {
        return;
      }

      const idEvento = `${viajeId}_${estado}`;

      // Evitar duplicados por evento (ID = viajeId + estado)
      const yaExiste = notificacionesRef.current.some(
        (notif) => notif.id === idEvento
      );
      if (yaExiste) {
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

      setNotificaciones((actuales) => {
        // Doble verificación dentro del setter
        if (actuales.some((n) => n.id === idEvento)) return actuales;
        const actualizadas = [nuevaNotificacion, ...actuales];
        persistirNotificaciones(actualizadas);
        return actualizadas;
      });
    },
    [persistirNotificaciones]
  );

  // Marcar una como leída
  const marcarComoLeida = useCallback(
    async (id: string) => {
      setNotificaciones((actuales) => {
        const actualizadas = actuales.map((item) =>
          item.id === id ? { ...item, leida: true } : item
        );
        persistirNotificaciones(actualizadas);
        return actualizadas;
      });
    },
    [persistirNotificaciones]
  );

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones((actuales) => {
      const actualizadas = actuales.map((item) => ({ ...item, leida: true }));
      persistirNotificaciones(actualizadas);
      return actualizadas;
    });
  }, [persistirNotificaciones]);

  // Eliminar una notificación
  const eliminarNotificacion = useCallback(
    async (id: string) => {
      setNotificaciones((actuales) => {
        const actualizadas = actuales.filter((item) => item.id !== id);
        persistirNotificaciones(actualizadas);
        return actualizadas;
      });
    },
    [persistirNotificaciones]
  );

  // Actualizar preferencia (ej. apagar notificaciones de viaje)
  const actualizarPreferencia = useCallback(
    async (clave: keyof PreferenciasNotificaciones, valor: boolean) => {
      const nuevoEstado = { ...preferenciasRef.current, [clave]: valor };
      setPreferencias(nuevoEstado);
      await persistirPreferencias(nuevoEstado);

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
    [userId, persistirPreferencias]
  );

  // Suscripción Realtime a cambios en viajes del usuario (Sprint 2 en primer plano)
  useEffect(() => {
    if (!userId) return;

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
            procesarEstadoViaje(
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
  }, [userId, procesarEstadoViaje]);

  const hayNoLeidas = useMemo(
    () => notificaciones.some((item) => !item.leida),
    [notificaciones]
  );

  return (
    <NotificacionesContext.Provider
      value={{
        notificaciones,
        hayNoLeidas,
        cargando,
        preferencias,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
        actualizarPreferencia,
        procesarEstadoViaje,
        recargarNotificaciones,
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error(
      "useNotificaciones debe utilizarse dentro de un NotificacionesProvider"
    );
  }
  return context;
}

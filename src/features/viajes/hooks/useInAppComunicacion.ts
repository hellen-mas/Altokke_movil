import { useState, useEffect, useCallback, useRef } from "react";
import {
  comunicacionViajeService,
  MensajeInApp,
  QUICK_REPLIES_CONDUCTOR,
  QUICK_REPLIES_PASAJERO,
  QuickReplyPreset,
} from "@/features/viajes/services/comunicacionViajeService";
import { useHaptics } from "@/shared/hooks/useHaptics";

interface UseInAppComunicacionProps {
  viajeId: string | null;
  usuarioActualId: string | null;
  rolUsuario: "conductor" | "pasajero";
}

export function useInAppComunicacion({
  viajeId,
  usuarioActualId,
  rolUsuario,
}: UseInAppComunicacionProps) {
  const [mensajes, setMensajes] = useState<MensajeInApp[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [noLeidos, setNoLeidos] = useState<number>(0);
  const { impactoLigero, alertaNuevaSolicitud } = useHaptics();

  const usuarioRef = useRef(usuarioActualId);
  useEffect(() => {
    usuarioRef.current = usuarioActualId;
  }, [usuarioActualId]);

  const quickRepliesDisponibles: QuickReplyPreset[] =
    rolUsuario === "conductor"
      ? QUICK_REPLIES_CONDUCTOR
      : QUICK_REPLIES_PASAJERO;

  const cargarHistorial = useCallback(async () => {
    if (!viajeId) {
      return;
    }

    setCargando(true);
    try {
      const historial = await comunicacionViajeService.obtenerMensajesViaje(viajeId);
      setMensajes(historial);

      if (usuarioRef.current) {
        const pendientes = historial.filter(
          (m) => !m.leido && m.remitente_id !== usuarioRef.current
        ).length;
        setNoLeidos(pendientes);
      }
    } finally {
      setCargando(false);
    }
  }, [viajeId]);

  useEffect(() => {
    let efectoActivo = true;
    queueMicrotask(() => {
      if (efectoActivo) void cargarHistorial();
    });

    if (!viajeId) {
      return () => {
        efectoActivo = false;
      };
    }

    const desuscribir = comunicacionViajeService.suscribirMensajes(
      viajeId,
      (nuevoMensaje) => {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevoMensaje.id)) {
            return prev;
          }
          return [...prev, nuevoMensaje];
        });

        // Alerta háptica al recibir mensaje de la contraparte
        if (nuevoMensaje.remitente_id !== usuarioRef.current) {
          alertaNuevaSolicitud();
          setNoLeidos((prev) => prev + 1);

          // Si es respuesta rápida y estamos en entorno con síntesis de voz
          if (
            nuevoMensaje.tipo === "quick_reply" &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window
          ) {
            try {
              const utterance = new SpeechSynthesisUtterance(nuevoMensaje.contenido);
              utterance.lang = "es-PE";
              window.speechSynthesis.speak(utterance);
            } catch (err) {
              console.warn("Aviso al sintetizar voz:", err);
            }
          }
        }
      }
    );

    return () => {
      efectoActivo = false;
      desuscribir();
    };
  }, [viajeId, cargarHistorial, alertaNuevaSolicitud]);

  const enviarTexto = useCallback(
    async (contenido: string) => {
      if (!viajeId || !usuarioRef.current) {
        return null;
      }
      impactoLigero();
      const resultado = await comunicacionViajeService.enviarMensajeTexto(
        viajeId,
        usuarioRef.current,
        contenido
      );
      return resultado;
    },
    [viajeId, impactoLigero]
  );

  const enviarQuickReply = useCallback(
    async (preset: QuickReplyPreset) => {
      if (!viajeId || !usuarioRef.current) {
        return null;
      }
      impactoLigero();
      const resultado = await comunicacionViajeService.enviarQuickReply(
        viajeId,
        usuarioRef.current,
        preset.texto
      );
      return resultado;
    },
    [viajeId, impactoLigero]
  );

  const marcarComoLeidos = useCallback(async () => {
    if (!viajeId || !usuarioRef.current) {
      return;
    }
    await comunicacionViajeService.marcarComoLeidos(viajeId, usuarioRef.current);
    setNoLeidos(0);
    setMensajes((prev) =>
      prev.map((m) =>
        m.remitente_id !== usuarioRef.current ? { ...m, leido: true } : m
      )
    );
  }, [viajeId]);

  return {
    mensajes: viajeId ? mensajes : [],
    cargando: viajeId ? cargando : false,
    noLeidos: viajeId ? noLeidos : 0,
    quickRepliesDisponibles,
    enviarTexto,
    enviarQuickReply,
    marcarComoLeidos,
    recargar: cargarHistorial,
  };
}

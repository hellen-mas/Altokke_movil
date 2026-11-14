import { supabase } from "@/shared/api/supabase";

export interface MensajeInApp {
  id: string;
  viaje_id: string;
  remitente_id: string;
  contenido: string;
  tipo: "texto" | "audio" | "quick_reply";
  audio_url: string | null;
  duracion_segundos: number | null;
  leido: boolean;
  creado_en: string;
}

export interface QuickReplyPreset {
  id: string;
  texto: string;
  destinatario: "conductor" | "pasajero";
}

export const QUICK_REPLIES_PASAJERO: QuickReplyPreset[] = [
  { id: "p_1", texto: "Ya salgo a la puerta", destinatario: "pasajero" },
  { id: "p_2", texto: "Estoy saliendo con equipaje/bolsas", destinatario: "pasajero" },
  { id: "p_3", texto: "Espéreme 1 minuto, por favor", destinatario: "pasajero" },
  { id: "p_4", texto: "Estoy esperando en la vereda", destinatario: "pasajero" },
];

export const QUICK_REPLIES_CONDUCTOR: QuickReplyPreset[] = [
  { id: "c_1", texto: "Ya estoy en la puerta de recogida", destinatario: "conductor" },
  { id: "c_2", texto: "Estoy a 2 cuadras, en camino", destinatario: "conductor" },
  { id: "c_3", texto: "Hay congestión/bache, llego en 2 min", destinatario: "conductor" },
  { id: "c_4", texto: "¿Cuál es el color de su fachada o casa?", destinatario: "conductor" },
];

export const comunicacionViajeService = {
  /**
   * Envía un mensaje de texto plano efímero dentro de la aplicación.
   * Cero exposición telefónica (Ley 29733 y Art. 151-A C.P.).
   */
  async enviarMensajeTexto(
    viajeId: string,
    remitenteId: string,
    contenido: string
  ): Promise<MensajeInApp | null> {
    const textoLimpio = contenido.trim();
    if (!textoLimpio || textoLimpio.length > 500) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("mensajes_viaje")
        .insert({
          viaje_id: viajeId,
          remitente_id: remitenteId,
          contenido: textoLimpio,
          tipo: "texto",
          leido: false,
        })
        .select()
        .single();

      if (error) {
        console.warn("Aviso al enviar mensaje de texto:", error.message);
        return null;
      }

      return data as unknown as MensajeInApp;
    } catch (err) {
      console.warn("Excepción al enviar mensaje de texto:", err);
      return null;
    }
  },

  /**
   * Envía una Respuesta Rápida (1-tap quick reply) que evita distracciones motrices.
   */
  async enviarQuickReply(
    viajeId: string,
    remitenteId: string,
    textoPreset: string
  ): Promise<MensajeInApp | null> {
    try {
      const { data, error } = await supabase
        .from("mensajes_viaje")
        .insert({
          viaje_id: viajeId,
          remitente_id: remitenteId,
          contenido: textoPreset,
          tipo: "quick_reply",
          leido: false,
        })
        .select()
        .single();

      if (error) {
        console.warn("Aviso al enviar respuesta rápida:", error.message);
        return null;
      }

      return data as unknown as MensajeInApp;
    } catch (err) {
      console.warn("Excepción al enviar respuesta rápida:", err);
      return null;
    }
  },

  /**
   * Obtiene la cronología de mensajes efímeros del viaje en curso.
   */
  async obtenerMensajesViaje(viajeId: string): Promise<MensajeInApp[]> {
    try {
      const { data, error } = await supabase
        .from("mensajes_viaje")
        .select("*")
        .eq("viaje_id", viajeId)
        .order("creado_en", { ascending: true });

      if (error) {
        console.warn("Aviso al obtener mensajes:", error.message);
        return [];
      }

      return (data || []) as unknown as MensajeInApp[];
    } catch (err) {
      console.warn("Excepción al obtener mensajes:", err);
      return [];
    }
  },

  /**
   * Marca los mensajes recibidos como leídos por el usuario actual.
   */
  async marcarComoLeidos(viajeId: string, usuarioActualId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("mensajes_viaje")
        .update({ leido: true })
        .eq("viaje_id", viajeId)
        .neq("remitente_id", usuarioActualId)
        .eq("leido", false);

      if (error) {
        console.warn("Aviso al marcar mensajes como leídos:", error.message);
      }
    } catch (err) {
      console.warn("Excepción al marcar mensajes como leídos:", err);
    }
  },

  /**
   * Suscribe en tiempo real al canal de mensajería efímera del viaje.
   */
  suscribirMensajes(
    viajeId: string,
    onNuevoMensaje: (mensaje: MensajeInApp) => void
  ) {
    const canal = supabase
      .channel(`chat_viaje:${viajeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_viaje",
          filter: `viaje_id=eq.${viajeId}`,
        },
        (payload) => {
          if (payload.new) {
            onNuevoMensaje(payload.new as unknown as MensajeInApp);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  },
};

import { supabase } from "@/shared/api/supabase";
import { ViajeHistorial } from "@/features/viajes/constants/pasajero";

export interface CrearViajeInput {
  pasajeroId: string;
  origenTexto: string;
  destinoTexto: string;
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  distanciaKm: number;
  tarifaEstimada: number;
  metodoPago: string;
  pagaCon?: number;
}

export const viajeService = {
  async crearViaje(input: CrearViajeInput) {
    try {
      // 1. Intento soberano mediante RPC seguro 'solicitar_viaje' con validación en servidor
      const { data: rpcData, error: rpcError } = await supabase.rpc("solicitar_viaje", {
        p_origen_texto: input.origenTexto,
        p_destino_texto: input.destinoTexto,
        p_origen_lat: input.origenLat,
        p_origen_lng: input.origenLng,
        p_destino_lat: input.destinoLat,
        p_destino_lng: input.destinoLng,
        p_metodo_pago: input.metodoPago,
        p_paga_con: input.pagaCon ?? null,
      });

      if (!rpcError && rpcData) {
        return rpcData as unknown as {
          id: string;
          pasajero_id: string;
          conductor_id: string | null;
          origen_texto: string;
          destino_texto: string;
          origen_lat: number;
          origen_lng: number;
          destino_lat: number;
          destino_lng: number;
          distancia_km: number | null;
          tarifa_estimada: number;
          tarifa_final: number | null;
          metodo_pago: string | null;
          paga_con: number | null;
          vuelto_estimado: number | null;
          estado: string | null;
          creado_en: string;
          aceptado_en: string | null;
          finalizado_en: string | null;
        };
      }

      // 2. Fallback de compatibilidad
      const { data, error } = await supabase
        .from("viajes")
        .insert({
          pasajero_id: input.pasajeroId,
          origen_texto: input.origenTexto,
          destino_texto: input.destinoTexto,
          origen_lat: input.origenLat,
          origen_lng: input.origenLng,
          destino_lat: input.destinoLat,
          destino_lng: input.destinoLng,
          distancia_km: input.distanciaKm,
          tarifa_estimada: input.tarifaEstimada,
          metodo_pago: input.metodoPago,
          paga_con: input.pagaCon ?? null,
          vuelto_estimado:
            input.pagaCon && input.pagaCon > input.tarifaEstimada
              ? Number((input.pagaCon - input.tarifaEstimada).toFixed(2))
              : null,
        })
        .select()
        .single();

      if (error) {
        console.warn("Aviso al crear viaje en Supabase:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn("Excepción al crear viaje en Supabase:", err);
      return null;
    }
  },

  async obtenerViajeActivoPasajero(pasajeroId: string) {
    if (!pasajeroId) {
      throw new Error("Se requiere el ID del pasajero.");
    }

    const estadosActivos = [
      "buscando",
      "aceptado",
      "en_camino_origen",
      "esperando_pasajero",
      "en_viaje",
    ] as const;

    const { data, error } = await supabase
      .from("viajes")
      .select(`
        id,
        estado,
        origen_texto,
        destino_texto,
        origen_lat,
        origen_lng,
        destino_lat,
        destino_lng,
        distancia_km,
        tarifa_estimada,
        metodo_pago
      `)
      .eq("pasajero_id", pasajeroId)
      .in("estado", estadosActivos)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al consultar viaje activo:", error);
      throw new Error(
        "No se pudo verificar si tienes un viaje activo."
      );
    }

    return data;
  },

  async finalizarViaje(viajeId: string, _tarifaFinal?: number) {
    if (!viajeId) return null;
    try {
      const { error } = await supabase.rpc("finalizar_viaje", { p_viaje_id: viajeId });
      if (error) throw error;
      const { data } = await supabase.from("viajes").select().eq("id", viajeId).maybeSingle();
      return data;
    } catch (err) {
      console.warn("No se pudo finalizar el viaje:", err);
      return null;
    }
  },

  /** Cancela el viaje mediante una transición validada en PostgreSQL con soporte para motivo. */
  async cancelarViaje(viajeId: string, motivo?: string) {
    if (!viajeId) return null;
    try {
      const { error } = await supabase.rpc("cancelar_viaje_pasajero", {
        p_viaje_id: viajeId,
        p_motivo: motivo ? motivo.trim() : null,
      });
      if (error) throw error;
      const { data } = await supabase.from("viajes").select().eq("id", viajeId).maybeSingle();
      return data;
    } catch (err) {
      console.warn("No se pudo cancelar el viaje:", err);
      return null;
    }
  },

  /**
   * Registra la calificación otorgada al conductor en Supabase
   */
  async registrarCalificacion(
    viajeId: string,
    autorId: string,
    receptorId: string | null,
    puntuacion: number,
    comentario?: string
  ) {
    if (!viajeId || !autorId) return null;

    try {
      // Si receptorId no se conoce aún (ej. conductor mock), usar autorId o consultar viaje
      let finalReceptorId = receptorId;
      if (!finalReceptorId) {
        const { data: viaje } = await supabase
          .from("viajes")
          .select("conductor_id")
          .eq("id", viajeId)
          .maybeSingle();

        finalReceptorId = viaje?.conductor_id || null;
      }

      if (!finalReceptorId) {
        return null; // Omitir calificación en DB si no hay conductor real vinculado
      }

      const { data, error } = await supabase
        .from("calificaciones")
        .insert(
          {
            viaje_id: viajeId,
            autor_id: autorId,
            receptor_id: finalReceptorId,
            puntuacion,
            comentario: comentario || null,
          },
        )
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Aviso al guardar calificación en Supabase:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn("Excepción al guardar calificación:", err);
      return null;
    }
  },
  async obtenerViajesParaNotificaciones(pasajeroId: string) {
    if (!pasajeroId) {
      throw new Error("Se requiere el ID del pasajero.");
    }

    const { data, error } = await supabase
      .from("viajes")
      .select("id, estado, creado_en")
      .eq("pasajero_id", pasajeroId)
      .order("creado_en", { ascending: false })
      .limit(8);

    if (error) {
      throw new Error(
        `No se pudieron consultar las notificaciones: ${error.message}`
      );
    }

    return data ?? [];
  },

  /**
   * Obtiene el historial de viajes de un pasajero desde Supabase
   */
  async obtenerHistorialPasajero(userId: string, limite = 50): Promise<ViajeHistorial[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from("viajes")
        .select("id, origen_texto, destino_texto, tarifa_estimada, tarifa_final, estado, creado_en")
        .eq("pasajero_id", userId)
        .order("creado_en", { ascending: false })
        .limit(limite);

      if (error || !data) {
        return [];
      }

      return data.map((v) => ({
        id: v.id,
        fecha: new Date(v.creado_en),
        origen: v.origen_texto,
        destino: v.destino_texto,
        tarifa: Number(v.tarifa_final || v.tarifa_estimada),
        estado:
          v.estado === "finalizado"
            ? "completado"
            : v.estado && v.estado.includes("cancelado")
              ? "cancelado"
              : "completado",
      }));
    } catch (err) {
      console.warn("Aviso al consultar historial de viajes de Supabase:", err);
      return [];
    }
  },
};

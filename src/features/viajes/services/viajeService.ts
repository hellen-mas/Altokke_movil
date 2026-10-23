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
}

export const viajeService = {
  /**
   * Crea un nuevo registro de viaje en estado 'buscando' en Supabase
   */
  async crearViaje(input: CrearViajeInput) {
    try {
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
          estado: "buscando",
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

  /**
   * Finaliza el viaje y actualiza su tarifa final
   */
  async finalizarViaje(viajeId: string, tarifaFinal?: number) {
    if (!viajeId) return null;

    try {
      const { data, error } = await supabase
        .from("viajes")
        .update({
          estado: "finalizado",
          tarifa_final: tarifaFinal,
          finalizado_en: new Date().toISOString(),
        })
        .eq("id", viajeId)
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Aviso al finalizar viaje en Supabase:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn("Excepción al finalizar viaje:", err);
      return null;
    }
  },

  /**
   * Cancela el viaje por parte del pasajero
   */
  async cancelarViaje(viajeId: string) {
    if (!viajeId) return null;

    try {
      const { data, error } = await supabase
        .from("viajes")
        .update({
          estado: "cancelado_pasajero",
        })
        .eq("id", viajeId)
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Aviso al cancelar viaje en Supabase:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn("Excepción al cancelar viaje:", err);
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
        .upsert(
          {
            viaje_id: viajeId,
            autor_id: autorId,
            receptor_id: finalReceptorId,
            puntuacion,
            comentario: comentario || null,
          },
          { onConflict: "viaje_id,autor_id" }
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

  /**
   * Obtiene el historial de viajes de un pasajero desde Supabase
   */
  async obtenerHistorialPasajero(userId: string): Promise<ViajeHistorial[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from("viajes")
        .select("id, origen_texto, destino_texto, tarifa_estimada, tarifa_final, estado, creado_en")
        .eq("pasajero_id", userId)
        .order("creado_en", { ascending: false });

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

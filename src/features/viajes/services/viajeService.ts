import { supabase } from "@/shared/api/supabase";
import type { ViajeHistorial } from "@/features/viajes/constants/pasajero";

export interface DestinoFrecuente {
  id: string; usuarioId: string; nombre: string; direccion: string;
  latitud: number; longitud: number; creadoEn: string;
}

export interface AgregarDestinoFrecuenteInput {
  usuarioId: string; nombre: string; direccion: string;
  latitud: number; longitud: number;
}

export interface DatosOperativosViajeConductor {
  viajeId: string; pasajeroPrimerNombre: string; pasajeroAvatar: string | null;
  pasajeroCalificacion: number; origenTexto: string; origenLat: number; origenLng: number;
  destinoTexto: string; destinoLat: number; destinoLng: number; tarifa: number;
  metodoPago: string; estado: string;
}

export interface CrearViajeInput {
  pasajeroId: string; origenTexto: string; destinoTexto: string;
  origenLat: number; origenLng: number; destinoLat: number; destinoLng: number;
  distanciaKm: number; tarifaEstimada: number; metodoPago: string; pagaCon?: number;
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

      if (!rpcError) {
        // El RPC devuelve { viaje_id, ... } (no la fila completa): se lee el viaje recién creado
        const respuesta = rpcData as { id?: string; viaje_id?: string } | null;
        const viajeId = respuesta?.viaje_id ?? respuesta?.id;
        if (!viajeId) return null;

        const { data: viaje, error: errorLectura } = await supabase
          .from("viajes")
          .select("*")
          .eq("id", viajeId)
          .single();
        if (errorLectura) throw new Error(errorLectura.message);
        return viaje;
      }

      // PGRST202 = la función con esta firma aún no existe en la base (migración sin aplicar).
      // Mientras tanto se registra el viaje con el insert directo de antes.
      if (rpcError.code !== "PGRST202") {
        console.warn("Aviso al solicitar viaje vía RPC:", rpcError.message);
        throw new Error(rpcError.message);
      }
      console.warn("RPC solicitar_viaje no disponible; se usa el registro directo.");

      const { data: viajeDirecto, error: errorInsert } = await supabase
        .from("viajes")
        .insert({
          pasajero_id: input.pasajeroId, origen_texto: input.origenTexto, destino_texto: input.destinoTexto,
          origen_lat: input.origenLat, origen_lng: input.origenLng, destino_lat: input.destinoLat,
          destino_lng: input.destinoLng, distancia_km: input.distanciaKm, tarifa_estimada: input.tarifaEstimada,
          metodo_pago: input.metodoPago,
        })
        .select()
        .single();
      if (errorInsert) throw new Error(errorInsert.message);
      return viajeDirecto;
    } catch (err: unknown) {
      console.warn("Excepción al crear viaje en Supabase:", err);
      throw err;
    }
  },

  async obtenerViajeActivoPasajero(pasajeroId: string) {
    if (!pasajeroId) throw new Error("Se requiere el ID del pasajero.");

    const estadosActivos = ["buscando", "aceptado", "en_camino_origen", "esperando_pasajero", "en_viaje"] as const;

    const { data, error } = await supabase
      .from("viajes")
      .select("id, estado, origen_texto, destino_texto, origen_lat, origen_lng, destino_lat, destino_lng, distancia_km, tarifa_estimada, metodo_pago")
      .eq("pasajero_id", pasajeroId)
      .in("estado", estadosActivos)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al consultar viaje activo:", error);
      throw new Error("No se pudo verificar si tienes un viaje activo.");
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
  async cancelarViaje(viajeId: string, motivo?: string): Promise<boolean> {
    if (!viajeId) return false;

    const { error } = await supabase.rpc("cancelar_viaje_pasajero", {
      p_viaje_id: viajeId,
      p_motivo: motivo?.trim() || null,
    });
    
    if (error) {
      console.error("Error RPC cancelar_viaje_pasajero:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      throw error;
    }

    return true;
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
        .insert({
          viaje_id: viajeId, autor_id: autorId, receptor_id: finalReceptorId,
          puntuacion, comentario: comentario || null,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Aviso al guardar calificación en Supabase:", error.message);
        return null;
      }
      return data;
    } catch (err: unknown) {
      console.warn("Excepción al guardar calificación:", err);
      return null;
    }
  },

  async obtenerViajesParaNotificaciones(pasajeroId: string) {
    if (!pasajeroId) throw new Error("Se requiere el ID del pasajero.");
    const { data, error } = await supabase
      .from("viajes")
      .select("id, estado, creado_en")
      .eq("pasajero_id", pasajeroId)
      .order("creado_en", { ascending: false })
      .limit(8);

    if (error) throw new Error(`No se pudieron consultar las notificaciones: ${error.message}`);
    return data ?? [];
  },

  /**
   * Obtiene únicamente los viajes finalizados o cancelados
   * del pasajero desde Supabase.
   */
  async obtenerHistorialPasajero(
    userId: string,
    limite = 50
  ): Promise<ViajeHistorial[]> {
    if (!userId) {
      throw new Error(
        "Se requiere una sesión de pasajero para consultar el historial."
      );
    }

    const estadosHistorial = [
      "finalizado",
      "cancelado_pasajero",
      "cancelado_conductor",
    ] as const;

    const { data, error } = await supabase
      .from("viajes")
      .select(
        "id, origen_texto, destino_texto, tarifa_estimada, tarifa_final, estado, creado_en"
      )
      .eq("pasajero_id", userId)
      .in("estado", estadosHistorial)
      .order("creado_en", { ascending: false })
      .limit(limite);

    if (error) {
      console.error(
        "Error al consultar el historial de viajes:",
        error
      );

      throw new Error(
        `No se pudo cargar el historial: ${error.message}`
      );
    }

    return (data ?? []).map((viaje) => ({
      id: viaje.id,
      fecha: new Date(viaje.creado_en),
      origen: viaje.origen_texto,
      destino: viaje.destino_texto,
      tarifa: Number(
        viaje.tarifa_final ?? viaje.tarifa_estimada ?? 0
      ),
      estado:
        viaje.estado === "finalizado"
          ? "completado"
          : "cancelado",
    }));
  },

  /**
   * Consulta los destinos frecuentes registrados por el pasajero (P-03).
   */
  async obtenerDestinosFrecuentes(usuarioId: string): Promise<DestinoFrecuente[]> {
    if (!usuarioId) return [];

    const { data, error } = await supabase
      .from("destinos_frecuentes")
      .select("id, usuario_id, nombre, direccion, latitud, longitud, creado_en")
      .eq("usuario_id", usuarioId)
      .order("creado_en", { ascending: false });

    if (error) {
      console.warn("Aviso al consultar destinos frecuentes:", error.message);
      return [];
    }

    return (data ?? []).map((d) => ({
      id: d.id,
      usuarioId: d.usuario_id,
      nombre: d.nombre,
      direccion: d.direccion,
      latitud: Number(d.latitud),
      longitud: Number(d.longitud),
      creadoEn: d.creado_en,
    }));
  },

  /**
   * Registra un nuevo destino frecuente para el pasajero (P-03).
   */
  async agregarDestinoFrecuente(
    input: AgregarDestinoFrecuenteInput
  ): Promise<DestinoFrecuente> {
    if (!input.usuarioId || !input.nombre.trim() || !input.direccion.trim()) {
      throw new Error("Datos incompletos para registrar el destino frecuente.");
    }

    const { data, error } = await supabase
      .from("destinos_frecuentes")
      .insert({
        usuario_id: input.usuarioId,
        nombre: input.nombre.trim(),
        direccion: input.direccion.trim(),
        latitud: input.latitud,
        longitud: input.longitud,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`No se pudo guardar el destino: ${error?.message || "Error desconocido"}`);
    }

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      nombre: data.nombre,
      direccion: data.direccion,
      latitud: Number(data.latitud),
      longitud: Number(data.longitud),
      creadoEn: data.creado_en,
    };
  },

  /**
   * Elimina un destino frecuente del pasajero (P-03).
   */
  async eliminarDestinoFrecuente(id: string, usuarioId: string): Promise<boolean> {
    if (!id || !usuarioId) return false;

    const { error } = await supabase
      .from("destinos_frecuentes")
      .delete()
      .eq("id", id)
      .eq("usuario_id", usuarioId);

    if (error) {
      console.warn("Aviso al eliminar destino frecuente:", error.message);
      return false;
    }

    return true;
  },

  /**
   * Consulta los datos mínimos del viaje autorizados para el conductor (P-08 / LPDP Ley 29733).
   */
  async obtenerDatosViajeParaConductor(
    viajeId: string
  ): Promise<DatosOperativosViajeConductor | null> {
    if (!viajeId) return null;

    try {
      const { data, error } = await supabase.rpc("obtener_datos_viaje_conductor", {
        p_viaje_id: viajeId,
      });

      if (error || !data) {
        console.warn("Aviso RPC obtener_datos_viaje_conductor:", error?.message);
        return null;
      }

      const res = data as {
        viaje_id: string;
        pasajero_primer_nombre: string;
        pasajero_avatar: string | null;
        pasajero_calificacion: number;
        origen_texto: string;
        origen_lat: number;
        origen_lng: number;
        destino_texto: string;
        destino_lat: number;
        destino_lng: number;
        tarifa: number;
        metodo_pago: string;
        estado: string;
      };

      return {
        viajeId: res.viaje_id,
        pasajeroPrimerNombre: res.pasajero_primer_nombre || "Pasajero",
        pasajeroAvatar: res.pasajero_avatar,
        pasajeroCalificacion: Number(res.pasajero_calificacion ?? 5.0),
        origenTexto: res.origen_texto,
        origenLat: Number(res.origen_lat),
        origenLng: Number(res.origen_lng),
        destinoTexto: res.destino_texto,
        destinoLat: Number(res.destino_lat),
        destinoLng: Number(res.destino_lng),
        tarifa: Number(res.tarifa ?? 0),
        metodoPago: res.metodo_pago,
        estado: res.estado,
      };
    } catch (err: unknown) {
      console.warn("Excepción al consultar datos operativos del viaje:", err);
      return null;
    }
  },
};

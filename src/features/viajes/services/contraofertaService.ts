import { supabase } from "@/shared/api/supabase";

export interface ContraofertaViaje {
  id: string;
  viaje_id: string;
  conductor_id: string;
  tarifa_ofertada: number;
  tiempo_llegada_min: number;
  estado: "pendiente" | "aceptada" | "rechazada" | "expirada" | "cancelada";
  expira_en: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CrearContraofertaInput {
  viajeId: string;
  tarifaOfertada: number;
  tiempoLlegadaMin?: number;
}

export interface ResultadoSeleccionOferta {
  success: boolean;
  viaje_id: string;
  conductor_id: string;
  tarifa_final: number;
  paga_con?: number | null;
  vuelto_estimado?: number | null;
  estado: string;
}

export const contraofertaService = {
  /**
   * Valida localmente si una contraoferta cumple con los pisos y techos de Bagua.
   */
  validarLimitesContraoferta(tarifaOfertada: number, tarifaBase: number): {
    valido: boolean;
    razon?: string;
    piso: number;
    techo: number;
  } {
    const piso = Math.max(2.5, Number((tarifaBase * 0.7).toFixed(2)));
    const techo = Number((tarifaBase * 1.5).toFixed(2));

    if (isNaN(tarifaOfertada) || tarifaOfertada <= 0) {
      return { valido: false, razon: "Tarifa inválida", piso, techo };
    }
    if (tarifaOfertada < piso) {
      return { valido: false, razon: `Monto menor al piso regulado (S/ ${piso.toFixed(2)})`, piso, techo };
    }
    if (tarifaOfertada > techo) {
      return { valido: false, razon: `Monto excede el techo permitido (S/ ${techo.toFixed(2)})`, piso, techo };
    }
    return { valido: true, piso, techo };
  },

  /**
   * Conductor envía una contraoferta regulada para un viaje solicitado.
   */
  async crearContraoferta(input: CrearContraofertaInput): Promise<{
    success: boolean;
    oferta_id?: string;
    mensaje?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("crear_contraoferta", {
        p_viaje_id: input.viajeId,
        p_tarifa: input.tarifaOfertada,
        p_tiempo_llegada_min: input.tiempoLlegadaMin ?? 3,
      });

      if (error) {
        console.warn("Aviso al crear contraoferta:", error.message);
        return { success: false, mensaje: error.message };
      }

      const res = data as unknown as { success: boolean; oferta_id: string };
      return { success: res?.success ?? true, oferta_id: res?.oferta_id };
    } catch (err) {
      console.warn("Excepción al crear contraoferta:", err);
      return {
        success: false,
        mensaje: err instanceof Error ? err.message : "Error al enviar contraoferta",
      };
    }
  },

  /**
   * Pasajero acepta una contraoferta con candado atómico pesimista en PostgreSQL.
   */
  async seleccionarOferta(ofertaId: string): Promise<ResultadoSeleccionOferta | null> {
    try {
      const { data, error } = await supabase.rpc("seleccionar_oferta_viaje", {
        p_oferta_id: ofertaId,
      });

      if (error) {
        console.warn("Aviso al seleccionar oferta:", error.message);
        return null;
      }

      return data as unknown as ResultadoSeleccionOferta;
    } catch (err) {
      console.warn("Excepción al seleccionar oferta:", err);
      return null;
    }
  },

  /**
   * Consulta la lista de ofertas activas para un viaje específico.
   */
  async obtenerOfertasViaje(viajeId: string): Promise<ContraofertaViaje[]> {
    try {
      const { data, error } = await supabase
        .from("contraofertas_viaje")
        .select("*")
        .eq("viaje_id", viajeId)
        .eq("estado", "pendiente")
        .gt("expira_en", new Date().toISOString())
        .order("tarifa_ofertada", { ascending: true });

      if (error) {
        console.warn("Aviso al obtener ofertas:", error.message);
        return [];
      }

      return (data || []) as unknown as ContraofertaViaje[];
    } catch (err) {
      console.warn("Excepción al obtener ofertas:", err);
      return [];
    }
  },

  /**
   * Suscripción Realtime a las ofertas de un viaje.
   */
  suscribirOfertas(viajeId: string, onUpdate: () => void) {
    const channel = supabase
      .channel(`contraofertas:${viajeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contraofertas_viaje",
          filter: `viaje_id=eq.${viajeId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

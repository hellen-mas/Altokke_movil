import { supabase, invocarEdgeFunction } from "@/shared/api/supabase";

const aTitulo = (str: string) =>
  str.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());

const cacheDni = new Map<string, { nombres: string; apellidos: string }>();

export const identidadService = {
  async existeDni(dni: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("id")
        .eq("dni", dni.trim())
        .maybeSingle();

      return Boolean(data);
    } catch {
      return false;
    }
  },

  async validarIdentidadDNI(dni: string) {
    const limpio = dni.trim();

    const yaRegistrado = await this.existeDni(limpio);
    if (yaRegistrado) {
      const err = new Error("DNI_YA_REGISTRADO");
      (err as any).code = "DNI_YA_REGISTRADO";
      throw err;
    }

    const guardado = cacheDni.get(limpio);
    if (guardado) return { ...guardado };

    try {
      const respuesta = await invocarEdgeFunction<{
        ok: boolean;
        nombres: string;
        apellidos: string;
      }>("consultar-dni", { dni: limpio }, 10000);

      const resultado = {
        nombres: aTitulo(respuesta.nombres),
        apellidos: aTitulo(respuesta.apellidos),
      };

      if (cacheDni.size >= 30) {
        const primerKey = cacheDni.keys().next().value;
        if (primerKey) cacheDni.delete(primerKey);
      }
      cacheDni.set(limpio, resultado);

      return resultado;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new Error("La consulta de DNI tardó más de lo esperado. Verifica tu conexión a internet.");
      }
      throw new Error(err.message || "No se encontraron datos registrados para este DNI.");
    }
  },
};

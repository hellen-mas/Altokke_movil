import { supabase } from "@/lib/supabase";
import { buscarDNI } from "@/utils/apiDNI";

export const usuarioService = {
  /**
   * Consulta si un DNI ya existe registrado en la base de datos de Altokke
   */
  async existeDni(dni: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("dni", dni.trim())
        .maybeSingle();

      if (error) {
        // Si la columna DNI aún no existe en la BD (código 42703) o hay fallo de red,
        // no bloqueamos el flujo hacia la API de RENIEC ni disparamos alertas visuales de LogBox.
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Valida disponibilidad en BD y, si no está registrado, consulta a la API de RENIEC.
   * Lanza error con código DNI_YA_REGISTRADO si ya existe en la base de datos.
   */
  async validarIdentidadDNI(dni: string) {
    const registrado = await this.existeDni(dni);
    if (registrado) {
      const err = new Error("DNI_YA_REGISTRADO");
      (err as any).code = "DNI_YA_REGISTRADO";
      throw err;
    }
    return await buscarDNI(dni);
  },
};

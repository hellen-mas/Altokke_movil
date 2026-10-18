import { supabase } from "@/lib/supabase";
import { buscarDNI } from "@/utils/apiDNI";

export const usuarioService = {
  /**
   * Consulta si un DNI ya existe registrado en la base de datos de Altokke
   */
  async existeDni(dni: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("dni", dni.trim())
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  },

  /**
   * Valida disponibilidad en BD y consulta a RENIEC si está disponible.
   * Lanza error con código DNI_YA_REGISTRADO si ya existe.
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

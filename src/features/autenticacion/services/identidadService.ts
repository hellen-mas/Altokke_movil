import { supabase } from "@/shared/api/supabase";

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

    const token = process.env.EXPO_PUBLIC_DNI_API_TOKEN?.trim();
    if (!token) {
      throw new Error("Servicio de validación no disponible temporalmente.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://api.apiperu.dev/dni", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dni: limpio }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data) {
        throw new Error("No se encontraron datos registrados para este DNI.");
      }

      const { nombres = "", apellido_paterno = "", apellido_materno = "" } = data.data;
      const resultado = {
        nombres: aTitulo(nombres.trim()),
        apellidos: aTitulo([apellido_paterno, apellido_materno].filter(Boolean).join(" ").trim()),
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
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

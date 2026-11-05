import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import type { Database } from "@/shared/types/database.types";
import { almacenamientoSeguro } from "@/shared/api/almacenamientoSeguro";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan las credenciales de Supabase. Revisa tu archivo .env");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: almacenamientoSeguro,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function invocarEdgeFunction<T>(
  nombreFuncion: string,
  body: object,
  timeoutMs = 12000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke(nombreFuncion, {
      body,
      signal: controller.signal,
    });

    if (error) {
      let mensaje = "No se pudo completar la operación con el servidor.";
      let codigo: string | undefined;

      if (error.context instanceof Response) {
        try {
          const detalle: unknown = await error.context.clone().json();
          if (
            typeof detalle === "object" &&
            detalle != null &&
            !Array.isArray(detalle)
          ) {
            const datos = detalle as Record<string, unknown>;

            if (typeof datos.error === "string") {
              mensaje = datos.error;
            }
            if (typeof datos.code === "string") {
              codigo = datos.code;
            }
          }
        } catch {
          mensaje = error.message || mensaje;
        }
      } else {
        mensaje = error.message || mensaje;
      }

      const fallo = new Error(
        controller.signal.aborted
          ? "La solicitud tardó más de lo esperado."
          : mensaje
      ) as Error & { code?: string };

      fallo.code = controller.signal.aborted
        ? "TIEMPO_AGOTADO"
        : codigo;

      throw fallo;
    }

    if (data?.error) {
      const fallo = new Error(
        String(data.error)
      ) as Error & { code?: string };

      if (typeof data.code === "string") {
        fallo.code = data.code;
      }
      throw fallo;
    }

    return data as T;
} catch (error: unknown) {
    if (
      controller.signal.aborted ||
      (error instanceof Error &&
        (error.name === "AbortError" ||
          error.name === "TimeoutError"))
    ) {
      const fallo = new Error(
        "La solicitud tardó más de lo esperado."
      ) as Error & { code: string };

      fallo.code = "TIEMPO_AGOTADO";
      throw fallo;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export type UsuarioFila = Database["public"]["Tables"]["usuarios"]["Row"];
export type UsuarioInsertar = Database["public"]["Tables"]["usuarios"]["Insert"];
export type UsuarioActualizar = Database["public"]["Tables"]["usuarios"]["Update"];
export type { Database };

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
      let estadoHttp: number | undefined;

      const contexto: unknown = error.context;
      if (
        contexto !== null &&
        typeof contexto === "object" &&
        "status" in contexto &&
        typeof contexto.status === "number"
      ) {
        estadoHttp = contexto.status;
      }

      if (
        contexto !== null &&
        typeof contexto === "object" &&
        "json" in contexto &&
        typeof contexto.json === "function"
      ) {
        try {
          const respuesta = contexto as {
            json: () => Promise<unknown>;
            clone?: () => { json: () => Promise<unknown> };
          };
          const detalle = await (
            typeof respuesta.clone === "function"
              ? respuesta.clone().json()
              : respuesta.json()
          );

          if (
            detalle !== null &&
            typeof detalle === "object" &&
            !Array.isArray(detalle)
          ) {
            const datos = detalle as Record<string, unknown>;
            if (typeof datos.error === "string") {
              mensaje = datos.error;
            } else if (typeof datos.message === "string") {
              mensaje = datos.message;
            }
            if (typeof datos.code === "string") {
              codigo = datos.code;
            }
          }
        } catch {
          // El servidor puede responder sin un cuerpo JSON.
        }
      }

      if (!codigo && estadoHttp === 401) {
        codigo = "NO_AUTORIZADO";
        mensaje = "No se pudo autorizar la consulta. Revisa tu sesión e inténtalo nuevamente.";
      } else if (!codigo && estadoHttp === 403) {
        codigo = "NO_AUTORIZADO";
        mensaje = "No tienes autorización para realizar esta consulta.";
      } else if (mensaje === "Edge Function returned a non-2xx status code") {
        mensaje = "El servidor rechazó la solicitud.";
      } else if (
        mensaje === "No se pudo completar la operación con el servidor." &&
        estadoHttp
      ) {
        mensaje = `No se pudo completar la operación (HTTP ${estadoHttp}).`;
      }

      const fallo = new Error(mensaje) as Error & {
        code?: string;
        status?: number;
      };
      fallo.code = codigo;
      fallo.status = estadoHttp;
      throw fallo;
    }

    if (data && typeof data === "object" && "error" in data && data.error) {
      const respuesta = data as { error: unknown; code?: unknown };
      const fallo = new Error(String(respuesta.error)) as Error & {
        code?: string;
      };
      if (typeof respuesta.code === "string") {
        fallo.code = respuesta.code;
      }
      throw fallo;
    }

    return data as T;
  } catch (error: unknown) {
    if (
      controller.signal.aborted ||
      (error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError"))
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

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
      headers: { "x-client-timeout": String(timeoutMs) },
    });

    if (error) {
      let mensaje = "No se pudo completar la operación con el servidor.";
      if (error.context instanceof Response) {
        try {
          const detalle = await error.context.json();
          mensaje = detalle.error || detalle.message || mensaje;
        } catch {}
      }
      throw new Error(mensaje);
    }

    if (data?.error) throw new Error(data.error);
    return data as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("La solicitud tardó más de lo esperado. Revisa tu conexión a internet.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export type UsuarioFila = Database["public"]["Tables"]["usuarios"]["Row"];
export type UsuarioInsertar = Database["public"]["Tables"]["usuarios"]["Insert"];
export type UsuarioActualizar = Database["public"]["Tables"]["usuarios"]["Update"];
export type { Database };

// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respuestaJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return respuestaJson(
        { error: "Método no permitido." },
        405
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respuestaJson(
        { error: "No autorizado." },
        401
      );
    }

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey || !serviceKey) {
      throw new Error(
        "Faltan variables de entorno de Supabase."
      );
    }

    const cliente = createClient(url, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const token = authorization.slice(7);

    // Verificar al usuario autenticado.
    const { data: autenticacion, error: errorAuth } =
      await admin.auth.getUser(token);

    if (errorAuth || !autenticacion.user) {
      return respuestaJson(
        { error: "Tu sesión no es válida." },
        401
      );
    }

    const usuarioId = autenticacion.user.id;

    // Consultar el estado de la cuenta.
    const { data: usuario, error: errorUsuario } =
      await admin
        .from("usuarios")
        .select("estado_cuenta")
        .eq("id", usuarioId)
        .single();

    if (errorUsuario || !usuario) {
      throw new Error("No se encontró tu cuenta.");
    }

    // Primero realizar la eliminación lógica.
    if (usuario.estado_cuenta === "activo") {
      const { error } = await cliente.rpc(
        "eliminar_mi_cuenta"
      );

      if (error) {
        throw new Error(error.message);
      }
    } else if (usuario.estado_cuenta !== "eliminada") {
      throw new Error(
        "La cuenta no puede eliminarse en su estado actual."
      );
    }

    // Liberar el correo sin borrar la identidad histórica.
    const correoInterno =
      `eliminado-${usuarioId.replace(/-/g, "")}@example.invalid`;

    const { error: errorCorreo } =
      await admin.auth.admin.updateUserById(usuarioId, {
        email: correoInterno,
        email_confirm: true,
        user_metadata: {},
      });

    if (errorCorreo) {
      console.error(
        "Error liberando el correo:",
        errorCorreo.message
      );

      throw new Error(
        "La cuenta fue marcada como eliminada, pero no se pudo liberar el correo."
      );
    }

    return respuestaJson({
      ok: true,
      mensaje: "Cuenta procesada correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);

    return respuestaJson(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
      },
      400
    );
  }
});

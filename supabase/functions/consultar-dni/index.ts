// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type CodigoError =
  | "DNI_INVALIDO"
  | "DNI_NO_ENCONTRADO"
  | "TIEMPO_AGOTADO"
  | "ERROR_PROVEEDOR"
  | "NO_AUTORIZADO"
  | "DNI_YA_REGISTRADO";

function responder(datos: unknown, status = 200): Response {
  return Response.json(datos, {
    status,
    headers: corsHeaders,
  });
}

function errorDni(
  codigo: CodigoError,
  mensaje: string,
  status: number
): Response {
  return responder({ ok: false, code: codigo, error: mensaje }, status);
}

function esObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function aTitulo(valor: string): string {
  return valor
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responder(
      { ok: false, code: "METODO_NO_PERMITIDO", error: "Método no permitido." },
      405
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await req.json();
  } catch {
    return errorDni("DNI_INVALIDO", "Solicitud inválida.", 400);
  }

  const dni = esObjeto(cuerpo) ? texto(cuerpo.dni) : "";

  if (!/^\d{8}$/.test(dni)) {
    return errorDni(
      "DNI_INVALIDO",
      "El DNI debe contener exactamente 8 dígitos.",
      400
    );
  }

  const token = Deno.env.get("DNI_API_TOKEN")?.trim();

  if (!token) {
    return errorDni(
      "ERROR_PROVEEDOR",
      "Servicio de identidad no disponible temporalmente.",
      503
    );
  }

  try {
    const respuesta = await fetch("https://api.apiperu.dev/dni", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dni }),
      signal: AbortSignal.timeout(8000),
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
      return errorDni(
        "NO_AUTORIZADO",
        "No fue posible autorizar la consulta de identidad.",
        502
      );
    }

    if (respuesta.status === 429) {
      return errorDni(
        "ERROR_PROVEEDOR",
        "El servicio de identidad está ocupado. Inténtalo más tarde.",
        503
      );
    }

    if (respuesta.status === 404) {
      return errorDni(
        "DNI_NO_ENCONTRADO",
        "No se encontraron datos para este DNI.",
        404
      );
    }

    if (!respuesta.ok) {
      return errorDni(
        "ERROR_PROVEEDOR",
        "El proveedor de identidad no está disponible.",
        502
      );
    }

    const resultado: unknown = await respuesta
      .json()
      .catch(() => null);

    if (!esObjeto(resultado)) {
      return errorDni(
        "ERROR_PROVEEDOR",
        "El proveedor devolvió una respuesta inválida.",
        502
      );
    }

    if (resultado.success === false) {
      return errorDni(
        "DNI_NO_ENCONTRADO",
        "No se encontraron datos para este DNI.",
        404
      );
    }

    if (resultado.success !== true || !esObjeto(resultado.data)) {
      return errorDni(
        "ERROR_PROVEEDOR",
        "El proveedor devolvió información incompleta.",
        502
      );
    }

    const data = resultado.data;

    const nombres = texto(data.nombres);
    const apellidoPaterno = texto(data.apellido_paterno);
    const apellidoMaterno = texto(data.apellido_materno);

    const apellidos = [apellidoPaterno, apellidoMaterno]
      .filter(Boolean)
      .join(" ");

    if (!nombres || !apellidos) {
      return errorDni(
        "ERROR_PROVEEDOR",
        "No fue posible validar los datos de identidad.",
        502
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return errorDni(
        "ERROR_PROVEEDOR",
        "La verificación de registros no está disponible.",
        503
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: registrado, error: errorRegistro } = await admin
      .from("usuarios")
      .select("id")
      .eq("dni", dni)
      .limit(1)
      .maybeSingle();

    if (errorRegistro) {
      console.error("Fallo al verificar registro de DNI:", errorRegistro.code);
      return errorDni(
        "ERROR_PROVEEDOR",
        "No se pudo comprobar el registro del DNI.",
        503
      );
    }

    if (registrado) {
      return errorDni(
        "DNI_YA_REGISTRADO",
        "Este DNI ya se encuentra registrado.",
        409
      );
    }

    return responder({
      ok: true,
      nombres: aTitulo(nombres),
      apellidos: aTitulo(apellidos),
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
    ) {
      return errorDni(
        "TIEMPO_AGOTADO",
        "La consulta de DNI tardó demasiado.",
        504
      );
    }

    console.error("Fallo de comunicación con proveedor DNI");

    return errorDni(
      "ERROR_PROVEEDOR",
      "No fue posible comunicarse con el servicio de identidad.",
      502
    );
  }
});

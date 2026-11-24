// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cf-turnstile-response',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type CodigoError =
  | "DNI_INVALIDO"
  | "DNI_NO_ENCONTRADO"
  | "TIEMPO_AGOTADO"
  | "ERROR_PROVEEDOR"
  | "NO_AUTORIZADO"
  | "DNI_YA_REGISTRADO"
  | "RATE_LIMIT_EXCEDIDO"
  | "CAPTCHA_REQUERIDO"
  | "CAPTCHA_INVALIDO";

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

async function calcularSha256(texto: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Control de rate limiting en memoria como respaldo (5 consultas cada 15 min por IP)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitEntry>();
const MAX_CONSULTAS_POR_VENTANA = 5;
const VENTANA_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const ahora = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || ahora > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: ahora + VENTANA_MS });
    if (rateLimits.size > 2000) {
      for (const [k, v] of rateLimits.entries()) {
        if (ahora > v.resetAt) rateLimits.delete(k);
      }
    }
    return true;
  }

  if (entry.count >= MAX_CONSULTAS_POR_VENTANA) {
    return false;
  }

  entry.count += 1;
  return true;
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

  // 1. Validar el formato de la petición y el DNI estrictamente antes de consumir recursos
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

  // 2. Obtener IP del cliente y verificar rate limiting persistente en BD
  const clientIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const ipHash = await calcularSha256(clientIp + "_altokke_dni_salt");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminRateLimit = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: rlData, error: rlError } = await adminRateLimit.rpc("verificar_rate_limit", {
        p_ip_hash: ipHash,
        p_endpoint: "consultar-dni",
        p_max_intentos: 5,
        p_ventana_segundos: 900,
      });

      if (!rlError && rlData && rlData.permitido === false) {
        return errorDni(
          "RATE_LIMIT_EXCEDIDO",
          "Has superado el límite de 5 consultas de DNI cada 15 minutos. Por favor espera antes de intentar nuevamente.",
          429
        );
      }
    } catch (errDbRateLimit) {
      console.warn("Fallo verificando rate limit en BD, usando respaldo en memoria:", errDbRateLimit);
    }
  }

  if (!checkRateLimit(clientIp)) {
    return errorDni(
      "RATE_LIMIT_EXCEDIDO",
      "Has superado el límite de 5 consultas de DNI cada 15 minutos. Por favor espera antes de intentar nuevamente.",
      429
    );
  }

  // 3. Verificación de Cloudflare Turnstile condicional (solo si viene de web o si envía token explícito)
  const turnstileSecret = Deno.env.get("CF_TURNSTILE_SECRET_KEY") || Deno.env.get("TURNSTILE_SECRET_KEY");
  const bypassTurnstile =
    Deno.env.get("ENVIRONMENT") === "development" ||
    Deno.env.get("BYPASS_TURNSTILE") === "true";

  const originHeader = req.headers.get("origin") || req.headers.get("referer") || "";
  const esOrigenWeb = Boolean(originHeader && !originHeader.startsWith("file:") && !originHeader.includes("localhost"));
  const turnstileToken = esObjeto(cuerpo)
    ? texto(cuerpo.turnstileToken || cuerpo.token_turnstile)
    : texto(req.headers.get("cf-turnstile-response"));

  const requiereTurnstile = Boolean(turnstileToken) || esOrigenWeb;

  if (turnstileSecret && !bypassTurnstile && requiereTurnstile) {
    if (!turnstileToken) {
      return errorDni(
        "CAPTCHA_REQUERIDO",
        "Token de verificación Turnstile requerido para solicitudes web.",
        403
      );
    }

    try {
      const form = new URLSearchParams();
      form.append("secret", turnstileSecret);
      form.append("response", turnstileToken);
      form.append("remoteip", clientIp);

      const cfResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(5000),
      });

      const cfData = await cfResp.json();
      if (!cfData?.success) {
        return errorDni(
          "CAPTCHA_INVALIDO",
          "Verificación anti-robot fallida o expirada.",
          403
        );
      }
    } catch (cfErr) {
      console.warn("Fallo verificando token Turnstile:", cfErr);
      return errorDni(
        "ERROR_PROVEEDOR",
        "No se pudo validar el captcha de seguridad.",
        502
      );
    }
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

    console.error("Fallo de comunicación con proveedor DNI:", error);

    return errorDni(
      "ERROR_PROVEEDOR",
      "No fue posible comunicarse con el servicio de identidad.",
      502
    );
  }
});

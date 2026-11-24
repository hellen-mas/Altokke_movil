/// <reference path="../deno.d.ts" />
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReclamacionPayload {
  tipoReclamo: "queja" | "reclamo";
  nombreCompleto: string;
  tipoDoc: "DNI" | "CE" | "PASAPORTE" | "OTRO";
  numDoc: string;
  email: string;
  telefono: string;
  direccion: string;
  montoReclamado?: number;
  descripcionHechos: string;
  pedidoConcreto: string;
  codigoViaje?: string;
  turnstileToken?: string;
}

function responder(datos: Record<string, unknown>, status = 200): Response {
  return Response.json(datos, {
    status,
    headers: corsHeaders,
  });
}

async function calcularSha256(textoPlano: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(textoPlano);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responder({ ok: false, error: "Método no permitido." }, 405);
  }

  let payload: ReclamacionPayload;
  try {
    payload = await req.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "JSON inválido";
    return responder({ ok: false, error: `Cuerpo de solicitud inválido: ${msg}` }, 400);
  }

  // Validaciones mínimas de presencia
  if (!payload.nombreCompleto || !payload.numDoc || !payload.email || !payload.descripcionHechos || !payload.pedidoConcreto) {
    return responder({ ok: false, error: "Faltan campos obligatorios para registrar la reclamación." }, 400);
  }

  // 1. Detección segura de IP de cliente
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const rawIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || "127.0.0.1";

  // 2. Hash anonimizado para rate limiting (LPDP Ley 29733)
  const ipHashHex = await calcularSha256(rawIp + "altokke_reclamaciones_salt");

  // 3. Inicializar cliente con service_role en el entorno de Edge Functions
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[CONFIG ERROR] Faltan variables de Supabase en Edge Function.");
    return responder({ ok: false, error: "Error de configuración interna en servidor." }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 4. Rate Limiting persistente en PostgreSQL (máximo 3 reclamos por IP cada hora)
  try {
    const { data: rlData, error: rlError } = await supabaseAdmin.rpc("verificar_rate_limit", {
      p_ip_hash: ipHashHex,
      p_endpoint: "registrar-reclamacion",
      p_max_intentos: 3,
      p_ventana_segundos: 3600,
    });

    if (!rlError && rlData && rlData.permitido === false) {
      return responder(
        { ok: false, error: "Has alcanzado el límite de 3 reclamaciones por hora desde esta dirección de red. Por favor intenta más tarde." },
        429
      );
    }
  } catch (errRateLimit) {
    console.warn("[RATE LIMIT DB WARN]", errRateLimit);
  }

  // 5. Validación Cloudflare Turnstile condicional (solo si viene de web o si envía token explícito)
  const isDev = Deno.env.get("ENVIRONMENT") === "development" || Deno.env.get("BYPASS_TURNSTILE") === "true";
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") || Deno.env.get("CF_TURNSTILE_SECRET_KEY");

  const originHeader = req.headers.get("origin") || req.headers.get("referer") || "";
  const esOrigenWeb = Boolean(originHeader && !originHeader.startsWith("file:") && !originHeader.includes("localhost"));
  const tieneToken = Boolean(payload.turnstileToken);
  const requiereTurnstile = !isDev && turnstileSecret && (tieneToken || esOrigenWeb);

  if (requiereTurnstile) {
    if (!payload.turnstileToken) {
      return responder({ ok: false, error: "Token de verificación anti-bot (Turnstile) requerido para envíos web." }, 403);
    }

    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        signal: AbortSignal.timeout(5000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: payload.turnstileToken,
          remoteip: rawIp,
        }),
      });
      const verifyData = (await verifyRes.json()) as { success?: boolean };
      if (!verifyData.success) {
        return responder({ ok: false, error: "Validación anti-bot (Turnstile) fallida. Inténtalo nuevamente." }, 403);
      }
    } catch (turnstileErr: unknown) {
      console.error("[TURNSTILE ERROR]", turnstileErr instanceof Error ? turnstileErr.message : String(turnstileErr));
      return responder({ ok: false, error: "Error de verificación anti-bot en el servidor." }, 502);
    }
  }

  const hechosCompletos = payload.codigoViaje
    ? `${payload.descripcionHechos} [Viaje ID: ${payload.codigoViaje}]`
    : payload.descripcionHechos;

  // 5. Invocación segura a la RPC (restringida a service_role)
  const { data, error } = await supabaseAdmin.rpc("registrar_reclamacion_publica", {
    p_tipo_reclamo: payload.tipoReclamo || "reclamo",
    p_consumidor_nombre: payload.nombreCompleto.trim(),
    p_consumidor_tipo_doc: payload.tipoDoc || "DNI",
    p_consumidor_dni: payload.numDoc.trim(),
    p_consumidor_email: payload.email.trim().toLowerCase(),
    p_consumidor_telefono: (payload.telefono || "").trim(),
    p_consumidor_direccion: (payload.direccion || "").trim(),
    p_monto_reclamado: Number(payload.montoReclamado) || 0,
    p_descripcion_hechos: hechosCompletos.trim(),
    p_pedido_concreto: payload.pedidoConcreto.trim(),
    p_ip_hash: ipHashHex,
  });

  if (error) {
    console.error("[RPC ERROR]", error);
    return responder({ ok: false, error: error.message || "Error al registrar la reclamación en base de datos." }, 400);
  }

  const resultado = data as {
    ok?: boolean;
    id?: string;
    codigo?: string;
    fecha?: string;
  } | null;

  if (!resultado?.codigo) {
    return responder({ ok: false, error: "No se generó el correlativo de constancia." }, 500);
  }

  return responder({
    ok: true,
    id: resultado.id,
    codigo: resultado.codigo,
    fecha: resultado.fecha || new Date().toISOString(),
  });
});

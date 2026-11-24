import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CulqiChargePayload {
  token_id: string;
  amount: number;
  email: string;
  currency_code?: string;
  description?: string;
}

interface CulqiErrorResponse {
  object?: string;
  type?: string;
  merchant_message?: string;
  user_message?: string;
  message?: string;
}

interface CulqiSuccessResponse {
  id: string;
  amount: number;
  currency_code: string;
}

function responder(datos: Record<string, unknown>, status = 200): Response {
  return Response.json(datos, {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responder({ ok: false, error: "Método no permitido." }, 405);
  }

  // 1. Exigir cabecera de autenticación obligatoria
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return responder({ ok: false, error: "No autorizado. Se requiere token de sesión activo." }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[CULQI ERROR] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    return responder({ ok: false, error: "Error de configuración de Supabase en el servidor." }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 2. Validar sesión real con getUser(token) y forzar conductor_id = user.id
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return responder({ ok: false, error: "Sesión inválida o expirada." }, 401);
  }

  const conductorId = user.id;

  let payload: CulqiChargePayload;
  try {
    payload = await req.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "JSON inválido";
    return responder({ ok: false, error: `Cuerpo de solicitud inválido: ${msg}` }, 400);
  }

  const { token_id, amount, email } = payload;

  if (!token_id || typeof token_id !== "string" || !token_id.startsWith("tkn_")) {
    return responder({ ok: false, error: "Token de tarjeta Culqi inválido." }, 400);
  }

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return responder({ ok: false, error: "El monto debe ser un número positivo." }, 400);
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return responder({ ok: false, error: "Correo electrónico inválido para facturación Culqi." }, 400);
  }

  const culqiSecretKey = Deno.env.get("CULQI_SECRET_KEY");
  if (!culqiSecretKey) {
    console.error("[CULQI ERROR] Variable CULQI_SECRET_KEY ausente en el entorno del servidor.");
    return responder(
      { ok: false, error: "Error de configuración de pasarela de pagos en el servidor." },
      500
    );
  }

  const montoCentimos = Math.round(amount * 100);

  // 3. Generar clave de idempotencia UUID para Culqi
  const idempotencyKey = crypto.randomUUID();

  try {
    const culqiResponse = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${culqiSecretKey}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        amount: montoCentimos,
        currency_code: payload.currency_code || "PEN",
        email: email.trim().toLowerCase(),
        source_id: token_id,
        description: payload.description || "Recarga de saldo billetera Altokke Conductor",
      }),
    });

    const culqiData: unknown = await culqiResponse.json();

    if (!culqiResponse.ok) {
      const errData = culqiData as CulqiErrorResponse;
      const mensajeUsuario =
        errData.user_message ||
        errData.merchant_message ||
        errData.message ||
        "El cargo fue rechazado por el emisor de la tarjeta.";
      console.warn("[CULQI CARGO RECHAZADO]", culqiData);
      return responder({ ok: false, error: mensajeUsuario }, 400);
    }

    const chargeSuccess = culqiData as CulqiSuccessResponse;
    const chargeId = chargeSuccess.id;

    // 4. Acreditar saldo atómicamente en Supabase
    const { data: recargaData, error: recargaError } = await supabaseAdmin.rpc(
      "recargar_billetera_conductor",
      {
        p_conductor_id: conductorId,
        p_monto: amount,
        p_referencia_pago: chargeId,
        p_descripcion: payload.description || "Recarga con tarjeta (Culqi)",
      }
    );

    // 5. Devolver error 500 si falla la acreditación en base de datos
    if (recargaError) {
      console.error("[CULQI ERROR CRÍTICO RECONCILIACIÓN]", {
        evento: "CARGO_CULQI_SIN_ACREDITAR_EN_DB",
        charge_id: chargeId,
        conductor_id: conductorId,
        monto: amount,
        idempotency_key: idempotencyKey,
        error_db: recargaError.message,
        timestamp: new Date().toISOString(),
      });
      return responder({
        ok: false,
        error: `El cobro bancario fue procesado (${chargeId}), pero ocurrió un fallo al acreditar el saldo en la billetera. Ha sido registrado para conciliación de soporte.`,
        charge_id: chargeId,
      }, 500);
    }

    return responder({
      ok: true,
      charge_id: chargeId,
      recarga: recargaData,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido en el servidor de pagos";
    console.error("[ERROR SERVIDOR CULQI]", error);
    return responder({ ok: false, error: errorMsg }, 500);
  }
});

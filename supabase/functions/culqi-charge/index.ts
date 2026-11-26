import "jsr:@supabase/functions-js@^2.119.0/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  token_id?: unknown;
  amount?: unknown;
}

interface CulqiError {
  user_message?: string;
  merchant_message?: string;
  message?: string;
  code?: string;
}

interface CulqiCharge {
  id?: string;
  amount?: number;
  currency?: string;
  currency_code?: string;
}

function responder(
  datos: Record<string, unknown>,
  status = 200
): Response {
  return Response.json(datos, {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responder({ ok: false, error: "Método no permitido." }, 405);
  }

  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return responder({
      ok: false,
      error: "Se requiere una sesión autenticada.",
    }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const culqiSecretKey = Deno.env.get("CULQI_SECRET_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return responder({
      ok: false,
      error: "Configuración de Supabase incompleta.",
    }, 500);
  }

  // Impedir que se utilice accidentalmente una llave de producción.
  if (!culqiSecretKey?.startsWith("sk_test_")) {
    return responder({
      ok: false,
      error: "Se requiere una llave secreta de pruebas de Culqi.",
    }, 500);
  }

  let payload: Payload;

  try {
    payload = await req.json();
  } catch {
    return responder({
      ok: false,
      error: "El cuerpo de la solicitud no es válido.",
    }, 400);
  }

  const tokenId = payload.token_id;
  const amount = payload.amount;

  if (
    typeof tokenId !== "string" ||
    !tokenId.startsWith("tkn_test_")
  ) {
    return responder({
      ok: false,
      error: "Token de prueba de Culqi inválido.",
    }, 400);
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {
    return responder({
      ok: false,
      error: "Monto inválido.",
    }, 400);
  }

  const amountCents = Math.round(amount * 100);

  if (
    amount < 1 ||
    amount > 99999 ||
    !Number.isSafeInteger(amountCents) ||
    Math.abs(amount * 100 - amountCents) > 0.000001
  ) {
    return responder({
      ok: false,
      error: "El monto debe estar entre S/ 1.00 y S/ 99,999.00, con dos decimales como máximo.",
    }, 400);
  }

  try {
    // 1. Verificar la identidad real mediante JWT.
    const supabaseAuth = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const jwt = authorization.slice("Bearer ".length);

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(jwt);

    if (authError || !user) {
      return responder({
        ok: false,
        error: "La sesión no es válida o ha expirado.",
      }, 401);
    }

    // 2. Cliente administrativo exclusivo del servidor.
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // 3. Comprobar rol y aprobación del conductor.
    const [usuarioResult, perfilResult] = await Promise.all([
      supabaseAdmin
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle(),

      supabaseAdmin
        .from("conductores_perfil")
        .select("estado")
        .eq("usuario_id", user.id)
        .maybeSingle(),
    ]);

    if (
      usuarioResult.error ||
      perfilResult.error
    ) {
      return responder({
        ok: false,
        error: "No se pudo verificar el perfil del conductor.",
      }, 500);
    }

    if (
      usuarioResult.data?.rol !== "conductor" ||
      perfilResult.data?.estado !== "aprobado"
    ) {
      return responder({
        ok: false,
        error: "Solo los conductores aprobados pueden recargar su billetera.",
      }, 403);
    }

    if (!user.email) {
      return responder({
        ok: false,
        error: "La cuenta no tiene un correo electrónico válido.",
      }, 400);
    }

    // 4. Procesar el cargo con Culqi.
    const culqiResponse = await fetch(
      "https://api.culqi.com/v2/charges",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${culqiSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountCents,
          currency_code: "PEN",
          email: user.email,
          source_id: tokenId,
          capture: true,
          description: "Recarga de billetera ALTOKKE",
        }),
      }
    );

    const culqiData: unknown = await culqiResponse.json();

    if (!culqiResponse.ok) {
      const errorData = culqiData as CulqiError;

      return responder({
        ok: false,
        error:
          errorData.user_message ||
          errorData.merchant_message ||
          errorData.message ||
          "Culqi rechazó el pago.",
        code: errorData.code,
      }, 402);
    }

    const charge = culqiData as CulqiCharge;
    const chargeCurrency = charge.currency ?? charge.currency_code;

    if (
      !charge.id?.startsWith("chr_test_") ||
      Number(charge.amount) !== amountCents ||
      chargeCurrency !== "PEN"
    ) {
      return responder({
        ok: true,
        estado: "pago_aprobado_pendiente_acreditacion",
        charge_id: charge.id ?? null,
        mensaje:
          "No se pudo verificar completamente el cargo. No repitas el pago; se requiere revisión.",
      });
    }

    // 5. Acreditar el saldo mediante la RPC protegida.
    const { data: recarga, error: recargaError } =
      await supabaseAdmin.rpc(
        "recargar_billetera_conductor",
        {
          p_conductor_id: user.id,
          p_monto: amount,
          p_referencia_pago: charge.id,
          p_descripcion: "Recarga con tarjeta de prueba Culqi",
        }
      );

    if (recargaError) {
      console.error(
        "[CULQI] Cargo aprobado, error al acreditar saldo:",
        recargaError.message
      );

      return responder({
        ok: true,
        estado: "pago_aprobado_pendiente_acreditacion",
        charge_id: charge.id,
        mensaje:
          "El cargo fue aprobado, pero no se pudo actualizar el saldo. No vuelvas a realizar el pago.",
      });
    }

    return responder({
      ok: true,
      estado: "completado",
      charge_id: charge.id,
      recarga,
    });

  } catch (error: unknown) {
    console.error("[CULQI ERROR]", error);

    return responder({
      ok: false,
      error: "Ocurrió un error al procesar la recarga.",
    }, 500);
  }
});
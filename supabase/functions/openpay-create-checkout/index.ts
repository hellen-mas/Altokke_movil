
import "jsr:@supabase/functions-js@^2.119.0/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  amount?: unknown;
}

interface OpenpayCheckout {
  id?: string;
  order_id?: string;
  status?: string;
  checkout_link?: string;
}

function responder(
  data: Record<string, unknown>,
  status = 200,
) {
  return Response.json(data, {
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
  const merchantId = Deno.env.get("OPENPAY_MERCHANT_ID");
  const privateKey = Deno.env.get("OPENPAY_PRIVATE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey ||
      !merchantId || !privateKey?.startsWith("sk_")) {
    return responder({
      ok: false,
      error: "Configuración del servidor incompleta.",
    }, 500);
  }

  let payload: Payload;

  try {
    payload = await req.json();
  } catch {
    return responder({ ok: false, error: "JSON inválido." }, 400);
  }

  const amount = payload.amount;

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < 1 ||
    amount > 99999 ||
    Math.round(amount * 100) / 100 !== amount
  ) {
    return responder({
      ok: false,
      error: "Monto de recarga inválido.",
    }, 400);
  }

  try {
    // 1. Verificar sesión.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const jwt = authorization.slice("Bearer ".length);

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(jwt);

    if (authError || !user) {
      return responder({
        ok: false,
        error: "Sesión inválida o expirada.",
      }, 401);
    }

    // 2. Cliente administrativo.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 3. Verificar conductor y recuperar sus datos.
    const [usuarioResult, perfilResult] = await Promise.all([
      admin
        .from("usuarios")
        .select("rol,nombre,apellidos,telefono,estado_cuenta")
        .eq("id", user.id)
        .maybeSingle(),

      admin
        .from("conductores_perfil")
        .select("estado")
        .eq("usuario_id", user.id)
        .maybeSingle(),
    ]);

    if (usuarioResult.error || perfilResult.error) {
      return responder({
        ok: false,
        error: "No se pudo verificar el conductor.",
      }, 500);
    }

    const usuario = usuarioResult.data;

    if (
      usuario?.rol !== "conductor" ||
      usuario.estado_cuenta !== "activo" ||
      perfilResult.data?.estado !== "aprobado"
    ) {
      return responder({
        ok: false,
        error: "Solo los conductores aprobados pueden recargar.",
      }, 403);
    }

    if (
      !user.email ||
      !usuario.nombre ||
      !usuario.apellidos ||
      !usuario.telefono
    ) {
      return responder({
        ok: false,
        error: "Faltan datos del conductor.",
      }, 400);
    }

    // 4. Crear identificador único de orden.
    const orderId = `ALT-${crypto.randomUUID()}`;

    // 5. Registrar intento pendiente en PostgreSQL.
    const { data: intento, error: intentoError } =
      await admin.rpc("crear_intento_recarga_openpay", {
        p_conductor_id: user.id,
        p_monto: amount,
        p_order_id: orderId,
      });

    if (intentoError || !intento?.ok) {
      console.error("[OPENPAY CHECKOUT]", intentoError?.message);

      return responder({
        ok: false,
        error: "No se pudo registrar el intento de recarga.",
      }, 500);
    }

    // 6. Preparar URL de retorno HTTPS.
    const redirectUrl = new URL(
      "/functions/v1/openpay-return",
      supabaseUrl,
    );

    redirectUrl.searchParams.set("order_id", orderId);

    // 7. Crear Checkout hospedado en Openpay Sandbox.
    const basicAuth = btoa(`${privateKey}:`);

    let checkoutResponse: Response;

    try {
      checkoutResponse = await fetch(
        `https://sandbox-api.openpay.pe/v1/${merchantId}/checkouts`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: "PEN",
            description: "Recarga de billetera ALTOKKE",
            order_id: orderId,
            redirect_url: redirectUrl.toString(),
            send_email: false,
            customer: {
              name: usuario.nombre,
              last_name: usuario.apellidos,
              phone_number: usuario.telefono.replace(/\D/g, ""),
              email: user.email,
            },
          }),
        },
      );
    } catch (error) {
      console.error("[OPENPAY NETWORK]", error);

      // El resultado es desconocido. No crear otro intento
      // ni marcarlo como fallido automáticamente.
      return responder({
        ok: true,
        estado: "pendiente",
        order_id: orderId,
        mensaje: "No se pudo confirmar la creación del Checkout. No repitas la solicitud.",
      }, 202);
    }

    const checkoutData: unknown = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error(
        "[OPENPAY API]",
        checkoutResponse.status,
        checkoutData,
      );

      if (checkoutResponse.status >= 500) {
        return responder({
          ok: true,
          estado: "pendiente",
          order_id: orderId,
          mensaje: "Openpay no confirmó la operación. Requiere conciliación.",
        }, 202);
      }

      await admin.rpc("fallar_intento_recarga_openpay", {
        p_conductor_id: user.id,
        p_order_id: orderId,
      });

      return responder({
        ok: false,
        estado: "fallido",
        error: "Openpay no pudo generar el enlace de pago.",
      }, 502);
    }

    const checkout = checkoutData as OpenpayCheckout;

    // 8. Validar la respuesta.
    let checkoutUrl: URL;

    try {
      checkoutUrl = new URL(checkout.checkout_link ?? "");
    } catch {
      return responder({
        ok: true,
        estado: "pendiente",
        order_id: orderId,
        mensaje: "Openpay no devolvió un enlace válido. Requiere revisión.",
      }, 202);
    }

    if (
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "sandbox-api.openpay.pe" ||
      checkout.order_id !== orderId ||
      checkout.status !== "available"
    ) {
      return responder({
        ok: true,
        estado: "pendiente",
        order_id: orderId,
        mensaje: "El Checkout requiere verificación.",
      }, 202);
    }

    return responder({
      ok: true,
      estado: "checkout_creado",
      order_id: orderId,
      checkout_id: checkout.id,
      checkout_link: checkoutUrl.toString(),
      monto: amount,
      moneda: "PEN",
    }, 201);

  } catch (error) {
    console.error("[OPENPAY CHECKOUT ERROR]", error);

    return responder({
      ok: false,
      error: "Error interno al crear el Checkout.",
    }, 500);
  }
});

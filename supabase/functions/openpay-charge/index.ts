
import "jsr:@supabase/functions-js@^2.119.0/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  token_id?: unknown;
  amount?: unknown;
  order_id?: unknown;
  device_session_id?: unknown;
}

interface OpenpayCharge {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  error_message?: string | null;
}

interface OpenpayError {
  error_code?: number;
  description?: string;
  category?: string;
  http_code?: number;
  error_message?: string;
}

function responder(
  datos: Record<string, unknown>,
  status = 200,
): Response {
  return Response.json(datos, {
    status,
    headers: corsHeaders,
  });
}

function validarMonto(monto: unknown): monto is number {
  if (typeof monto !== "number" || !Number.isFinite(monto)) {
    return false;
  }

  return (
    monto >= 1 &&
    monto <= 99999 &&
    Math.round(monto * 100) / 100 === monto
  );
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

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return responder({
      ok: false,
      error: "Configuración de Supabase incompleta.",
    }, 500);
  }

  if (
    !merchantId ||
    !privateKey?.startsWith("sk_")
  ) {
    return responder({
      ok: false,
      error: "Configuración de Openpay incompleta.",
    }, 500);
  }

  let payload: Payload;

  try {
    payload = await req.json();
  } catch {
    return responder({
      ok: false,
      error: "Solicitud JSON inválida.",
    }, 400);
  }

  const { token_id, amount, order_id, device_session_id } = payload;

  if (
    typeof token_id !== "string" ||
    token_id.length < 10 ||
    token_id.length > 45
  ) {
    return responder({
      ok: false,
      error: "Token de Openpay inválido.",
    }, 400);
  }

  if (!validarMonto(amount)) {
    return responder({
      ok: false,
      error: "El monto debe estar entre S/ 1.00 y S/ 99,999.00.",
    }, 400);
  }

  if (
    typeof order_id !== "string" ||
    !/^[A-Za-z0-9_-]{10,100}$/.test(order_id)
  ) {
    return responder({
      ok: false,
      error: "Identificador de orden inválido.",
    }, 400);
  }

  if (
    typeof device_session_id !== "string" ||
    device_session_id.length !== 32
  ) {
    return responder({
      ok: false,
      error: "Identificador de dispositivo inválido.",
    }, 400);
  }

  // Openpay exige la IP del dispositivo para sus controles antifraude.
  // Se utiliza la IP recibida por el gateway, no una IP enviada en el JSON.
  const deviceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim();

  if (!deviceIp) {
    return responder({
      ok: false,
      error: "No se pudo obtener la IP del dispositivo.",
    }, 400);
  }

  try {
    // 1. Validar la sesión del conductor.
    const supabaseAuth = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
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

    // 2. Cliente administrativo del servidor.
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    // 3. Verificar rol, estado y datos del conductor.
    const [usuarioResult, perfilResult] = await Promise.all([
      supabaseAdmin
        .from("usuarios")
        .select("rol, nombre, apellidos, telefono, estado_cuenta")
        .eq("id", user.id)
        .maybeSingle(),

      supabaseAdmin
        .from("conductores_perfil")
        .select("estado")
        .eq("usuario_id", user.id)
        .maybeSingle(),
    ]);

    if (usuarioResult.error || perfilResult.error) {
      return responder({
        ok: false,
        error: "No se pudo verificar el perfil del conductor.",
      }, 500);
    }

    const usuario = usuarioResult.data;
    const perfil = perfilResult.data;

    if (
      usuario?.rol !== "conductor" ||
      usuario.estado_cuenta !== "activo" ||
      String(perfil?.estado) !== "aprobado"
    ) {
      return responder({
        ok: false,
        error: "El conductor no está autorizado para recargar.",
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
        error: "Faltan datos del conductor para procesar el pago.",
      }, 400);
    }

    const telefono = usuario.telefono.replace(/\D/g, "");

    if (telefono.length < 7 || telefono.length > 15) {
      return responder({
        ok: false,
        error: "El teléfono registrado no es válido.",
      }, 400);
    }

    // 4. Registrar el intento antes de llamar a Openpay.
    const { data: intento, error: intentoError } =
      await supabaseAdmin.rpc(
        "crear_intento_recarga_openpay",
        {
          p_conductor_id: user.id,
          p_monto: amount,
          p_order_id: order_id,
        },
      );

    if (intentoError || !intento?.ok) {
      console.error("[OPENPAY] Error registrando intento:", intentoError?.message);

      return responder({
        ok: false,
        error: "No se pudo registrar el intento de recarga.",
      }, 500);
    }

    // 5. Configurar autenticación Basic.
    const baseUrl =
      `https://sandbox-api.openpay.pe/v1/${merchantId}`;

    const authBasic = `Basic ${btoa(`${privateKey}:`)}`;

    const headers = {
      Authorization: authBasic,
      "Content-Type": "application/json",
      "X-Forwarded-For": deviceIp,
    };

    // Consultar una orden previamente registrada.
    const consultarCargo = async (): Promise<OpenpayCharge | null> => {
      const response = await fetch(
        `${baseUrl}/charges?order_id=${encodeURIComponent(order_id)}&limit=10`,
        {
          method: "GET",
          headers,
        },
      );

      if (!response.ok) return null;

      const data: unknown = await response.json();

      if (!Array.isArray(data)) return null;

      return (
        data.find(
          (item: OpenpayCharge) => item.order_id === order_id,
        ) ?? null
      );
    };

    let cargo: OpenpayCharge | null = null;

    // Si la orden ya existe, jamás volvemos a enviar otro cargo
    // sin comprobar primero su estado en Openpay.
    if (intento.duplicada === true) {
      if (intento.estado === "completado") {
        return responder({
          ok: true,
          estado: "completado",
          duplicada: true,
          mensaje: "Esta recarga ya fue acreditada.",
        });
      }

      if (intento.estado === "fallido") {
        return responder({
          ok: false,
          estado: "fallido",
          error: "Este intento de recarga ya fue rechazado.",
        }, 402);
      }

      try {
        cargo = await consultarCargo();
      } catch {
        return responder({
          ok: true,
          estado: "pendiente",
          mensaje: "No se pudo verificar todavía el cargo anterior.",
        });
      }

      if (!cargo) {
        return responder({
          ok: true,
          estado: "pendiente",
          mensaje: "La orden sigue pendiente de conciliación. No repitas el pago.",
        });
      }
    } else {
      // 6. Procesar el cargo en Openpay.
      try {
        const chargeResponse = await fetch(
          `${baseUrl}/charges`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              source_id: token_id,
              method: "card",
              amount: Number(amount.toFixed(2)),
              currency: "PEN",
              description: "Recarga de billetera ALTOKKE",
              order_id,
              device_session_id,
              customer: {
                name: usuario.nombre,
                last_name: usuario.apellidos,
                phone_number: telefono,
                email: user.email,
              },
            }),
          },
        );

        const chargeData: unknown = await chargeResponse.json();

        if (chargeResponse.ok) {
          cargo = chargeData as OpenpayCharge;
        } else {
          const errorData = chargeData as OpenpayError;

          // Consultar si Openpay llegó a registrar la orden.
          cargo = await consultarCargo();

          if (!cargo) {
            // No marcar como fallido cuando el resultado puede
            // ser desconocido o requerir reintento técnico.
            if (
              chargeResponse.status >= 500 ||
              chargeResponse.status === 409 ||
              chargeResponse.status === 429
            ) {
              return responder({
                ok: true,
                estado: "pendiente",
                order_id,
                mensaje: "No se pudo confirmar el resultado. No repitas el pago.",
              });
            }

            await supabaseAdmin.rpc(
              "fallar_intento_recarga_openpay",
              {
                p_conductor_id: user.id,
                p_order_id: order_id,
              },
            );

            return responder({
              ok: false,
              estado: "fallido",
              error:
                errorData.description ||
                "Openpay rechazó el pago.",
              codigo: errorData.error_code,
            }, 402);
          }
        }
      } catch (networkError) {
        console.error("[OPENPAY] Error de comunicación:", networkError);

        // Una interrupción no significa que el cargo no se haya realizado.
        try {
          cargo = await consultarCargo();
        } catch {
          return responder({
            ok: true,
            estado: "pendiente",
            order_id,
            mensaje: "No se pudo confirmar el resultado. No repitas el pago.",
          });
        }

        if (!cargo) {
          return responder({
            ok: true,
            estado: "pendiente",
            order_id,
            mensaje: "El cargo requiere conciliación antes de volver a intentar.",
          });
        }
      }
    }

    if (!cargo) {
      return responder({
        ok: true,
        estado: "pendiente",
        order_id,
        mensaje: "La operación todavía no tiene un resultado confirmado.",
      });
    }

    // 7. Verificar la respuesta del proveedor.
    const estadoCargo = cargo.status?.toLowerCase();

    if (
      cargo.order_id !== order_id ||
      Number(cargo.amount) !== Number(amount) ||
      cargo.currency !== "PEN" ||
      !cargo.id
    ) {
      console.error("[OPENPAY] Respuesta no coincidente:", {
        order_id,
        cargo_id: cargo.id,
        estado: estadoCargo,
      });

      return responder({
        ok: true,
        estado: "revision_pendiente",
        order_id,
        mensaje: "El cargo requiere verificación manual. No repitas el pago.",
      });
    }

    if (estadoCargo === "failed") {
      const { error: falloError } = await supabaseAdmin.rpc(
        "fallar_intento_recarga_openpay",
        {
          p_conductor_id: user.id,
          p_order_id: order_id,
        },
      );

      if (falloError) {
        console.error("[OPENPAY] Error registrando rechazo:", falloError.message);
      }

      return responder({
        ok: false,
        estado: "fallido",
        error: cargo.error_message || "Openpay rechazó la tarjeta.",
      }, 402);
    }

    if (estadoCargo !== "completed") {
      return responder({
        ok: true,
        estado: "pendiente",
        order_id,
        mensaje: "Openpay todavía está procesando la operación.",
      });
    }

    // 8. Acreditar el saldo únicamente después de confirmar el cargo.
    const { data: recarga, error: recargaError } =
      await supabaseAdmin.rpc(
        "confirmar_recarga_openpay",
        {
          p_conductor_id: user.id,
          p_monto: amount,
          p_order_id: order_id,
          p_charge_id: cargo.id,
        },
      );

    if (recargaError) {
      console.error(
        "[OPENPAY] Cargo aprobado, error de acreditación:",
        recargaError.message,
      );

      return responder({
        ok: true,
        estado: "pago_aprobado_pendiente_acreditacion",
        order_id,
        charge_id: cargo.id,
        mensaje: "El pago fue aprobado, pero la acreditación requiere revisión. No repitas el pago.",
      });
    }

    return responder({
      ok: true,
      estado: "completado",
      order_id,
      charge_id: cargo.id,
      recarga,
    });

  } catch (error: unknown) {
    console.error("[OPENPAY ERROR]", error);

    return responder({
      ok: false,
      error: "Ocurrió un error interno al procesar la recarga.",
    }, 500);
  }
});

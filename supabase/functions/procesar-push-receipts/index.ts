
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface ReciboPendiente {
  id: string;
  ticket_id: string;
  usuario_id: string;
  push_token_id: string | null;
}

interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

const EXPO_RECEIPTS_URL =
  "https://exp.host/--/api/v2/push/getReceipts";

const TAMANO_LOTE = 1000;
const ANTIGUEDAD_MINIMA_MS = 15 * 60 * 1000;
const ANTIGUEDAD_MAXIMA_MS = 24 * 60 * 60 * 1000;

const responder = (data: unknown, status = 200) =>
  Response.json(data, { status });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return responder({ error: "Método no permitido" }, 405);
  }

  try {
    // 1. Validar acceso exclusivo del backend.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan las credenciales de Supabase.");
    }

    if (
      req.headers.get("Authorization") !==
      `Bearer ${serviceRoleKey}`
    ) {
      return responder({ error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // 2. Calcular los límites de consulta.
    const ahora = Date.now();

    const fechaDisponible = new Date(
      ahora - ANTIGUEDAD_MINIMA_MS
    ).toISOString();

    const fechaVencimiento = new Date(
      ahora - ANTIGUEDAD_MAXIMA_MS
    ).toISOString();

    // 3. Marcar recibos que superaron las 24 horas.
    const { data: vencidos, error: errorVencidos } =
      await supabaseAdmin
        .from("push_receipts")
        .select("id")
        .eq("estado", "pendiente")
        .lt("creado_en", fechaVencimiento)
        .limit(TAMANO_LOTE);

    if (errorVencidos) {
      throw new Error(
        `Error consultando recibos vencidos: ${errorVencidos.message}`
      );
    }

    let recibosVencidos = 0;

    if (vencidos && vencidos.length > 0) {
      const { error } = await supabaseAdmin
        .from("push_receipts")
        .update({
          estado: "error",
          codigo_error: "ReceiptExpired",
          mensaje_error:
            "El recibo no pudo consultarse dentro del periodo de disponibilidad de Expo.",
          consultado_en: new Date().toISOString(),
        })
        .in("id", vencidos.map((r) => r.id));

      if (error) {
        throw new Error(
          `Error actualizando recibos vencidos: ${error.message}`
        );
      }

      recibosVencidos = vencidos.length;
    }

    // 4. Obtener recibos pendientes que ya pueden consultarse.
    const { data: pendientes, error: errorPendientes } =
      await supabaseAdmin
        .from("push_receipts")
        .select(
          "id, ticket_id, usuario_id, push_token_id"
        )
        .eq("estado", "pendiente")
        .lte("creado_en", fechaDisponible)
        .gte("creado_en", fechaVencimiento)
        .order("creado_en", { ascending: true })
        .limit(TAMANO_LOTE);

    if (errorPendientes) {
      throw new Error(
        `Error consultando recibos pendientes: ${errorPendientes.message}`
      );
    }

    const recibos = (pendientes ?? []) as ReciboPendiente[];

    if (recibos.length === 0) {
      return responder({
        ok: true,
        mensaje: "No hay recibos pendientes para consultar.",
        consultados: 0,
        vencidos: recibosVencidos,
      });
    }

    // 5. Preparar autenticación de Expo.
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (expoAccessToken) {
      headers.Authorization = `Bearer ${expoAccessToken}`;
    }

    let actualizados = 0;
    let errores = 0;
    let sinRecibo = 0;

    const tokensInvalidos = new Set<string>();

    // 6. Consultar los recibos por lotes.
    for (
      let inicio = 0;
      inicio < recibos.length;
      inicio += TAMANO_LOTE
    ) {
      const lote = recibos.slice(
        inicio,
        inicio + TAMANO_LOTE
      );

      const respuesta = await fetch(EXPO_RECEIPTS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ids: lote.map((r) => r.ticket_id),
        }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text();

        throw new Error(
          `Error consultando Expo Receipts: HTTP ${respuesta.status}: ${detalle.slice(0, 500)}`
        );
      }

      const resultado = await respuesta.json() as {
        data?: Record<string, ExpoPushReceipt>;
      };

      if (!resultado.data) {
        throw new Error(
          "Expo no devolvió los recibos esperados."
        );
      }

      // 7. Procesar cada respuesta.
      const actualizaciones: PromiseLike<unknown>[] = [];

      for (const registro of lote) {
        const recibo = resultado.data[registro.ticket_id];

        // Expo todavía no tiene disponible el recibo.
        if (!recibo) {
          sinRecibo++;
          continue;
        }

        if (recibo.status === "ok") {
          actualizaciones.push(
            supabaseAdmin
              .from("push_receipts")
              .update({
                estado: "ok",
                codigo_error: null,
                mensaje_error: null,
                consultado_en: new Date().toISOString(),
              })
              .eq("id", registro.id)
          );

          actualizados++;
          continue;
        }

        const codigoError =
          recibo.details?.error ?? "UnknownError";

        actualizaciones.push(
          supabaseAdmin
            .from("push_receipts")
            .update({
              estado: "error",
              codigo_error: codigoError,
              mensaje_error:
                recibo.message ?? "Error de entrega informado por Expo.",
              consultado_en: new Date().toISOString(),
            })
            .eq("id", registro.id)
        );

        errores++;

        if (
          codigoError === "DeviceNotRegistered" &&
          registro.push_token_id
        ) {
          tokensInvalidos.add(registro.push_token_id);
        }
      }

      // 8. Ejecutar actualizaciones en grupos pequeños.
      for (
        let i = 0;
        i < actualizaciones.length;
        i += 50
      ) {
        const resultados = await Promise.all(
          actualizaciones.slice(i, i + 50)
        );

        for (const resultado of resultados) {
          const operacion = resultado as {
            error?: { message: string } | null;
          };

          if (operacion.error) {
            throw new Error(
              `Error actualizando un recibo: ${operacion.error.message}`
            );
          }
        }
      }
    }

    // 9. Eliminar dispositivos definitivamente inválidos.
    let tokensEliminados = 0;

    for (const tokenId of tokensInvalidos) {
      const { error } = await supabaseAdmin
        .from("push_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) {
        console.warn(
          "No se pudo eliminar un dispositivo inválido:",
          error.message
        );
      } else {
        tokensEliminados++;
      }
    }

    // 10. Resumen de ejecución.
    return responder({
      ok: true,
      consultados: recibos.length,
      actualizados,
      errores,
      sin_recibo_disponible: sinRecibo,
      recibos_vencidos: recibosVencidos,
      tokens_eliminados: tokensEliminados,
    });

  } catch (error: unknown) {
    console.error(
      "Error en procesar-push-receipts:",
      error
    );

    return responder({
      error: error instanceof Error
        ? error.message
        : "Error interno del servidor",
    }, 500);
  }
});

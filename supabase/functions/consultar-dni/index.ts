// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const respuestaJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: corsHeaders })

const aTitulo = (str: string) =>
  str.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase())

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return respuestaJson({ error: 'Método no permitido' }, 405)
  }

  try {
    const { dni } = await req.json().catch(() => ({}))
    const dniLimpio = String(dni || '').trim()

    if (!/^\d{8}$/.test(dniLimpio)) {
      return respuestaJson({ error: 'El DNI debe contener exactamente 8 dígitos numéricos.' }, 400)
    }

    const token = Deno.env.get('DNI_API_TOKEN')?.trim()
    if (!token) {
      return respuestaJson({ error: 'Servicio de validación no disponible temporalmente.' }, 503)
    }

    const apiRes = await fetch('https://api.apiperu.dev/dni', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ dni: dniLimpio }),
      signal: AbortSignal.timeout(8000),
    })

    const data = await apiRes.json().catch(() => null)

    if (!apiRes.ok || !data?.success || !data?.data) {
      return respuestaJson({ error: 'No se encontraron datos registrados para este DNI.' }, 404)
    }

    const { nombres = '', apellido_paterno = '', apellido_materno = '' } = data.data

    return respuestaJson({
      ok: true,
      nombres: aTitulo(nombres.trim()),
      apellidos: aTitulo([apellido_paterno, apellido_materno].filter(Boolean).join(' ').trim()),
    })
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return respuestaJson({ error: 'La consulta de DNI tardó más de lo esperado.' }, 504)
    }

    return respuestaJson({ error: 'Error interno al consultar el documento de identidad.' }, 500)
  }
})

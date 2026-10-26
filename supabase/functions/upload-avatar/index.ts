// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const respuestaJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: corsHeaders })

/**
 * Convierte Base64 a Uint8Array de forma nativa y eficiente
 */
function base64ABytes(base64: string): Uint8Array {
  const limpio = base64.replace(/^data:image\/\w+;base64,/, '')
  const binario = atob(limpio)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i)
  }
  return bytes
}

/**
 * Consulta la moderación en Sightengine y determina si la imagen es apta
 */
async function validarContenidoImagen(file: File, user: string, secret: string): Promise<boolean> {
  const form = new FormData()
  form.append('media', file)
  form.append('models', 'nudity-2.0,wad')
  form.append('api_user', user)
  form.append('api_secret', secret)

  const res = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(9000),
  })

  if (!res.ok) {
    throw new Error('FALLO_MODERACION')
  }

  const data = await res.json()
  if (data.status === 'failure') {
    throw new Error('FALLO_MODERACION')
  }

  const sinDesnudez = typeof data.nudity?.none === 'number' ? data.nudity.none : 1
  const armas = typeof data.weapon === 'number' ? data.weapon : 0
  const drogas = typeof data.drugs === 'number' ? data.drugs : 0

  return sinDesnudez >= 0.4 && armas <= 0.6 && drogas <= 0.6
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let file: File | null = null
    let userId: string | null = null
    let validateOnly = false
    let mimeType = 'image/jpeg'

    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}))
      userId = json.userId || null
      validateOnly = Boolean(json.validateOnly)
      mimeType = json.mimeType || 'image/jpeg'
      const ext = mimeType.split('/')[1] || 'jpg'

      if (json.base64) {
        file = new File([base64ABytes(json.base64)], `${userId || 'temp'}-${Date.now()}.${ext}`, { type: mimeType })
      }
    } else {
      const form = await req.formData()
      file = form.get('file') as File | null
      userId = form.get('userId') as string | null
      validateOnly = form.get('validateOnly') === 'true'
      mimeType = file?.type || 'image/jpeg'
    }

    if (!file || (!validateOnly && !userId)) {
      return respuestaJson({ error: 'Faltan datos requeridos (imagen o id de usuario).' }, 400)
    }

    // 1. Verificación de credenciales de moderación
    const apiUser = Deno.env.get('SIGHTENGINE_USER')
    const apiSecret = Deno.env.get('SIGHTENGINE_SECRET')
    if (!apiUser || !apiSecret) {
      return respuestaJson({ error: 'Servicio de validación no disponible temporalmente.' }, 503)
    }

    // 2. Validación de contenido con Sightengine
    try {
      const esApta = await validarContenidoImagen(file, apiUser, apiSecret)
      if (!esApta) {
        return respuestaJson({
          error: 'La foto seleccionada contiene material no permitido (desnudez, armas o drogas).'
        }, 400)
      }
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        return respuestaJson({ error: 'La validación de la imagen tardó demasiado tiempo.' }, 504)
      }
      return respuestaJson({ error: 'No se pudo verificar la imagen en este momento.' }, 502)
    }

    if (validateOnly) {
      return respuestaJson({ ok: true, valid: true, message: 'Foto verificada y permitida' })
    }

    // 3. Persistencia en Supabase Storage y Base de Datos
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const nombreArchivo = `${userId}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(nombreArchivo, file, { contentType: mimeType, upsert: true })

    if (uploadError) {
      return respuestaJson({ error: 'No se pudo guardar la imagen de perfil.' }, 500)
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(nombreArchivo)

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .update({ avatar_url: publicUrl, foto_url: publicUrl })
      .eq('id', userId)

    if (dbError) {
      return respuestaJson({ error: 'No se pudo actualizar el perfil del usuario.' }, 500)
    }

    return respuestaJson({ url: publicUrl, message: 'Avatar actualizado con éxito' })
  } catch {
    return respuestaJson({ error: 'Error interno al procesar el avatar.' }, 500)
  }
})
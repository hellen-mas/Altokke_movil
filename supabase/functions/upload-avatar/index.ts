// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Manejo de peticiones preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let file: File | null = null
    let userId: string | null = null
    let fileName: string = ''
    let mimeType: string = 'image/jpeg'
    let validateOnly: boolean = false

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const jsonBody = await req.json()
      userId = jsonBody.userId || null
      validateOnly = Boolean(jsonBody.validateOnly)
      const base64Data = jsonBody.base64 || ''
      mimeType = jsonBody.mimeType || 'image/jpeg'
      const ext = mimeType.split('/')[1] || 'jpg'
      fileName = `${userId || 'temp'}-${Date.now()}.${ext}`

      if (base64Data) {
        const pureBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
        const binaryString = atob(pureBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        file = new File([bytes], fileName, { type: mimeType })
      }
    } else {
      const formData = await req.formData()
      file = formData.get('file') as File | null
      userId = formData.get('userId') as string | null
      validateOnly = formData.get('validateOnly') === 'true'
      const ext = file?.name?.split('.').pop()?.toLowerCase() || 'jpg'
      fileName = `${userId || 'temp'}-${Date.now()}.${ext}`
      mimeType = file?.type || 'image/jpeg'
    }

    if (!file || (!validateOnly && !userId)) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos (imagen o id de usuario)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. Validar la imagen con la API de Sightengine usando los Secretos de Supabase
    const apiUser = Deno.env.get('SIGHTENGINE_USER')
    const apiSecret = Deno.env.get('SIGHTENGINE_SECRET')

    if (!apiUser || !apiSecret) {
      console.error('Faltan los secretos SIGHTENGINE_USER y SIGHTENGINE_SECRET en Supabase.')
      return new Response(
        JSON.stringify({ error: 'El servicio de moderación de imágenes no está configurado.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const sightengineForm = new FormData()
    sightengineForm.append('media', file)
    sightengineForm.append('models', 'nudity-2.0,wad')
    sightengineForm.append('api_user', apiUser)
    sightengineForm.append('api_secret', apiSecret)

    try {
      const moderationRes = await fetch('https://api.sightengine.com/1.0/check.json', {
        method: 'POST',
        body: sightengineForm,
      })
      const moderationData = await moderationRes.json()

      if (moderationData.status === 'failure') {
        console.warn('Aviso de Sightengine:', moderationData.error?.message)
      } else {
        const nudityNone = typeof moderationData.nudity?.none === 'number' ? moderationData.nudity.none : 1
        const weaponScore = typeof moderationData.weapon === 'number' ? moderationData.weapon : 0
        const drugsScore = typeof moderationData.drugs === 'number' ? moderationData.drugs : 0

        const isNsfw = nudityNone < 0.4 || weaponScore > 0.6 || drugsScore > 0.6

        if (isNsfw) {
          return new Response(
            JSON.stringify({ error: 'La foto seleccionada contiene material no permitido (desnudez, armas o drogas).' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
    } catch (modErr) {
      console.warn('Error al conectar con Sightengine:', modErr)
    }

    // Si solo es validación previa al registro, respondemos exitosamente sin guardar en BD ni Storage
    if (validateOnly) {
      return new Response(
        JSON.stringify({ ok: true, valid: true, message: 'Foto verificada y permitida' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Conectar a Supabase usando permisos de servicio administrativo
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Subir el archivo al bucket de avatars
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, { 
        contentType: mimeType,
        upsert: true 
      })

    if (uploadError) {
      console.error('Error al subir a storage:', uploadError)
      throw new Error(`Error en almacenamiento: ${uploadError.message}`)
    }

    // 4. Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName)

    // 5. Actualizar la tabla public.usuarios con la nueva foto
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .update({ 
        avatar_url: publicUrl,
        foto_url: publicUrl 
      })
      .eq('id', userId)

    if (dbError) {
      console.error('Error al actualizar base de datos:', dbError)
      throw new Error(`Error en base de datos: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({ url: publicUrl, message: 'Avatar actualizado con éxito' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error en upload-avatar:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Error inesperado al procesar el avatar' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
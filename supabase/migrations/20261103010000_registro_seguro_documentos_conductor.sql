
-- Evita registros simultáneos del mismo documento.
-- Conserva todos los documentos históricos existentes.
CREATE OR REPLACE FUNCTION public.registrar_documento_conductor(
  p_tipo public.tipo_documento,
  p_ruta text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_usuario uuid := auth.uid();
  v_documento_id uuid;
  v_estado public.estado_verificacion;
BEGIN
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conductores_perfil
    WHERE usuario_id = v_usuario
      AND estado = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'La solicitud no permite registrar documentos';
  END IF;

  IF p_tipo::text NOT IN (
    'DNI_FRONTAL',
    'DNI_POSTERIOR',
    'SELFIE',
    'LICENCIA',
    'SOAT',
    'ANTECEDENTES'
  ) THEN
    RAISE EXCEPTION 'Tipo de documento no permitido';
  END IF;

  IF p_ruta IS NULL
     OR p_ruta NOT LIKE v_usuario::text || '/%'
     OR position('..' IN p_ruta) > 0 THEN
    RAISE EXCEPTION 'Ruta de documento no autorizada';
  END IF;

  -- Solo aceptar archivos que ya existen en el bucket privado.
  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'documentos-conductores'
      AND name = p_ruta
  ) THEN
    RAISE EXCEPTION 'Archivo no encontrado en Storage';
  END IF;

  -- Serializar los intentos del mismo usuario y tipo.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_usuario::text || ':' || p_tipo::text,
      0
    )
  );

  SELECT id, estado
  INTO v_documento_id, v_estado
  FROM public.documentos
  WHERE usuario_id = v_usuario
    AND tipo = p_tipo
  ORDER BY fecha_subida DESC, id DESC
  LIMIT 1
  FOR UPDATE;

  IF v_documento_id IS NULL THEN
    INSERT INTO public.documentos (
      usuario_id, tipo, url_archivo, estado
    )
    VALUES (
      v_usuario, p_tipo, p_ruta, 'pendiente'
    );

  ELSIF v_estado = 'rechazado' THEN
    UPDATE public.documentos
    SET
      url_archivo = p_ruta,
      estado = 'pendiente',
      motivo_rechazo = NULL,
      fecha_subida = now()
    WHERE id = v_documento_id;

  ELSIF v_estado IN ('pendiente', 'aprobado') THEN
    RETURN;

  ELSE
    RAISE EXCEPTION 'El documento no admite cambios';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_documento_conductor(
  public.tipo_documento, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.registrar_documento_conductor(
  public.tipo_documento, text
) TO authenticated;

-- Migración: Registro de soporte para incidentes y soporte de etiquetas en calificaciones
-- Fecha: 2026-11-23

-- 1. Soporte de etiquetas en calificaciones de viaje
ALTER TABLE public.calificaciones ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';

-- Actualizar permisos de inserción en calificaciones
GRANT INSERT(viaje_id, autor_id, receptor_id, puntuacion, comentario, etiquetas)
  ON public.calificaciones TO authenticated;

-- 2. Función RPC para reportar incidentes de soporte
CREATE OR REPLACE FUNCTION public.reportar_incidente(
  p_tipo TEXT,
  p_descripcion TEXT,
  p_viaje_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_usuario_id UUID := auth.uid();
  v_log_id UUID;
BEGIN
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_tipo IS NULL OR LENGTH(TRIM(p_tipo)) = 0 THEN
    RAISE EXCEPTION 'El tipo de incidente es obligatorio';
  END IF;

  IF p_descripcion IS NULL OR LENGTH(TRIM(p_descripcion)) < 5 THEN
    RAISE EXCEPTION 'La descripción del incidente debe contener al menos 5 caracteres';
  END IF;

  INSERT INTO public.auditoria_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  )
  VALUES (
    v_usuario_id,
    'INCIDENTE_REPORTADO',
    'soporte_incidentes',
    p_viaje_id,
    jsonb_build_object(
      'tipo', p_tipo,
      'descripcion', p_descripcion,
      'viaje_id', p_viaje_id,
      'reportado_en', timezone('utc'::text, now())
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;

REVOKE ALL ON FUNCTION public.reportar_incidente(TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reportar_incidente(TEXT, TEXT, UUID) TO authenticated, service_role;

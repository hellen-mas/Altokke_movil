
-- =============================================================================
-- MIGRACIÓN: Corregir anonimización del correo electrónico
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.eliminar_mi_cuenta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID := auth.uid();
  v_correo_interno TEXT;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión.';
  END IF;

  PERFORM 1
  FROM public.usuarios
  WHERE id = v_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.viajes
    WHERE (
      pasajero_id = v_id
      OR conductor_id = v_id
    )
    AND estado IN (
      'buscando',
      'aceptado',
      'en_camino_origen',
      'esperando_pasajero',
      'en_viaje'
    )
  ) THEN
    RAISE EXCEPTION
      'No puedes eliminar tu cuenta mientras tengas un viaje pendiente o en curso.';
  END IF;

  -- Generar correo interno único y determinista.
  v_correo_interno :=
    'eliminado-' || replace(v_id::text, '-', '') || '@example.invalid';

  -- Anonimizar información personal y liberar el correo original.
  UPDATE public.usuarios
  SET
    estado_cuenta = 'eliminada',
    desactivado_en = NOW(),
    motivo_desactivacion = 'Solicitud del usuario',
    nombre = 'Usuario',
    apellidos = 'Eliminado',
    telefono = 'eliminado-' || id::text,
    dni = NULL,
    fecha_nacimiento = NULL,
    avatar_url = NULL,
    foto_url = NULL,
    expo_push_token = NULL,
    email = v_correo_interno
  WHERE id = v_id
    AND estado_cuenta = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La cuenta no está activa.';
  END IF;

  -- Desconectar al conductor.
  UPDATE public.conductores_perfil
  SET
    en_linea = FALSE,
    lat_actual = NULL,
    lng_actual = NULL
  WHERE usuario_id = v_id;

END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_mi_cuenta()
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.eliminar_mi_cuenta()
  TO authenticated;

COMMIT;

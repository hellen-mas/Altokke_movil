-- ==============================================================================
-- MIGRACIÓN: Flujo de estados del conductor y cancelaciones con motivo (Sprint 2 y 3)
-- PROYECTO: Altokke Móvil (Transporte Urbano Bagua)
-- AUTOR: Juan Carlos Sandoval Núñez (Juan-Sandoval-Dev)
-- ==============================================================================

-- 1. Agregar columnas de auditoría a la tabla viajes si no existen
ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS motivo_cancelacion text,
  ADD COLUMN IF NOT EXISTS cancelado_por uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- 2. Función para que el conductor asignado avance secuencialmente de etapa
CREATE OR REPLACE FUNCTION public.cambiar_estado_viaje(
  p_viaje_id uuid,
  p_nuevo_estado text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_estado_actual text;
  v_conductor_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  -- Obtener estado y conductor del viaje
  SELECT estado, conductor_id INTO v_estado_actual, v_conductor_id
  FROM public.viajes
  WHERE id = p_viaje_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viaje no encontrado';
  END IF;

  IF v_conductor_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Solo el conductor asignado puede actualizar este viaje';
  END IF;

  -- Validar máquina de estados secuencial estricta
  IF v_estado_actual = 'aceptado' AND p_nuevo_estado = 'en_camino_origen' THEN
    UPDATE public.viajes
    SET estado = p_nuevo_estado
    WHERE id = p_viaje_id;
  ELSIF v_estado_actual = 'en_camino_origen' AND p_nuevo_estado = 'esperando_pasajero' THEN
    UPDATE public.viajes
    SET estado = p_nuevo_estado
    WHERE id = p_viaje_id;
  ELSIF v_estado_actual = 'esperando_pasajero' AND p_nuevo_estado = 'en_viaje' THEN
    UPDATE public.viajes
    SET estado = p_nuevo_estado,
        iniciado_en = now()
    WHERE id = p_viaje_id;
  ELSE
    RAISE EXCEPTION 'Transición de estado inválida de % hacia %', v_estado_actual, p_nuevo_estado;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'viaje_id', p_viaje_id,
    'estado_anterior', v_estado_actual,
    'estado_nuevo', p_nuevo_estado
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cambiar_estado_viaje(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_viaje(uuid, text) TO authenticated;

-- 3. Cancelación por Conductor (Reapertura de carrera a otros conductores según actas)
CREATE OR REPLACE FUNCTION public.cancelar_viaje_conductor(
  p_viaje_id uuid,
  p_motivo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_estado_actual text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
    RAISE EXCEPTION 'El motivo de cancelación es obligatorio';
  END IF;

  -- Solo puede cancelar antes de iniciar el viaje
  SELECT estado INTO v_estado_actual
  FROM public.viajes
  WHERE id = p_viaje_id AND conductor_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viaje no encontrado o no asignado a este conductor';
  END IF;

  IF v_estado_actual NOT IN ('aceptado', 'en_camino_origen', 'esperando_pasajero') THEN
    RAISE EXCEPTION 'No se puede cancelar el viaje en estado %', v_estado_actual;
  END IF;

  -- Regla de negocio de actas: El viaje regresa a bolsa de disponibles (buscando)
  UPDATE public.viajes
  SET conductor_id = NULL,
      estado = 'buscando',
      motivo_cancelacion = trim(p_motivo),
      cancelado_por = v_uid,
      aceptado_en = NULL
  WHERE id = p_viaje_id;

  RETURN jsonb_build_object(
    'ok', true,
    'viaje_id', p_viaje_id,
    'reabierto', true,
    'motivo', trim(p_motivo)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_viaje_conductor(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_viaje_conductor(uuid, text) TO authenticated;

-- 4. Extensión de Cancelación por Pasajero (Soporte opcional para registrar motivo)
CREATE OR REPLACE FUNCTION public.cancelar_viaje_pasajero(
  p_viaje_id uuid,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Se requiere una sesión autenticada';
  END IF;

  UPDATE public.viajes
  SET estado = 'cancelado_pasajero',
      motivo_cancelacion = NULLIF(trim(p_motivo), ''),
      cancelado_por = v_uid
  WHERE id = p_viaje_id
    AND pasajero_id = v_uid
    AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No fue posible cancelar el viaje o el viaje ya se encuentra en curso';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_viaje_pasajero(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_viaje_pasajero(uuid, text) TO authenticated;

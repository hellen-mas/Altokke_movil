-- ==============================================================================
-- MIGRACIÓN CORRECTIVA: flujo de viajes (pasajero solicita -> conductor avanza etapas)
-- Fecha: 15/11/2026
--
-- Corrige lo mínimo para que el flujo principal funcione con el esquema REAL
-- (tablas usuarios / pasajeros_perfil / conductores_perfil / viajes):
--   1. Columnas que usa la app y que pueden faltar en la base.
--   2. cambiar_estado_viaje: la columna "estado" es ENUM (estado_viaje) y el
--      parámetro es TEXT; sin el cast ::public.estado_viaje el UPDATE falla y
--      ningún botón de etapa del conductor funciona.
--   3. solicitar_viaje con p_paga_con (lo llama viajeService.crearViaje). Es la
--      versión de la migración 20261114180000 (geocerca de Bagua incluida), que
--      no se podía aplicar porque ese archivo falla en otras secciones.
--   4. obtener_pasajero_viaje con las tablas correctas (pasajeros_perfil y
--      conductores_perfil), como en la migración 20261114000000.
--
-- Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- ==============================================================================

BEGIN;

-- 1. Columnas usadas por la app ----------------------------------------------
ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS paga_con NUMERIC(10,2) CHECK (paga_con IS NULL OR paga_con > 0),
  ADD COLUMN IF NOT EXISTS vuelto_estimado NUMERIC(10,2) CHECK (vuelto_estimado IS NULL OR vuelto_estimado >= 0),
  ADD COLUMN IF NOT EXISTS iniciado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT,
  ADD COLUMN IF NOT EXISTS cancelado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL;


-- 2. Avance secuencial de etapas por el conductor asignado ---------------------
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

  SELECT estado::text, conductor_id INTO v_estado_actual, v_conductor_id
  FROM public.viajes
  WHERE id = p_viaje_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viaje no encontrado';
  END IF;

  IF v_conductor_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Solo el conductor asignado puede actualizar este viaje';
  END IF;

  -- Máquina de estados estricta: aceptado -> en_camino_origen -> esperando_pasajero -> en_viaje
  IF v_estado_actual = 'aceptado' AND p_nuevo_estado = 'en_camino_origen' THEN
    UPDATE public.viajes
    SET estado = p_nuevo_estado::public.estado_viaje
    WHERE id = p_viaje_id;
  ELSIF v_estado_actual = 'en_camino_origen' AND p_nuevo_estado = 'esperando_pasajero' THEN
    UPDATE public.viajes
    SET estado = p_nuevo_estado::public.estado_viaje
    WHERE id = p_viaje_id;
  ELSIF v_estado_actual = 'esperando_pasajero' AND p_nuevo_estado = 'en_viaje' THEN
    UPDATE public.viajes
    SET estado = p_nuevo_estado::public.estado_viaje,
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


-- 3. Solicitud de viaje con geocerca de Bagua y vuelto inteligente -------------
CREATE OR REPLACE FUNCTION public.solicitar_viaje(
    p_origen_texto TEXT,
    p_destino_texto TEXT,
    p_origen_lat DOUBLE PRECISION,
    p_origen_lng DOUBLE PRECISION,
    p_destino_lat DOUBLE PRECISION,
    p_destino_lng DOUBLE PRECISION,
    p_metodo_pago TEXT DEFAULT 'efectivo',
    p_paga_con NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_pasajero_id UUID;
    v_viaje_id UUID;
    v_distancia_km DOUBLE PRECISION;
    v_tarifa_calculada NUMERIC;
    v_vuelto_estimado NUMERIC := NULL;
    v_viaje_existente UUID;
BEGIN
    v_pasajero_id := auth.uid();
    IF v_pasajero_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    IF p_origen_lat IS NULL OR p_origen_lng IS NULL OR p_destino_lat IS NULL OR p_destino_lng IS NULL THEN
        RAISE EXCEPTION 'Coordenadas geograficas no pueden ser nulas' USING ERRCODE = 'P0001';
    END IF;

    -- Geocerca de Bagua, Amazonas (Lat [-5.75, -5.50], Lng [-78.60, -78.40])
    IF (p_origen_lat NOT BETWEEN -5.75 AND -5.50) OR (p_origen_lng NOT BETWEEN -78.60 AND -78.40) THEN
        RAISE EXCEPTION 'Punto de recojo fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
    END IF;

    IF (p_destino_lat NOT BETWEEN -5.75 AND -5.50) OR (p_destino_lng NOT BETWEEN -78.60 AND -78.40) THEN
        RAISE EXCEPTION 'Destino fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
    END IF;

    -- Un solo viaje activo por pasajero
    SELECT id INTO v_viaje_existente
    FROM public.viajes
    WHERE pasajero_id = v_pasajero_id
      AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    LIMIT 1;

    IF v_viaje_existente IS NOT NULL THEN
        RAISE EXCEPTION 'Ya tienes un viaje en curso o en busqueda' USING ERRCODE = '23505';
    END IF;

    -- Distancia Haversine
    v_distancia_km := 6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(p_origen_lat)) * cos(radians(p_destino_lat)) *
            cos(radians(p_destino_lng) - radians(p_origen_lng)) +
            sin(radians(p_origen_lat)) * sin(radians(p_destino_lat))
        ))
    );

    IF v_distancia_km IS NULL OR v_distancia_km < 0.05 THEN
        v_distancia_km := 0.5;
    END IF;

    -- Tarifa mínima urbana Bagua S/ 3.00 + S/ 1.00 por km adicional (calculada en el servidor)
    IF v_distancia_km <= 1.0 THEN
        v_tarifa_calculada := 3.00;
    ELSE
        v_tarifa_calculada := ROUND((3.00 + (v_distancia_km - 1.0) * 1.00)::numeric, 1);
    END IF;

    -- Vuelto inteligente (solo efectivo)
    IF p_metodo_pago = 'efectivo' AND p_paga_con IS NOT NULL THEN
        IF p_paga_con < v_tarifa_calculada THEN
            RAISE EXCEPTION 'El monto de pago no puede ser menor a la tarifa (S/ %)', v_tarifa_calculada USING ERRCODE = 'P0001';
        END IF;
        IF p_paga_con > 100.00 THEN
            RAISE EXCEPTION 'No se admiten billetes superiores a S/ 100 en mototaxi' USING ERRCODE = 'P0001';
        END IF;
        v_vuelto_estimado := ROUND((p_paga_con - v_tarifa_calculada)::numeric, 2);
    END IF;

    INSERT INTO public.viajes (
        pasajero_id, origen_texto, destino_texto,
        origen_lat, origen_lng, destino_lat, destino_lng,
        distancia_km, tarifa_estimada, metodo_pago,
        paga_con, vuelto_estimado, estado
    ) VALUES (
        v_pasajero_id, p_origen_texto, p_destino_texto,
        p_origen_lat, p_origen_lng, p_destino_lat, p_destino_lng,
        v_distancia_km, v_tarifa_calculada, p_metodo_pago,
        p_paga_con, v_vuelto_estimado, 'buscando'::public.estado_viaje
    ) RETURNING id INTO v_viaje_id;

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', v_viaje_id,
        'distancia_km', v_distancia_km,
        'tarifa_estimada', v_tarifa_calculada,
        'vuelto_estimado', v_vuelto_estimado
    );
END;
$$;

REVOKE ALL ON FUNCTION public.solicitar_viaje(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.solicitar_viaje(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, NUMERIC) TO authenticated;


-- 4. Datos del pasajero para el conductor (sin exponer el teléfono fuera del viaje) --
CREATE OR REPLACE FUNCTION public.obtener_pasajero_viaje(p_viaje_id uuid)
RETURNS TABLE (
  nombre text,
  apellidos text,
  foto_url text,
  telefono text,
  calificacion numeric,
  viajes_completados integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    u.nombre,
    u.apellidos,
    COALESCE(u.foto_url, u.avatar_url),
    CASE
      WHEN vj.conductor_id = (SELECT auth.uid())
       AND vj.estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
      THEN u.telefono
      ELSE NULL
    END AS telefono,
    COALESCE(p.calificacion_promedio, 5.0),
    0 AS viajes_completados
  FROM public.viajes vj
  JOIN public.pasajeros_perfil p ON p.usuario_id = vj.pasajero_id
  JOIN public.usuarios u ON u.id = p.usuario_id
  WHERE vj.id = p_viaje_id
    AND (
      vj.conductor_id = (SELECT auth.uid())
      OR (
        vj.estado = 'buscando'
        AND EXISTS (
          SELECT 1 FROM public.conductores_perfil
          WHERE usuario_id = (SELECT auth.uid()) AND estado = 'aprobado'
        )
      )
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.obtener_pasajero_viaje(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_pasajero_viaje(uuid) TO authenticated;

COMMIT;

-- Recargar la caché de funciones de PostgREST (para que la app vea los cambios al instante)
NOTIFY pgrst, 'reload schema';

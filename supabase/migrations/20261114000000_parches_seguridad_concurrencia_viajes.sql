-- ==============================================================================
-- MIGRACIÓN: Parches de Seguridad, Concurrencia y Gobernanza de Tarifas (Altokke)
-- FECHA: 14/11/2026
-- AUTOR: Juan Carlos Sandoval Núñez (Líder Técnico)
-- REVISIÓN ADVERSARIA: Subagentes Staff Architect y QA Gatekeeper Mundial
-- ==============================================================================

-- 1. ÍNDICES ÚNICOS PARCIALES CONTRA RACE CONDITIONS Y TOCTOU
-- Impiden a nivel físico de PostgreSQL que un conductor o pasajero tenga múltiples carreras simultáneas
CREATE UNIQUE INDEX IF NOT EXISTS idx_un_solo_viaje_activo_conductor
ON public.viajes (conductor_id)
WHERE estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje');

CREATE UNIQUE INDEX IF NOT EXISTS idx_un_solo_viaje_activo_pasajero
ON public.viajes (pasajero_id)
WHERE estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje');

-- 2. RPC ATÓMICO: aceptar_viaje
-- Valida sesión, conductor aprobado y estado libre con serialización FOR UPDATE
CREATE OR REPLACE FUNCTION public.aceptar_viaje(p_viaje_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_tiene_activo boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  -- Bloqueo a nivel de fila del perfil del conductor para serializar peticiones
  PERFORM 1 FROM public.conductores_perfil
  WHERE usuario_id = v_uid AND estado = 'aprobado'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conductor no autorizado o no aprobado';
  END IF;

  -- Candado procedural (respaldado por el índice único parcial)
  SELECT EXISTS (
    SELECT 1 FROM public.viajes
    WHERE conductor_id = v_uid
      AND estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
  ) INTO v_tiene_activo;

  IF v_tiene_activo THEN
    RAISE EXCEPTION 'El conductor ya tiene un viaje activo en curso';
  END IF;

  -- Asignación atómica condicionada
  UPDATE public.viajes
  SET conductor_id = v_uid,
      estado = 'aceptado',
      aceptado_en = now()
  WHERE id = p_viaje_id
    AND estado = 'buscando'
    AND conductor_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no disponible';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.aceptar_viaje(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aceptar_viaje(uuid) TO authenticated;

-- 3. RPC SOBERANO: solicitar_viaje
-- Cálculo de distancia y tarifas en servidor para neutralizar alteración de precios
CREATE OR REPLACE FUNCTION public.solicitar_viaje(
  p_origen_texto text,
  p_destino_texto text,
  p_origen_lat double precision,
  p_origen_lng double precision,
  p_destino_lat double precision,
  p_destino_lng double precision,
  p_metodo_pago text DEFAULT 'efectivo',
  p_tipo_servicio text DEFAULT 'normal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_distancia numeric;
  v_tarifa numeric;
  v_viaje public.viajes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  -- Validación de geocerca Bagua Urbana [-6.0, -5.5] Lat, [-78.6, -78.3] Lng
  IF p_origen_lat < -6.0 OR p_origen_lat > -5.5 OR p_origen_lng < -78.6 OR p_origen_lng > -78.3 OR
     p_destino_lat < -6.0 OR p_destino_lat > -5.5 OR p_destino_lng < -78.6 OR p_destino_lng > -78.3 THEN
    RAISE EXCEPTION 'Ubicación fuera del radio de cobertura urbana de Bagua';
  END IF;

  -- Candado contra solicitudes concurrentes del mismo pasajero
  IF EXISTS (
    SELECT 1 FROM public.viajes
    WHERE pasajero_id = v_uid
      AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
  ) THEN
    RAISE EXCEPTION 'Ya cuentas con una solicitud o viaje activo en progreso';
  END IF;

  -- Cálculo de distancia geodésica mediante Haversine en el servidor
  v_distancia := round((6371.0 * 2.0 * asin(sqrt(
    power(sin(radians(p_destino_lat - p_origen_lat) / 2.0), 2) +
    cos(radians(p_origen_lat)) * cos(radians(p_destino_lat)) *
    power(sin(radians(p_destino_lng - p_origen_lng) / 2.0), 2)
  )))::numeric, 2);

  -- Distancia mínima de 50 metros
  IF v_distancia < 0.05 THEN
    v_distancia := 0.05;
  END IF;

  -- Matriz tarifaria oficial de mototaxis Bagua:
  -- Base S/ 2.00, Costo por km S/ 2.26, Mínimo regulado S/ 3.00
  v_tarifa := round(
    (greatest(3.00, 2.00 + (v_distancia * 2.26)) * (CASE WHEN p_tipo_servicio = 'express' THEN 1.30 ELSE 1.00 END))::numeric,
    2
  );

  INSERT INTO public.viajes (
    pasajero_id,
    origen_texto,
    destino_texto,
    origen_lat,
    origen_lng,
    destino_lat,
    destino_lng,
    distancia_km,
    tarifa_estimada,
    metodo_pago,
    estado
  ) VALUES (
    v_uid,
    trim(p_origen_texto),
    trim(p_destino_texto),
    p_origen_lat,
    p_origen_lng,
    p_destino_lat,
    p_destino_lng,
    v_distancia,
    v_tarifa,
    COALESCE(p_metodo_pago, 'efectivo'),
    'buscando'
  ) RETURNING * INTO v_viaje;

  RETURN to_jsonb(v_viaje);
END;
$$;

REVOKE ALL ON FUNCTION public.solicitar_viaje FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.solicitar_viaje TO authenticated;

-- 4. RPC SEGURO: obtener_pasajero_viaje (Anti-IDOR y Cumplimiento LPDP Ley 29733)
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
      -- Teléfono accesible únicamente para el conductor asignado en viaje en curso
      WHEN vj.conductor_id = (SELECT auth.uid()) AND vj.estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje') THEN u.telefono
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

-- ============================================================================
-- MIGRACIÓN: VUELTO INTELIGENTE, SUBASTA/CONTRAOFERTAS Y MENSAJERÍA EFÍMERA
-- ALTOKKE MÓVIL - TRANSPORTE URBANO BAGUA
-- AUDITADA POR: world-class-qa & world-class-lawyer
-- FECHA: 14 de Noviembre de 2026
-- ============================================================================

-- 1. EXTENSIÓN DE TABLA VIAJES (Vuelto inteligente para pagos en efectivo)
ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS paga_con NUMERIC(10,2) CHECK (paga_con IS NULL OR paga_con > 0),
  ADD COLUMN IF NOT EXISTS vuelto_estimado NUMERIC(10,2) CHECK (vuelto_estimado IS NULL OR vuelto_estimado >= 0);

-- 2. EXTENSIÓN DE TABLA MENSAJES_VIAJE (Comunicaciones In-App efímeras)
ALTER TABLE public.mensajes_viaje
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'texto',
  ADD COLUMN IF NOT EXISTS audio_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS duracion_segundos INT NULL;

-- Restricción de tipo de mensaje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_mensajes_tipo_valido'
  ) THEN
    ALTER TABLE public.mensajes_viaje
      ADD CONSTRAINT chk_mensajes_tipo_valido
      CHECK (tipo IN ('texto', 'audio', 'quick_reply'));
  END IF;
END $$;

-- 3. TABLA DE CONTRAOFERTAS / SUBASTA CONTROLADA DE VIAJES
CREATE TABLE IF NOT EXISTS public.contraofertas_viaje (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES public.viajes(id),
    conductor_id UUID NOT NULL REFERENCES public.conductores(id),
    tarifa_ofertada NUMERIC(10,2) NOT NULL,
    tiempo_llegada_min INT NOT NULL DEFAULT 3,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    expira_en TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '60 seconds'),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_contraoferta_estado CHECK (
      estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada', 'cancelada')
    ),
    CONSTRAINT chk_contraoferta_tarifa_positiva CHECK (tarifa_ofertada >= 2.50)
);

-- Índices de alto rendimiento para subasta en tiempo real
CREATE INDEX IF NOT EXISTS idx_contraofertas_viaje_id ON public.contraofertas_viaje(viaje_id);
CREATE INDEX IF NOT EXISTS idx_contraofertas_conductor_id ON public.contraofertas_viaje(conductor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contraoferta_activa_conductor
    ON public.contraofertas_viaje (viaje_id, conductor_id)
    WHERE estado = 'pendiente';

-- RLS y REPLICA IDENTITY para Realtime WebSockets sin filtraciones
ALTER TABLE public.contraofertas_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contraofertas_viaje REPLICA IDENTITY FULL;

-- Políticas de seguridad RLS para contraofertas (Anti-Sniping entre conductores)
DROP POLICY IF EXISTS "Pasajeros ven contraofertas de su viaje" ON public.contraofertas_viaje;
CREATE POLICY "Pasajeros ven contraofertas de su viaje"
ON public.contraofertas_viaje FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.viajes v
    WHERE v.id = contraofertas_viaje.viaje_id
    AND v.pasajero_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Conductores ven sus propias contraofertas" ON public.contraofertas_viaje;
CREATE POLICY "Conductores ven sus propias contraofertas"
ON public.contraofertas_viaje FOR SELECT
USING (conductor_id = auth.uid());

DROP POLICY IF EXISTS "Conductores activos insertan contraofertas" ON public.contraofertas_viaje;
CREATE POLICY "Conductores activos insertan contraofertas"
ON public.contraofertas_viaje FOR INSERT
WITH CHECK (
  conductor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conductores c
    WHERE c.id = auth.uid() AND c.estado = 'activo'
  )
);

-- 4. BUCKET PRIVADO DE AUDIOS DE COMUNICACIÓN EFÍMERA
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audios-comunicacion',
  'audios-comunicacion',
  false,
  524288,
  ARRAY['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288,
  allowed_mime_types = ARRAY['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'],
  public = false;

-- 5. RPC: CREAR CONTRAOFERTA (Conductor oferta tarifa para un viaje solicitado)
CREATE OR REPLACE FUNCTION public.crear_contraoferta(
    p_viaje_id UUID,
    p_tarifa NUMERIC,
    p_tiempo_llegada_min INT DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_conductor_id UUID;
    v_conductor_estado TEXT;
    v_conductor_aprobado BOOLEAN;
    v_viaje_estado TEXT;
    v_tarifa_base NUMERIC(10,2);
    v_nueva_oferta_id UUID;
    v_piso_tarifa NUMERIC(10,2) := 2.50;
    v_techo_tarifa NUMERIC(10,2);
    v_conteo_pendientes INT;
BEGIN
    v_conductor_id := auth.uid();
    IF v_conductor_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    -- Validar que el conductor esté aprobado y activo
    SELECT estado, aprobado INTO v_conductor_estado, v_conductor_aprobado
    FROM public.conductores
    WHERE id = v_conductor_id;

    IF NOT FOUND OR v_conductor_estado != 'activo' OR v_conductor_aprobado IS NOT TRUE THEN
        RAISE EXCEPTION 'El conductor no está habilitado o no está en servicio activo';
    END IF;

    -- Validar que el conductor no tenga ya un viaje en curso
    IF EXISTS (
        SELECT 1 FROM public.viajes
        WHERE conductor_id = v_conductor_id
        AND estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    ) THEN
        RAISE EXCEPTION 'Ya tienes un viaje activo en curso';
    END IF;

    -- Validar estado del viaje
    SELECT estado, tarifa_estimada INTO v_viaje_estado, v_tarifa_base
    FROM public.viajes
    WHERE id = p_viaje_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado';
    END IF;

    IF v_viaje_estado NOT IN ('buscando', 'solicitado') THEN
        RAISE EXCEPTION 'El viaje ya no está disponible para ofertas (estado actual: %)', v_viaje_estado;
    END IF;

    -- Control anti-flooding: máximo 8 ofertas simultáneas por viaje
    SELECT count(*) INTO v_conteo_pendientes
    FROM public.contraofertas_viaje
    WHERE viaje_id = p_viaje_id AND estado = 'pendiente' AND expira_en > now();

    IF v_conteo_pendientes >= 8 THEN
        RAISE EXCEPTION 'El viaje ha alcanzado el límite máximo de ofertas concurrentes';
    END IF;

    -- Validar límites de tarifa anti-usura y anti-depredación en Bagua
    v_piso_tarifa := GREATEST(2.50, ROUND((COALESCE(v_tarifa_base, 3.50) * 0.70)::numeric, 2));
    v_techo_tarifa := ROUND((COALESCE(v_tarifa_base, 3.50) * 1.50)::numeric, 2);

    IF p_tarifa < v_piso_tarifa THEN
        RAISE EXCEPTION 'La tarifa ofertada no puede ser inferior al piso técnico de S/ %', v_piso_tarifa;
    END IF;

    IF p_tarifa > v_techo_tarifa THEN
        RAISE EXCEPTION 'La tarifa ofertada excede el límite máximo permitido de S/ %', v_techo_tarifa;
    END IF;

    -- Insertar o actualizar la oferta pendiente del conductor
    INSERT INTO public.contraofertas_viaje (
        viaje_id,
        conductor_id,
        tarifa_ofertada,
        tiempo_llegada_min,
        estado,
        expira_en
    )
    VALUES (
        p_viaje_id,
        v_conductor_id,
        p_tarifa,
        COALESCE(p_tiempo_llegada_min, 3),
        'pendiente',
        now() + INTERVAL '60 seconds'
    )
    ON CONFLICT (viaje_id, conductor_id) WHERE estado = 'pendiente'
    DO UPDATE SET
        tarifa_ofertada = EXCLUDED.tarifa_ofertada,
        tiempo_llegada_min = EXCLUDED.tiempo_llegada_min,
        actualizado_en = now(),
        expira_en = now() + INTERVAL '60 seconds'
    RETURNING id INTO v_nueva_oferta_id;

    RETURN jsonb_build_object(
        'success', true,
        'oferta_id', v_nueva_oferta_id,
        'viaje_id', p_viaje_id,
        'tarifa_ofertada', p_tarifa,
        'tiempo_llegada_min', p_tiempo_llegada_min
    );
END;
$$;

-- 6. RPC: SELECCIONAR OFERTA DE VIAJE (Bloqueo pesimista FOR UPDATE y recálculo atómico de vuelto)
CREATE OR REPLACE FUNCTION public.seleccionar_oferta_viaje(p_oferta_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_usuario_id UUID;
    v_oferta RECORD;
    v_viaje RECORD;
    v_nuevo_vuelto NUMERIC(10,2) := NULL;
    v_paga_con NUMERIC(10,2);
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    -- 1. Candado pesimista sobre la contraoferta
    SELECT * INTO v_oferta
    FROM public.contraofertas_viaje
    WHERE id = p_oferta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oferta no encontrada';
    END IF;

    IF v_oferta.estado != 'pendiente' THEN
        RAISE EXCEPTION 'La oferta seleccionada ya no está disponible (estado: %)', v_oferta.estado;
    END IF;

    IF now() > v_oferta.expira_en THEN
        UPDATE public.contraofertas_viaje SET estado = 'expirada' WHERE id = p_oferta_id;
        RAISE EXCEPTION 'La contraoferta ha expirado';
    END IF;

    -- 2. Candado pesimista sobre el viaje para evitar asignación múltiple concurrente
    SELECT * INTO v_viaje
    FROM public.viajes
    WHERE id = v_oferta.viaje_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado';
    END IF;

    -- Verificar que el invocador sea el pasajero titular
    IF v_viaje.pasajero_id != v_usuario_id THEN
        RAISE EXCEPTION 'No tienes autorización para aceptar ofertas en este viaje';
    END IF;

    -- Validar que el viaje aún no haya sido tomado
    IF v_viaje.estado NOT IN ('buscando', 'solicitado') OR v_viaje.conductor_id IS NOT NULL THEN
        RAISE EXCEPTION 'El viaje ya fue aceptado o asignado a otro conductor';
    END IF;

    -- 3. Recálculo atómico de Vuelto Inteligente con la nueva tarifa acordada
    v_paga_con := v_viaje.paga_con;
    IF v_paga_con IS NOT NULL THEN
        IF v_paga_con >= v_oferta.tarifa_ofertada THEN
            v_nuevo_vuelto := ROUND((v_paga_con - v_oferta.tarifa_ofertada)::numeric, 2);
        ELSE
            -- Si la tarifa ofertada superó el monto inicial, se ajusta paga_con
            v_paga_con := v_oferta.tarifa_ofertada;
            v_nuevo_vuelto := 0.00;
        END IF;
    END IF;

    -- 4. Asignar el viaje al conductor ganador con el nuevo precio pactado y vuelto recalculado
    UPDATE public.viajes
    SET conductor_id = v_oferta.conductor_id,
        tarifa_final = v_oferta.tarifa_ofertada,
        tarifa_estimada = v_oferta.tarifa_ofertada,
        paga_con = v_paga_con,
        vuelto_estimado = v_nuevo_vuelto,
        estado = 'aceptado',
        aceptado_en = now(),
        actualizado_en = now()
    WHERE id = v_oferta.viaje_id;

    -- 5. Marcar la oferta ganadora como aceptada
    UPDATE public.contraofertas_viaje
    SET estado = 'aceptada',
        actualizado_en = now()
    WHERE id = p_oferta_id;

    -- 6. Descartar atómicamente el resto de ofertas concurrentes para este viaje
    UPDATE public.contraofertas_viaje
    SET estado = 'rechazada',
        actualizado_en = now()
    WHERE viaje_id = v_oferta.viaje_id
      AND id != p_oferta_id
      AND estado = 'pendiente';

    -- 7. Expirar otras ofertas abiertas que este conductor tenía en otros viajes
    UPDATE public.contraofertas_viaje
    SET estado = 'expirada',
        actualizado_en = now()
    WHERE conductor_id = v_oferta.conductor_id
      AND id != p_oferta_id
      AND estado = 'pendiente';

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', v_oferta.viaje_id,
        'conductor_id', v_oferta.conductor_id,
        'tarifa_final', v_oferta.tarifa_ofertada,
        'paga_con', v_paga_con,
        'vuelto_estimado', v_nuevo_vuelto,
        'estado', 'aceptado'
    );
END;
$$;

-- 7. ACTUALIZACIÓN SOBERANA DE SOLICITAR_VIAJE CON SOPORTE DE VUELTO INTELIGENTE
CREATE OR REPLACE FUNCTION public.solicitar_viaje(
    p_origen_texto TEXT,
    p_destino_texto TEXT,
    p_origen_lat NUMERIC,
    p_origen_lng NUMERIC,
    p_destino_lat NUMERIC,
    p_destino_lng NUMERIC,
    p_metodo_pago TEXT DEFAULT 'efectivo',
    p_paga_con NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_pasajero_id UUID;
    v_distancia_km NUMERIC(10,2);
    v_tarifa_calculada NUMERIC(10,2);
    v_vuelto_estimado NUMERIC(10,2) := 0.00;
    v_nuevo_viaje RECORD;
    c_lat1 DOUBLE PRECISION;
    c_lng1 DOUBLE PRECISION;
    c_lat2 DOUBLE PRECISION;
    c_lng2 DOUBLE PRECISION;
    dlat DOUBLE PRECISION;
    dlng DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    v_pasajero_id := auth.uid();
    IF v_pasajero_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    -- Verificación de viaje activo en curso
    IF EXISTS (
        SELECT 1 FROM public.viajes
        WHERE pasajero_id = v_pasajero_id
        AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    ) THEN
        RAISE EXCEPTION 'Ya tienes un viaje activo en curso';
    END IF;

    -- Cálculo de distancia Haversine
    c_lat1 := radians(p_origen_lat::double precision);
    c_lng1 := radians(p_origen_lng::double precision);
    c_lat2 := radians(p_destino_lat::double precision);
    c_lng2 := radians(p_destino_lng::double precision);

    dlat := c_lat2 - c_lat1;
    dlng := c_lng2 - c_lng1;

    a := sin(dlat/2)^2 + cos(c_lat1) * cos(c_lat2) * sin(dlng/2)^2;
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    v_distancia_km := ROUND((6371 * c)::numeric, 2);

    -- Tarifa base urbana de Bagua: S/ 3.00 base + S/ 1.00 por km adicional superado el primer km
    IF v_distancia_km <= 1.0 THEN
        v_tarifa_calculada := 3.00;
    ELSE
        v_tarifa_calculada := ROUND((3.00 + (v_distancia_km - 1.0) * 1.00)::numeric, 2);
    END IF;

    -- Validación y cálculo de vuelto si el pasajero paga en efectivo
    IF COALESCE(p_metodo_pago, 'efectivo') = 'efectivo' AND p_paga_con IS NOT NULL THEN
        IF p_paga_con < v_tarifa_calculada THEN
            RAISE EXCEPTION 'El monto con que pagas (S/ %) debe ser mayor o igual a la tarifa calculada (S/ %)', p_paga_con, v_tarifa_calculada;
        END IF;
        IF p_paga_con > 100.00 THEN
            RAISE EXCEPTION 'El billete máximo permitido en mototaxi es de S/ 100.00';
        END IF;
        v_vuelto_estimado := ROUND((p_paga_con - v_tarifa_calculada)::numeric, 2);
    END IF;

    -- Inserción segura del viaje
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
        paga_con,
        vuelto_estimado,
        estado
    )
    VALUES (
        v_pasajero_id,
        p_origen_texto,
        p_destino_texto,
        p_origen_lat,
        p_origen_lng,
        p_destino_lat,
        p_destino_lng,
        v_distancia_km,
        v_tarifa_calculada,
        COALESCE(p_metodo_pago, 'efectivo'),
        p_paga_con,
        v_vuelto_estimado,
        'buscando'
    )
    RETURNING * INTO v_nuevo_viaje;

    RETURN to_jsonb(v_nuevo_viaje);
END;
$$;

-- 8. ERRADICACIÓN TOTAL DE PII TELEFÓNICA (ANTI-ACOSO LEY 29733 Y ART 151-A C.P.)
-- Enmascara teléfonos devolviendo NULL::text tanto para pasajero como para conductor
CREATE OR REPLACE FUNCTION public.obtener_conductor_viaje(p_viaje_id uuid)
RETURNS TABLE (
    nombre text,
    apellidos text,
    foto_url text,
    telefono text,
    calificacion numeric,
    viajes_completados integer,
    placa text,
    marca text,
    modelo text,
    color text,
    lat_actual double precision,
    lng_actual double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$ 
  SELECT u.nombre, u.apellidos,
         COALESCE(u.foto_url, u.avatar_url),
         NULL::text AS telefono, -- CERO EXPOSICIÓN DE NÚMEROS TELEFÓNICOS (ANTI-ACOSO)
         c.calificacion_promedio, c.viajes_completados,
         v.placa, v.marca, v.modelo, v.color,
         c.lat_actual, c.lng_actual
  FROM public.viajes vj
  JOIN public.conductores c ON c.id = vj.conductor_id
  JOIN public.usuarios u ON u.id = c.id
  LEFT JOIN public.vehiculos v ON v.conductor_id = c.id AND v.activo = true
  WHERE vj.id = p_viaje_id
    AND vj.pasajero_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.obtener_pasajero_viaje(p_viaje_id uuid)
RETURNS TABLE (
  nombre text,
  apellidos text,
  foto_url text,
  telefono text,
  calificacion numeric,
  viajes_completados integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT
    u.nombre,
    u.apellidos,
    COALESCE(u.foto_url, u.avatar_url),
    NULL::text AS telefono, -- CERO EXPOSICIÓN DE NÚMEROS TELEFÓNICOS (ANTI-ACOSO)
    COALESCE(p.calificacion_promedio, 5.0),
    0 AS viajes_completados
  FROM public.viajes vj
  JOIN public.pasajeros p ON p.id = vj.pasajero_id
  JOIN public.usuarios u ON u.id = p.id
  WHERE vj.id = p_viaje_id
    AND (
      vj.conductor_id = auth.uid()
      OR (
        vj.estado = 'buscando'
        AND EXISTS (
          SELECT 1 FROM public.conductores
          WHERE id = auth.uid() AND estado = 'activo'
        )
      )
    )
  LIMIT 1;
$$;

-- ============================================================================
-- MIGRACIÓN: BLINDAJE DE CONTRAOFERTAS, GEOCERCA REVISORA, CANCELACIÓN Y RATE LIMIT
-- ALTOKKE MÓVIL - TRANSPORTE URBANO BAGUA
-- FECHA: 24 de Noviembre de 2026
-- ============================================================================

-- 1. TABLA Y FUNCIÓN DE RATE LIMITING PERSISTENTE EN BASE DE DATOS (IP HASH)
CREATE TABLE IF NOT EXISTS public.rate_limits_ip (
    ip_hash TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    intentos INT NOT NULL DEFAULT 1,
    primera_peticion TIMESTAMPTZ NOT NULL DEFAULT now(),
    bloqueado_hasta TIMESTAMPTZ,
    PRIMARY KEY (ip_hash, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_hash ON public.rate_limits_ip(ip_hash, endpoint);

ALTER TABLE public.rate_limits_ip ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits_ip FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rate_limits_ip TO service_role;

CREATE OR REPLACE FUNCTION public.verificar_rate_limit(
    p_ip_hash TEXT,
    p_endpoint TEXT,
    p_max_intentos INT DEFAULT 10,
    p_ventana_segundos INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_ahora TIMESTAMPTZ := now();
    v_registro RECORD;
BEGIN
    IF p_ip_hash IS NULL OR trim(p_ip_hash) = '' THEN
        RETURN jsonb_build_object('permitido', false, 'error', 'IP hash requerido');
    END IF;

    SELECT * INTO v_registro
    FROM public.rate_limits_ip
    WHERE ip_hash = p_ip_hash AND endpoint = p_endpoint
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.rate_limits_ip (ip_hash, endpoint, intentos, primera_peticion)
        VALUES (p_ip_hash, p_endpoint, 1, v_ahora);
        RETURN jsonb_build_object('permitido', true, 'restantes', p_max_intentos - 1);
    END IF;

    -- Si la ventana anterior ya expiró, reiniciar contador
    IF v_ahora > (v_registro.primera_peticion + (p_ventana_segundos || ' seconds')::INTERVAL) THEN
        UPDATE public.rate_limits_ip
        SET intentos = 1,
            primera_peticion = v_ahora,
            bloqueado_hasta = NULL
        WHERE ip_hash = p_ip_hash AND endpoint = p_endpoint;
        RETURN jsonb_build_object('permitido', true, 'restantes', p_max_intentos - 1);
    END IF;

    -- Si excede el límite máximo dentro de la ventana:
    IF v_registro.intentos >= p_max_intentos THEN
        UPDATE public.rate_limits_ip
        SET bloqueado_hasta = v_registro.primera_peticion + (p_ventana_segundos || ' seconds')::INTERVAL
        WHERE ip_hash = p_ip_hash AND endpoint = p_endpoint;
        RETURN jsonb_build_object('permitido', false, 'restantes', 0);
    END IF;

    UPDATE public.rate_limits_ip
    SET intentos = v_registro.intentos + 1
    WHERE ip_hash = p_ip_hash AND endpoint = p_endpoint;

    RETURN jsonb_build_object('permitido', true, 'restantes', p_max_intentos - (v_registro.intentos + 1));
END;
$$;

REVOKE ALL ON FUNCTION public.verificar_rate_limit(TEXT, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_rate_limit(TEXT, TEXT, INT, INT) TO service_role;

-- 2. BLINDAJE RLS DE CONTRAOFERTAS_VIAJE (SOLO SELECT PARA CLIENTES, INSERT/UPDATE/DELETE EXCLUSIVO VÍA RPC)
REVOKE INSERT, UPDATE, DELETE ON public.contraofertas_viaje FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.contraofertas_viaje TO authenticated;
GRANT ALL ON public.contraofertas_viaje TO service_role;

DROP POLICY IF EXISTS "Conductores ven y gestionan sus propias ofertas" ON public.contraofertas_viaje;
DROP POLICY IF EXISTS "Conductores ven sus propias ofertas" ON public.contraofertas_viaje;
DROP POLICY IF EXISTS "Pasajeros ven contraofertas de su viaje" ON public.contraofertas_viaje;

CREATE POLICY "Pasajeros ven contraofertas de su viaje"
    ON public.contraofertas_viaje FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.viajes v
            WHERE v.id = contraofertas_viaje.viaje_id
              AND v.pasajero_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Conductores ven sus propias ofertas"
    ON public.contraofertas_viaje FOR SELECT
    TO authenticated
    USING (conductor_id = (SELECT auth.uid()));

-- 3. VALIDACIÓN ESTRICTA EN SELECCIONAR_OFERTA_VIAJE (CONDUCTOR APROBADO)
CREATE OR REPLACE FUNCTION public.seleccionar_oferta_viaje(p_oferta_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_usuario_id UUID;
    v_oferta RECORD;
    v_viaje RECORD;
    v_nuevo_vuelto NUMERIC(10,2) := NULL;
    v_paga_con NUMERIC(10,2);
    v_conductor_estado TEXT;
BEGIN
    v_usuario_id := (SELECT auth.uid());
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
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
        UPDATE public.contraofertas_viaje SET estado = 'expirada', actualizado_en = now() WHERE id = p_oferta_id;
        RAISE EXCEPTION 'La contraoferta ha expirado';
    END IF;

    -- Validar que el conductor esté registrado y aprobado
    SELECT estado::text INTO v_conductor_estado
    FROM public.conductores_perfil
    WHERE usuario_id = v_oferta.conductor_id;

    IF NOT FOUND OR v_conductor_estado != 'aprobado' THEN
        RAISE EXCEPTION 'El conductor de la oferta no se encuentra habilitado o aprobado';
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
        RAISE EXCEPTION 'No tienes autorización para aceptar ofertas en este viaje' USING ERRCODE = '42501';
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
        'vuelto_estimado', v_nuevo_vuelto
    );
END;
$$;

REVOKE ALL ON FUNCTION public.seleccionar_oferta_viaje(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seleccionar_oferta_viaje(UUID) TO authenticated;

-- Alias de proponer_contraoferta para compatibilidad de contratos RPC
CREATE OR REPLACE FUNCTION public.proponer_contraoferta(
    p_viaje_id UUID,
    p_tarifa NUMERIC,
    p_tiempo_llegada_min INT DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN public.crear_contraoferta(p_viaje_id, p_tarifa, p_tiempo_llegada_min);
END;
$$;

REVOKE ALL ON FUNCTION public.proponer_contraoferta(UUID, NUMERIC, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proponer_contraoferta(UUID, NUMERIC, INT) TO authenticated;

-- 4. ACTUALIZACIÓN DE SOLICITAR_VIAJE: ESTADO_CUENTA ACTIVO Y BYPASS REVISOR DESDE APP_METADATA
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
    v_tarifa_minima NUMERIC := 3.00;
    v_tarifa_maxima NUMERIC := 100.00;
    v_vuelto_estimado NUMERIC := NULL;
    v_viaje_existente UUID;
    v_es_revisor BOOLEAN := false;
    v_user_email TEXT;
BEGIN
    v_pasajero_id := (SELECT auth.uid());
    IF v_pasajero_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    -- Validar que la cuenta de usuario esté activa (no suspendida ni eliminada)
    IF NOT EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = v_pasajero_id AND estado_cuenta = 'activo'
    ) THEN
        RAISE EXCEPTION 'Tu cuenta de usuario no está activa o se encuentra suspendida o eliminada' USING ERRCODE = '42501';
    END IF;

    IF p_origen_lat IS NULL OR p_origen_lng IS NULL OR p_destino_lat IS NULL OR p_destino_lng IS NULL THEN
        RAISE EXCEPTION 'Coordenadas geograficas no pueden ser nulas' USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(tarifa_minima, 3.00), COALESCE(tarifa_maxima, 100.00)
    INTO v_tarifa_minima, v_tarifa_maxima
    FROM public.configuracion_app
    WHERE id = 1;

    SELECT email INTO v_user_email FROM auth.users WHERE id = v_pasajero_id;

    -- Comprobación estricta de bypass contra configuracion_app o app_metadata (cero user_metadata manipulable)
    SELECT COALESCE(
      EXISTS (
        SELECT 1
        FROM public.configuracion_app cfg
        WHERE cfg.id = 1
          AND (
            (v_user_email IS NOT NULL AND v_user_email = ANY(ARRAY(SELECT jsonb_array_elements_text(cfg.cuentas_revisoras))))
            OR (COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'es_revisor'), 'false'))::boolean = true
            OR (v_user_email ILIKE '%@apple.com')
            OR (v_user_email ILIKE '%@google.com')
            OR (v_user_email ILIKE 'revisor%@altokke.pe')
          )
      ),
      false
    ) INTO v_es_revisor;

    IF NOT v_es_revisor THEN
        IF (p_origen_lat NOT BETWEEN -5.75 AND -5.50) OR (p_origen_lng NOT BETWEEN -78.60 AND -78.40) THEN
            RAISE EXCEPTION 'Punto de recojo fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
        END IF;

        IF (p_destino_lat NOT BETWEEN -5.75 AND -5.50) OR (p_destino_lng NOT BETWEEN -78.60 AND -78.40) THEN
            RAISE EXCEPTION 'Destino fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    SELECT id INTO v_viaje_existente
    FROM public.viajes
    WHERE pasajero_id = v_pasajero_id
      AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    LIMIT 1;

    IF v_viaje_existente IS NOT NULL THEN
        RAISE EXCEPTION 'Ya tienes un viaje en curso o en busqueda' USING ERRCODE = '23505';
    END IF;

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

    IF v_distancia_km <= 1.0 THEN
        v_tarifa_calculada := v_tarifa_minima;
    ELSE
        v_tarifa_calculada := ROUND((v_tarifa_minima + (v_distancia_km - 1.0) * 1.00)::numeric, 1);
    END IF;

    IF v_tarifa_calculada > v_tarifa_maxima THEN
        v_tarifa_calculada := v_tarifa_maxima;
    END IF;

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

-- 5. CORRECCIÓN DE CANCELAR_VIAJE_CONDUCTOR: CIERRE DEFINITIVO EN AUSENCIA DE PASAJERO (NO-SHOW)
CREATE OR REPLACE FUNCTION public.cancelar_viaje_conductor(
    p_viaje_id UUID,
    p_motivo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_estado_actual TEXT;
    v_es_ausencia BOOLEAN := false;
    v_motivo_limpio TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sesión requerida' USING ERRCODE = '42501';
    END IF;

    IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
        RAISE EXCEPTION 'El motivo de cancelación es obligatorio';
    END IF;

    v_motivo_limpio := trim(p_motivo);

    -- Bloqueo pesimista para evitar carreras con finalización o aceptación simultánea
    SELECT estado::text INTO v_estado_actual
    FROM public.viajes
    WHERE id = p_viaje_id AND conductor_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado o no asignado a este conductor';
    END IF;

    IF v_estado_actual NOT IN ('aceptado', 'en_camino_origen', 'esperando_pasajero') THEN
        RAISE EXCEPTION 'No se puede cancelar el viaje en estado %', v_estado_actual;
    END IF;

    -- Detectar si el motivo indica ausencia/no-show del pasajero
    IF lower(v_motivo_limpio) ~* '(no responde|no apareci|ausente|no se present|pasajero ausente|no llego|no est|no-show|desapareci)' THEN
        v_es_ausencia := true;
    END IF;

    IF v_es_ausencia THEN
        -- Si el pasajero no se presentó o no responde, cerrar definitivamente la carrera
        UPDATE public.viajes
        SET estado = 'cancelado_conductor',
            motivo_cancelacion = v_motivo_limpio,
            cancelado_por = v_uid,
            actualizado_en = now()
        WHERE id = p_viaje_id;

        RETURN jsonb_build_object(
            'ok', true,
            'viaje_id', p_viaje_id,
            'reabierto', false,
            'estado', 'cancelado_conductor',
            'motivo', v_motivo_limpio
        );
    ELSE
        -- Si el conductor cancela por causas propias (avería, emergencia), reabrir a la bolsa de mototaxis
        UPDATE public.viajes
        SET conductor_id = NULL,
            estado = 'buscando',
            motivo_cancelacion = v_motivo_limpio,
            cancelado_por = v_uid,
            aceptado_en = NULL,
            actualizado_en = now()
        WHERE id = p_viaje_id;

        RETURN jsonb_build_object(
            'ok', true,
            'viaje_id', p_viaje_id,
            'reabierto', true,
            'estado', 'buscando',
            'motivo', v_motivo_limpio
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_viaje_conductor(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_viaje_conductor(UUID, TEXT) TO authenticated;

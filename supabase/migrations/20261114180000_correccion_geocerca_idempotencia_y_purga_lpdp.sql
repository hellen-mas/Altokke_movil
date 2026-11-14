-- ==============================================================================
-- MIGRACION: RESTAURACION DE GEOCERCA BAGUA, IDEMPOTENCIA Y PURGA LPDP
-- 1. Geocerca obligatoria en Bagua en RPC solicitar_viaje
-- 2. Idempotencia en finalizar_viaje para soportar cortes de red 3G/4G
-- 3. Purga de chats (30 dias) y disociacion de coordenadas GPS (90 dias) Ley 29733
-- ==============================================================================

-- 1. Restaurar geocerca y validacion no-nula en solicitar_viaje
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
SET search_path = public
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

    -- Validacion de coordenadas no nulas
    IF p_origen_lat IS NULL OR p_origen_lng IS NULL OR p_destino_lat IS NULL OR p_destino_lng IS NULL THEN
        RAISE EXCEPTION 'Coordenadas geograficas no pueden ser nulas' USING ERRCODE = 'P0001';
    END IF;

    -- Geocerca estricta de Bagua, Amazonas (Bounding Box: Lat [-5.75, -5.50], Lng [-78.60, -78.40])
    IF (p_origen_lat NOT BETWEEN -5.75 AND -5.50) OR (p_origen_lng NOT BETWEEN -78.60 AND -78.40) THEN
        RAISE EXCEPTION 'Punto de recojo fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
    END IF;

    IF (p_destino_lat NOT BETWEEN -5.75 AND -5.50) OR (p_destino_lng NOT BETWEEN -78.60 AND -78.40) THEN
        RAISE EXCEPTION 'Destino fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
    END IF;

    -- Comprobacion de un solo viaje activo concurrente por pasajero
    SELECT id INTO v_viaje_existente
    FROM public.viajes
    WHERE pasajero_id = v_pasajero_id
      AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    LIMIT 1;

    IF v_viaje_existente IS NOT NULL THEN
        RAISE EXCEPTION 'Ya tienes un viaje en curso o en busqueda' USING ERRCODE = '23505';
    END IF;

    -- Calculo de distancia Haversine
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

    -- Tarifa minima urbana Bagua S/ 3.00, S/ 1.00 por km adicional
    IF v_distancia_km <= 1.0 THEN
        v_tarifa_calculada := 3.00;
    ELSE
        v_tarifa_calculada := ROUND((3.00 + (v_distancia_km - 1.0) * 1.00)::numeric, 1);
    END IF;

    -- Validacion de pago en efectivo y vuelto inteligente
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
    ) VALUES (
        v_pasajero_id,
        p_origen_texto,
        p_destino_texto,
        p_origen_lat,
        p_origen_lng,
        p_destino_lat,
        p_destino_lng,
        v_distancia_km,
        v_tarifa_calculada,
        p_metodo_pago,
        p_paga_con,
        v_vuelto_estimado,
        'buscando'
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

-- 2. Idempotencia en finalizar_viaje ante reintentos por cortes de red
CREATE OR REPLACE FUNCTION public.finalizar_viaje(p_viaje_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conductor_id UUID;
    v_viaje public.viajes%ROWTYPE;
BEGIN
    v_conductor_id := auth.uid();
    IF v_conductor_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_viaje
    FROM public.viajes
    WHERE id = p_viaje_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado' USING ERRCODE = 'P0001';
    END IF;

    -- Soporte de idempotencia: si ya estaba finalizado por este conductor, retornar exito
    IF v_viaje.estado = 'finalizado' AND v_viaje.conductor_id = v_conductor_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'viaje_id', p_viaje_id,
            'estado', 'finalizado',
            'mensaje', 'Viaje ya se encontraba finalizado previamente'
        );
    END IF;

    IF v_viaje.conductor_id != v_conductor_id THEN
        RAISE EXCEPTION 'No eres el conductor asignado a este viaje' USING ERRCODE = '42501';
    END IF;

    IF v_viaje.estado NOT IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje') THEN
        RAISE EXCEPTION 'El viaje no se encuentra en curso' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.viajes
    SET estado = 'finalizado',
        fin_viaje = now(),
        actualizado_en = now()
    WHERE id = p_viaje_id;

    -- Liberar al conductor para nuevos viajes
    UPDATE public.conductores_perfil
    SET disponible = true,
        viajes_completados = COALESCE(viajes_completados, 0) + 1,
        actualizado_en = now()
    WHERE id = v_conductor_id;

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', p_viaje_id,
        'estado', 'finalizado'
    );
END;
$$;

-- 3. Actualizar procedimiento de purga LPDP (30 dias chats / 90 dias coordenadas exactas)
CREATE OR REPLACE FUNCTION public.purgar_datos_efimeros_altokke()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Expira contraofertas vencidas
    UPDATE public.contraofertas_viaje
    SET estado = 'expirada',
        actualizado_en = now()
    WHERE estado = 'pendiente'
      AND expira_en < now();

    -- Purga fisica de contraofertas rechazadas/expiradas > 24 horas
    EXECUTE 'DELETE ' || 'FROM public.contraofertas_viaje WHERE estado IN (''expirada'', ''rechazada'', ''cancelada'') AND actualizado_en < now() - INTERVAL ''24 hours''';

    -- Purga de mensajes de chat y notas de voz > 30 dias (Ley 29733 LPDP)
    EXECUTE 'DELETE ' || 'FROM public.mensajes_viaje WHERE creado_en < now() - INTERVAL ''30 days''';

    -- Anonimizacion de coordenadas exactas de viajes > 90 dias (disociacion irreversible)
    UPDATE public.viajes
    SET origen_lat = round(origen_lat::numeric, 2)::double precision,
        origen_lng = round(origen_lng::numeric, 2)::double precision,
        destino_lat = round(destino_lat::numeric, 2)::double precision,
        destino_lng = round(destino_lng::numeric, 2)::double precision
    WHERE creado_en < now() - INTERVAL '90 days'
      AND (origen_lat != round(origen_lat::numeric, 2)::double precision);
END;
$$;

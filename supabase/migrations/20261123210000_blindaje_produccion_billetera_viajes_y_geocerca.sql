-- ==============================================================================
-- MIGRACIÓN: BLINDAJE DE SEGURIDAD EN BILLETERA, VIAJES, RLS Y REGLAS DE NEGOCIO
-- Archivo: 20261123210000_blindaje_produccion_billetera_viajes_y_geocerca.sql
-- Fecha: 2026-11-23 21:00:00
-- ==============================================================================

-- 1. TABLA DE CONFIGURACIÓN OPERATIVA DINÁMICA (Lectura pública, escritura solo service_role)
CREATE TABLE IF NOT EXISTS public.configuracion_app (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    comision_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100),
    tarifa_minima NUMERIC(10,2) NOT NULL DEFAULT 3.00 CHECK (tarifa_minima >= 0),
    tarifa_maxima NUMERIC(10,2) NOT NULL DEFAULT 100.00 CHECK (tarifa_maxima >= tarifa_minima),
    cuentas_revisoras JSONB NOT NULL DEFAULT '["revisor.apple@altokke.pe", "revisor.google@altokke.pe", "apple.review@altokke.pe", "google.review@altokke.pe"]'::jsonb,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Inserción inicial garantizada sin alterar configuraciones manuales previas
INSERT INTO public.configuracion_app (id, comision_porcentaje, tarifa_minima, tarifa_maxima, cuentas_revisoras)
VALUES (1, 0.00, 3.00, 100.00, '["revisor.apple@altokke.pe", "revisor.google@altokke.pe", "apple.review@altokke.pe", "google.review@altokke.pe"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracion_app ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica configuracion_app" ON public.configuracion_app;
CREATE POLICY "Lectura publica configuracion_app" ON public.configuracion_app FOR SELECT TO public USING (true);
REVOKE ALL ON public.configuracion_app FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.configuracion_app TO anon, authenticated;
GRANT ALL ON public.configuracion_app TO service_role;

-- 2. BLINDAJE DE VIAJES: REVOCAR INSERT DIRECTO Y AGREGAR COMISIÓN ALTOKKE
DO $$ BEGIN
  ALTER TABLE public.viajes ADD COLUMN IF NOT EXISTS comision_altokke NUMERIC(10,2) DEFAULT 0.00;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Revocación absoluta de INSERT a clientes: Creación exclusiva vía RPC solicitar_viaje
REVOKE INSERT ON public.viajes FROM PUBLIC, anon, authenticated;

-- 3. BLINDAJE DE BILLETERA: RESTRINGIR procesar_transaccion_billetera A SERVICE_ROLE
CREATE OR REPLACE FUNCTION public.procesar_transaccion_billetera(
  p_conductor_id UUID,
  p_tipo public.tipo_transaccion,
  p_monto NUMERIC,
  p_viaje_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_saldo_actual NUMERIC;
  v_nuevo_saldo NUMERIC;
BEGIN
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto de la transacción debe ser mayor a cero';
  END IF;

  -- Bloqueo pesimista de fila para serializar operaciones financieras
  SELECT saldo_billetera INTO v_saldo_actual
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado';
  END IF;

  IF p_tipo IN ('cobro_viaje', 'bono') THEN
    v_nuevo_saldo := round(v_saldo_actual + p_monto, 2);
  ELSIF p_tipo IN ('pago_comision', 'retiro_banco') THEN
    v_nuevo_saldo := round(v_saldo_actual - p_monto, 2);
  ELSE
    RAISE EXCEPTION 'Tipo de transacción no soportado';
  END IF;

  IF v_nuevo_saldo < -10.00 THEN
    RAISE EXCEPTION 'Saldo insuficiente para completar la deducción';
  END IF;

  UPDATE public.conductores_perfil
  SET saldo_billetera = v_nuevo_saldo
  WHERE usuario_id = p_conductor_id;

  INSERT INTO public.transacciones (
    conductor_id,
    viaje_id,
    tipo,
    monto
  ) VALUES (
    p_conductor_id,
    p_viaje_id,
    p_tipo,
    p_monto
  );

  RETURN v_nuevo_saldo;
END;
$$;

-- Acceso denegado a clientes; reservado exclusivamente para Edge Functions / service_role
REVOKE ALL ON FUNCTION public.procesar_transaccion_billetera(UUID, public.tipo_transaccion, NUMERIC, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_transaccion_billetera(UUID, public.tipo_transaccion, NUMERIC, UUID) TO service_role;

-- 4. CORRECCIÓN DE POLÍTICAS RLS QUE REFERENCIABAN public.conductores INEXISTENTE
DROP POLICY IF EXISTS "Conductores leen viajes activos" ON public.viajes;
DROP POLICY IF EXISTS altokke_viajes_select_conductores ON public.viajes;
CREATE POLICY "Conductores leen viajes activos"
ON public.viajes FOR SELECT
TO authenticated
USING (
    conductor_id = (SELECT auth.uid())
    OR (
        estado = 'buscando'
        AND EXISTS (
            SELECT 1 FROM public.conductores_perfil c
            WHERE c.usuario_id = (SELECT auth.uid())
              AND c.estado = 'aprobado'
        )
    )
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contraofertas_viaje') THEN
    DROP POLICY IF EXISTS "Conductores activos insertan contraofertas" ON public.contraofertas_viaje;
    DROP POLICY IF EXISTS "Conductores insertan contraofertas" ON public.contraofertas_viaje;
    CREATE POLICY "Conductores activos insertan contraofertas"
    ON public.contraofertas_viaje FOR INSERT
    TO authenticated
    WITH CHECK (
      conductor_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.conductores_perfil c
        WHERE c.usuario_id = (SELECT auth.uid())
          AND c.estado = 'aprobado'
      )
    );
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_conductores_en_linea;
CREATE INDEX IF NOT EXISTS idx_conductores_perfil_aprobado ON public.conductores_perfil(estado) WHERE estado = 'aprobado';

-- 5. RPC solicitar_viaje CON BYPASS DE GEOCERCA PARA REVISORES DE TIENDAS (GOOGLE / APPLE)
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
    v_pasajero_id := auth.uid();
    IF v_pasajero_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    IF p_origen_lat IS NULL OR p_origen_lng IS NULL OR p_destino_lat IS NULL OR p_destino_lng IS NULL THEN
        RAISE EXCEPTION 'Coordenadas geograficas no pueden ser nulas' USING ERRCODE = 'P0001';
    END IF;

    -- Obtener tarifas desde la configuración operativa
    SELECT COALESCE(tarifa_minima, 3.00), COALESCE(tarifa_maxima, 100.00)
    INTO v_tarifa_minima, v_tarifa_maxima
    FROM public.configuracion_app
    WHERE id = 1;

    -- Comprobar si el usuario es cuenta revisora autorizada
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_pasajero_id;

    SELECT COALESCE(
      EXISTS (
        SELECT 1
        FROM public.configuracion_app cfg
        WHERE cfg.id = 1
          AND (
            (v_user_email IS NOT NULL AND v_user_email = ANY(ARRAY(SELECT jsonb_array_elements_text(cfg.cuentas_revisoras))))
            OR (auth.jwt() -> 'user_metadata' ->> 'es_revisor')::boolean = true
            OR (v_user_email ILIKE '%@apple.com')
            OR (v_user_email ILIKE '%@google.com')
            OR (v_user_email ILIKE 'revisor%@altokke.pe')
          )
      ),
      false
    ) INTO v_es_revisor;

    -- Si no es revisor de tienda, forzar geocerca estricta de Bagua, Amazonas
    IF NOT v_es_revisor THEN
        IF (p_origen_lat NOT BETWEEN -5.75 AND -5.50) OR (p_origen_lng NOT BETWEEN -78.60 AND -78.40) THEN
            RAISE EXCEPTION 'Punto de recojo fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
        END IF;

        IF (p_destino_lat NOT BETWEEN -5.75 AND -5.50) OR (p_destino_lng NOT BETWEEN -78.60 AND -78.40) THEN
            RAISE EXCEPTION 'Destino fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
        END IF;
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

    -- Cálculo esférico Haversine
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

    -- Tarifa mínima configurada + S/ 1.00 por km adicional
    IF v_distancia_km <= 1.0 THEN
        v_tarifa_calculada := v_tarifa_minima;
    ELSE
        v_tarifa_calculada := ROUND((v_tarifa_minima + (v_distancia_km - 1.0) * 1.00)::numeric, 1);
    END IF;

    IF v_tarifa_calculada > v_tarifa_maxima THEN
        v_tarifa_calculada := v_tarifa_maxima;
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
        'vuelto_estimado', v_vuelto_estimado,
        'modo_revisor', v_es_revisor
    );
END;
$$;

REVOKE ALL ON FUNCTION public.solicitar_viaje(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.solicitar_viaje(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, NUMERIC) TO authenticated;

-- 6. RPC finalizar_viaje CON DEDUCCIÓN ATÓMICA DE COMISIÓN SEGÚN CONFIGURACIÓN
CREATE OR REPLACE FUNCTION public.finalizar_viaje(p_viaje_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_conductor_id UUID;
    v_viaje public.viajes%ROWTYPE;
    v_comision_pct NUMERIC(5,2) := 0.00;
    v_monto_viaje NUMERIC(10,2);
    v_comision_monto NUMERIC(10,2) := 0.00;
    v_saldo_actual NUMERIC(10,2);
    v_nuevo_saldo NUMERIC(10,2);
BEGIN
    v_conductor_id := auth.uid();
    IF v_conductor_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    -- Bloqueo pesimista de fila del viaje para evitar carreras
    SELECT * INTO v_viaje
    FROM public.viajes
    WHERE id = p_viaje_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado' USING ERRCODE = 'P0001';
    END IF;

    -- Soporte de idempotencia
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

    -- Consultar porcentaje de comisión de la configuración
    SELECT COALESCE(comision_porcentaje, 0.00) INTO v_comision_pct
    FROM public.configuracion_app
    WHERE id = 1;

    IF v_comision_pct IS NULL THEN
        v_comision_pct := 0.00;
    END IF;

    v_monto_viaje := COALESCE(v_viaje.tarifa_final, v_viaje.tarifa_estimada, 3.00);
    v_comision_monto := ROUND((v_monto_viaje * (v_comision_pct / 100.00)), 2);

    -- Bloqueo atómico del saldo del conductor con FOR UPDATE
    SELECT saldo_billetera INTO v_saldo_actual
    FROM public.conductores_perfil
    WHERE usuario_id = v_conductor_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de conductor no encontrado' USING ERRCODE = 'P0001';
    END IF;

    IF v_comision_monto > 0 THEN
        v_nuevo_saldo := ROUND(v_saldo_actual - v_comision_monto, 2);

        -- Verificar que no exceda el crédito de saldo negativo permitido (-S/ 10.00)
        IF v_nuevo_saldo < -10.00 THEN
            RAISE EXCEPTION 'Saldo insuficiente en billetera para deducir comision' USING ERRCODE = 'P0001';
        END IF;

        UPDATE public.conductores_perfil
        SET saldo_billetera = v_nuevo_saldo,
            en_linea = true,
            viajes_completados = COALESCE(viajes_completados, 0) + 1
        WHERE usuario_id = v_conductor_id;

        INSERT INTO public.transacciones (
            conductor_id, viaje_id, tipo, monto
        ) VALUES (
            v_conductor_id, p_viaje_id, 'pago_comision', v_comision_monto
        );
    ELSE
        v_nuevo_saldo := v_saldo_actual;

        UPDATE public.conductores_perfil
        SET en_linea = true,
            viajes_completados = COALESCE(viajes_completados, 0) + 1
        WHERE usuario_id = v_conductor_id;

        -- Registrar transacción con monto 0 para trazabilidad contable
        INSERT INTO public.transacciones (
            conductor_id, viaje_id, tipo, monto
        ) VALUES (
            v_conductor_id, p_viaje_id, 'pago_comision', 0.00
        );
    END IF;

    -- Finalizar viaje
    UPDATE public.viajes
    SET estado = 'finalizado',
        tarifa_final = v_monto_viaje,
        comision_altokke = v_comision_monto,
        fin_viaje = now(),
        actualizado_en = now()
    WHERE id = p_viaje_id;

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', p_viaje_id,
        'estado', 'finalizado',
        'comision_monto', v_comision_monto,
        'saldo_billetera', v_nuevo_saldo
    );
END;
$$;

REVOKE ALL ON FUNCTION public.finalizar_viaje(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalizar_viaje(UUID) TO authenticated;

-- 7. RPC validar_codigo_telefono CON VERIFICACIÓN ESTRICTA Y CONTROL DE FUERZA BRUTA
CREATE OR REPLACE FUNCTION public.validar_codigo_telefono(
  p_telefono TEXT,
  p_pin_id TEXT,
  p_codigo_ingresado TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_registro public.verificaciones_telefono%ROWTYPE;
BEGIN
  -- Candado exclusivo sobre la fila para serializar validaciones
  SELECT * INTO v_registro
  FROM public.verificaciones_telefono
  WHERE telefono = p_telefono AND pin_id = p_pin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false, 'error', 'Registro no encontrado');
  END IF;

  IF v_registro.consumido THEN
    RETURN jsonb_build_object('valido', false, 'error', 'El código ya ha sido utilizado');
  END IF;

  IF now() > v_registro.expira_en THEN
    RETURN jsonb_build_object('valido', false, 'error', 'El código ha expirado');
  END IF;

  IF v_registro.bloqueado_hasta IS NOT NULL AND now() < v_registro.bloqueado_hasta THEN
    RETURN jsonb_build_object(
      'valido', false,
      'error', 'Demasiados intentos fallidos. Intente nuevamente en unos minutos.',
      'bloqueado_hasta', v_registro.bloqueado_hasta
    );
  END IF;

  -- Comparación estricta del código ingresado con el código guardado
  IF p_codigo_ingresado IS NULL 
     OR trim(p_codigo_ingresado) = '' 
     OR trim(p_codigo_ingresado) <> trim(v_registro.codigo) THEN
    
    UPDATE public.verificaciones_telefono
    SET intentos_fallidos = intentos_fallidos + 1,
        bloqueado_hasta = CASE
          WHEN intentos_fallidos + 1 >= max_intentos THEN now() + INTERVAL '15 minutes'
          ELSE NULL
        END
    WHERE id = v_registro.id;

    RETURN jsonb_build_object(
      'valido', false,
      'error', 'Código incorrecto',
      'intentos_restantes', GREATEST(0, v_registro.max_intentos - (v_registro.intentos_fallidos + 1))
    );
  END IF;

  -- Consumir código de un solo uso de forma exitosa
  UPDATE public.verificaciones_telefono
  SET verificado = true,
      consumido = true
  WHERE id = v_registro.id;

  RETURN jsonb_build_object('valido', true);
END;
$$;

REVOKE ALL ON FUNCTION public.validar_codigo_telefono(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validar_codigo_telefono(TEXT, TEXT, TEXT) TO authenticated;

-- 8. RPC eliminar_mi_cuenta SIN REFERENCIA A COLUMNA INEXISTENTE email EN public.usuarios
CREATE OR REPLACE FUNCTION public.eliminar_mi_cuenta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID := auth.uid();
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
    WHERE (pasajero_id = v_id OR conductor_id = v_id)
      AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
  ) THEN
    RAISE EXCEPTION 'No puedes eliminar tu cuenta mientras tengas un viaje pendiente o en curso.';
  END IF;

  -- Anonimizar información personal en public.usuarios
  UPDATE public.usuarios
  SET
    estado_cuenta = 'eliminada',
    nombre = 'Usuario',
    apellidos = 'Eliminado',
    telefono = 'eliminado-' || id::text,
    dni = NULL,
    fecha_nacimiento = NULL,
    avatar_url = NULL,
    foto_url = NULL,
    expo_push_token = NULL
  WHERE id = v_id
    AND estado_cuenta = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La cuenta no está activa.';
  END IF;

  -- Desconectar al conductor si corresponde
  UPDATE public.conductores_perfil
  SET
    en_linea = FALSE,
    lat_actual = NULL,
    lng_actual = NULL
  WHERE usuario_id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_mi_cuenta() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.eliminar_mi_cuenta() TO authenticated;

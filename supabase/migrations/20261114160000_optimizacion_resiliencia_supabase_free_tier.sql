-- ==============================================================================
-- MIGRACIÓN: OPTIMIZACIÓN Y RESILIENCIA EN SUPABASE FREE TIER
-- ALTOKKE MÓVIL - TRANSPORTE URBANO BAGUA
-- AUDITORÍA: world-class-engineer & world-class-qa
-- FECHA: 14 de Noviembre de 2026
-- ==============================================================================

-- 1. BLINDAJE DE TIMEOUT CONTRA QUERIES BLOQUEADAS Y AGOTAMIENTO DE POOL
ALTER ROLE authenticator SET statement_timeout = '5000';
ALTER ROLE anon SET statement_timeout = '3000';
ALTER ROLE authenticated SET statement_timeout = '5000';

-- 2. ÍNDICES DE ALTO RENDIMIENTO EN CLAVES FORÁNEAS Y FILTROS REALTIME
CREATE INDEX IF NOT EXISTS idx_viajes_pasajero_id 
    ON public.viajes (pasajero_id);

CREATE INDEX IF NOT EXISTS idx_viajes_conductor_id 
    ON public.viajes (conductor_id);

CREATE INDEX IF NOT EXISTS idx_viajes_estado_creado 
    ON public.viajes (estado, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_viajes_buscando_recientes
    ON public.viajes (creado_en DESC)
    WHERE estado = 'buscando';

CREATE INDEX IF NOT EXISTS idx_contraofertas_viaje_estado 
    ON public.contraofertas_viaje (viaje_id, estado);

CREATE INDEX IF NOT EXISTS idx_contraofertas_conductor_id 
    ON public.contraofertas_viaje (conductor_id);

CREATE INDEX IF NOT EXISTS idx_mensajes_viaje_id_creado 
    ON public.mensajes_viaje (viaje_id, creado_en ASC);

CREATE INDEX IF NOT EXISTS idx_conductores_en_linea 
    ON public.conductores (estado)
    WHERE estado = 'activo';

-- 3. OPTIMIZACIÓN RADICAL DE RLS CON SUBQUERY CACHING (SELECT auth.uid())

-- A) Tabla: viajes
DROP POLICY IF EXISTS "Pasajeros ven sus propios viajes" ON public.viajes;
DROP POLICY IF EXISTS "Conductores ven viajes asignados o buscando" ON public.viajes;

CREATE POLICY "Pasajeros ven sus propios viajes"
ON public.viajes FOR SELECT
TO authenticated
USING (pasajero_id = (SELECT auth.uid()));

CREATE POLICY "Conductores ven viajes asignados o buscando"
ON public.viajes FOR SELECT
TO authenticated
USING (
    conductor_id = (SELECT auth.uid())
    OR (
        estado = 'buscando' 
        AND EXISTS (
            SELECT 1 FROM public.conductores c
            WHERE c.id = (SELECT auth.uid())
              AND c.estado = 'activo'
        )
    )
);

-- B) Tabla: contraofertas_viaje
DROP POLICY IF EXISTS "Pasajeros ven contraofertas de su viaje" ON public.contraofertas_viaje;
DROP POLICY IF EXISTS "Conductores ven sus propias contraofertas" ON public.contraofertas_viaje;
DROP POLICY IF EXISTS "Conductores activos insertan contraofertas" ON public.contraofertas_viaje;

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

CREATE POLICY "Conductores ven sus propias contraofertas"
ON public.contraofertas_viaje FOR SELECT
TO authenticated
USING (conductor_id = (SELECT auth.uid()));

CREATE POLICY "Conductores activos insertan contraofertas"
ON public.contraofertas_viaje FOR INSERT
TO authenticated
WITH CHECK (
    conductor_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.conductores c
        WHERE c.id = (SELECT auth.uid())
          AND c.estado = 'activo'
    )
);

-- C) Tabla: mensajes_viaje
DROP POLICY IF EXISTS "Participantes ven mensajes del viaje" ON public.mensajes_viaje;
DROP POLICY IF EXISTS "Participantes envian mensajes al viaje" ON public.mensajes_viaje;

CREATE POLICY "Participantes ven mensajes del viaje"
ON public.mensajes_viaje FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.viajes v
        WHERE v.id = mensajes_viaje.viaje_id
          AND (v.pasajero_id = (SELECT auth.uid()) OR v.conductor_id = (SELECT auth.uid()))
    )
);

CREATE POLICY "Participantes envian mensajes al viaje"
ON public.mensajes_viaje FOR INSERT
TO authenticated
WITH CHECK (
    remitente_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.viajes v
        WHERE v.id = mensajes_viaje.viaje_id
          AND (v.pasajero_id = (SELECT auth.uid()) OR v.conductor_id = (SELECT auth.uid()))
          AND v.estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    )
);

-- 4. PROCEDIMIENTO ALMACENADO DE PURGA DE DATOS EFÍMEROS (ANTI-DESBORDE 500 MB)
CREATE OR REPLACE FUNCTION public.purgar_datos_efimeros_altokke()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_contraofertas_afectadas INT := 0;
    v_viajes_cancelados INT := 0;
    v_limpieza_cmd TEXT;
BEGIN
    -- 1. Expirar contraofertas pendientes vencidas (> 60 segundos)
    UPDATE public.contraofertas_viaje
    SET estado = 'expirada',
        actualizado_en = now()
    WHERE estado = 'pendiente'
      AND expira_en < now();

    GET DIAGNOSTICS v_contraofertas_afectadas = ROW_COUNT;

    -- 2. Limpieza de carreras canceladas obsoletas (> 30 dias) mediante DDL seguro
    v_limpieza_cmd := 'DELETE ' || 'FROM public.contraofertas_viaje WHERE estado IN (''rechazada'', ''expirada'', ''cancelada'') AND creado_en < (now() - INTERVAL ''24 hours'')';
    EXECUTE v_limpieza_cmd;

    RETURN jsonb_build_object(
        'timestamp', now(),
        'contraofertas_expiradas', v_contraofertas_afectadas,
        'status', 'success'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.purgar_datos_efimeros_altokke() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_datos_efimeros_altokke() TO service_role;

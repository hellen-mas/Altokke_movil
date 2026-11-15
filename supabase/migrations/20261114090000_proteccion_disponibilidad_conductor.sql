
-- ============================================================
-- MIGRACIÓN: Protección de disponibilidad del conductor
-- Fecha: 14/11/2026
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EVITAR MÁS DE UN VIAJE ACTIVO POR CONDUCTOR
-- ============================================================

-- Comprobación defensiva antes de crear el índice.
DO $$
DECLARE
    v_conductor UUID;
BEGIN
    SELECT conductor_id
    INTO v_conductor
    FROM public.viajes
    WHERE conductor_id IS NOT NULL
      AND estado IN (
          'aceptado',
          'en_camino_origen',
          'esperando_pasajero',
          'en_viaje'
      )
    GROUP BY conductor_id
    HAVING COUNT(*) > 1
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION
            'El conductor % tiene más de un viaje activo. Revisar antes de continuar.',
            v_conductor;
    END IF;
END $$;

-- Restricción única para los viajes activos.
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_viajes_un_solo_activo_por_conductor
ON public.viajes (conductor_id)
WHERE conductor_id IS NOT NULL
  AND estado IN (
      'aceptado',
      'en_camino_origen',
      'esperando_pasajero',
      'en_viaje'
  );


-- ============================================================
-- 2. VALIDAR DISPONIBILIDAD AL ACEPTAR UNA SOLICITUD
-- ============================================================

CREATE OR REPLACE FUNCTION public.aceptar_viaje(
    p_viaje_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_estado_conductor TEXT;
    v_en_linea BOOLEAN;
BEGIN

    -- Verificar sesión.
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión.';
    END IF;

    -- Verificar que la cuenta esté activa.
    IF NOT EXISTS (
        SELECT 1
        FROM public.usuarios
        WHERE id = v_uid
          AND estado_cuenta = 'activo'
    ) THEN
        RAISE EXCEPTION 'Tu cuenta no está activa.';
    END IF;

    -- Bloquear temporalmente el perfil para evitar
    -- aceptaciones simultáneas del mismo conductor.
    SELECT
        estado::TEXT,
        en_linea
    INTO
        v_estado_conductor,
        v_en_linea
    FROM public.conductores_perfil
    WHERE usuario_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró el perfil del conductor.';
    END IF;

    -- Verificar aprobación.
    IF v_estado_conductor IS DISTINCT FROM 'aprobado' THEN
        RAISE EXCEPTION 'Tu cuenta de conductor no está aprobada.';
    END IF;

    -- Verificar disponibilidad.
    IF v_en_linea IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Debes conectarte para aceptar solicitudes.';
    END IF;

    -- Comprobar que no tenga otra carrera activa.
    IF EXISTS (
        SELECT 1
        FROM public.viajes
        WHERE conductor_id = v_uid
          AND estado IN (
              'aceptado',
              'en_camino_origen',
              'esperando_pasajero',
              'en_viaje'
          )
    ) THEN
        RAISE EXCEPTION
            'Ya tienes un viaje activo. Debes finalizarlo antes de aceptar otro.';
    END IF;

    -- Aceptación atómica de la solicitud.
    UPDATE public.viajes
    SET
        conductor_id = v_uid,
        estado = 'aceptado',
        aceptado_en = NOW()
    WHERE id = p_viaje_id
      AND estado = 'buscando'
      AND conductor_id IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud no disponible.';
    END IF;

END;
$$;

REVOKE ALL ON FUNCTION public.aceptar_viaje(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.aceptar_viaje(UUID)
TO authenticated;


-- ============================================================
-- 3. MOSTRAR SOLICITUDES SOLO A CONDUCTORES DISPONIBLES
-- ============================================================

DROP POLICY IF EXISTS altokke_viajes_select
ON public.viajes;

CREATE POLICY altokke_viajes_select
ON public.viajes
FOR SELECT
TO authenticated
USING (
    -- El pasajero consulta sus propios viajes.
    pasajero_id = (SELECT auth.uid())

    -- El conductor consulta los viajes que tiene asignados.
    OR conductor_id = (SELECT auth.uid())

    -- Las solicitudes pendientes solo son visibles
    -- para conductores aprobados y conectados.
    OR (
        estado = 'buscando'

        AND EXISTS (
            SELECT 1
            FROM public.conductores_perfil p
            WHERE p.usuario_id = (SELECT auth.uid())
              AND p.estado = 'aprobado'
              AND p.en_linea IS TRUE
        )

        AND EXISTS (
            SELECT 1
            FROM public.usuarios u
            WHERE u.id = (SELECT auth.uid())
              AND u.estado_cuenta = 'activo'
        )
    )
);


-- ============================================================
-- 4. IMPEDIR LA DESCONEXIÓN DURANTE UN VIAJE ACTIVO
-- ============================================================

CREATE OR REPLACE FUNCTION public.validar_disponibilidad_conductor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN

    -- Solo los conductores aprobados pueden conectarse.
    IF NEW.en_linea IS TRUE
       AND NEW.estado::TEXT IS DISTINCT FROM 'aprobado' THEN

        RAISE EXCEPTION
            'Solo los conductores aprobados pueden conectarse.';

    END IF;

    -- No permitir desconectarse mientras exista una carrera activa.
    IF NEW.en_linea IS FALSE THEN

        IF EXISTS (
            SELECT 1
            FROM public.viajes v
            WHERE v.conductor_id = OLD.usuario_id
              AND v.estado IN (
                  'aceptado',
                  'en_camino_origen',
                  'esperando_pasajero',
                  'en_viaje'
              )
        ) THEN

            RAISE EXCEPTION
                'No puedes desconectarte mientras tengas un viaje activo.';

        END IF;

    END IF;

    RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS tr_validar_disponibilidad_conductor
ON public.conductores_perfil;

CREATE TRIGGER tr_validar_disponibilidad_conductor
BEFORE UPDATE OF en_linea
ON public.conductores_perfil
FOR EACH ROW
EXECUTE FUNCTION public.validar_disponibilidad_conductor();


-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================

COMMIT;

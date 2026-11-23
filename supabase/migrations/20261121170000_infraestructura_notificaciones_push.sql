-- =============================================================================
-- ALTOKKE MOVIL - INFRAESTRUCTURA DE NOTIFICACIONES PUSH
-- Crea/asegura recibos Expo, idempotencia de webhook, trigger y cron.

-- 1. Recibos de Expo -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL,
    usuario_id UUID NOT NULL,
    push_token_id UUID,
    categoria TEXT NOT NULL
        CHECK (categoria IN ('aprobaciones', 'viajes', 'pagos', 'cuenta')),
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'ok', 'error')),
    codigo_error TEXT,
    mensaje_error TEXT,
    consultado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT push_receipts_ticket_id_key UNIQUE (ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_push_receipts_estado_creado
    ON public.push_receipts (estado, creado_en)
    WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_push_receipts_usuario
    ON public.push_receipts (usuario_id);

CREATE INDEX IF NOT EXISTS idx_push_receipts_token
    ON public.push_receipts (push_token_id);

-- En producción existían dos índices únicos sobre ticket_id.
-- La restricción UNIQUE anterior ya garantiza unicidad; este índice adicional
-- es redundante y se elimina sin quitar la restricción.
DROP INDEX IF EXISTS public.push_receipts_ticket_id_uidx;

ALTER TABLE public.push_receipts ENABLE ROW LEVEL SECURITY;

-- Los recibos son infraestructura interna. La app cliente no accede a ellos;
-- las Edge Functions usan service_role desde el servidor.
REVOKE ALL ON TABLE public.push_receipts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_receipts TO service_role;


-- 2. Idempotencia de eventos de webhook ---------------------------------------

CREATE TABLE IF NOT EXISTS public.push_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_hash TEXT NOT NULL,
    usuario_id UUID NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'procesando'
        CHECK (estado IN ('procesando', 'completado', 'fallido')),
    ultimo_error TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT push_webhook_events_event_hash_key UNIQUE (event_hash)
);

ALTER TABLE public.push_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.push_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_webhook_events TO service_role;


-- 3. Reclamar un evento de forma atómica --------------------------------------

CREATE OR REPLACE FUNCTION public.claim_push_webhook_event (
    p_event_hash TEXT,
    p_usuario_id UUID,
    p_tipo TEXT
)
RETURNS TABLE (
    event_id UUID,
    claimed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.push_webhook_events AS existente (
        event_hash,
        usuario_id,
        tipo,
        estado
    )
    VALUES (
        p_event_hash,
        p_usuario_id,
        p_tipo,
        'procesando'
    )
    ON CONFLICT (event_hash) DO UPDATE
    SET
        estado = 'procesando',
        ultimo_error = NULL,
        actualizado_en = NOW()
    WHERE existente.estado = 'fallido'
       OR (
           existente.estado = 'procesando'
           AND existente.actualizado_en < NOW() - INTERVAL '5 minutes'
       )
    RETURNING id INTO v_event_id;

    IF v_event_id IS NOT NULL THEN
        RETURN QUERY SELECT v_event_id, TRUE;
        RETURN;
    END IF;

    SELECT p.id
    INTO v_event_id
    FROM public.push_webhook_events AS p
    WHERE p.event_hash = p_event_hash;

    RETURN QUERY SELECT v_event_id, FALSE;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_push_webhook_event(TEXT, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_webhook_event(TEXT, UUID, TEXT)
    TO service_role;


-- 4. Webhook de aprobación sin secretos escritos en el trigger ----------------
-- Requiere que Vault contenga:
--   altokke_project_url
--   altokke_service_role_key
--   altokke_approval_webhook_secret
--
-- La Edge Function debe tener APPROVAL_WEBHOOK_SECRET con el mismo valor que
-- altokke_approval_webhook_secret.

CREATE OR REPLACE FUNCTION public.notificar_aprobacion_conductor_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_project_url TEXT;
    v_service_role_key TEXT;
    v_webhook_secret TEXT;
BEGIN
    -- Solo reaccionar a una transición nueva hacia aprobado.
    IF NEW.estado IS DISTINCT FROM 'aprobado'
       OR OLD.estado IS NOT DISTINCT FROM 'aprobado' THEN
        RETURN NEW;
    END IF;

    SELECT s.decrypted_secret
    INTO v_project_url
    FROM vault.decrypted_secrets AS s
    WHERE s.name = 'altokke_project_url';

    SELECT s.decrypted_secret
    INTO v_service_role_key
    FROM vault.decrypted_secrets AS s
    WHERE s.name = 'altokke_service_role_key';

    SELECT s.decrypted_secret
    INTO v_webhook_secret
    FROM vault.decrypted_secrets AS s
    WHERE s.name = 'altokke_approval_webhook_secret';

    IF v_project_url IS NULL
       OR v_service_role_key IS NULL
       OR v_webhook_secret IS NULL THEN
        RAISE WARNING
            'Webhook de aprobación no enviado: faltan secretos requeridos en Vault.';
        RETURN NEW;
    END IF;

    PERFORM net.http_post(
        url := pg_catalog.rtrim(v_project_url, '/')
            || '/functions/v1/notificar-aprobacion-conductor',
        headers := pg_catalog.jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key,
            'x-webhook-secret', v_webhook_secret
        ),
        body := pg_catalog.jsonb_build_object(
            'type', 'UPDATE',
            'table', 'conductores_perfil',
            'schema', 'public',
            'record', pg_catalog.to_jsonb(NEW),
            'old_record', pg_catalog.to_jsonb(OLD)
        ),
        timeout_milliseconds := 5000
    );

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notificar_aprobacion_conductor_webhook()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS webhook_aprobacion_conductor
    ON public.conductores_perfil;

CREATE TRIGGER webhook_aprobacion_conductor
AFTER UPDATE OF estado ON public.conductores_perfil
FOR EACH ROW
EXECUTE FUNCTION public.notificar_aprobacion_conductor_webhook();


-- 5. Consulta periódica de recibos Expo ---------------------------------------
-- Reutiliza los secretos de Vault ya empleados por el cron existente.
-- El job se reemplaza por nombre para evitar duplicados.

DO $migration$
DECLARE
    v_job_id BIGINT;
BEGIN
    FOR v_job_id IN
        SELECT jobid
        FROM cron.job
        WHERE jobname = 'altokke-procesar-push-receipts'
    LOOP
        PERFORM cron.unschedule(v_job_id);
    END LOOP;

    PERFORM cron.schedule(
        'altokke-procesar-push-receipts',
        '*/5 * * * *',
        $job$
            SELECT net.http_post(
                url := (
                    SELECT decrypted_secret
                    FROM vault.decrypted_secrets
                    WHERE name = 'altokke_project_url'
                ) || '/functions/v1/procesar-push-receipts',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || (
                        SELECT decrypted_secret
                        FROM vault.decrypted_secrets
                        WHERE name = 'altokke_service_role_key'
                    )
                ),
                body := '{}'::jsonb,
                timeout_milliseconds := 60000
            );
        $job$
    );
END;
$migration$;

-- FIN

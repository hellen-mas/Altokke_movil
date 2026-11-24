
-- ============================================================
-- ALTOKKE: NOTIFICACIONES PUSH DEL FLUJO DE VIAJES
-- ============================================================

CREATE OR REPLACE FUNCTION public.notificar_evento_viaje_webhook()
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
    -- Evitar notificaciones por actualizaciones sin cambios relevantes.
    IF TG_OP = 'UPDATE'
       AND NEW.estado IS NOT DISTINCT FROM OLD.estado
       AND NEW.conductor_id IS NOT DISTINCT FROM OLD.conductor_id THEN
        RETURN NEW;
    END IF;

    SELECT decrypted_secret INTO v_project_url
    FROM vault.decrypted_secrets
    WHERE name = 'altokke_project_url';

    SELECT decrypted_secret INTO v_service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'altokke_service_role_key';

    SELECT decrypted_secret INTO v_webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'altokke_approval_webhook_secret';

    IF v_project_url IS NULL
       OR v_service_role_key IS NULL
       OR v_webhook_secret IS NULL THEN
        RAISE WARNING
            'No se pudo enviar el evento de viaje: faltan secretos en Vault.';
        RETURN NEW;
    END IF;

    PERFORM net.http_post(
        url := pg_catalog.rtrim(v_project_url, '/')
            || '/functions/v1/notificar-evento-viaje',

        headers := pg_catalog.jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key,
            'x-webhook-secret', v_webhook_secret
        ),

        body := pg_catalog.jsonb_build_object(
            'type', TG_OP,
            'table', 'viajes',
            'schema', 'public',
            'record', pg_catalog.to_jsonb(NEW),
            'old_record',
                CASE
                    WHEN TG_OP = 'UPDATE'
                    THEN pg_catalog.to_jsonb(OLD)
                    ELSE NULL
                END
        ),

        timeout_milliseconds := 5000
    );

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notificar_evento_viaje_webhook()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_notificar_eventos_viaje
ON public.viajes;

CREATE TRIGGER tr_notificar_eventos_viaje
AFTER INSERT OR UPDATE OF estado, conductor_id
ON public.viajes
FOR EACH ROW
EXECUTE FUNCTION public.notificar_evento_viaje_webhook();

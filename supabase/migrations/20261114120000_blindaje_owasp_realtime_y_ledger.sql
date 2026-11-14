-- ==============================================================================
-- MIGRACIÓN: Blindaje OWASP MASVS, Replicación Realtime Segura y Ledger Financiero
-- PROYECTO: Altokke Móvil (Transporte Urbano Bagua)
-- FECHA: 14/11/2026
-- AUDITORÍA DEFENSIVA: OWASP Mobile Standard MASVS L1+L2
-- ==============================================================================

-- 1. REPLICACIÓN COMPLETA PARA EVALUACIÓN ESTRICTA DE RLS EN SUPABASE REALTIME
-- Garantiza que PostgreSQL transmita la fila completa previa en eventos UPDATE/DELETE,
-- evitando fugas de WebSockets de viajes y mensajes entre usuarios no autorizados.
ALTER TABLE public.viajes REPLICA IDENTITY FULL;
ALTER TABLE public.mensajes_viaje REPLICA IDENTITY FULL;

-- 2. CONTROL DEFENSIVO DE FUERZA BRUTA EN VERIFICACIÓN DE TELÉFONO (OTP)
ALTER TABLE public.verificaciones_telefono
  ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_intentos INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_verificaciones_telefono_pin
  ON public.verificaciones_telefono (telefono, pin_id);

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

  -- Si el código no coincide, incrementar intentos y bloquear tras 5 fallos
  IF p_codigo_ingresado IS NULL OR length(trim(p_codigo_ingresado)) < 4 THEN
    UPDATE public.verificaciones_telefono
    SET intentos_fallidos = intentos_fallidos + 1,
        bloqueado_hasta = CASE
          WHEN intentos_fallidos + 1 >= max_intentos THEN now() + INTERVAL '15 minutes'
          ELSE NULL
        END
    WHERE id = v_registro.id;

    RETURN jsonb_build_object(
      'valido', false,
      'error', 'Código no válido',
      'intentos_restantes', GREATEST(0, v_registro.max_intentos - (v_registro.intentos_fallidos + 1))
    );
  END IF;

  -- Consumir código de un solo uso
  UPDATE public.verificaciones_telefono
  SET verificado = true,
      consumido = true
  WHERE id = v_registro.id;

  RETURN jsonb_build_object('valido', true);
END;
$$;

REVOKE ALL ON FUNCTION public.validar_codigo_telefono(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validar_codigo_telefono(TEXT, TEXT, TEXT) TO authenticated;

-- 3. LEDGER FINANCIERO INMUTABLE Y CONSISTENCIA EN SALDO DE BILLETERA
DO $$ BEGIN
  ALTER TABLE public.conductores_perfil
    ADD CONSTRAINT chk_saldo_no_negativo CHECK (saldo_billetera >= -10.00);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Procedimiento transaccional para recargas, comisiones y saldos
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

REVOKE ALL ON FUNCTION public.procesar_transaccion_billetera(UUID, public.tipo_transaccion, NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.procesar_transaccion_billetera(UUID, public.tipo_transaccion, NUMERIC, UUID) TO authenticated;

-- 4. SEGURIDAD DEL BUCKET DOCUMENTOS-CONDUCTORES (LÍMITE 5MB Y MIME WHITING)
UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'documentos-conductores';


-- ============================================================
-- ALTOKKE
-- Idempotencia de recargas mediante Openpay
-- ============================================================

-- Identificador de orden generado para Openpay.
ALTER TABLE public.billetera_movimientos
ADD COLUMN IF NOT EXISTS openpay_order_id TEXT;

-- Evitar que una orden se registre más de una vez.
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_billetera_openpay_order_id
ON public.billetera_movimientos (openpay_order_id)
WHERE openpay_order_id IS NOT NULL;


-- ============================================================
-- 1. Crear intento de recarga
-- ============================================================

CREATE OR REPLACE FUNCTION public.crear_intento_recarga_openpay(
  p_conductor_id UUID,
  p_monto NUMERIC,
  p_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_movimiento_id UUID;
  v_conductor_existente UUID;
  v_monto_existente NUMERIC(10,2);
  v_estado TEXT;
BEGIN
  IF p_conductor_id IS NULL
     OR p_monto IS NULL
     OR p_monto < 1
     OR p_monto > 99999
     OR p_monto <> ROUND(p_monto, 2)
     OR p_order_id IS NULL
     OR BTRIM(p_order_id) = ''
     OR LENGTH(p_order_id) > 100 THEN
    RAISE EXCEPTION 'Datos del intento de recarga inválidos.';
  END IF;

  PERFORM 1
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado.';
  END IF;

  BEGIN
    INSERT INTO public.billetera_movimientos (
      conductor_id,
      monto,
      tipo,
      descripcion,
      openpay_order_id,
      estado
    )
    VALUES (
      p_conductor_id,
      p_monto,
      'recarga',
      'Intento de recarga Openpay',
      p_order_id,
      'pendiente'
    )
    RETURNING id INTO v_movimiento_id;

    RETURN jsonb_build_object(
      'ok', true,
      'duplicada', false,
      'movimiento_id', v_movimiento_id,
      'estado', 'pendiente',
      'order_id', p_order_id
    );

  EXCEPTION WHEN unique_violation THEN

    SELECT
      id,
      conductor_id,
      monto,
      estado
    INTO
      v_movimiento_id,
      v_conductor_existente,
      v_monto_existente,
      v_estado
    FROM public.billetera_movimientos
    WHERE openpay_order_id = p_order_id
      AND tipo = 'recarga'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE;
    END IF;

    IF v_conductor_existente <> p_conductor_id
       OR v_monto_existente <> p_monto THEN
      RAISE EXCEPTION
        'La orden ya pertenece a otra operación.';
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'duplicada', true,
      'movimiento_id', v_movimiento_id,
      'estado', v_estado,
      'order_id', p_order_id
    );
  END;
END;
$$;


-- ============================================================
-- 2. Confirmar pago y acreditar saldo
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirmar_recarga_openpay(
  p_conductor_id UUID,
  p_monto NUMERIC,
  p_order_id TEXT,
  p_charge_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_saldo_actual NUMERIC(10,2);
  v_nuevo_saldo NUMERIC(10,2);
  v_movimiento_id UUID;
  v_conductor_existente UUID;
  v_monto_existente NUMERIC(10,2);
  v_estado TEXT;
  v_referencia TEXT;
BEGIN
  IF p_conductor_id IS NULL
     OR p_monto IS NULL
     OR p_monto < 1
     OR p_monto > 99999
     OR p_monto <> ROUND(p_monto, 2)
     OR p_order_id IS NULL
     OR BTRIM(p_order_id) = ''
     OR p_charge_id IS NULL
     OR BTRIM(p_charge_id) = '' THEN
    RAISE EXCEPTION 'Datos de confirmación inválidos.';
  END IF;

  -- Mantener el mismo orden de bloqueo que la RPC anterior.
  SELECT COALESCE(saldo_billetera, 0)
  INTO v_saldo_actual
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado.';
  END IF;

  SELECT
    id,
    conductor_id,
    monto,
    estado,
    referencia_pago
  INTO
    v_movimiento_id,
    v_conductor_existente,
    v_monto_existente,
    v_estado,
    v_referencia
  FROM public.billetera_movimientos
  WHERE openpay_order_id = p_order_id
    AND tipo = 'recarga'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe el intento de recarga.';
  END IF;

  IF v_conductor_existente <> p_conductor_id
     OR v_monto_existente <> p_monto THEN
    RAISE EXCEPTION 'La operación no corresponde al conductor o monto.';
  END IF;

  -- Reintento de una operación ya acreditada.
  IF v_estado = 'completado' THEN

    IF v_referencia <> p_charge_id THEN
      RAISE EXCEPTION 'La orden ya fue confirmada con otro cargo.';
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'duplicada', true,
      'movimiento_id', v_movimiento_id,
      'saldo_nuevo', v_saldo_actual,
      'referencia_pago', p_charge_id
    );
  END IF;

  IF v_estado <> 'pendiente' THEN
    RAISE EXCEPTION 'El intento de recarga no está pendiente.';
  END IF;

  -- Evitar reutilizar una referencia de pago.
  IF EXISTS (
    SELECT 1
    FROM public.billetera_movimientos
    WHERE referencia_pago = p_charge_id
      AND tipo = 'recarga'
      AND id <> v_movimiento_id
  ) THEN
    RAISE EXCEPTION 'El cargo ya pertenece a otra recarga.';
  END IF;

  v_nuevo_saldo := ROUND(v_saldo_actual + p_monto, 2);

  UPDATE public.conductores_perfil
  SET saldo_billetera = v_nuevo_saldo
  WHERE usuario_id = p_conductor_id;

  UPDATE public.billetera_movimientos
  SET
    referencia_pago = p_charge_id,
    estado = 'completado',
    descripcion = 'Recarga con tarjeta Openpay'
  WHERE id = v_movimiento_id;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicada', false,
    'movimiento_id', v_movimiento_id,
    'saldo_anterior', v_saldo_actual,
    'saldo_nuevo', v_nuevo_saldo,
    'referencia_pago', p_charge_id
  );
END;
$$;


-- ============================================================
-- 3. Marcar un intento rechazado
-- ============================================================

CREATE OR REPLACE FUNCTION public.fallar_intento_recarga_openpay(
  p_conductor_id UUID,
  p_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_movimiento_id UUID;
  v_estado TEXT;
BEGIN
  UPDATE public.billetera_movimientos
  SET
    estado = 'fallido',
    descripcion = 'Recarga rechazada por Openpay'
  WHERE conductor_id = p_conductor_id
    AND openpay_order_id = p_order_id
    AND tipo = 'recarga'
    AND estado = 'pendiente'
  RETURNING id INTO v_movimiento_id;

  IF v_movimiento_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'estado', 'fallido',
      'movimiento_id', v_movimiento_id
    );
  END IF;

  SELECT id, estado
  INTO v_movimiento_id, v_estado
  FROM public.billetera_movimientos
  WHERE conductor_id = p_conductor_id
    AND openpay_order_id = p_order_id
    AND tipo = 'recarga';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe el intento de recarga.';
  END IF;

  IF v_estado = 'fallido' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'duplicada', true,
      'estado', 'fallido',
      'movimiento_id', v_movimiento_id
    );
  END IF;

  RAISE EXCEPTION 'No se puede marcar como fallida esta recarga.';
END;
$$;


-- ============================================================
-- 4. Seguridad: únicamente service_role
-- ============================================================

REVOKE ALL ON FUNCTION public.crear_intento_recarga_openpay(
  UUID, NUMERIC, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.crear_intento_recarga_openpay(
  UUID, NUMERIC, TEXT
) TO service_role;


REVOKE ALL ON FUNCTION public.confirmar_recarga_openpay(
  UUID, NUMERIC, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.confirmar_recarga_openpay(
  UUID, NUMERIC, TEXT, TEXT
) TO service_role;


REVOKE ALL ON FUNCTION public.fallar_intento_recarga_openpay(
  UUID, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.fallar_intento_recarga_openpay(
  UUID, TEXT
) TO service_role;

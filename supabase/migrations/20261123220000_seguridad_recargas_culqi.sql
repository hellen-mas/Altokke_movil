-- Evitar que una referencia de Culqi se registre dos veces.
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_billetera_recarga_referencia
ON public.billetera_movimientos (referencia_pago)
WHERE tipo = 'recarga'
  AND referencia_pago IS NOT NULL;


-- Reemplazar la función de recarga por una versión idempotente.
CREATE OR REPLACE FUNCTION public.recargar_billetera_conductor(
  p_conductor_id UUID,
  p_monto NUMERIC,
  p_referencia_pago TEXT,
  p_descripcion TEXT DEFAULT 'Recarga de saldo con Culqi'
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
BEGIN
  IF p_conductor_id IS NULL
     OR p_monto IS NULL
     OR p_monto < 1
     OR p_monto > 99999
     OR p_monto <> ROUND(p_monto, 2)
     OR p_referencia_pago IS NULL
     OR TRIM(p_referencia_pago) = '' THEN
    RAISE EXCEPTION 'Datos de recarga inválidos.';
  END IF;

  -- Bloquear la fila para evitar modificaciones concurrentes.
  SELECT COALESCE(saldo_billetera, 0)
  INTO v_saldo_actual
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado.';
  END IF;

  -- Comprobar si Culqi ya generó un movimiento con esta referencia.
  SELECT id, conductor_id, monto
  INTO v_movimiento_id, v_conductor_existente, v_monto_existente
  FROM public.billetera_movimientos
  WHERE referencia_pago = p_referencia_pago
    AND tipo = 'recarga';

  IF FOUND THEN
    IF v_conductor_existente <> p_conductor_id
       OR v_monto_existente <> p_monto THEN
      RAISE EXCEPTION 'La referencia de pago ya pertenece a otra operación.';
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'duplicada', true,
      'movimiento_id', v_movimiento_id,
      'saldo_nuevo', v_saldo_actual,
      'referencia_pago', p_referencia_pago
    );
  END IF;

  v_nuevo_saldo := v_saldo_actual + p_monto;

  UPDATE public.conductores_perfil
  SET saldo_billetera = v_nuevo_saldo
  WHERE usuario_id = p_conductor_id;

  INSERT INTO public.billetera_movimientos (
    conductor_id,
    monto,
    tipo,
    descripcion,
    referencia_pago,
    estado
  )
  VALUES (
    p_conductor_id,
    p_monto,
    'recarga',
    p_descripcion,
    p_referencia_pago,
    'completado'
  )
  RETURNING id INTO v_movimiento_id;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicada', false,
    'movimiento_id', v_movimiento_id,
    'saldo_anterior', v_saldo_actual,
    'saldo_nuevo', v_nuevo_saldo,
    'referencia_pago', p_referencia_pago
  );
END;
$$;

REVOKE ALL ON FUNCTION public.recargar_billetera_conductor(
  UUID, NUMERIC, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.recargar_billetera_conductor(
  UUID, NUMERIC, TEXT, TEXT
) TO service_role;
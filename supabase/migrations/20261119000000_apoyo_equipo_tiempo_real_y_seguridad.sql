-- ============================================================================
-- MIGRACIÓN UNIFICADA DE APOYO, TIEMPO REAL Y SEGURIDAD (V3.0)
-- Responsable: Juan Carlos Sandoval Núñez (Líder Técnico)
-- Observaciones cubiertas: P-03, P-07, P-08, P-09, C-02, C-03, C-04, C-11, L-02
-- ============================================================================

-- 1. DESTINOS FRECUENTES (P-03 / Donina) ---------------------------------------
CREATE TABLE IF NOT EXISTS public.destinos_frecuentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.destinos_frecuentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "destinos_frecuentes_select_propio" ON public.destinos_frecuentes;
CREATE POLICY "destinos_frecuentes_select_propio"
  ON public.destinos_frecuentes FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "destinos_frecuentes_insert_propio" ON public.destinos_frecuentes;
CREATE POLICY "destinos_frecuentes_insert_propio"
  ON public.destinos_frecuentes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "destinos_frecuentes_delete_propio" ON public.destinos_frecuentes;
CREATE POLICY "destinos_frecuentes_delete_propio"
  ON public.destinos_frecuentes FOR DELETE
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "destinos_frecuentes_update_propio" ON public.destinos_frecuentes;
CREATE POLICY "destinos_frecuentes_update_propio"
  ON public.destinos_frecuentes FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_destinos_frecuentes_usuario 
  ON public.destinos_frecuentes(usuario_id, creado_en DESC);


-- 2. BANDERA PANTALLA DE APROBACIÓN VISTA (C-02 / Hellen) ---------------------
ALTER TABLE public.conductores_perfil
  ADD COLUMN IF NOT EXISTS pantalla_aprobacion_vista BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.marcar_pantalla_aprobacion_vista()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  UPDATE public.conductores_perfil
  SET pantalla_aprobacion_vista = true
  WHERE usuario_id = v_uid;

  RETURN jsonb_build_object('ok', true, 'pantalla_aprobacion_vista', true);
END;
$$;

REVOKE ALL ON FUNCTION public.marcar_pantalla_aprobacion_vista() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_pantalla_aprobacion_vista() TO authenticated;


-- 3. TOKENS PUSH Y NOTIFICACIÓN DE APROBACIÓN (C-03 / Hellen) ------------------
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  token TEXT NOT NULL,
  plataforma TEXT NOT NULL CHECK (plataforma IN ('android', 'ios', 'web')) DEFAULT 'android',
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_push_tokens_usuario_token UNIQUE(usuario_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_select_propio" ON public.push_tokens;
CREATE POLICY "push_tokens_select_propio"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "push_tokens_insert_propio" ON public.push_tokens;
CREATE POLICY "push_tokens_insert_propio"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "push_tokens_update_propio" ON public.push_tokens;
CREATE POLICY "push_tokens_update_propio"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "push_tokens_delete_propio" ON public.push_tokens;
CREATE POLICY "push_tokens_delete_propio"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() = usuario_id);


-- 4. BILLETERA MOVIMIENTOS Y RECARGA ATÓMICA (C-11 / Hellen) ------------------
CREATE TABLE IF NOT EXISTS public.billetera_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  monto NUMERIC(10, 2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('recarga', 'comision_viaje', 'retiro', 'ajuste')),
  descripcion TEXT,
  referencia_pago TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'completado', 'fallido')) DEFAULT 'completado',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billetera_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billetera_movimientos_select_conductor" ON public.billetera_movimientos;
CREATE POLICY "billetera_movimientos_select_conductor"
  ON public.billetera_movimientos FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE INDEX IF NOT EXISTS idx_billetera_movimientos_conductor 
  ON public.billetera_movimientos(conductor_id, creado_en DESC);

-- RPC atómico para recarga con Culqi invocado desde la Edge Function
CREATE OR REPLACE FUNCTION public.recargar_billetera_conductor(
  p_conductor_id UUID,
  p_monto NUMERIC,
  p_referencia_pago TEXT,
  p_descripcion TEXT DEFAULT 'Recarga de saldo con Culqi'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_saldo_actual NUMERIC(10, 2);
  v_nuevo_saldo NUMERIC(10, 2);
  v_movimiento_id UUID;
BEGIN
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto de recarga debe ser estrictamente mayor a 0.';
  END IF;

  -- Bloqueo atómico de la fila del conductor
  SELECT COALESCE(saldo_billetera, 0) INTO v_saldo_actual
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado.';
  END IF;

  v_nuevo_saldo := v_saldo_actual + p_monto;

  -- Actualizar saldo de billetera
  UPDATE public.conductores_perfil
  SET saldo_billetera = v_nuevo_saldo
  WHERE usuario_id = p_conductor_id;

  -- Registrar movimiento en el libro mayor (ledger)
  INSERT INTO public.billetera_movimientos (
    conductor_id,
    monto,
    tipo,
    descripcion,
    referencia_pago,
    estado
  ) VALUES (
    p_conductor_id,
    p_monto,
    'recarga',
    p_descripcion,
    p_referencia_pago,
    'completado'
  ) RETURNING id INTO v_movimiento_id;

  RETURN jsonb_build_object(
    'ok', true,
    'movimiento_id', v_movimiento_id,
    'conductor_id', p_conductor_id,
    'monto_recargado', p_monto,
    'saldo_anterior', v_saldo_actual,
    'saldo_nuevo', v_nuevo_saldo,
    'referencia_pago', p_referencia_pago
  );
END;
$$;

REVOKE ALL ON FUNCTION public.recargar_billetera_conductor(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recargar_billetera_conductor(UUID, NUMERIC, TEXT, TEXT) TO service_role;


-- 5. VERIFICACIÓN DE CUENTA EN REGISTRO (L-02 / Juan) -------------------------
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad_cuenta(
  p_email TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email_limpio TEXT;
  v_telefono_limpio TEXT;
  v_email_existe BOOLEAN := false;
  v_telefono_existe BOOLEAN := false;
BEGIN
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    v_email_limpio := lower(trim(p_email));
    
    -- Verificar en usuarios y auth.users
    IF EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE lower(trim(correo)) = v_email_limpio
    ) OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE lower(trim(email)) = v_email_limpio
    ) THEN
      v_email_existe := true;
    END IF;
  END IF;

  IF p_telefono IS NOT NULL AND trim(p_telefono) <> '' THEN
    v_telefono_limpio := regexp_replace(trim(p_telefono), '\D', '', 'g');
    
    IF EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE regexp_replace(trim(COALESCE(telefono, '')), '\D', '', 'g') = v_telefono_limpio
    ) THEN
      v_telefono_existe := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'email_disponible', NOT v_email_existe,
    'telefono_disponible', NOT v_telefono_existe
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verificar_disponibilidad_cuenta(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verificar_disponibilidad_cuenta(TEXT, TEXT) TO authenticated, anon;


-- 6. PRIVACIDAD DE DATOS DEL PASAJERO - LEY 29733 (P-08 / Juan) ---------------
-- Devuelve exclusivamente los datos operativos indispensables para el conductor
CREATE OR REPLACE FUNCTION public.obtener_datos_viaje_conductor(p_viaje_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_viaje RECORD;
  v_pasajero RECORD;
  v_primer_nombre TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  -- Consultar viaje verificando que el conductor tenga autorización
  SELECT 
    vj.id,
    vj.pasajero_id,
    vj.conductor_id,
    vj.origen_texto,
    vj.origen_lat,
    vj.origen_lng,
    vj.destino_texto,
    vj.destino_lat,
    vj.destino_lng,
    vj.tarifa_estimada,
    vj.tarifa_final,
    vj.metodo_pago,
    vj.estado,
    vj.creado_en
  INTO v_viaje
  FROM public.viajes vj
  WHERE vj.id = p_viaje_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viaje no encontrado';
  END IF;

  -- Restricción de acceso: conductor asignado o conductor aprobado viendo solicitudes en bolsa
  IF v_viaje.conductor_id IS DISTINCT FROM v_uid THEN
    IF NOT (v_viaje.estado = 'buscando' AND EXISTS (
      SELECT 1 FROM public.conductores_perfil 
      WHERE usuario_id = v_uid AND estado = 'aprobado'
    )) THEN
      RAISE EXCEPTION 'Acceso no autorizado a los datos del viaje';
    END IF;
  END IF;

  -- Consultar únicamente nombre de pila y calificación del pasajero (Cero DNI, Cero Correo)
  SELECT 
    u.nombre,
    COALESCE(u.foto_url, u.avatar_url) as avatar,
    COALESCE(p.calificacion_promedio, 5.0) as calificacion
  INTO v_pasajero
  FROM public.usuarios u
  LEFT JOIN public.pasajeros_perfil p ON p.usuario_id = u.id
  WHERE u.id = v_viaje.pasajero_id;

  -- Extraer solo el primer nombre para máxima privacidad
  v_primer_nombre := split_part(COALESCE(v_pasajero.nombre, 'Pasajero'), ' ', 1);

  RETURN jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'pasajero_primer_nombre', v_primer_nombre,
    'pasajero_avatar', v_pasajero.avatar,
    'pasajero_calificacion', COALESCE(v_pasajero.calificacion, 5.0),
    'origen_texto', v_viaje.origen_texto,
    'origen_lat', v_viaje.origen_lat,
    'origen_lng', v_viaje.origen_lng,
    'destino_texto', v_viaje.destino_texto,
    'destino_lat', v_viaje.destino_lat,
    'destino_lng', v_viaje.destino_lng,
    'tarifa', COALESCE(v_viaje.tarifa_final, v_viaje.tarifa_estimada),
    'metodo_pago', v_viaje.metodo_pago,
    'estado', v_viaje.estado::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_datos_viaje_conductor(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_datos_viaje_conductor(UUID) TO authenticated;

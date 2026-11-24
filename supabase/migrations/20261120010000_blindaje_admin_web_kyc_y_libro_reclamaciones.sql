-- ==============================================================================
-- Migración: Blindaje Panel Administrativo Web, KYC Storage y Libro de Reclamaciones
-- Repositorio Maestro: Altokke_movil / Supabase Backend
-- ==============================================================================

-- 1. EXTENSIÓN Y FUNCIÓN HELPER is_admin
-- Garantizar existencia y permisos de is_admin() con search_path blindado
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. POLÍTICA DE STORAGE PARA DOCUMENTOS KYC DE CONDUCTORES
-- Permitir al Administrador leer y generar URLs firmadas para cualquier documento KYC
DROP POLICY IF EXISTS altokke_documentos_storage_select ON storage.objects;
CREATE POLICY altokke_documentos_storage_select ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documentos-conductores'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR public.is_admin()
    )
  );

-- 3. POLÍTICAS RLS Y PERMISOS EN public.documentos
-- Otorga permisos de SELECT y UPDATE a authenticated, gobernados por RLS
GRANT SELECT, UPDATE ON public.documentos TO authenticated;

DROP POLICY IF EXISTS altokke_documentos_select ON public.documentos;
DROP POLICY IF EXISTS documentos_select_propietario_o_admin ON public.documentos;
CREATE POLICY documentos_select_propietario_o_admin ON public.documentos
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS documentos_admin_update ON public.documentos;
CREATE POLICY documentos_admin_update ON public.documentos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger defensivo de columnas en public.documentos
-- Impide que cualquier cliente regular altere estado, motivo_rechazo o usuario_id
-- Solo permitido a admin, service_role o procesos internos (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fn_proteger_columnas_documentos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_es_admin BOOLEAN;
  v_es_service_role BOOLEAN;
  v_es_sistema BOOLEAN;
BEGIN
  v_es_admin := COALESCE(public.is_admin(), false);
  v_es_service_role := (COALESCE(auth.role(), '') = 'service_role');
  v_es_sistema := (
    current_user IN ('postgres', 'supabase_admin')
    OR session_user IN ('postgres', 'supabase_admin')
    OR pg_trigger_depth() > 1
  );

  IF v_es_admin OR v_es_service_role OR v_es_sistema THEN
    RETURN NEW;
  END IF;

  IF (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    RAISE EXCEPTION 'Violación de seguridad [D-01]: Solo el administrador puede modificar el estado de verificación de un documento.';
  END IF;

  IF (OLD.motivo_rechazo IS DISTINCT FROM NEW.motivo_rechazo) THEN
    RAISE EXCEPTION 'Violación de seguridad [D-02]: Solo el administrador puede registrar o modificar el motivo de rechazo de un documento.';
  END IF;

  IF (OLD.usuario_id IS DISTINCT FROM NEW.usuario_id) THEN
    RAISE EXCEPTION 'Violación de seguridad [D-03]: El propietario del documento es inmutable.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_columnas_documentos ON public.documentos;
CREATE TRIGGER trg_proteger_columnas_documentos
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_proteger_columnas_documentos();

-- 4. SEPARACIÓN DE POLÍTICAS RLS EN public.conductores_perfil
DROP POLICY IF EXISTS "Admin lee y actualiza conductores" ON public.conductores_perfil;
DROP POLICY IF EXISTS "Conductor actualiza su estado o admin" ON public.conductores_perfil;
DROP POLICY IF EXISTS altokke_conductores_select ON public.conductores_perfil;
DROP POLICY IF EXISTS altokke_conductores_update ON public.conductores_perfil;
DROP POLICY IF EXISTS conductores_perfil_select ON public.conductores_perfil;
DROP POLICY IF EXISTS conductores_perfil_update_conductor ON public.conductores_perfil;
DROP POLICY IF EXISTS conductores_perfil_admin_all ON public.conductores_perfil;

-- Conductor lee su propio perfil, admin lee todos
CREATE POLICY conductores_perfil_select ON public.conductores_perfil
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_admin());

-- Conductor actualiza únicamente sus propias filas
CREATE POLICY conductores_perfil_update_conductor ON public.conductores_perfil
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Admin tiene control total sobre conductores_perfil
CREATE POLICY conductores_perfil_admin_all ON public.conductores_perfil
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. TRIGGER DEFENSIVO DE COLUMNAS EN public.conductores_perfil
-- Impide que un cliente regular altere saldo_billetera, estado o calificación
-- Permite cambios si es admin, service_role (Culqi), o proceso interno confiable (SECURITY DEFINER / postgres)
CREATE OR REPLACE FUNCTION public.fn_proteger_columnas_conductores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_es_admin BOOLEAN;
  v_es_service_role BOOLEAN;
  v_es_sistema BOOLEAN;
BEGIN
  -- 1. Verificar si el usuario autenticado tiene rol de admin
  v_es_admin := COALESCE(public.is_admin(), false);

  -- 2. Verificar si es service_role (ej. Edge Functions, webhook de recargas Culqi)
  v_es_service_role := (COALESCE(auth.role(), '') = 'service_role');

  -- 3. Verificar si la ejecución proviene de una función confiable del sistema
  -- En Postgres, una función SECURITY DEFINER (como finalizar_viaje o procesar_transaccion_billetera)
  -- se ejecuta con current_user = 'postgres' / 'supabase_admin'.
  -- También se comprueba si la llamada viene anidada por un trigger previo (pg_trigger_depth() > 1).
  v_es_sistema := (
    current_user IN ('postgres', 'supabase_admin')
    OR session_user IN ('postgres', 'supabase_admin')
    OR pg_trigger_depth() > 1
  );

  -- Si la modificación proviene de admin, service_role o proceso interno confiable, se permite el cambio
  IF v_es_admin OR v_es_service_role OR v_es_sistema THEN
    RETURN NEW;
  END IF;

  -- 4. Si proviene de un cliente regular (authenticated o anon directamente): bloquear manipulación de columnas sensibles
  IF (OLD.saldo_billetera IS DISTINCT FROM NEW.saldo_billetera) THEN
    RAISE EXCEPTION 'Violación de seguridad [B-01]: Solo el administrador o procesos autorizados pueden alterar saldo_billetera.';
  END IF;

  IF (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    RAISE EXCEPTION 'Violación de seguridad [B-02]: El estado de verificación del conductor solo puede ser modificado por un administrador.';
  END IF;

  IF (OLD.calificacion_promedio IS DISTINCT FROM NEW.calificacion_promedio) THEN
    RAISE EXCEPTION 'Violación de seguridad [B-03]: La calificación promedio se calcula de forma inmutable.';
  END IF;

  IF (OLD.viajes_completados IS DISTINCT FROM NEW.viajes_completados) THEN
    RAISE EXCEPTION 'Violación de seguridad [B-04]: El contador de viajes completados es inmutable.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_columnas_conductores ON public.conductores_perfil;
CREATE TRIGGER trg_proteger_columnas_conductores
  BEFORE UPDATE ON public.conductores_perfil
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_proteger_columnas_conductores();

-- 6. TABLA DE AUDITORÍA ADMINISTRATIVA INMUTABLE
CREATE TABLE IF NOT EXISTS public.auditoria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id UUID,
  detalles JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_accion ON public.auditoria_logs(usuario_id, accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON public.auditoria_logs(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado_en ON public.auditoria_logs(creado_en DESC);

ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auditoria_logs FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.auditoria_logs TO authenticated;

DROP POLICY IF EXISTS auditoria_logs_admin_select ON public.auditoria_logs;
CREATE POLICY auditoria_logs_admin_select ON public.auditoria_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS auditoria_logs_admin_insert ON public.auditoria_logs;
CREATE POLICY auditoria_logs_admin_insert ON public.auditoria_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 7. RPC ADMINISTRATIVA PARA RECARGA EN EFECTIVO CON FOR UPDATE Y AUDITORÍA
CREATE OR REPLACE FUNCTION public.admin_recargar_billetera_efectivo(
  p_conductor_id UUID,
  p_monto NUMERIC,
  p_motivo TEXT DEFAULT 'Recarga administrativa en efectivo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_id UUID;
  v_saldo_actual NUMERIC(10, 2);
  v_nuevo_saldo NUMERIC(10, 2);
  v_movimiento_id UUID;
BEGIN
  -- Validar autorización de administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Violación de seguridad: Solo un administrador autorizado puede recargar saldo de forma manual.';
  END IF;

  v_admin_id := auth.uid();

  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto de recarga debe ser estrictamente mayor a S/. 0.00';
  END IF;

  -- Bloqueo pesimista de fila para serializar operaciones financieras
  SELECT COALESCE(saldo_billetera, 0) INTO v_saldo_actual
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado.';
  END IF;

  v_nuevo_saldo := v_saldo_actual + p_monto;

  -- Actualizar saldo en conductores_perfil
  UPDATE public.conductores_perfil
  SET saldo_billetera = v_nuevo_saldo
  WHERE usuario_id = p_conductor_id;

  -- Registrar movimiento en billetera_movimientos
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
    COALESCE(p_motivo, 'Recarga manual administrativa en efectivo'),
    'ADMIN_MANUAL_' || to_char(now(), 'YYYYMMDDHH24MISS'),
    'completado'
  ) RETURNING id INTO v_movimiento_id;

  -- Registrar en auditoria_logs
  INSERT INTO public.auditoria_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    v_admin_id,
    'RECARGA_MANUAL_BILLETERA',
    'conductores_perfil',
    p_conductor_id,
    jsonb_build_object(
      'monto', p_monto,
      'saldo_anterior', v_saldo_actual,
      'saldo_nuevo', v_nuevo_saldo,
      'motivo', p_motivo,
      'movimiento_id', v_movimiento_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'movimiento_id', v_movimiento_id,
    'conductor_id', p_conductor_id,
    'monto_recargado', p_monto,
    'saldo_anterior', v_saldo_actual,
    'saldo_nuevo', v_nuevo_saldo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_recargar_billetera_efectivo(UUID, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recargar_billetera_efectivo(UUID, NUMERIC, TEXT) TO authenticated;

-- 8. LIBRO DE RECLAMACIONES Y CORRELATIVO ATÓMICO (Ley 29571 / Indecopi)
CREATE TABLE IF NOT EXISTS public.reclamaciones_libro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_correlativo TEXT UNIQUE NOT NULL,
  tipo_bien TEXT NOT NULL DEFAULT 'Servicio de Intermediación Tecnológica en Mototaxi',
  tipo_reclamo TEXT NOT NULL CHECK (tipo_reclamo IN ('queja', 'reclamo')),
  consumidor_nombre TEXT NOT NULL,
  consumidor_tipo_doc TEXT NOT NULL CHECK (consumidor_tipo_doc IN ('DNI', 'CE', 'PASAPORTE', 'OTRO')),
  consumidor_dni TEXT NOT NULL,
  consumidor_email TEXT NOT NULL,
  consumidor_telefono TEXT NOT NULL,
  consumidor_direccion TEXT NOT NULL,
  monto_reclamado NUMERIC(10, 2) DEFAULT 0.00,
  descripcion_hechos TEXT NOT NULL,
  pedido_concreto TEXT NOT NULL,
  ip_hash TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'atendido', 'archivado')),
  respuesta_administrador TEXT,
  fecha_respuesta TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migración aditiva idempotente si la tabla ya existía
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reclamaciones_libro' AND column_name = 'ip_hash'
  ) THEN
    ALTER TABLE public.reclamaciones_libro ADD COLUMN ip_hash TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reclamaciones_ip_hash_creado_en ON public.reclamaciones_libro(ip_hash, creado_en);
CREATE SEQUENCE IF NOT EXISTS public.seq_reclamaciones_correlativo START 1 INCREMENT 1;

ALTER TABLE public.reclamaciones_libro ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.reclamaciones_libro FROM PUBLIC, anon;
GRANT SELECT ON public.reclamaciones_libro TO authenticated;

DROP POLICY IF EXISTS reclamaciones_admin_all ON public.reclamaciones_libro;
CREATE POLICY reclamaciones_admin_all ON public.reclamaciones_libro
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Eliminar versión previa sin parámetro de IP si existiera
DROP FUNCTION IF EXISTS public.registrar_reclamacion_publica(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT);

-- Vía controlada RPC con rate limiting persistente en BD (por identidad e IP)
CREATE OR REPLACE FUNCTION public.registrar_reclamacion_publica(
  p_tipo_reclamo TEXT,
  p_consumidor_nombre TEXT,
  p_consumidor_tipo_doc TEXT,
  p_consumidor_dni TEXT,
  p_consumidor_email TEXT,
  p_consumidor_telefono TEXT,
  p_consumidor_direccion TEXT,
  p_monto_reclamado NUMERIC,
  p_descripcion_hechos TEXT,
  p_pedido_concreto TEXT,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_correlativo_num BIGINT;
  v_codigo TEXT;
  v_reclamacion_id UUID;
  v_conteo_reciente INT;
  v_conteo_ip INT;
  v_anio TEXT;
BEGIN
  -- 1. Rate limiting por identidad (DNI o email): máximo 3 por hora
  SELECT count(*) INTO v_conteo_reciente
  FROM public.reclamaciones_libro
  WHERE (lower(consumidor_email) = lower(trim(p_consumidor_email)) OR consumidor_dni = trim(p_consumidor_dni))
    AND creado_en > (now() - INTERVAL '1 hour');

  IF v_conteo_reciente >= 3 THEN
    RAISE EXCEPTION 'Límite de envíos excedido: Ya se han registrado reclamaciones recientes con estos datos. Espera una hora antes de reintentar.';
  END IF;

  -- 2. Rate limiting por IP hash (anti-bot / anti-scraping / flood control): máximo 5 por hora por IP
  IF p_ip_hash IS NOT NULL AND trim(p_ip_hash) <> '' THEN
    SELECT count(*) INTO v_conteo_ip
    FROM public.reclamaciones_libro
    WHERE ip_hash = trim(p_ip_hash)
      AND creado_en > (now() - INTERVAL '1 hour');

    IF v_conteo_ip >= 5 THEN
      RAISE EXCEPTION 'Límite de solicitudes por conexión alcanzado: Se detectaron múltiples envíos desde este origen. Intenta más tarde.';
    END IF;
  END IF;

  -- 3. Generar correlativo atómico determinista
  v_correlativo_num := nextval('public.seq_reclamaciones_correlativo');
  v_anio := to_char(now(), 'YYYY');
  v_codigo := 'ALTK-REC-' || v_anio || '-' || lpad(v_correlativo_num::text, 5, '0');

  -- 4. Inserción protegida
  INSERT INTO public.reclamaciones_libro (
    codigo_correlativo,
    tipo_reclamo,
    consumidor_nombre,
    consumidor_tipo_doc,
    consumidor_dni,
    consumidor_email,
    consumidor_telefono,
    consumidor_direccion,
    monto_reclamado,
    descripcion_hechos,
    pedido_concreto,
    ip_hash,
    estado
  ) VALUES (
    v_codigo,
    p_tipo_reclamo,
    trim(p_consumidor_nombre),
    p_consumidor_tipo_doc,
    trim(p_consumidor_dni),
    lower(trim(p_consumidor_email)),
    trim(p_consumidor_telefono),
    trim(p_consumidor_direccion),
    COALESCE(p_monto_reclamado, 0.00),
    trim(p_descripcion_hechos),
    trim(p_pedido_concreto),
    NULLIF(trim(p_ip_hash), ''),
    'pendiente'
  ) RETURNING id INTO v_reclamacion_id;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_reclamacion_id,
    'codigo', v_codigo,
    'fecha', now()
  );
END;
$$;

-- Restringir RPC exclusivamente a service_role (invocada por Edge Function registrar-reclamacion)
REVOKE ALL ON FUNCTION public.registrar_reclamacion_publica(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_reclamacion_publica(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO service_role;

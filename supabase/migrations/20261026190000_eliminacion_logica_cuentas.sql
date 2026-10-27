
-- ALTOKKE: Eliminación lógica e integridad del historial

BEGIN;

-- 1. Estados de cuenta
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS estado_cuenta TEXT NOT NULL DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS desactivado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_desactivacion TEXT;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_estado_cuenta_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_estado_cuenta_check
  CHECK (
    estado_cuenta IN (
      'activo',
      'desactivado',
      'suspendido',
      'eliminada'
    )
  );

CREATE INDEX IF NOT EXISTS idx_usuarios_estado_cuenta
  ON public.usuarios(estado_cuenta);

-- 2. Evitar eliminaciones accidentales en cascada
-- Conserva las relaciones y los registros históricos.
DO $$
DECLARE
  fk RECORD;
  definicion TEXT;
BEGIN
  FOR fk IN
    SELECT
      c.conname,
      c.conrelid,
      pg_get_constraintdef(c.oid) AS definicion
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confdeltype = 'c'
      AND c.connamespace = 'public'::regnamespace
      AND c.conrelid IN (
        'public.usuarios'::regclass,
        'public.pasajeros_perfil'::regclass,
        'public.conductores_perfil'::regclass,
        'public.vehiculos'::regclass,
        'public.viajes'::regclass,
        'public.mensajes_viaje'::regclass,
        'public.calificaciones'::regclass,
        'public.transacciones'::regclass,
        'public.documentos'::regclass
      )
  LOOP
    definicion := replace(
      fk.definicion,
      'ON DELETE CASCADE',
      'ON DELETE RESTRICT'
    );

    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      fk.conrelid::regclass,
      fk.conname
    );

    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I %s',
      fk.conrelid::regclass,
      fk.conname,
      definicion
    );
  END LOOP;
END $$;

-- 3. Comprobar que la cuenta esté activa
CREATE OR REPLACE FUNCTION public.cuenta_altokke_activa(
  p_usuario_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = p_usuario_id
      AND estado_cuenta = 'activo'
  );
$$;

REVOKE ALL ON FUNCTION public.cuenta_altokke_activa(UUID)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.cuenta_altokke_activa(UUID)
  TO authenticated;

-- 4. Impedir crear viajes con cuentas inactivas
DROP POLICY IF EXISTS altokke_viajes_cuenta_activa
  ON public.viajes;

CREATE POLICY altokke_viajes_cuenta_activa
ON public.viajes
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.cuenta_altokke_activa((SELECT auth.uid()))
);

-- 5. Protección de operaciones de escritura
DO $$
DECLARE
  tabla TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'usuarios',
    'pasajeros_perfil',
    'conductores_perfil',
    'vehiculos',
    'documentos',
    'mensajes_viaje',
    'calificaciones'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS cuenta_activa_update ON public.%I',
      tabla
    );

    EXECUTE format(
      'CREATE POLICY cuenta_activa_update
       ON public.%I
       AS RESTRICTIVE
       FOR UPDATE TO authenticated
       USING (public.cuenta_altokke_activa(auth.uid()))
       WITH CHECK (public.cuenta_altokke_activa(auth.uid()))',
      tabla
    );

    EXECUTE format(
      'DROP POLICY IF EXISTS cuenta_activa_insert ON public.%I',
      tabla
    );

    EXECUTE format(
      'CREATE POLICY cuenta_activa_insert
       ON public.%I
       AS RESTRICTIVE
       FOR INSERT TO authenticated
       WITH CHECK (public.cuenta_altokke_activa(auth.uid()))',
      tabla
    );
  END LOOP;
END $$;

-- 6. Protección de lectura de datos operativos
DO $$
DECLARE
  tabla TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'viajes',
    'mensajes_viaje',
    'documentos',
    'transacciones',
    'calificaciones'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS cuenta_activa_select ON public.%I',
      tabla
    );

    EXECUTE format(
      'CREATE POLICY cuenta_activa_select
       ON public.%I
       AS RESTRICTIVE
       FOR SELECT TO authenticated
       USING (public.cuenta_altokke_activa(auth.uid()))',
      tabla
    );
  END LOOP;
END $$;

-- 7. Impedir modificaciones de viajes desde cuentas inactivas
CREATE OR REPLACE FUNCTION public.validar_cuenta_viaje()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL
     OR NOT public.cuenta_altokke_activa(auth.uid()) THEN
    RAISE EXCEPTION 'Tu cuenta está desactivada o suspendida';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validar_cuenta_viaje
  ON public.viajes;

CREATE TRIGGER tr_validar_cuenta_viaje
BEFORE INSERT OR UPDATE ON public.viajes
FOR EACH ROW
EXECUTE FUNCTION public.validar_cuenta_viaje();

-- 8. Eliminación lógica
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
    WHERE (
      pasajero_id = v_id
      OR conductor_id = v_id
    )
    AND estado IN (
      'buscando',
      'aceptado',
      'en_camino_origen',
      'esperando_pasajero',
      'en_viaje'
    )
  ) THEN
    RAISE EXCEPTION
      'No puedes eliminar tu cuenta mientras tengas un viaje pendiente o en curso.';
  END IF;

  UPDATE public.usuarios
  SET
    estado_cuenta = 'eliminada',
    desactivado_en = NOW(),
    motivo_desactivacion = 'Solicitud del usuario',
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

  UPDATE public.conductores_perfil
  SET
    en_linea = FALSE,
    lat_actual = NULL,
    lng_actual = NULL
  WHERE usuario_id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_mi_cuenta()
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.eliminar_mi_cuenta()
  TO authenticated;

COMMIT;

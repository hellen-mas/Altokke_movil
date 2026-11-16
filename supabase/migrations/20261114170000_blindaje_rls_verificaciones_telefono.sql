-- ==============================================================================
-- MIGRACION: BLINDAJE DE SEGURIDAD RLS EN VERIFICACIONES_TELEFONO
-- Objetivo: Erradicar alerta de tabla con RLS habilitado pero sin politicas
-- Proteccion: Bloqueo total de lectura/escritura publica por PostgREST
-- Acceso: Exclusivo para procesos del servidor (service_role y SECURITY DEFINER)
-- ==============================================================================

-- 1. Asegurar que RLS este activo en la tabla
ALTER TABLE public.verificaciones_telefono ENABLE ROW LEVEL SECURITY;

-- 2. Revocar privilegios directos de lectura, insercion, modificacion a anon y authenticated
REVOKE ALL ON TABLE public.verificaciones_telefono FROM anon, authenticated;

-- 3. Eliminar politicas previas si existieran para evitar duplicidad
DROP POLICY IF EXISTS "verificaciones_telefono_service_role" ON public.verificaciones_telefono;
DROP POLICY IF EXISTS "verificaciones_telefono_bloqueo_publico" ON public.verificaciones_telefono;
DROP POLICY IF EXISTS "verificaciones_telefono_acceso_exclusivo_backend" ON public.verificaciones_telefono;

-- 4. Politica explicita de acceso total para service_role (Edge Functions / Backend)
CREATE POLICY "verificaciones_telefono_service_role"
  ON public.verificaciones_telefono
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Politica explicita de bloqueo determinista para anon y authenticated
-- Garantiza que ningun atacante pueda enumerar o manipular OTPs de otros usuarios via PostgREST
CREATE POLICY "verificaciones_telefono_bloqueo_publico"
  ON public.verificaciones_telefono
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 6. Comentario de auditoria en catalogo PostgreSQL
COMMENT ON TABLE public.verificaciones_telefono IS
  'Tabla de custodia de OTP telefonicos. Acceso publico denegado 100% via RLS. Solo operable por service_role y RPCs SECURITY DEFINER.';

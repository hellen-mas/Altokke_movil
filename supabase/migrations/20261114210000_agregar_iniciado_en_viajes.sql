
-- ==============================================================================
-- Ajustes complementarios del flujo de viajes
-- ==============================================================================

-- 1. Agregar fecha de inicio del viaje
ALTER TABLE public.viajes
ADD COLUMN IF NOT EXISTS iniciado_en TIMESTAMPTZ;

-- 2. Eliminar la versión antigua de un solo parámetro.
-- La nueva función de dos parámetros ya fue creada
-- por la migración anterior.
DROP FUNCTION IF EXISTS public.cancelar_viaje_pasajero(uuid);

-- 3. Actualizar la caché de funciones de PostgREST.
NOTIFY pgrst, 'reload schema';
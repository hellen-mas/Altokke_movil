-- ==============================================================================
-- Migración: Agregar dni y fecha_nacimiento a la tabla public.usuarios
-- ==============================================================================

ALTER TABLE public.usuarios 
  ADD COLUMN IF NOT EXISTS dni TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

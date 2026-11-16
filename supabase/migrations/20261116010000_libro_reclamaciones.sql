CREATE TABLE IF NOT EXISTS public.reclamaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_reclamacion TEXT NOT NULL UNIQUE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_completo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('DNI', 'CE', 'RUC')),
  numero_documento TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  direccion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('reclamo', 'queja')),
  monto_reclamado NUMERIC NOT NULL DEFAULT 0 CHECK (monto_reclamado >= 0),
  descripcion_bien_contratado TEXT NOT NULL,
  detalle_reclamacion TEXT NOT NULL,
  pedido_consumidor TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reclamaciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reclamaciones FROM PUBLIC, anon, authenticated;
GRANT INSERT(
  codigo_reclamacion,
  usuario_id,
  nombre_completo,
  tipo_documento,
  numero_documento,
  telefono,
  email,
  direccion,
  tipo,
  monto_reclamado,
  descripcion_bien_contratado,
  detalle_reclamacion,
  pedido_consumidor
) ON public.reclamaciones TO authenticated;

DROP POLICY IF EXISTS altokke_reclamaciones_insert ON public.reclamaciones;
CREATE POLICY altokke_reclamaciones_insert ON public.reclamaciones
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (SELECT auth.uid()));

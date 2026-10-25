--"firma" que recibe y que devuelve 
CREATE OR REPLACE FUNCTION public.obtener_conductor_viaje(p_viaje_id uuid)
RETURNS TABLE (
    nombre text,
    apellidos text,
    foto_url text,
    telefono text,
    calificacion numeric,
    viajes_completados integer,
    placa text,
    marca text,
    modelo text,
    color text,
    lat_actual double precision,
    lng_actual double precision
)

LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ 

--Consulta

  SELECT u.nombre, u.apellidos,
         COALESCE(u.foto_url, u.avatar_url),
         u.telefono,
         c.calificacion_promedio, c.viajes_completados,
         v.placa, v.marca, v.modelo, v.color,
         c.lat_actual, c.lng_actual
  FROM public.viajes vj
  JOIN public.conductores_perfil c ON c.usuario_id = vj.conductor_id
  JOIN public.usuarios u ON u.id = c.usuario_id
  LEFT JOIN public.vehiculos v ON v.conductor_id = c.usuario_id AND v.activo = true
  WHERE vj.id = p_viaje_id
    AND vj.pasajero_id = (SELECT auth.uid())
  LIMIT 1;
$$;

--Permisos
REVOKE ALL ON FUNCTION public.obtener_conductor_viaje(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_conductor_viaje(uuid) TO authenticated;

--Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'viajes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.viajes;
  END IF;
END $$;
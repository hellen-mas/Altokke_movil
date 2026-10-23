-- Altokke / Supabase Auth + RLS.
-- Ejecutar tras revisar el esquema efectivo y probar con usuarios de prueba.
-- Los datos de auth.users son propiedad de Supabase Auth.
ALTER TYPE public.tipo_documento ADD VALUE IF NOT EXISTS 'DNI_FRONTAL';
ALTER TYPE public.tipo_documento ADD VALUE IF NOT EXISTS 'DNI_POSTERIOR';
ALTER TYPE public.tipo_documento ADD VALUE IF NOT EXISTS 'SELFIE';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS dni text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento date;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_dni ON public.usuarios(dni);
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS capacidad integer;

-- Compatibilidad con versiones anteriores del esquema.
-- No se eliminan datos; solo se renombran columnas si aún usan nombres antiguos.
DO $compat$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='archivo_url')
 AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='url_archivo') THEN
  ALTER TABLE public.documentos RENAME COLUMN archivo_url TO url_archivo;
 END IF;
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='observaciones')
 AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='motivo_rechazo') THEN
  ALTER TABLE public.documentos RENAME COLUMN observaciones TO motivo_rechazo;
 END IF;
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='creado_en')
 AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='fecha_subida') THEN
  ALTER TABLE public.documentos RENAME COLUMN creado_en TO fecha_subida;
 END IF;
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mensajes_viaje' AND column_name='emisor_id')
 AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mensajes_viaje' AND column_name='remitente_id') THEN
  ALTER TABLE public.mensajes_viaje RENAME COLUMN emisor_id TO remitente_id;
 END IF;
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mensajes_viaje' AND column_name='mensaje')
 AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mensajes_viaje' AND column_name='contenido') THEN
  ALTER TABLE public.mensajes_viaje RENAME COLUMN mensaje TO contenido;
 END IF;
END $compat$;
ALTER TABLE public.mensajes_viaje ADD COLUMN IF NOT EXISTS leido boolean DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
 v_rol public.rol_usuario;
 v_fecha date;
 v_foto text;
BEGIN
 -- 'admin' JAMÁS se obtiene de user_metadata, que controla el cliente.
 v_rol := CASE WHEN new.raw_user_meta_data->>'rol' = 'conductor'
   THEN 'conductor'::public.rol_usuario ELSE 'pasajero'::public.rol_usuario END;
 BEGIN
   v_fecha := NULLIF(new.raw_user_meta_data->>'fecha_nacimiento','')::date;
 EXCEPTION WHEN OTHERS THEN v_fecha := null;
 END;
 v_foto := coalesce(new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'picture');
 INSERT INTO public.usuarios
  (id,rol,nombre,apellidos,telefono,dni,fecha_nacimiento,avatar_url,foto_url)
 VALUES
  (new.id,v_rol,coalesce(nullif(new.raw_user_meta_data->>'nombre',''),
    new.raw_user_meta_data->>'full_name','Usuario'),
   coalesce(new.raw_user_meta_data->>'apellidos',''),
   coalesce(nullif(new.raw_user_meta_data->>'telefono',''),'Sin numero - '||new.id),
   nullif(trim(new.raw_user_meta_data->>'dni'),''),
   v_fecha,v_foto,v_foto)
 ON CONFLICT (id) DO NOTHING;
 IF v_rol='conductor' THEN
  INSERT INTO public.conductores_perfil(usuario_id,estado)
   VALUES(new.id,'pendiente') ON CONFLICT(usuario_id) DO NOTHING;
 ELSE
  INSERT INTO public.pasajeros_perfil(usuario_id)
   VALUES(new.id) ON CONFLICT(usuario_id) DO NOTHING;
 END IF;
 RETURN new;
END $fn$;

-- La función anterior será llamada por el trigger de Supabase Auth.
DO $fn$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_trigger tr
   JOIN pg_proc fn ON tr.tgfoid = fn.oid
   JOIN pg_namespace ns ON fn.pronamespace = ns.oid
   WHERE tr.tgrelid='auth.users'::regclass
     AND NOT tr.tgisinternal
     AND fn.proname='handle_new_user'
     AND ns.nspname='public'
 ) THEN
  CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users FOR EACH ROW
   EXECUTE FUNCTION public.handle_new_user();
 END IF;
END $fn$;

-- Asegurar que NO queden políticas permisivas antiguas en tablas sensibles.
DO $fn$ DECLARE p record;
BEGIN
 FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies
  WHERE schemaname='public' AND tablename = ANY(ARRAY[
    'usuarios','pasajeros_perfil','conductores_perfil','vehiculos',
    'documentos','viajes','mensajes_viaje','calificaciones',
    'transacciones','verificaciones_telefono'])
 LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',p.policyname,p.schemaname,p.tablename);
 END LOOP;
END $fn$;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasajeros_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conductores_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verificaciones_telefono ENABLE ROW LEVEL SECURITY;

-- RLS controla filas; permisos por columna impiden manipular roles,
-- saldos, aprobaciones, importes, remitentes y otros campos del servidor.
REVOKE ALL ON public.usuarios,public.pasajeros_perfil,public.conductores_perfil,
public.vehiculos,public.documentos,public.viajes,public.mensajes_viaje,
public.calificaciones,public.transacciones,public.verificaciones_telefono
FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.usuarios,public.pasajeros_perfil,public.conductores_perfil,
public.vehiculos,public.documentos,public.viajes,public.mensajes_viaje,
public.calificaciones,public.transacciones TO authenticated;
GRANT UPDATE(nombre,apellidos,telefono,avatar_url,foto_url,expo_push_token)
 ON public.usuarios TO authenticated;
GRANT UPDATE(preferencias) ON public.pasajeros_perfil TO authenticated;
-- El chat permite marcar como leídos mensajes de un viaje propio, sin editar su contenido.
GRANT UPDATE(leido) ON public.mensajes_viaje TO authenticated;
GRANT UPDATE(en_linea,lat_actual,lng_actual) ON public.conductores_perfil TO authenticated;
GRANT INSERT(conductor_id,placa,marca,modelo,color,anio,capacidad,activo)
 ON public.vehiculos TO authenticated;
GRANT UPDATE(placa,marca,modelo,color,anio,capacidad)
 ON public.vehiculos TO authenticated;
GRANT INSERT(usuario_id,tipo,url_archivo) ON public.documentos TO authenticated;
GRANT INSERT(pasajero_id,origen_texto,destino_texto,origen_lat,origen_lng,
 destino_lat,destino_lng,distancia_km,tarifa_estimada,metodo_pago)
 ON public.viajes TO authenticated;
GRANT INSERT(viaje_id,remitente_id,contenido) ON public.mensajes_viaje TO authenticated;
GRANT INSERT(viaje_id,autor_id,receptor_id,puntuacion,comentario)
 ON public.calificaciones TO authenticated;

-- Los participantes de un viaje pueden identificar a su contraparte.
-- No se abre la lectura indiscriminada que existía antes.
CREATE POLICY altokke_usuarios_select ON public.usuarios FOR SELECT TO authenticated
 USING (id=(SELECT auth.uid()) OR EXISTS (
   SELECT 1 FROM public.viajes v
   WHERE (v.pasajero_id=(SELECT auth.uid()) AND v.conductor_id=usuarios.id)
      OR (v.conductor_id=(SELECT auth.uid()) AND v.pasajero_id=usuarios.id)
 ));
CREATE POLICY altokke_usuarios_update ON public.usuarios FOR UPDATE TO authenticated
 USING (id=(SELECT auth.uid())) WITH CHECK(id=(SELECT auth.uid()));
CREATE POLICY altokke_pasajeros_select ON public.pasajeros_perfil FOR SELECT TO authenticated
 USING(usuario_id=(SELECT auth.uid()) OR EXISTS (
   SELECT 1 FROM public.viajes v
   WHERE v.conductor_id=(SELECT auth.uid()) AND v.pasajero_id=pasajeros_perfil.usuario_id
 ));
CREATE POLICY altokke_pasajeros_update ON public.pasajeros_perfil FOR UPDATE TO authenticated
 USING(usuario_id=(SELECT auth.uid())) WITH CHECK(usuario_id=(SELECT auth.uid()));
CREATE POLICY altokke_conductores_select ON public.conductores_perfil FOR SELECT TO authenticated
 USING(usuario_id=(SELECT auth.uid()) OR EXISTS (
   SELECT 1 FROM public.viajes v
   WHERE v.pasajero_id=(SELECT auth.uid()) AND v.conductor_id=conductores_perfil.usuario_id
 ));
CREATE POLICY altokke_conductores_update ON public.conductores_perfil FOR UPDATE TO authenticated
 USING(usuario_id=(SELECT auth.uid()) AND estado='aprobado')
 WITH CHECK(usuario_id=(SELECT auth.uid()) AND estado='aprobado');
-- Conservar consulta de vehículos activos sin exponer vehículos no activos ajenos.
CREATE POLICY altokke_vehiculos_select ON public.vehiculos FOR SELECT TO authenticated
 USING(conductor_id=(SELECT auth.uid()) OR activo=true);
CREATE POLICY altokke_vehiculos_insert ON public.vehiculos FOR INSERT TO authenticated
 WITH CHECK(conductor_id=(SELECT auth.uid()) AND activo=false);
CREATE POLICY altokke_vehiculos_update ON public.vehiculos FOR UPDATE TO authenticated
 USING(conductor_id=(SELECT auth.uid())) WITH CHECK(conductor_id=(SELECT auth.uid()));
CREATE POLICY altokke_documentos_select ON public.documentos FOR SELECT TO authenticated
 USING(usuario_id=(SELECT auth.uid()));
-- Conserva la validación de documentos del entorno original:
-- pendiente, sin motivo de rechazo y almacenado en carpeta propia.
CREATE POLICY altokke_documentos_insert ON public.documentos FOR INSERT TO authenticated
 WITH CHECK(usuario_id=(SELECT auth.uid())
 AND estado='pendiente' AND motivo_rechazo IS NULL
 AND split_part(url_archivo,'/',1)=(SELECT auth.uid())::text);

-- Solo el propietario ve su viaje; conductores aprobados pueden ver ofertas pendientes.
CREATE POLICY altokke_viajes_select ON public.viajes FOR SELECT TO authenticated
 USING (pasajero_id=(SELECT auth.uid()) OR conductor_id=(SELECT auth.uid())
 OR (estado='buscando' AND EXISTS (
 SELECT 1 FROM public.conductores_perfil p
 WHERE p.usuario_id=(SELECT auth.uid()) AND p.estado='aprobado')));
CREATE POLICY altokke_viajes_insert ON public.viajes FOR INSERT TO authenticated
 WITH CHECK(pasajero_id=(SELECT auth.uid())
 AND EXISTS (SELECT 1 FROM public.pasajeros_perfil p
 WHERE p.usuario_id=(SELECT auth.uid())));
-- Aceptar/finalizar viajes y calcular saldos NO se autoriza mediante UPDATE genérico.
-- Requiere RPC transaccional del servidor con controles de transición de estado.
CREATE POLICY altokke_mensajes_select ON public.mensajes_viaje FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.viajes v WHERE v.id=viaje_id
 AND (v.pasajero_id=(SELECT auth.uid()) OR v.conductor_id=(SELECT auth.uid()))));
CREATE POLICY altokke_mensajes_insert ON public.mensajes_viaje FOR INSERT TO authenticated
 WITH CHECK(remitente_id=(SELECT auth.uid()) AND EXISTS (
 SELECT 1 FROM public.viajes v WHERE v.id=viaje_id
 AND (v.pasajero_id=(SELECT auth.uid()) OR v.conductor_id=(SELECT auth.uid()))));
-- La política ALL antigua permitía marcar mensajes leídos; se conserva solo ese campo.
CREATE POLICY altokke_mensajes_update ON public.mensajes_viaje FOR UPDATE TO authenticated
 USING (EXISTS(SELECT 1 FROM public.viajes v WHERE v.id=viaje_id
 AND (v.pasajero_id=(SELECT auth.uid()) OR v.conductor_id=(SELECT auth.uid()))))
 WITH CHECK (EXISTS(SELECT 1 FROM public.viajes v WHERE v.id=viaje_id
 AND (v.pasajero_id=(SELECT auth.uid()) OR v.conductor_id=(SELECT auth.uid()))));
CREATE POLICY altokke_calificaciones_select ON public.calificaciones FOR SELECT TO authenticated
 USING(autor_id=(SELECT auth.uid()) OR receptor_id=(SELECT auth.uid()));
CREATE POLICY altokke_calificaciones_insert ON public.calificaciones FOR INSERT TO authenticated
 WITH CHECK(autor_id=(SELECT auth.uid()) AND EXISTS(
 SELECT 1 FROM public.viajes v WHERE v.id=viaje_id AND v.estado='finalizado'
 AND ((v.pasajero_id=(SELECT auth.uid()) AND v.conductor_id=receptor_id)
 OR (v.conductor_id=(SELECT auth.uid()) AND v.pasajero_id=receptor_id))));
CREATE POLICY altokke_transacciones_select ON public.transacciones FOR SELECT TO authenticated
 USING(conductor_id=(SELECT auth.uid()));
-- verificaciones_telefono: acceso reservado a procesos del servidor.

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_documentos_usuario_id ON public.documentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON public.documentos(estado);
CREATE INDEX IF NOT EXISTS idx_vehiculos_conductor_id ON public.vehiculos(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_pasajero_id ON public.viajes(pasajero_id);
CREATE INDEX IF NOT EXISTS idx_viajes_conductor_id ON public.viajes(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON public.viajes(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_viaje_id ON public.mensajes_viaje(viaje_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_viaje_id ON public.calificaciones(viaje_id);

INSERT INTO storage.buckets(id,name,public)
 VALUES('documentos-conductores','documentos-conductores',false)
 ON CONFLICT(id) DO UPDATE SET public=false;
DROP POLICY IF EXISTS altokke_documentos_storage_insert ON storage.objects;
CREATE POLICY altokke_documentos_storage_insert ON storage.objects
 FOR INSERT TO authenticated WITH CHECK (
 bucket_id='documentos-conductores'
 AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
DROP POLICY IF EXISTS altokke_documentos_storage_select ON storage.objects;
CREATE POLICY altokke_documentos_storage_select ON storage.objects
 FOR SELECT TO authenticated USING (
 bucket_id='documentos-conductores'
 AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

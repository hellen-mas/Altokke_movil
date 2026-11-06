-- ==============================================================================
-- Schema Completo de Base de Datos - Altokke Móvil (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.rol_usuario AS ENUM ('pasajero', 'conductor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_viaje AS ENUM (
    'buscando',
    'aceptado',
    'en_camino_origen',
    'esperando_pasajero',
    'en_viaje',
    'finalizado',
    'cancelado_pasajero',
    'cancelado_conductor'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_verificacion AS ENUM (
    'pendiente',
    'aprobado',
    'rechazado',
    'suspendido'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_documento AS ENUM (
    'DNI',
    'LICENCIA',
    'SOAT',
    'ANTECEDENTES',
    'TARJETA_PROPIEDAD',
    'DNI_FRONTAL',
    'DNI_POSTERIOR',
    'SELFIE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_transaccion AS ENUM (
    'cobro_viaje',
    'pago_comision',
    'retiro_banco',
    'bono'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLA: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol public.rol_usuario DEFAULT 'pasajero'::public.rol_usuario,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT UNIQUE NOT NULL,
  foto_url TEXT,
  avatar_url TEXT,
  dni TEXT UNIQUE,
  fecha_nacimiento DATE,
  expo_push_token TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA: pasajeros_perfil
CREATE TABLE IF NOT EXISTS public.pasajeros_perfil (
  usuario_id UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  preferencias JSONB DEFAULT '{}'::jsonb,
  calificacion_promedio NUMERIC DEFAULT 5.0
);

-- 5. TABLA: conductores_perfil
CREATE TABLE IF NOT EXISTS public.conductores_perfil (
  usuario_id UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  estado public.estado_verificacion DEFAULT 'pendiente'::public.estado_verificacion,
  en_linea BOOLEAN DEFAULT false,
  lat_actual DOUBLE PRECISION,
  lng_actual DOUBLE PRECISION,
  saldo_billetera NUMERIC DEFAULT 0,
  calificacion_promedio NUMERIC DEFAULT 5.0,
  viajes_completados INTEGER DEFAULT 0
);

-- 6. TABLA: vehiculos
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id UUID NOT NULL REFERENCES public.conductores_perfil(usuario_id) ON DELETE CASCADE,
  placa TEXT UNIQUE NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  color TEXT NOT NULL,
  anio INTEGER,
  capacidad INTEGER,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABLA: viajes
CREATE TABLE IF NOT EXISTS public.viajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pasajero_id UUID NOT NULL REFERENCES public.pasajeros_perfil(usuario_id) ON DELETE CASCADE,
  conductor_id UUID REFERENCES public.conductores_perfil(usuario_id) ON DELETE SET NULL,
  origen_texto TEXT NOT NULL,
  destino_texto TEXT NOT NULL,
  origen_lat DOUBLE PRECISION NOT NULL,
  origen_lng DOUBLE PRECISION NOT NULL,
  destino_lat DOUBLE PRECISION NOT NULL,
  destino_lng DOUBLE PRECISION NOT NULL,
  estado public.estado_viaje DEFAULT 'buscando'::public.estado_viaje,
  distancia_km NUMERIC,
  tarifa_estimada NUMERIC NOT NULL,
  tarifa_final NUMERIC,
  metodo_pago TEXT DEFAULT 'efectivo',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  aceptado_en TIMESTAMPTZ,
  finalizado_en TIMESTAMPTZ
);

-- 8. TABLA: mensajes_viaje
CREATE TABLE IF NOT EXISTS public.mensajes_viaje (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  remitente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. TABLA: calificaciones
CREATE TABLE IF NOT EXISTS public.calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  receptor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (viaje_id, autor_id)
);

-- 10. TABLA: transacciones
CREATE TABLE IF NOT EXISTS public.transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id UUID NOT NULL REFERENCES public.conductores_perfil(usuario_id) ON DELETE CASCADE,
  viaje_id UUID REFERENCES public.viajes(id) ON DELETE SET NULL,
  tipo public.tipo_transaccion NOT NULL,
  monto NUMERIC NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. TABLA: documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo public.tipo_documento NOT NULL,
  url_archivo TEXT NOT NULL,
  estado public.estado_verificacion DEFAULT 'pendiente'::public.estado_verificacion,
  motivo_rechazo TEXT,
  fecha_subida TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. TABLA: verificaciones_telefono
CREATE TABLE IF NOT EXISTS public.verificaciones_telefono (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono TEXT NOT NULL,
  pin_id TEXT UNIQUE NOT NULL,
  verificado BOOLEAN NOT NULL DEFAULT false,
  consumido BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_en TIMESTAMPTZ NOT NULL
);

-- 13. TRIGGERS Y FUNCIONES

-- Sincronizar avatar_url y foto_url
CREATE OR REPLACE FUNCTION public.sincronizar_avatar_usuario()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.avatar_url IS NOT NULL AND NEW.foto_url IS NULL THEN
      NEW.foto_url := NEW.avatar_url;
    ELSIF NEW.foto_url IS NOT NULL AND NEW.avatar_url IS NULL THEN
      NEW.avatar_url := NEW.foto_url;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
      NEW.foto_url := NEW.avatar_url;
    ELSIF NEW.foto_url IS DISTINCT FROM OLD.foto_url THEN
      NEW.avatar_url := NEW.foto_url;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sincronizar_avatar_usuario ON public.usuarios;
CREATE TRIGGER tr_sincronizar_avatar_usuario
BEFORE INSERT OR UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.sincronizar_avatar_usuario();

-- Manejo de nuevos usuarios creados desde Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_avatar TEXT;
  v_nombre TEXT;
  v_apellidos TEXT;
  v_telefono TEXT;
  v_rol public.rol_usuario;
BEGIN
  v_avatar := COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL);
  v_nombre := COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', 'Usuario');
  v_apellidos := COALESCE(new.raw_user_meta_data->>'apellidos', '');
  v_telefono := COALESCE(new.raw_user_meta_data->>'telefono', 'Sin numero - ' || new.id);

  BEGIN
    v_rol := (new.raw_user_meta_data->>'rol')::public.rol_usuario;
  EXCEPTION WHEN OTHERS THEN
    v_rol := 'pasajero'::public.rol_usuario;
  END;
  IF v_rol IS NULL THEN
    v_rol := 'pasajero'::public.rol_usuario;
  END IF;

  INSERT INTO public.usuarios (id, rol, nombre, apellidos, telefono, avatar_url, foto_url)
  VALUES (
    new.id,
    v_rol,
    v_nombre,
    v_apellidos,
    v_telefono,
    v_avatar,
    v_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    rol = EXCLUDED.rol,
    nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    telefono = EXCLUDED.telefono,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.usuarios.avatar_url),
    foto_url = COALESCE(EXCLUDED.foto_url, public.usuarios.foto_url);

  IF (v_rol = 'pasajero') THEN
    INSERT INTO public.pasajeros_perfil (usuario_id) VALUES (new.id)
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;

  IF (v_rol = 'conductor') THEN
    INSERT INTO public.conductores_perfil (usuario_id) VALUES (new.id)
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 14. BUCKET DE ALMACENAMIENTO PARA AVATARES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatares publicos visibles'
  ) THEN
    CREATE POLICY "Avatares publicos visibles"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;


-- 15. SEGURIDAD RLS Y ALMACENAMIENTO PRIVADO
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


-- Las declaraciones de seguridad se mantienen en la migración correspondiente.
-- Altokke / Supabase Auth + RLS.
-- Ejecutar tras revisar el esquema efectivo y probar con usuarios de prueba.
-- Los datos de auth.users son propiedad de Supabase Auth.

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

CREATE POLICY altokke_usuarios_select ON public.usuarios FOR SELECT TO authenticated
 USING (id=(SELECT auth.uid()));
CREATE POLICY altokke_usuarios_update ON public.usuarios FOR UPDATE TO authenticated
 USING (id=(SELECT auth.uid())) WITH CHECK(id=(SELECT auth.uid()));
CREATE POLICY altokke_pasajeros_select ON public.pasajeros_perfil FOR SELECT TO authenticated
 USING(usuario_id=(SELECT auth.uid()));
CREATE POLICY altokke_pasajeros_update ON public.pasajeros_perfil FOR UPDATE TO authenticated
 USING(usuario_id=(SELECT auth.uid())) WITH CHECK(usuario_id=(SELECT auth.uid()));
CREATE POLICY altokke_conductores_select ON public.conductores_perfil FOR SELECT TO authenticated
 USING(usuario_id=(SELECT auth.uid()));
CREATE POLICY altokke_conductores_update ON public.conductores_perfil FOR UPDATE TO authenticated
 USING(usuario_id=(SELECT auth.uid()) AND estado='aprobado')
 WITH CHECK(usuario_id=(SELECT auth.uid()) AND estado='aprobado');
CREATE POLICY altokke_vehiculos_select ON public.vehiculos FOR SELECT TO authenticated
 USING(conductor_id=(SELECT auth.uid()));
CREATE POLICY altokke_vehiculos_insert ON public.vehiculos FOR INSERT TO authenticated
 WITH CHECK(conductor_id=(SELECT auth.uid()) AND activo=false);
CREATE POLICY altokke_vehiculos_update ON public.vehiculos FOR UPDATE TO authenticated
 USING(conductor_id=(SELECT auth.uid())) WITH CHECK(conductor_id=(SELECT auth.uid()));
CREATE POLICY altokke_documentos_select ON public.documentos FOR SELECT TO authenticated
 USING(usuario_id=(SELECT auth.uid()));
CREATE POLICY altokke_documentos_insert ON public.documentos FOR INSERT TO authenticated
 WITH CHECK(usuario_id=(SELECT auth.uid()));

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

-- 16. Funciones transaccionales del ciclo de viaje.
-- Operaciones de viaje confiables: las transiciones y saldos se validan en PostgreSQL.
CREATE OR REPLACE FUNCTION public.aceptar_viaje(p_viaje_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(
 SELECT 1 FROM public.conductores_perfil
 WHERE usuario_id=v_uid AND estado='aprobado') THEN
 RAISE EXCEPTION 'Conductor no autorizado';
 END IF;
 UPDATE public.viajes SET conductor_id=v_uid,estado='aceptado',aceptado_en=now()
 WHERE id=p_viaje_id AND estado='buscando' AND conductor_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no disponible'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.aceptar_viaje(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aceptar_viaje(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.finalizar_viaje(p_viaje_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_uid uuid := auth.uid();
 v_tarifa numeric;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sesion requerida'; END IF;
 -- Tarifa determinada por el dato previamente guardado, no por el cliente.
 UPDATE public.viajes
 SET estado='finalizado',tarifa_final=tarifa_estimada,finalizado_en=now()
 WHERE id=p_viaje_id AND conductor_id=v_uid
 AND estado IN ('aceptado','en_camino_origen','esperando_pasajero','en_viaje')
 RETURNING tarifa_final INTO v_tarifa;
 IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no disponible'; END IF;
 -- La tarifa_estimada la envía el cliente y NO acredita dinero.
 -- El saldo solo debe modificarse mediante un cobro verificado en el servidor.
 UPDATE public.conductores_perfil
 SET viajes_completados=coalesce(viajes_completados,0)+1
 WHERE usuario_id=v_uid;
END $$;
REVOKE ALL ON FUNCTION public.finalizar_viaje(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalizar_viaje(uuid) TO authenticated;

-- El pasajero solo puede cancelar una solicitud propia que aún no inició viaje.
CREATE OR REPLACE FUNCTION public.cancelar_viaje_pasajero(p_viaje_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL THEN
   RAISE EXCEPTION 'Se requiere una sesión autenticada';
 END IF;
 UPDATE public.viajes
 SET estado='cancelado_pasajero'
 WHERE id=p_viaje_id AND pasajero_id=auth.uid()
   AND estado IN ('buscando','aceptado','en_camino_origen','esperando_pasajero');
 IF NOT FOUND THEN
   RAISE EXCEPTION 'El viaje no existe o ya no se puede cancelar';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.cancelar_viaje_pasajero(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_viaje_pasajero(uuid) TO authenticated;

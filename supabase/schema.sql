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
  comision_altokke NUMERIC(10,2) DEFAULT 0.00,
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
  etiquetas TEXT[] DEFAULT '{}',
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
-- Creación de viajes restringida exclusivamente a RPC solicitar_viaje
REVOKE INSERT ON public.viajes FROM PUBLIC, anon, authenticated;
GRANT INSERT(viaje_id,remitente_id,contenido) ON public.mensajes_viaje TO authenticated;
GRANT INSERT(viaje_id,autor_id,receptor_id,puntuacion,comentario,etiquetas)
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
-- Creación de viajes restringida exclusivamente a RPC solicitar_viaje
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

CREATE OR REPLACE FUNCTION public.finalizar_viaje(p_viaje_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_conductor_id UUID;
    v_viaje public.viajes%ROWTYPE;
    v_comision_pct NUMERIC(5,2) := 0.00;
    v_monto_viaje NUMERIC(10,2);
    v_comision_monto NUMERIC(10,2) := 0.00;
    v_saldo_actual NUMERIC(10,2);
    v_nuevo_saldo NUMERIC(10,2);
BEGIN
    v_conductor_id := auth.uid();
    IF v_conductor_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_viaje
    FROM public.viajes
    WHERE id = p_viaje_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado' USING ERRCODE = 'P0001';
    END IF;

    IF v_viaje.estado = 'finalizado' AND v_viaje.conductor_id = v_conductor_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'viaje_id', p_viaje_id,
            'estado', 'finalizado',
            'mensaje', 'Viaje ya se encontraba finalizado previamente'
        );
    END IF;

    IF v_viaje.conductor_id != v_conductor_id THEN
        RAISE EXCEPTION 'No eres el conductor asignado a este viaje' USING ERRCODE = '42501';
    END IF;

    IF v_viaje.estado NOT IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje') THEN
        RAISE EXCEPTION 'El viaje no se encuentra en curso' USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(comision_porcentaje, 0.00) INTO v_comision_pct
    FROM public.configuracion_app
    WHERE id = 1;

    IF v_comision_pct IS NULL THEN
        v_comision_pct := 0.00;
    END IF;

    v_monto_viaje := COALESCE(v_viaje.tarifa_final, v_viaje.tarifa_estimada, 3.00);
    v_comision_monto := ROUND((v_monto_viaje * (v_comision_pct / 100.00)), 2);

    SELECT saldo_billetera INTO v_saldo_actual
    FROM public.conductores_perfil
    WHERE usuario_id = v_conductor_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de conductor no encontrado' USING ERRCODE = 'P0001';
    END IF;

    IF v_comision_monto > 0 THEN
        v_nuevo_saldo := ROUND(v_saldo_actual - v_comision_monto, 2);

        IF v_nuevo_saldo < -10.00 THEN
            RAISE EXCEPTION 'Saldo insuficiente en billetera para deducir comision' USING ERRCODE = 'P0001';
        END IF;

        UPDATE public.conductores_perfil
        SET saldo_billetera = v_nuevo_saldo,
            en_linea = true,
            viajes_completados = COALESCE(viajes_completados, 0) + 1
        WHERE usuario_id = v_conductor_id;

        INSERT INTO public.transacciones (
            conductor_id, viaje_id, tipo, monto
        ) VALUES (
            v_conductor_id, p_viaje_id, 'pago_comision', v_comision_monto
        );
    ELSE
        v_nuevo_saldo := v_saldo_actual;

        UPDATE public.conductores_perfil
        SET en_linea = true,
            viajes_completados = COALESCE(viajes_completados, 0) + 1
        WHERE usuario_id = v_conductor_id;

        INSERT INTO public.transacciones (
            conductor_id, viaje_id, tipo, monto
        ) VALUES (
            v_conductor_id, p_viaje_id, 'pago_comision', 0.00
        );
    END IF;

    UPDATE public.viajes
    SET estado = 'finalizado',
        tarifa_final = v_monto_viaje,
        comision_altokke = v_comision_monto,
        fin_viaje = now(),
        actualizado_en = now()
    WHERE id = p_viaje_id;

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', p_viaje_id,
        'estado', 'finalizado',
        'comision_monto', v_comision_monto,
        'saldo_billetera', v_nuevo_saldo
    );
END;
$$;
REVOKE ALL ON FUNCTION public.finalizar_viaje(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalizar_viaje(UUID) TO authenticated;

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

-- 17. Tabla de configuración operativa de la app
CREATE TABLE IF NOT EXISTS public.configuracion_app (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    comision_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100),
    tarifa_minima NUMERIC(10,2) NOT NULL DEFAULT 3.00 CHECK (tarifa_minima >= 0),
    tarifa_maxima NUMERIC(10,2) NOT NULL DEFAULT 100.00 CHECK (tarifa_maxima >= tarifa_minima),
    cuentas_revisoras JSONB NOT NULL DEFAULT '["revisor.apple@altokke.pe", "revisor.google@altokke.pe", "apple.review@altokke.pe", "google.review@altokke.pe"]'::jsonb,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.configuracion_app (id, comision_porcentaje, tarifa_minima, tarifa_maxima, cuentas_revisoras)
VALUES (1, 0.00, 3.00, 100.00, '["revisor.apple@altokke.pe", "revisor.google@altokke.pe", "apple.review@altokke.pe", "google.review@altokke.pe"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracion_app ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica configuracion_app" ON public.configuracion_app;
CREATE POLICY "Lectura publica configuracion_app" ON public.configuracion_app FOR SELECT TO public USING (true);
REVOKE ALL ON public.configuracion_app FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.configuracion_app TO anon, authenticated;
GRANT ALL ON public.configuracion_app TO service_role;

-- 18. Procedimiento transaccional seguro de billetera (solo service_role)
CREATE OR REPLACE FUNCTION public.procesar_transaccion_billetera(
  p_conductor_id UUID,
  p_tipo public.tipo_transaccion,
  p_monto NUMERIC,
  p_viaje_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_saldo_actual NUMERIC;
  v_nuevo_saldo NUMERIC;
BEGIN
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto de la transacción debe ser mayor a cero';
  END IF;

  SELECT saldo_billetera INTO v_saldo_actual
  FROM public.conductores_perfil
  WHERE usuario_id = p_conductor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de conductor no encontrado';
  END IF;

  IF p_tipo IN ('cobro_viaje', 'bono') THEN
    v_nuevo_saldo := round(v_saldo_actual + p_monto, 2);
  ELSIF p_tipo IN ('pago_comision', 'retiro_banco') THEN
    v_nuevo_saldo := round(v_saldo_actual - p_monto, 2);
  ELSE
    RAISE EXCEPTION 'Tipo de transacción no soportado';
  END IF;

  IF v_nuevo_saldo < -10.00 THEN
    RAISE EXCEPTION 'Saldo insuficiente para completar la deducción';
  END IF;

  UPDATE public.conductores_perfil
  SET saldo_billetera = v_nuevo_saldo
  WHERE usuario_id = p_conductor_id;

  INSERT INTO public.transacciones (
    conductor_id,
    viaje_id,
    tipo,
    monto
  ) VALUES (
    p_conductor_id,
    p_viaje_id,
    p_tipo,
    p_monto
  );

  RETURN v_nuevo_saldo;
END;
$$;
REVOKE ALL ON FUNCTION public.procesar_transaccion_billetera(UUID, public.tipo_transaccion, NUMERIC, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_transaccion_billetera(UUID, public.tipo_transaccion, NUMERIC, UUID) TO service_role;

-- 19. Creación segura de viaje con bypass para revisores de tiendas
CREATE OR REPLACE FUNCTION public.solicitar_viaje(
    p_origen_texto TEXT,
    p_destino_texto TEXT,
    p_origen_lat DOUBLE PRECISION,
    p_origen_lng DOUBLE PRECISION,
    p_destino_lat DOUBLE PRECISION,
    p_destino_lng DOUBLE PRECISION,
    p_metodo_pago TEXT DEFAULT 'efectivo',
    p_paga_con NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_pasajero_id UUID;
    v_viaje_id UUID;
    v_distancia_km DOUBLE PRECISION;
    v_tarifa_calculada NUMERIC;
    v_tarifa_minima NUMERIC := 3.00;
    v_tarifa_maxima NUMERIC := 100.00;
    v_vuelto_estimado NUMERIC := NULL;
    v_viaje_existente UUID;
    v_es_revisor BOOLEAN := false;
    v_user_email TEXT;
BEGIN
    v_pasajero_id := auth.uid();
    IF v_pasajero_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
    END IF;

    IF p_origen_lat IS NULL OR p_origen_lng IS NULL OR p_destino_lat IS NULL OR p_destino_lng IS NULL THEN
        RAISE EXCEPTION 'Coordenadas geograficas no pueden ser nulas' USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(tarifa_minima, 3.00), COALESCE(tarifa_maxima, 100.00)
    INTO v_tarifa_minima, v_tarifa_maxima
    FROM public.configuracion_app
    WHERE id = 1;

    SELECT email INTO v_user_email FROM auth.users WHERE id = v_pasajero_id;

    SELECT COALESCE(
      EXISTS (
        SELECT 1
        FROM public.configuracion_app cfg
        WHERE cfg.id = 1
          AND (
            (v_user_email IS NOT NULL AND v_user_email = ANY(ARRAY(SELECT jsonb_array_elements_text(cfg.cuentas_revisoras))))
            OR (auth.jwt() -> 'user_metadata' ->> 'es_revisor')::boolean = true
            OR (v_user_email ILIKE '%@apple.com')
            OR (v_user_email ILIKE '%@google.com')
            OR (v_user_email ILIKE 'revisor%@altokke.pe')
          )
      ),
      false
    ) INTO v_es_revisor;

    IF NOT v_es_revisor THEN
        IF (p_origen_lat NOT BETWEEN -5.75 AND -5.50) OR (p_origen_lng NOT BETWEEN -78.60 AND -78.40) THEN
            RAISE EXCEPTION 'Punto de recojo fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
        END IF;

        IF (p_destino_lat NOT BETWEEN -5.75 AND -5.50) OR (p_destino_lng NOT BETWEEN -78.60 AND -78.40) THEN
            RAISE EXCEPTION 'Destino fuera del area de cobertura de Bagua' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    SELECT id INTO v_viaje_existente
    FROM public.viajes
    WHERE pasajero_id = v_pasajero_id
      AND estado IN ('buscando', 'aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    LIMIT 1;

    IF v_viaje_existente IS NOT NULL THEN
        RAISE EXCEPTION 'Ya tienes un viaje en curso o en busqueda' USING ERRCODE = '23505';
    END IF;

    v_distancia_km := 6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(p_origen_lat)) * cos(radians(p_destino_lat)) *
            cos(radians(p_destino_lng) - radians(p_origen_lng)) +
            sin(radians(p_origen_lat)) * sin(radians(p_destino_lat))
        ))
    );

    IF v_distancia_km IS NULL OR v_distancia_km < 0.05 THEN
        v_distancia_km := 0.5;
    END IF;

    IF v_distancia_km <= 1.0 THEN
        v_tarifa_calculada := v_tarifa_minima;
    ELSE
        v_tarifa_calculada := ROUND((v_tarifa_minima + (v_distancia_km - 1.0) * 1.00)::numeric, 1);
    END IF;

    IF v_tarifa_calculada > v_tarifa_maxima THEN
        v_tarifa_calculada := v_tarifa_maxima;
    END IF;

    IF p_metodo_pago = 'efectivo' AND p_paga_con IS NOT NULL THEN
        IF p_paga_con < v_tarifa_calculada THEN
            RAISE EXCEPTION 'El monto de pago no puede ser menor a la tarifa (S/ %)', v_tarifa_calculada USING ERRCODE = 'P0001';
        END IF;
        IF p_paga_con > 100.00 THEN
            RAISE EXCEPTION 'No se admiten billetes superiores a S/ 100 en mototaxi' USING ERRCODE = 'P0001';
        END IF;
        v_vuelto_estimado := ROUND((p_paga_con - v_tarifa_calculada)::numeric, 2);
    END IF;

    INSERT INTO public.viajes (
        pasajero_id, origen_texto, destino_texto,
        origen_lat, origen_lng, destino_lat, destino_lng,
        distancia_km, tarifa_estimada, metodo_pago,
        paga_con, vuelto_estimado, estado
    ) VALUES (
        v_pasajero_id, p_origen_texto, p_destino_texto,
        p_origen_lat, p_origen_lng, p_destino_lat, p_destino_lng,
        v_distancia_km, v_tarifa_calculada, p_metodo_pago,
        p_paga_con, v_vuelto_estimado, 'buscando'::public.estado_viaje
    ) RETURNING id INTO v_viaje_id;

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', v_viaje_id,
        'distancia_km', v_distancia_km,
        'tarifa_estimada', v_tarifa_calculada,
        'vuelto_estimado', v_vuelto_estimado,
        'modo_revisor', v_es_revisor
    );
END;
$$;
REVOKE ALL ON FUNCTION public.solicitar_viaje(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.solicitar_viaje(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, NUMERIC) TO authenticated;

-- 20. Validación estricta de OTP telefónico
CREATE OR REPLACE FUNCTION public.validar_codigo_telefono(
  p_telefono TEXT,
  p_pin_id TEXT,
  p_codigo_ingresado TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_registro public.verificaciones_telefono%ROWTYPE;
BEGIN
  SELECT * INTO v_registro
  FROM public.verificaciones_telefono
  WHERE telefono = p_telefono AND pin_id = p_pin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false, 'error', 'Registro no encontrado');
  END IF;

  IF v_registro.consumido THEN
    RETURN jsonb_build_object('valido', false, 'error', 'El código ya ha sido utilizado');
  END IF;

  IF now() > v_registro.expira_en THEN
    RETURN jsonb_build_object('valido', false, 'error', 'El código ha expirado');
  END IF;

  IF v_registro.bloqueado_hasta IS NOT NULL AND now() < v_registro.bloqueado_hasta THEN
    RETURN jsonb_build_object(
      'valido', false,
      'error', 'Demasiados intentos fallidos. Intente nuevamente en unos minutos.',
      'bloqueado_hasta', v_registro.bloqueado_hasta
    );
  END IF;

  IF p_codigo_ingresado IS NULL 
     OR trim(p_codigo_ingresado) = '' 
     OR trim(p_codigo_ingresado) <> trim(v_registro.codigo) THEN
    
    UPDATE public.verificaciones_telefono
    SET intentos_fallidos = intentos_fallidos + 1,
        bloqueado_hasta = CASE
          WHEN intentos_fallidos + 1 >= max_intentos THEN now() + INTERVAL '15 minutes'
          ELSE NULL
        END
    WHERE id = v_registro.id;

    RETURN jsonb_build_object(
      'valido', false,
      'error', 'Código incorrecto',
      'intentos_restantes', GREATEST(0, v_registro.max_intentos - (v_registro.intentos_fallidos + 1))
    );
  END IF;

  UPDATE public.verificaciones_telefono
  SET verificado = true,
      consumido = true
  WHERE id = v_registro.id;

  RETURN jsonb_build_object('valido', true);
END;
$$;
REVOKE ALL ON FUNCTION public.validar_codigo_telefono(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validar_codigo_telefono(TEXT, TEXT, TEXT) TO authenticated;

-- 27. FUNCIÓN RPC: reportar_incidente
CREATE OR REPLACE FUNCTION public.reportar_incidente(
  p_tipo TEXT,
  p_descripcion TEXT,
  p_viaje_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_usuario_id UUID := auth.uid();
  v_log_id UUID;
BEGIN
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_tipo IS NULL OR LENGTH(TRIM(p_tipo)) = 0 THEN
    RAISE EXCEPTION 'El tipo de incidente es obligatorio';
  END IF;

  IF p_descripcion IS NULL OR LENGTH(TRIM(p_descripcion)) < 5 THEN
    RAISE EXCEPTION 'La descripción del incidente debe contener al menos 5 caracteres';
  END IF;

  INSERT INTO public.auditoria_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  )
  VALUES (
    v_usuario_id,
    'INCIDENTE_REPORTADO',
    'soporte_incidentes',
    p_viaje_id,
    jsonb_build_object(
      'tipo', p_tipo,
      'descripcion', p_descripcion,
      'viaje_id', p_viaje_id,
      'reportado_en', timezone('utc'::text, now())
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;
REVOKE ALL ON FUNCTION public.reportar_incidente(TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reportar_incidente(TEXT, TEXT, UUID) TO authenticated, service_role;



-- ==============================================================================
-- 23. LIBRO DE RECLAMACIONES E INFRAESTRUCTURA DE NOTIFICACIONES PUSH
-- ==============================================================================

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

CREATE TABLE IF NOT EXISTS public.push_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  push_token_id UUID,
  categoria TEXT NOT NULL CHECK (categoria IN ('aprobaciones', 'viajes', 'pagos', 'cuenta')),
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ok', 'error')),
  codigo_error TEXT,
  mensaje_error TEXT,
  consultado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_receipts_ticket_id_key UNIQUE (ticket_id)
);

ALTER TABLE public.push_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.push_receipts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_receipts TO service_role;

CREATE TABLE IF NOT EXISTS public.push_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'procesando' CHECK (estado IN ('procesando', 'completado', 'fallido')),
  ultimo_error TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_webhook_events_event_hash_key UNIQUE (event_hash)
);

ALTER TABLE public.push_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.push_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_webhook_events TO service_role;

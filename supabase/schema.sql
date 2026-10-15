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
    'TARJETA_PROPIEDAD'
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
  emisor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
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
  archivo_url TEXT NOT NULL,
  estado public.estado_verificacion DEFAULT 'pendiente'::public.estado_verificacion,
  observaciones TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
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

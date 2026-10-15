-- ==============================================================================
-- Migración: Agregar avatar_url a la tabla public.usuarios y configurar sincronización
-- ==============================================================================

-- 1. Agregar columna avatar_url de tipo TEXT
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Asegurar que usuarios existentes tengan su avatar_url sincronizado desde foto_url
UPDATE public.usuarios 
SET avatar_url = foto_url 
WHERE avatar_url IS NULL AND foto_url IS NOT NULL;

-- 3. Crear función y trigger para mantener avatar_url y foto_url sincronizados automáticamente
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

-- 4. Actualizar función handle_new_user para admitir avatar inicial (OAuth / Auth metadata)
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

-- 5. Asegurar bucket de avatars con acceso público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Política de lectura pública de objetos en bucket avatars
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

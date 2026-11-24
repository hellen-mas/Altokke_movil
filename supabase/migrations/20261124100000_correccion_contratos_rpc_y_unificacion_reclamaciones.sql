-- ============================================================================
-- MIGRACIÓN: CORRECCIÓN DE CONTRATOS RPC Y UNIFICACIÓN DE RECLAMACIONES
-- ALTOKKE MÓVIL - TRANSPORTE URBANO BAGUA
-- AUDITORÍA: RED_TEAM_AUDIT / TAREA 1
-- FECHA: 24 de Noviembre de 2026
-- ============================================================================

-- 1. TABLA CONTRAOFERTAS_VIAJE (Garantiza referencia a conductores_perfil)
CREATE TABLE IF NOT EXISTS public.contraofertas_viaje (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
    conductor_id UUID NOT NULL REFERENCES public.conductores_perfil(usuario_id) ON DELETE CASCADE,
    tarifa_ofertada NUMERIC(10,2) NOT NULL,
    tiempo_llegada_min INT NOT NULL DEFAULT 3,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    expira_en TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '60 seconds'),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_contraoferta_estado CHECK (
      estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada', 'cancelada')
    ),
    CONSTRAINT chk_contraoferta_tarifa_positiva CHECK (tarifa_ofertada >= 2.50)
);

CREATE INDEX IF NOT EXISTS idx_contraofertas_viaje_id ON public.contraofertas_viaje(viaje_id);
CREATE INDEX IF NOT EXISTS idx_contraofertas_conductor_id ON public.contraofertas_viaje(conductor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contraoferta_activa_conductor
    ON public.contraofertas_viaje (viaje_id, conductor_id)
    WHERE estado = 'pendiente';

ALTER TABLE public.contraofertas_viaje ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pasajeros ven contraofertas de su viaje" ON public.contraofertas_viaje;
CREATE POLICY "Pasajeros ven contraofertas de su viaje"
    ON public.contraofertas_viaje FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.viajes v
            WHERE v.id = contraofertas_viaje.viaje_id
              AND v.pasajero_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Conductores ven y gestionan sus propias ofertas" ON public.contraofertas_viaje;
CREATE POLICY "Conductores ven y gestionan sus propias ofertas"
    ON public.contraofertas_viaje FOR ALL
    TO authenticated
    USING (conductor_id = (SELECT auth.uid()))
    WITH CHECK (conductor_id = (SELECT auth.uid()));

-- 2. CORRECCIÓN DE RPC: crear_contraoferta
-- Corrige la consulta que apuntaba a tabla inexistente public.conductores
CREATE OR REPLACE FUNCTION public.crear_contraoferta(
    p_viaje_id UUID,
    p_tarifa NUMERIC,
    p_tiempo_llegada_min INT DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_conductor_id UUID;
    v_conductor_estado TEXT;
    v_conductor_en_linea BOOLEAN;
    v_viaje_estado TEXT;
    v_tarifa_base NUMERIC(10,2);
    v_nueva_oferta_id UUID;
    v_piso_tarifa NUMERIC(10,2) := 2.50;
    v_techo_tarifa NUMERIC(10,2);
    v_conteo_pendientes INT;
BEGIN
    v_conductor_id := (SELECT auth.uid());
    IF v_conductor_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
    END IF;

    -- Validar que el conductor esté aprobado y en línea en conductores_perfil
    SELECT estado::text, en_linea INTO v_conductor_estado, v_conductor_en_linea
    FROM public.conductores_perfil
    WHERE usuario_id = v_conductor_id;

    IF NOT FOUND OR v_conductor_estado != 'aprobado' THEN
        RAISE EXCEPTION 'El conductor no está habilitado o no está aprobado';
    END IF;

    -- Validar que el conductor no tenga ya un viaje en curso
    IF EXISTS (
        SELECT 1 FROM public.viajes
        WHERE conductor_id = v_conductor_id
        AND estado IN ('aceptado', 'en_camino_origen', 'esperando_pasajero', 'en_viaje')
    ) THEN
        RAISE EXCEPTION 'Ya tienes un viaje activo en curso';
    END IF;

    -- Validar estado del viaje
    SELECT estado::text, tarifa_estimada INTO v_viaje_estado, v_tarifa_base
    FROM public.viajes
    WHERE id = p_viaje_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado';
    END IF;

    IF v_viaje_estado NOT IN ('buscando', 'solicitado') THEN
        RAISE EXCEPTION 'El viaje ya no está disponible para ofertas (estado actual: %)', v_viaje_estado;
    END IF;

    -- Control anti-flooding: máximo 8 ofertas simultáneas por viaje
    SELECT count(*) INTO v_conteo_pendientes
    FROM public.contraofertas_viaje
    WHERE viaje_id = p_viaje_id AND estado = 'pendiente' AND expira_en > now();

    IF v_conteo_pendientes >= 8 THEN
        RAISE EXCEPTION 'El viaje ha alcanzado el límite máximo de ofertas concurrentes';
    END IF;

    -- Validar límites de tarifa anti-usura y anti-depredación en Bagua
    v_piso_tarifa := GREATEST(2.50, ROUND((COALESCE(v_tarifa_base, 3.50) * 0.70)::numeric, 2));
    v_techo_tarifa := ROUND((COALESCE(v_tarifa_base, 3.50) * 1.50)::numeric, 2);

    IF p_tarifa < v_piso_tarifa THEN
        RAISE EXCEPTION 'La tarifa mínima permitida para este viaje es S/ %', v_piso_tarifa;
    END IF;

    IF p_tarifa > v_techo_tarifa THEN
        RAISE EXCEPTION 'La tarifa máxima permitida para este viaje es S/ %', v_techo_tarifa;
    END IF;

    -- Insertar o actualizar la oferta del conductor para este viaje
    INSERT INTO public.contraofertas_viaje (
        viaje_id, conductor_id, tarifa_ofertada, tiempo_llegada_min, estado, expira_en
    ) VALUES (
        p_viaje_id, v_conductor_id, p_tarifa, COALESCE(p_tiempo_llegada_min, 3), 'pendiente', now() + INTERVAL '60 seconds'
    )
    ON CONFLICT (viaje_id, conductor_id) WHERE estado = 'pendiente'
    DO UPDATE SET
        tarifa_ofertada = EXCLUDED.tarifa_ofertada,
        tiempo_llegada_min = EXCLUDED.tiempo_llegada_min,
        expira_en = EXCLUDED.expira_en,
        actualizado_en = now()
    RETURNING id INTO v_nueva_oferta_id;

    RETURN jsonb_build_object(
        'success', true,
        'oferta_id', v_nueva_oferta_id,
        'viaje_id', p_viaje_id,
        'tarifa', p_tarifa,
        'expira_en', (now() + INTERVAL '60 seconds')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.crear_contraoferta(UUID, NUMERIC, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_contraoferta(UUID, NUMERIC, INT) TO authenticated;

-- 3. CORRECCIÓN DE RPC: obtener_conductor_viaje
-- Corrige el JOIN con public.conductores para usar public.conductores_perfil y usuarios
CREATE OR REPLACE FUNCTION public.obtener_conductor_viaje(p_viaje_id UUID)
RETURNS TABLE (
    nombre TEXT,
    apellidos TEXT,
    foto_url TEXT,
    telefono TEXT,
    calificacion NUMERIC,
    viajes_completados INTEGER,
    placa TEXT,
    marca TEXT,
    modelo TEXT,
    color TEXT,
    lat_actual DOUBLE PRECISION,
    lng_actual DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$ 
  SELECT u.nombre, u.apellidos,
         COALESCE(u.foto_url, u.avatar_url),
         NULL::text AS telefono, -- CERO EXPOSICIÓN DE NÚMEROS TELEFÓNICOS (ANTI-ACOSO)
         COALESCE(c.calificacion_promedio, 5.0),
         COALESCE(c.viajes_completados, 0),
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

REVOKE ALL ON FUNCTION public.obtener_conductor_viaje(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_conductor_viaje(UUID) TO authenticated;

-- 4. UNIFICACIÓN DE RECLAMACIONES: SINCRONIZACIÓN AUTOMÁTICA A LIBRO INDECOPI
-- Evita silos entre la tabla móvil (public.reclamaciones) y la tabla del panel web (public.reclamaciones_libro)
CREATE OR REPLACE FUNCTION public.sincronizar_reclamacion_a_libro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insertar en reclamaciones_libro si la tabla existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reclamaciones_libro'
  ) THEN
    INSERT INTO public.reclamaciones_libro (
      codigo_correlativo,
      tipo_bien,
      tipo_reclamo,
      consumidor_nombre,
      consumidor_tipo_doc,
      consumidor_dni,
      consumidor_email,
      consumidor_telefono,
      consumidor_direccion,
      monto_reclamado,
      descripcion_hechos,
      pedido_concreto,
      estado
    ) VALUES (
      NEW.codigo_reclamacion,
      COALESCE(NEW.descripcion_bien_contratado, 'Servicio de Intermediación Tecnológica en Mototaxi'),
      CASE WHEN lower(NEW.tipo) = 'queja' THEN 'queja' ELSE 'reclamo' END,
      NEW.nombre_completo,
      CASE 
        WHEN NEW.tipo_documento IN ('DNI', 'CE', 'PASAPORTE') THEN NEW.tipo_documento 
        ELSE 'OTRO' 
      END,
      NEW.numero_documento,
      NEW.email,
      NEW.telefono,
      COALESCE(NEW.direccion, 'No especificada'),
      COALESCE(NEW.monto_reclamado, 0.00),
      NEW.detalle_reclamacion,
      NEW.pedido_consumidor,
      'pendiente'
    )
    ON CONFLICT (codigo_correlativo) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sincronizar_reclamacion_a_libro ON public.reclamaciones;
CREATE TRIGGER trg_sincronizar_reclamacion_a_libro
  AFTER INSERT ON public.reclamaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.sincronizar_reclamacion_a_libro();

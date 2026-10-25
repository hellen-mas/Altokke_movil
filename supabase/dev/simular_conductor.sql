-- =========================================================
-- SIMULADOR DE CONDUCTOR (solo desarrollo, NUNCA en producción)
-- Ejecutar cada PASO por separado en el SQL Editor.
-- =========================================================

-- PASO 0 (una sola vez): convertir el usuario de prueba en conductor aprobado con moto
DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = 'conductor.prueba@altokke.test';
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Primero crea el usuario en Authentication > Users';
  END IF;

  UPDATE public.usuarios
  SET rol = 'conductor', nombre = 'Carlos', apellidos = 'Prueba Ramos', telefono = '900000001'
  WHERE id = v_id;

  INSERT INTO public.conductores_perfil (usuario_id, estado, en_linea, calificacion_promedio, viajes_completados)
  VALUES (v_id, 'aprobado', true, 4.8, 120)
  ON CONFLICT (usuario_id) DO UPDATE SET estado = 'aprobado', en_linea = true;

  INSERT INTO public.vehiculos (conductor_id, placa, marca, modelo, color, anio, capacidad)
  VALUES (v_id, 'PRB-001', 'Bajaj', 'Torito', 'Rojo', 2022, 3)
  ON CONFLICT (placa) DO NOTHING;
END $$;

-- PASO 1: Carlos acepta el viaje más reciente que esté en 'buscando'
DO $$
DECLARE v_conductor uuid; v_viaje public.viajes;
BEGIN
  SELECT id INTO v_conductor FROM auth.users WHERE email = 'conductor.prueba@altokke.test';
  SELECT * INTO v_viaje FROM public.viajes
  WHERE estado = 'buscando' ORDER BY creado_en DESC LIMIT 1;
  IF v_viaje.id IS NULL THEN
    RAISE EXCEPTION 'No hay viajes en buscando: pide uno desde la app';
  END IF;

  UPDATE public.viajes
  SET conductor_id = v_conductor, estado = 'aceptado', aceptado_en = now()
  WHERE id = v_viaje.id;

  -- Carlos aparece a unos 900 m del pasajero
  UPDATE public.conductores_perfil
  SET lat_actual = v_viaje.origen_lat + 0.008, lng_actual = v_viaje.origen_lng + 0.008
  WHERE usuario_id = v_conductor;
END $$;

-- PASO 2: Carlos va en camino a recoger al pasajero
DO $$
DECLARE v_conductor uuid; v_viaje public.viajes;
BEGIN
  SELECT id INTO v_conductor FROM auth.users WHERE email = 'conductor.prueba@altokke.test';
  SELECT * INTO v_viaje FROM public.viajes
  WHERE conductor_id = v_conductor AND estado = 'aceptado'
  ORDER BY creado_en DESC LIMIT 1;
  IF v_viaje.id IS NULL THEN
    RAISE EXCEPTION 'No hay viaje en aceptado: ejecuta antes el PASO 1';
  END IF;

  UPDATE public.viajes SET estado = 'en_camino_origen' WHERE id = v_viaje.id;

  -- A mitad de camino hacia el origen
  UPDATE public.conductores_perfil
  SET lat_actual = v_viaje.origen_lat + 0.004, lng_actual = v_viaje.origen_lng + 0.004
  WHERE usuario_id = v_conductor;
END $$;

-- PASO 3: Carlos llegó al punto de recojo y espera al pasajero
DO $$
DECLARE v_conductor uuid; v_viaje public.viajes;
BEGIN
  SELECT id INTO v_conductor FROM auth.users WHERE email = 'conductor.prueba@altokke.test';
  SELECT * INTO v_viaje FROM public.viajes
  WHERE conductor_id = v_conductor AND estado = 'en_camino_origen'
  ORDER BY creado_en DESC LIMIT 1;
  IF v_viaje.id IS NULL THEN
    RAISE EXCEPTION 'No hay viaje en en_camino_origen: ejecuta antes el PASO 2';
  END IF;

  UPDATE public.viajes SET estado = 'esperando_pasajero' WHERE id = v_viaje.id;

  -- Justo en el origen
  UPDATE public.conductores_perfil
  SET lat_actual = v_viaje.origen_lat, lng_actual = v_viaje.origen_lng
  WHERE usuario_id = v_conductor;
END $$;

-- PASO 4: el pasajero subió y van hacia el destino
DO $$
DECLARE v_conductor uuid; v_viaje public.viajes;
BEGIN
  SELECT id INTO v_conductor FROM auth.users WHERE email = 'conductor.prueba@altokke.test';
  SELECT * INTO v_viaje FROM public.viajes
  WHERE conductor_id = v_conductor AND estado = 'esperando_pasajero'
  ORDER BY creado_en DESC LIMIT 1;
  IF v_viaje.id IS NULL THEN
    RAISE EXCEPTION 'No hay viaje en esperando_pasajero: ejecuta antes el PASO 3';
  END IF;

  UPDATE public.viajes SET estado = 'en_viaje' WHERE id = v_viaje.id;

  -- Punto medio entre origen y destino
  UPDATE public.conductores_perfil
  SET lat_actual = (v_viaje.origen_lat + v_viaje.destino_lat) / 2,
      lng_actual = (v_viaje.origen_lng + v_viaje.destino_lng) / 2
  WHERE usuario_id = v_conductor;
END $$;

-- PASO 5: legaron al destino y el viaje termina
DO $$
DECLARE v_conductor uuid; v_viaje public.viajes;
BEGIN
  SELECT id INTO v_conductor FROM auth.users WHERE email = 'conductor.prueba@altokke.test';
  SELECT * INTO v_viaje FROM public.viajes
  WHERE conductor_id = v_conductor AND estado = 'en_viaje'
  ORDER BY creado_en DESC LIMIT 1;
  IF v_viaje.id IS NULL THEN
    RAISE EXCEPTION 'No hay viaje en en_viaje: ejecuta antes el PASO 4';
  END IF;

  -- Se guarda la tarifa final y la hora de llegada (las usa el Paquete 4)
  UPDATE public.viajes
  SET estado = 'finalizado', tarifa_final = v_viaje.tarifa_estimada, finalizado_en = now()
  WHERE id = v_viaje.id;

  -- Justo en el destino
  UPDATE public.conductores_perfil
  SET lat_actual = v_viaje.destino_lat, lng_actual = v_viaje.destino_lng
  WHERE usuario_id = v_conductor;
END $$;
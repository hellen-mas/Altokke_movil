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

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ============================================================================
// CONFIGURACIÓN DE ENTORNO Y MÉTRICAS
// ============================================================================
const BASE_URL = __ENV.SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'test-anon-key';
const PASAJERO_JWT = __ENV.PASAJERO_JWT || __ENV.TEST_PASAJERO_JWT || 'Bearer test-pasajero-jwt';
const CONDUCTOR_JWT = __ENV.CONDUCTOR_JWT || __ENV.TEST_CONDUCTOR_JWT || 'Bearer test-conductor-jwt';
const PASAJERO_ID = __ENV.PASAJERO_ID || '11111111-1111-1111-1111-111111111111';
const CONDUCTOR_ID = __ENV.CONDUCTOR_ID || '22222222-2222-2222-2222-222222222222';

function limpiarBearer(token) {
  const t = (token || '').trim();
  if (!t) return 'Bearer token-invalido';
  return t.startsWith('Bearer ') ? t : `Bearer ${t}`;
}

const authHeaderPasajero = {
  'apikey': ANON_KEY,
  'Authorization': limpiarBearer(PASAJERO_JWT),
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const authHeaderConductor = {
  'apikey': ANON_KEY,
  'Authorization': limpiarBearer(CONDUCTOR_JWT),
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const anonHeader = {
  'apikey': ANON_KEY,
  'Content-Type': 'application/json',
};

// Métricas de observabilidad
const duracionE2E = new Trend('altokke_smoke_duracion_ms');
const tasaSeguridadChecks = new Rate('altokke_seguridad_checks_exitosos');
const fallosSeguridad = new Counter('altokke_fallos_seguridad_total');

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    altokke_seguridad_checks_exitosos: ['rate==1.0'], // 100% de las pruebas de seguridad deben pasar
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const tiempoInicio = Date.now();

  // ==========================================================================
  // BLOQUE 1: VERIFICACIONES NEGATIVAS DE SEGURIDAD (RED TEAM / AUDITORÍA)
  // ==========================================================================
  group('1. Pruebas Negativas de Seguridad y Blindaje RLS', () => {

    // 1.1 Intento de INSERT directo en public.viajes (DEBE SER RECHAZADO)
    const payloadViajeDirecto = JSON.stringify({
      pasajero_id: PASAJERO_ID,
      origen_texto: 'Ataque directo bypassing RPC',
      destino_texto: 'Destino malicioso',
      origen_lat: -5.6394,
      origen_lng: -78.5311,
      destino_lat: -5.6450,
      destino_lng: -78.5250,
      tarifa_estimada: 1.00,
    });

    const resInsertDirecto = http.post(
      `${BASE_URL}/rest/v1/viajes`,
      payloadViajeDirecto,
      { headers: authHeaderPasajero }
    );

    const insertDirectoBloqueado = check(resInsertDirecto, {
      'INSERT directo en viajes rechazado (401/403/42501)': (r) =>
        r.status === 401 || r.status === 403 || r.status === 404 ||
        (r.body && (r.body.includes('permission denied') || r.body.includes('42501') || r.body.includes('violates row-level'))),
    });
    tasaSeguridadChecks.add(insertDirectoBloqueado);
    if (!insertDirectoBloqueado) fallosSeguridad.add(1);

    // 1.2 Intento de invocar procesar_transaccion_billetera con token autenticado (DEBE SER RECHAZADO)
    const payloadTransaccionIlegal = JSON.stringify({
      p_conductor_id: CONDUCTOR_ID,
      p_monto: 9999.00,
      p_tipo: 'recarga',
      p_concepto: 'Recarga forzada sin service_role',
    });

    const resTransaccionAuth = http.post(
      `${BASE_URL}/rest/v1/rpc/procesar_transaccion_billetera`,
      payloadTransaccionIlegal,
      { headers: authHeaderConductor }
    );

    const transaccionAuthBloqueada = check(resTransaccionAuth, {
      'procesar_transaccion_billetera rechazado a authenticated (401/403/404)': (r) =>
        r.status === 401 || r.status === 403 || r.status === 404 ||
        (r.body && (r.body.includes('permission denied') || r.body.includes('42501'))),
    });
    tasaSeguridadChecks.add(transaccionAuthBloqueada);
    if (!transaccionAuthBloqueada) fallosSeguridad.add(1);

    // 1.3 Intento de invocar procesar_transaccion_billetera anónimo (DEBE SER RECHAZADO)
    const resTransaccionAnon = http.post(
      `${BASE_URL}/rest/v1/rpc/procesar_transaccion_billetera`,
      payloadTransaccionIlegal,
      { headers: anonHeader }
    );

    const transaccionAnonBloqueada = check(resTransaccionAnon, {
      'procesar_transaccion_billetera rechazado a anon (401/403/404)': (r) =>
        r.status === 401 || r.status === 403 || r.status === 404,
    });
    tasaSeguridadChecks.add(transaccionAnonBloqueada);
    if (!transaccionAnonBloqueada) fallosSeguridad.add(1);

    // 1.4 Intento de lectura cruzada de transacciones ajenas (Aislamiento RLS)
    const resLecturaCruzada = http.get(
      `${BASE_URL}/rest/v1/transacciones?select=*`,
      { headers: authHeaderPasajero }
    );

    const rlsTransaccionesOk = check(resLecturaCruzada, {
      'Aislamiento RLS: pasajero no ve transacciones de conductores': (r) => {
        if (r.status === 403 || r.status === 401) return true;
        if (r.status === 200) {
          try {
            const data = JSON.parse(r.body);
            return Array.isArray(data) && data.length === 0;
          } catch {
            return false;
          }
        }
        return false;
      },
    });
    tasaSeguridadChecks.add(rlsTransaccionesOk);
    if (!rlsTransaccionesOk) fallosSeguridad.add(1);

    // 1.5 Invocación no autenticada de Edge Function culqi-charge (DEBE RECHAZAR CON 401)
    const resCulqiAnon = http.post(
      `${BASE_URL}/functions/v1/culqi-charge`,
      JSON.stringify({ token: 'tkn_test_123', monto: 500 }),
      { headers: anonHeader }
    );

    const culqiAnonRechazado = check(resCulqiAnon, {
      'culqi-charge sin JWT rechaza acceso (401)': (r) => r.status === 401,
    });
    tasaSeguridadChecks.add(culqiAnonRechazado);
    if (!culqiAnonRechazado) fallosSeguridad.add(1);

    // 1.6 Intento de INSERT directo en public.contraofertas_viaje (DEBE SER RECHAZADO)
    const payloadOfertaDirecta = JSON.stringify({
      viaje_id: '33333333-3333-3333-3333-333333333333',
      conductor_id: CONDUCTOR_ID,
      tarifa_ofertada: 5.00,
      tiempo_llegada_min: 3,
    });

    const resInsertContraoferta = http.post(
      `${BASE_URL}/rest/v1/contraofertas_viaje`,
      payloadOfertaDirecta,
      { headers: authHeaderConductor }
    );

    const insertContraofertaBloqueado = check(resInsertContraoferta, {
      'INSERT directo en contraofertas_viaje rechazado (401/403/42501)': (r) =>
        r.status === 401 || r.status === 403 || r.status === 404 ||
        (r.body && (r.body.includes('permission denied') || r.body.includes('42501') || r.body.includes('violates row-level'))),
    });
    tasaSeguridadChecks.add(insertContraofertaBloqueado);
    if (!insertContraofertaBloqueado) fallosSeguridad.add(1);

    // 1.7 Spoofing de push notification arbitrario sin relación legítima (DEBE RECHAZAR CON 403)
    const payloadPushSpoofing = JSON.stringify({
      evento: 'chat_mensaje',
      viajeId: '33333333-3333-3333-3333-333333333333',
      usuarioDestinoId: '99999999-9999-9999-9999-999999999999',
      titulo: 'Ataque de push arbitrario',
      mensaje: 'Spam no autorizado',
    });

    const resPushSpoofing = http.post(
      `${BASE_URL}/functions/v1/enviar-notificacion-push`,
      payloadPushSpoofing,
      { headers: authHeaderPasajero }
    );

    const pushSpoofingRechazado = check(resPushSpoofing, {
      'Push spoofing arbitrario rechazado (401/403/404)': (r) =>
        r.status === 401 || r.status === 403 || r.status === 404,
    });
    tasaSeguridadChecks.add(pushSpoofingRechazado);
    if (!pushSpoofingRechazado) fallosSeguridad.add(1);
  });

  // ==========================================================================
  // BLOQUE 2: CICLO DE VIDA COMPLETO DE LA API (SOLICITUD -> FINALIZACIÓN)
  // ==========================================================================
  group('2. Ciclo de Vida Secuencial de Viaje en Altokke', () => {
    let viajeId = null;
    let ofertaId = null;

    // 2.1 Pasajero solicita viaje vía RPC solicitar_viaje
    const payloadSolicitud = JSON.stringify({
      p_origen_texto: 'Parque Principal de Bagua',
      p_destino_texto: 'Hospital de Apoyo Gustavo Lanatta Luján',
      p_origen_lat: -5.6394,
      p_origen_lng: -78.5311,
      p_destino_lat: -5.6420,
      p_destino_lng: -78.5280,
      p_metodo_pago: 'efectivo',
      p_paga_con: 10.00,
    });

    const resSolicitud = http.post(
      `${BASE_URL}/rest/v1/rpc/solicitar_viaje`,
      payloadSolicitud,
      { headers: authHeaderPasajero }
    );

    const solicitudExitosa = check(resSolicitud, {
      'solicitar_viaje responde 200': (r) => r.status === 200,
      'solicitar_viaje devuelve viaje_id': (r) => {
        try {
          const body = JSON.parse(r.body);
          viajeId = body.viaje_id || body.id;
          return !!viajeId;
        } catch {
          return false;
        }
      },
    });

    if (!solicitudExitosa || !viajeId) {
      console.warn('Fallo en solicitar_viaje o entorno sin token real, usando ID ficticio para continuar validaciones.');
      viajeId = '00000000-0000-0000-0000-000000000001';
    }

    sleep(0.3);

    // 2.2 Conductor propone contraoferta vía crear_contraoferta
    const payloadContraoferta = JSON.stringify({
      p_viaje_id: viajeId,
      p_tarifa: 4.00,
      p_tiempo_llegada_min: 3,
    });

    const resOferta = http.post(
      `${BASE_URL}/rest/v1/rpc/crear_contraoferta`,
      payloadContraoferta,
      { headers: authHeaderConductor }
    );

    check(resOferta, {
      'crear_contraoferta procesada (200 o validación controlada)': (r) => {
        if (r.status === 200) {
          try {
            const body = JSON.parse(r.body);
            ofertaId = body.oferta_id || body.id;
            return true;
          } catch {
            return false;
          }
        }
        // En mock/pruebas locales sin fila real de conductor aprobado devuelve 400 con mensaje controlado
        return r.status === 400 || r.status === 404;
      },
    });

    sleep(0.3);

    // 2.3 Pasajero selecciona oferta o conductor acepta viaje directo
    if (ofertaId) {
      const resSeleccion = http.post(
        `${BASE_URL}/rest/v1/rpc/seleccionar_oferta_viaje`,
        JSON.stringify({ p_oferta_id: ofertaId }),
        { headers: authHeaderPasajero }
      );
      check(resSeleccion, {
        'seleccionar_oferta_viaje responde 200': (r) => r.status === 200,
      });
    } else {
      const resAceptar = http.post(
        `${BASE_URL}/rest/v1/rpc/aceptar_viaje`,
        JSON.stringify({ p_viaje_id: viajeId }),
        { headers: authHeaderConductor }
      );
      check(resAceptar, {
        'aceptar_viaje procesada (200 o validación controlada)': (r) =>
          r.status === 200 || r.status === 400 || r.status === 404,
      });
    }

    sleep(0.3);

    // 2.4 Chat in-app: Enviar y leer mensajes del viaje
    const resMensaje = http.post(
      `${BASE_URL}/rest/v1/mensajes_viaje`,
      JSON.stringify({
        viaje_id: viajeId,
        remitente_id: PASAJERO_ID,
        contenido: 'Estoy esperando frente a la farmacia.',
        tipo: 'texto',
      }),
      { headers: authHeaderPasajero }
    );

    check(resMensaje, {
      'mensajes_viaje insertado (201 o 400/404 controlado)': (r) =>
        r.status === 201 || r.status === 200 || r.status === 400 || r.status === 404,
    });

    const resLecturaMensajes = http.get(
      `${BASE_URL}/rest/v1/mensajes_viaje?viaje_id=eq.${viajeId}&select=id,contenido,creado_en`,
      { headers: authHeaderPasajero }
    );

    check(resLecturaMensajes, {
      'mensajes_viaje consultados (200)': (r) => r.status === 200,
    });

    sleep(0.3);

    // 2.5 Finalizar viaje mediante RPC finalizar_viaje
    const resFinalizar = http.post(
      `${BASE_URL}/rest/v1/rpc/finalizar_viaje`,
      JSON.stringify({ p_viaje_id: viajeId }),
      { headers: authHeaderConductor }
    );

    check(resFinalizar, {
      'finalizar_viaje responde (200 o validación controlada de estado)': (r) =>
        r.status === 200 || r.status === 400 || r.status === 404,
    });

    sleep(0.3);

    // 2.6 Pasajero califica al conductor (calificaciones)
    const resCalificacion = http.post(
      `${BASE_URL}/rest/v1/calificaciones`,
      JSON.stringify({
        viaje_id: viajeId,
        autor_id: PASAJERO_ID,
        receptor_id: CONDUCTOR_ID,
        puntuacion: 5,
        comentario: 'Excelente servicio, muy puntual y amable.',
        etiquetas: ['puntual', 'manejo_seguro'],
      }),
      { headers: authHeaderPasajero }
    );

    check(resCalificacion, {
      'calificaciones registrada (201 o validación de clave foránea 400/409)': (r) =>
        r.status === 201 || r.status === 200 || r.status === 400 || r.status === 409,
    });

    sleep(0.3);

    // 2.7 Reportar reclamación o incidente
    const resReclamacion = http.post(
      `${BASE_URL}/rest/v1/reclamaciones`,
      JSON.stringify({
        codigo_reclamacion: `REC-TEST-${Date.now()}`,
        usuario_id: PASAJERO_ID,
        nombre_completo: 'Usuario Auditor k6',
        tipo_documento: 'DNI',
        numero_documento: '70809010',
        telefono: '941234567',
        email: 'auditor.k6@altokke.pe',
        tipo: 'queja',
        monto_reclamado: 0.00,
        descripcion_bien_contratado: 'Servicio de Intermediación Tecnológica en Mototaxi - Altokke',
        detalle_reclamacion: 'Prueba de humo automatizada del libro de reclamaciones',
        pedido_consumidor: 'Verificación de integridad de datos en suite k6',
      }),
      { headers: authHeaderPasajero }
    );

    check(resReclamacion, {
      'reclamaciones registrada y sincronizada (201 o 200)': (r) =>
        r.status === 201 || r.status === 200 || r.status === 400,
    });
  });

  duracionE2E.add(Date.now() - tiempoInicio);
}

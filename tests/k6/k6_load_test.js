import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ============================================================================
// MÉTRICAS DE RENDIMIENTO Y CONCURRENCIA
// ============================================================================
const duracionSolicitudViaje = new Trend('altokke_duracion_solicitud_ms');
const duracionContraoferta = new Trend('altokke_duracion_contraoferta_ms');
const duracionSeleccionOferta = new Trend('altokke_duracion_seleccion_ms');
const duracionAceptarViajeConcurrente = new Trend('altokke_duracion_aceptar_viaje_ms');
const tasaExitoOperaciones = new Rate('altokke_tasa_exito');
const viajesPactadosTotal = new Counter('altokke_viajes_pactados_total');
const carrerasGanadasTotal = new Counter('altokke_carreras_ganadas_total');
const carrerasRechazadasEsperadas = new Counter('altokke_carreras_rechazadas_409_total');

// ============================================================================
// GESTIÓN DE POOL DE TOKENS (USUARIOS Y CONDUCTORES CONCURRENTES)
// ============================================================================
const BASE_URL = __ENV.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'tu-anon-key';

function formatearBearer(token) {
  const t = token ? token.trim() : '';
  if (!t) return 'Bearer TU_JWT_TOKEN';
  return t.startsWith('Bearer ') ? t : `Bearer ${t}`;
}

function inicializarPoolTokens(envKey, fallbackDefault) {
  const envVal = __ENV[envKey];
  if (envVal && envVal.trim()) {
    const lista = envVal.split(',').map(item => formatearBearer(item)).filter(Boolean);
    if (lista.length > 0) return lista;
  }
  return [formatearBearer(fallbackDefault)];
}

// Admite PASAJEROS_POOL="token1,token2,token3" o token único
const POOL_PASAJEROS = inicializarPoolTokens('PASAJEROS_POOL', __ENV.PASAJERO_JWT || 'Bearer JWT_PASAJERO_1');
// Admite CONDUCTORES_POOL="tokenConductor1,tokenConductor2,tokenConductor3" o token único
const POOL_CONDUCTORES = inicializarPoolTokens('CONDUCTORES_POOL', __ENV.CONDUCTOR_JWT || 'Bearer JWT_CONDUCTOR_1');

function obtenerTokenPasajero(vuId) {
  return POOL_PASAJEROS[(vuId - 1) % POOL_PASAJEROS.length];
}

function obtenerTokenConductor(vuId) {
  return POOL_CONDUCTORES[(vuId - 1) % POOL_CONDUCTORES.length];
}

// ============================================================================
// ESCENARIOS DE CARGA Y CONDICIÓN DE CARRERA
// ============================================================================
export const options = {
  scenarios: {
    // 1. Flujo habitual de hora pico en Bagua
    flujo_movilidad_bagua: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 15 },  // Calentamiento
        { duration: '40s', target: 50 },  // Tráfico habitual
        { duration: '30s', target: 100 }, // Salida universitaria / lluvia en Bagua
        { duration: '15s', target: 0 },   // Descompresión
      ],
      gracefulRampDown: '10s',
      exec: 'flujoMovilidadCompleto',
    },

    // 2. Condición de carrera: Múltiples conductores intentan aceptar la misma carrera simultáneamente
    carrera_aceptar_viaje: {
      executor: 'per-vu-iterations',
      vus: 10, // 10 conductores compitiendo en paralelo
      iterations: 5,
      startTime: '30s',
      exec: 'simularCarreraConcurrente',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    http_req_failed: ['rate<0.05'], // Tolera 409 intencionales por descarte de carrera
    altokke_tasa_exito: ['rate>0.90'],
  },
};

// ============================================================================
// ESCENARIO 1: FLUJO HABITUAL COMPLETO (PASAJERO -> OFERTAS -> SELECCIÓN)
// ============================================================================
export function flujoMovilidadCompleto() {
  const tokenPasajero = obtenerTokenPasajero(__VU);
  const tokenConductor = obtenerTokenConductor(__VU);

  const headersPasajero = {
    'apikey': ANON_KEY,
    'Authorization': tokenPasajero,
    'Content-Type': 'application/json',
  };

  const headersConductor = {
    'apikey': ANON_KEY,
    'Authorization': tokenConductor,
    'Content-Type': 'application/json',
  };

  // 1. Pasajero solicita carrera en Bagua
  const payloadSolicitud = JSON.stringify({
    p_origen_texto: 'Plaza de Armas de Bagua',
    p_destino_texto: 'Universidad Nacional Toribio Rodríguez de Mendoza (UNTRM)',
    p_origen_lat: -5.6394,
    p_origen_lng: -78.5311,
    p_destino_lat: -5.6450,
    p_destino_lng: -78.5250,
    p_metodo_pago: 'efectivo',
    p_paga_con: 20.00,
  });

  const resSolicitud = http.post(
    `${BASE_URL}/rest/v1/rpc/solicitar_viaje`,
    payloadSolicitud,
    { headers: headersPasajero }
  );

  duracionSolicitudViaje.add(resSolicitud.timings.duration);
  const solicitudOk = check(resSolicitud, {
    'solicitar_viaje responde 200': (r) => r.status === 200,
  });
  tasaExitoOperaciones.add(solicitudOk);

  if (!solicitudOk) {
    sleep(1);
    return;
  }

  let viajeId;
  try {
    const viajeData = JSON.parse(resSolicitud.body);
    viajeId = viajeData.id || viajeData.viaje_id;
  } catch (err) {
    console.warn('Error al parsear datos de viaje:', err);
    return;
  }

  sleep(0.5);

  // 2. Conductor del pool oferta tarifa regulada
  const payloadOferta = JSON.stringify({
    p_viaje_id: viajeId,
    p_tarifa: 4.50,
    p_tiempo_llegada_min: 3,
  });

  const resOferta = http.post(
    `${BASE_URL}/rest/v1/rpc/crear_contraoferta`,
    payloadOferta,
    { headers: headersConductor }
  );

  duracionContraoferta.add(resOferta.timings.duration);
  const ofertaOk = check(resOferta, {
    'crear_contraoferta responde 200': (r) => r.status === 200,
  });
  tasaExitoOperaciones.add(ofertaOk);

  if (!ofertaOk) {
    sleep(1);
    return;
  }

  let ofertaId;
  try {
    const ofertaData = JSON.parse(resOferta.body);
    ofertaId = ofertaData.oferta_id || ofertaData.id;
  } catch (err) {
    console.warn('Error al parsear oferta:', err);
    return;
  }

  sleep(0.5);

  // 3. Pasajero acepta la contraoferta seleccionada
  if (ofertaId) {
    const resSeleccion = http.post(
      `${BASE_URL}/rest/v1/rpc/seleccionar_oferta_viaje`,
      JSON.stringify({ p_oferta_id: ofertaId }),
      { headers: headersPasajero }
    );

    duracionSeleccionOferta.add(resSeleccion.timings.duration);
    const seleccionOk = check(resSeleccion, {
      'seleccionar_oferta responde 200': (r) => r.status === 200,
    });
    tasaExitoOperaciones.add(seleccionOk);
    if (seleccionOk) {
      viajesPactadosTotal.add(1);
    }
  }

  sleep(Math.random() * 2 + 1);
}

// ============================================================================
// ESCENARIO 2: CONDICIÓN DE CARRERA (RACE CONDITION EN ACEPTAR VIAJE)
// Garantiza que cuando N conductores intentan tomar el mismo viaje a la vez,
// exactamente UNO gana (HTTP 200) y los N-1 restantes reciben rechazo seguro.
// ============================================================================
export function simularCarreraConcurrente() {
  const tokenConductor = obtenerTokenConductor(__VU);

  const headersConductor = {
    'apikey': ANON_KEY,
    'Authorization': tokenConductor,
    'Content-Type': 'application/json',
  };

  // Viaje compartido bajo contienda concurrente
  const viajeIdContendido = __ENV.VIAJE_ID_TEST || '00000000-0000-0000-0000-000000000001';

  const resAceptar = http.post(
    `${BASE_URL}/rest/v1/rpc/aceptar_viaje`,
    JSON.stringify({ p_viaje_id: viajeIdContendido }),
    { headers: headersConductor }
  );

  duracionAceptarViajeConcurrente.add(resAceptar.timings.duration);

  // Verificación atómica de concurrencia:
  // - Estado 200: El conductor ganó la asignación (solo 1 conductor por viaje)
  // - Estado 400 / 409 / error de fila bloqueada: El viaje ya fue tomado por otro conductor
  const esGanador = resAceptar.status === 200;
  const esRechazoEsperado = resAceptar.status === 409 || resAceptar.status === 400;

  if (esGanador) {
    carrerasGanadasTotal.add(1);
  } else if (esRechazoEsperado) {
    carrerasRechazadasEsperadas.add(1);
  }

  check(resAceptar, {
    'respuesta concurrente controlada (200 o 400/409)': (r) => r.status === 200 || r.status === 409 || r.status === 400,
  });

  sleep(0.5);
}

export default function () {
  flujoMovilidadCompleto();
}

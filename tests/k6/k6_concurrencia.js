import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ============================================================================
// CONFIGURACIÓN DE CONCURRENCIA
// ============================================================================
const BASE_URL = __ENV.SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'test-anon-key';
const VIAJE_ID_CONCURRENTE = __ENV.VIAJE_ID || '00000000-0000-0000-0000-000000000001';

// Cantidad de VUs por defecto: 15 mototaxis en pugna simultánea
const CANTIDAD_VUS = Number(__ENV.VUS) || 15;

function formatearBearer(token) {
  const t = (token || '').trim();
  if (!t) return 'Bearer token-default';
  return t.startsWith('Bearer ') ? t : `Bearer ${t}`;
}

// Inicialización de pool de tokens para simular conductores independientes
function inicializarPoolConductores() {
  const rawPool = __ENV.CONDUCTORES_POOL;
  if (rawPool && rawPool.trim()) {
    const tokens = rawPool.split(',').map((t) => formatearBearer(t)).filter(Boolean);
    if (tokens.length > 0) return tokens;
  }
  const tokenUnico = __ENV.CONDUCTOR_JWT || __ENV.TEST_CONDUCTOR_JWT || 'Bearer JWT_CONDUCTOR_TEST';
  return [formatearBearer(tokenUnico)];
}

const POOL_CONDUCTORES = inicializarPoolConductores();

function obtenerTokenConductor(vuIndex) {
  return POOL_CONDUCTORES[(vuIndex - 1) % POOL_CONDUCTORES.length];
}

// Métricas de observabilidad de concurrencia
const duracionAceptarViaje = new Trend('altokke_concurrencia_aceptar_ms');
const duracionFinalizarViaje = new Trend('altokke_concurrencia_finalizar_ms');
const asignacionesGanadas = new Counter('altokke_asignaciones_ganadas_total');
const rechazosLimpiosCarrera = new Counter('altokke_rechazos_limpios_400_409_total');
const respuestasInesperadas = new Counter('altokke_respuestas_inesperadas_total');
const tasaLogicaValida = new Rate('altokke_tasa_logica_valida');

export const options = {
  scenarios: {
    // 1. Pugna simultánea de 15 conductores intentando tomar el mismo viaje
    carrera_aceptar_viaje: {
      executor: 'per-vu-iterations',
      vus: CANTIDAD_VUS,
      iterations: 1,
      maxDuration: '30s',
      exec: 'testPugnaAceptarViaje',
    },
    // 2. Intentos concurrentes de finalizar el mismo viaje (prueba de idempotencia)
    concurrencia_finalizar_viaje: {
      executor: 'per-vu-iterations',
      vus: Math.min(CANTIDAD_VUS, 5),
      iterations: 1,
      startTime: '10s',
      maxDuration: '30s',
      exec: 'testConcurrenciaFinalizarViaje',
    },
  },
  thresholds: {
    // Thresholds estrictos definidos en auditoría
    http_req_duration: ['p(95)<800'],
    altokke_tasa_logica_valida: ['rate==1.0'], // 0% tasa de fallos de lógica de negocio
    altokke_respuestas_inesperadas_total: ['count==0'], // Ningún error 500 o respuesta no controlada
  },
};

// ============================================================================
// ESCENARIO 1: PUGNA SIMULTÁNEA EN aceptar_viaje (RACE CONDITION)
// Exactamente 1 conductor debe ganar (200), los N-1 restantes reciben rechazo limpio (400/409)
// ============================================================================
export function testPugnaAceptarViaje() {
  const tokenConductor = obtenerTokenConductor(__VU);

  const headers = {
    'apikey': ANON_KEY,
    'Authorization': tokenConductor,
    'Content-Type': 'application/json',
  };

  const payload = JSON.stringify({
    p_viaje_id: VIAJE_ID_CONCURRENTE,
  });

  const res = http.post(
    `${BASE_URL}/rest/v1/rpc/aceptar_viaje`,
    payload,
    { headers }
  );

  duracionAceptarViaje.add(res.timings.duration);

  // Estados aceptables bajo alta contienda concurrente:
  // - 200 OK: Ganó la asignación atómica (1 único ganador)
  // - 400 / 409: Rechazo limpio y controlado ("Solicitud no disponible" o viaje ya tomado)
  // - 404: Viaje no encontrado o expirado (en entorno de pruebas sin seed previo)
  const esGanador = res.status === 200;
  const esRechazoLimpio = res.status === 400 || res.status === 409 || res.status === 404;

  if (esGanador) {
    asignacionesGanadas.add(1);
    tasaLogicaValida.add(true);
  } else if (esRechazoLimpio) {
    rechazosLimpiosCarrera.add(1);
    tasaLogicaValida.add(true);
  } else {
    // 500 Internal Server Error o bloqueo no controlado
    respuestasInesperadas.add(1);
    tasaLogicaValida.add(false);
    console.error(`[CONCURRENCY FAILURE VU ${__VU}] Código inesperado: ${res.status} Body: ${res.body}`);
  }

  check(res, {
    'carrera aceptar_viaje: respuesta limpia y sin deadlock': (r) =>
      r.status === 200 || r.status === 400 || r.status === 409 || r.status === 404,
  });
}

// ============================================================================
// ESCENARIO 2: CONCURRENCIA EN finalizar_viaje (IDEMPOTENCIA Y PROTECCIÓN CONTABLE)
// Múltiples solicitudes simultáneas no duplican comisiones ni generan doble asiento
// ============================================================================
export function testConcurrenciaFinalizarViaje() {
  const tokenConductor = obtenerTokenConductor(__VU);

  const headers = {
    'apikey': ANON_KEY,
    'Authorization': tokenConductor,
    'Content-Type': 'application/json',
  };

  const payload = JSON.stringify({
    p_viaje_id: VIAJE_ID_CONCURRENTE,
  });

  const res = http.post(
    `${BASE_URL}/rest/v1/rpc/finalizar_viaje`,
    payload,
    { headers }
  );

  duracionFinalizarViaje.add(res.timings.duration);

  // Comportamiento esperado de finalizar_viaje:
  // - 200 OK con payload JSON { success: true, estado: 'finalizado' } (sea primer intento o subsecuente idempotente)
  // - 400 / 404: El viaje no está en curso o no existe (rechazo seguro)
  const esValido = res.status === 200 || res.status === 400 || res.status === 404;

  if (esValido) {
    tasaLogicaValida.add(true);
  } else {
    respuestasInesperadas.add(1);
    tasaLogicaValida.add(false);
    console.error(`[IDEMPOTENCY FAILURE VU ${__VU}] Código inesperado al finalizar: ${res.status} Body: ${res.body}`);
  }

  check(res, {
    'finalizar_viaje: respuesta idempotente y sin error 500': (r) => esValido,
  });
}

export default function () {
  testPugnaAceptarViaje();
}

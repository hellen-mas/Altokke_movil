import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Métricas de rendimiento
const duracionSolicitudViaje = new Trend('altokke_duracion_solicitud_ms');
const duracionContraoferta = new Trend('altokke_duracion_contraoferta_ms');
const duracionSeleccionOferta = new Trend('altokke_duracion_seleccion_ms');
const tasaExitoOperaciones = new Rate('altokke_tasa_exito');
const viajesPactadosTotal = new Counter('altokke_viajes_pactados_total');

// Configuración de endpoints y credenciales
const BASE_URL = __ENV.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'tu-anon-key';
const PASAJERO_JWT = __ENV.PASAJERO_JWT || 'Bearer TU_JWT_PASAJERO';
const CONDUCTOR_JWT = __ENV.CONDUCTOR_JWT || 'Bearer TU_JWT_CONDUCTOR';

export const options = {
  scenarios: {
    flujo_movilidad_bagua: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },  // Calentamiento
        { duration: '1m',  target: 80 },  // Tráfico habitual de hora pico en Bagua
        { duration: '1m',  target: 150 }, // Pico por lluvia torrencial o salida universitaria
        { duration: '30s', target: 200 }, // Estrés límite Free Tier
        { duration: '30s', target: 0 },   // Descompresión
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<450', 'p(99)<1200'],
    http_req_failed: ['rate<0.01'],
    altokke_tasa_exito: ['rate>0.95'],
  },
};

export default function () {
  const headersPasajero = {
    'apikey': ANON_KEY,
    'Authorization': PASAJERO_JWT,
    'Content-Type': 'application/json',
  };

  const headersConductor = {
    'apikey': ANON_KEY,
    'Authorization': CONDUCTOR_JWT,
    'Content-Type': 'application/json',
  };

  // 1. Pasajero solicita carrera
  const payloadSolicitud = JSON.stringify({
    p_origen_texto: 'Plaza de Armas de Bagua',
    p_destino_texto: 'Universidad Nacional Toribio Rodríguez de Mendoza',
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

  // 2. Conductor oferta tarifa regulada
  const payloadOferta = JSON.stringify({
    p_viaje_id: viajeId,
    p_tarifa_ofertada: 5.00,
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

  // 3. Pasajero acepta contraoferta
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

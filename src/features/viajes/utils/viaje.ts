import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";
import type { MetodoPago, TipoServicio } from "@/features/viajes/context/ViajeContext";

export const NOMBRE_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
};

// TEMPORAL: tarifas de ejemplo (más adelante las calculará el backend).
// Con 1.3 km en servicio Normal da S/ 4.94, igual que el mockup.
const TARIFA_BASE = 2.0;
const TARIFA_POR_KM = 2.26;
const TARIFA_MINIMA = 3.0;
const RECARGO_EXPRESS = 1.3;
const MINUTOS_POR_KM = 2.3;
const FACTOR_TIEMPO_EXPRESS = 0.8;

const RADIO_TIERRA_KM = 6371;

function aRadianes(grados: number) {
  return (grados * Math.PI) / 180;
}

// Distancia en línea recta entre dos puntos (fórmula de Haversine)
export function distanciaKm(a: PuntoMapa, b: PuntoMapa) {
  const dLat = aRadianes(b.latitude - a.latitude);
  const dLng = aRadianes(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitude)) *
      Math.cos(aRadianes(b.latitude)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

export function calcularTarifa(km: number, servicio: TipoServicio) {
  const normal = Math.max(TARIFA_MINIMA, TARIFA_BASE + km * TARIFA_POR_KM);

  return servicio === "express" ? normal * RECARGO_EXPRESS : normal;
}

export function calcularMinutos(km: number, servicio: TipoServicio) {
  const factor = servicio === "express" ? FACTOR_TIEMPO_EXPRESS : 1;

  return Math.max(1, Math.ceil(km * MINUTOS_POR_KM * factor));
}

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

// Hora en formato "9:44 a. m."
export function formatearHora(fecha: Date) {
  const horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  const sufijo = horas >= 12 ? "p. m." : "a. m.";

  return `${horas % 12 || 12}:${minutos} ${sufijo}`;
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Fecha y hora en formato "Lun, 12 may 2025 • 10:24 a. m."
export function formatearFechaHora(fecha: Date) {
  const dia = DIAS_SEMANA[fecha.getDay()];
  const mes = MESES[fecha.getMonth()];

  return `${dia}, ${fecha.getDate()} ${mes} ${fecha.getFullYear()} • ${formatearHora(fecha)}`;
}

// Punto de la ruta al que se llegó tras recorrer `avance` (0 a 1) del camino
export function interpolarRuta(ruta: PuntoMapa[], avance: number): PuntoMapa {
  const proporcion = Math.min(1, Math.max(0, avance));
  const tramos = ruta.slice(1).map((punto, i) => distanciaKm(ruta[i], punto));
  const total = tramos.reduce((suma, tramo) => suma + tramo, 0);

  if (total === 0) return ruta[0];

  let restante = proporcion * total;

  for (let i = 0; i < tramos.length; i++) {
    if (restante <= tramos[i] || i === tramos.length - 1) {
      const fraccion = tramos[i] === 0 ? 0 : Math.min(1, restante / tramos[i]);
      const desde = ruta[i];
      const hasta = ruta[i + 1];

      return {
        latitude: desde.latitude + (hasta.latitude - desde.latitude) * fraccion,
        longitude:
          desde.longitude + (hasta.longitude - desde.longitude) * fraccion,
      };
    }

    restante -= tramos[i];
  }

  return ruta[ruta.length - 1];
}

export const ESTADOS_VALIDOS_VIAJE = [
  "buscando",
  "aceptado",
  "conductor_en_camino",
  "esperando_pasajero",
  "en_curso",
  "finalizado",
  "cancelado",
] as const;

export type EstadoViajeFlujo = (typeof ESTADOS_VALIDOS_VIAJE)[number];

const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  buscando: ["aceptado", "conductor_en_camino", "cancelado"],
  aceptado: ["conductor_en_camino", "esperando_pasajero", "cancelado"],
  conductor_en_camino: ["esperando_pasajero", "en_curso", "cancelado"],
  esperando_pasajero: ["en_curso", "cancelado"],
  en_curso: ["finalizado", "cancelado"],
  finalizado: [],
  cancelado: [],
};

export function esTransicionValida(estadoActual: string, nuevoEstado: string): boolean {
  if (estadoActual === nuevoEstado) return true;
  const permitidos = TRANSICIONES_PERMITIDAS[estadoActual];
  return Boolean(permitidos && permitidos.includes(nuevoEstado));
}

export interface ResultadoCalculoVuelto {
  pagaCon: number;
  montoTarifa: number;
  vuelto: number;
  esExacto: boolean;
  denominacionValida: boolean;
}

export function validarYCalcularVuelto(pagaCon: number, montoTarifa: number): ResultadoCalculoVuelto {
  if (typeof pagaCon !== "number" || typeof montoTarifa !== "number") {
    throw new TypeError("Los montos deben ser numéricos");
  }
  if (isNaN(pagaCon) || isNaN(montoTarifa)) {
    throw new Error("Montos no pueden ser NaN");
  }
  if (montoTarifa <= 0) {
    throw new Error("La tarifa del viaje debe ser mayor a 0");
  }
  if (pagaCon < montoTarifa) {
    throw new Error("El monto de pago no puede ser menor a la tarifa");
  }

  const vuelto = Math.round((pagaCon - montoTarifa) * 100) / 100;
  const esExacto = vuelto === 0;

  return {
    pagaCon,
    montoTarifa,
    vuelto,
    esExacto,
    denominacionValida: [10, 20, 50, 100].includes(pagaCon) || esExacto,
  };
}

export const TARIFA_MINIMA_BAGUA = 1.5;
export const TARIFA_MAXIMA_BAGUA = 15.0;

export interface ResultadoValidacionContraoferta {
  valido: boolean;
  razon?: string;
  montoFinal?: number;
}

export function validarContraoferta(
  montoContraoferta: number,
  tarifaBase: number
): ResultadoValidacionContraoferta {
  if (typeof montoContraoferta !== "number" || typeof tarifaBase !== "number") {
    return { valido: false, razon: "Valores no numéricos" };
  }
  if (isNaN(montoContraoferta) || isNaN(tarifaBase)) {
    return { valido: false, razon: "Valores no válidos (NaN)" };
  }
  if (montoContraoferta < TARIFA_MINIMA_BAGUA) {
    return {
      valido: false,
      razon: `Monto por debajo del piso de Bagua (S/ ${TARIFA_MINIMA_BAGUA.toFixed(2)})`,
    };
  }
  if (montoContraoferta > TARIFA_MAXIMA_BAGUA) {
    return {
      valido: false,
      razon: `Monto supera el techo máximo permitido (S/ ${TARIFA_MAXIMA_BAGUA.toFixed(2)})`,
    };
  }

  const pisoPermitido = Math.round(tarifaBase * 0.5 * 10) / 10;
  const techoPermitido = Math.round(tarifaBase * 2.0 * 10) / 10;

  if (montoContraoferta < pisoPermitido) {
    return {
      valido: false,
      razon: "La contraoferta no puede ser inferior al 50% de la tarifa propuesta",
    };
  }
  if (montoContraoferta > techoPermitido) {
    return {
      valido: false,
      razon: "La contraoferta no puede superar el 200% de la tarifa propuesta",
    };
  }

  const montoRedondeado = Math.round(montoContraoferta * 10) / 10;
  return { valido: true, montoFinal: montoRedondeado };
}

const REGEX_NUMERO_PERU = /\b9\d{8}\b|\b9\d{2}[-.\s]\d{3}[-.\s]\d{3}\b/;

export interface ResultadoSanitizacionMensaje {
  permitido: boolean;
  texto?: string;
  razon?: string;
}

export function procesarMensajeRapido(texto: unknown): ResultadoSanitizacionMensaje {
  if (typeof texto !== "string") {
    return { permitido: false, razon: "Mensaje inválido" };
  }
  const limpio = texto.trim();
  if (limpio.length === 0 || limpio.length > 120) {
    return {
      permitido: false,
      razon: "Longitud no autorizada (1 a 120 caracteres)",
    };
  }

  if (REGEX_NUMERO_PERU.test(limpio)) {
    return {
      permitido: false,
      razon: "Violación de privacidad: Prohibido compartir números telefónicos directos en el chat.",
    };
  }

  const sanitizado = limpio.replace(/<[^>]*>?/gm, "");
  return { permitido: true, texto: sanitizado };
}

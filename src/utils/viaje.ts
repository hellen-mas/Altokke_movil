import type { PuntoMapa } from "@/components/pasajero/tiposMapa";
import type { TipoServicio } from "@/context/ViajeContext";

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

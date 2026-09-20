import type { PuntoMapa } from "@/components/pasajero/tiposMapa";

// Verde oscuro de las cabeceras del flujo de pasajero (según los mockups)
export const COLOR_CABECERA = "#0B3B2A";

// TEMPORAL: coordenadas aproximadas de Bagua (más adelante vendrán del GPS)
export const CENTRO_BAGUA: PuntoMapa = {
  latitude: -5.6389,
  longitude: -78.5318,
};

// TEMPORAL: mototaxis de ejemplo cerca del pasajero (más adelante vendrán del backend)
export const CONDUCTORES_CERCANOS: PuntoMapa[] = [
  { latitude: -5.6376, longitude: -78.5334 },
  { latitude: -5.6402, longitude: -78.5297 },
  { latitude: -5.6381, longitude: -78.5289 },
];

// TEMPORAL: usuario de ejemplo (más adelante vendrá del login)
export const USUARIO_EJEMPLO = {
  nombre: "Hellen",
};

export interface Lugar {
  id: string;
  nombre: string;
  detalle: string;
  coordenadas: PuntoMapa;
}

// TEMPORAL: punto de recogida de ejemplo (más adelante será la ubicación real)
export const ORIGEN_EJEMPLO: Lugar = {
  id: "origen",
  nombre: "Jirón Miraflores, Bagua",
  detalle: "Tu ubicación actual",
  coordenadas: CENTRO_BAGUA,
};

// TEMPORAL: lugares de ejemplo de Bagua con coordenadas aproximadas
// (más adelante vendrán de un servicio de búsqueda de direcciones)
export const LUGARES_BAGUA: Lugar[] = [
  {
    id: "plaza-heroes-cenepa",
    nombre: "Plaza de Armas Héroes del Cenepa",
    detalle: "Jirón Ortiz Arrieta, Bagua",
    coordenadas: { latitude: -5.632, longitude: -78.5225 },
  },
  {
    id: "plaza-armas-bagua",
    nombre: "Plaza de Armas de Bagua",
    detalle: "Centro de Bagua, Bagua",
    coordenadas: { latitude: -5.6398, longitude: -78.533 },
  },
  {
    id: "plaza-grau",
    nombre: "Plaza Grau",
    detalle: "Jirón 28 de Julio, Bagua",
    coordenadas: { latitude: -5.6425, longitude: -78.528 },
  },
  {
    id: "plazuela-bolivar",
    nombre: "Plazuela Simón Bolívar",
    detalle: "Jirón Miraflores, Bagua",
    coordenadas: { latitude: -5.636, longitude: -78.534 },
  },
  {
    id: "terminal-terrestre",
    nombre: "Terminal Terrestre de Bagua",
    detalle: "Av. Amazonas, Bagua",
    coordenadas: { latitude: -5.645, longitude: -78.521 },
  },
  {
    id: "hospital-santiago-apostol",
    nombre: "Hospital Santiago Apóstol",
    detalle: "Av. Circunvalación, Bagua",
    coordenadas: { latitude: -5.63, longitude: -78.535 },
  },
  {
    id: "untrm-bagua",
    nombre: "UNTRM Bagua",
    detalle: "Av. Universidad, Bagua",
    coordenadas: { latitude: -5.626, longitude: -78.5195 },
  },
];

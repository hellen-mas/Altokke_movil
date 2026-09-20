import type { PuntoMapa } from "@/components/pasajero/tiposMapa";

// Verde oscuro de las cabeceras del flujo de pasajero (según los mockups)
export const COLOR_CABECERA = "#0B3B2A";

// TEMPORAL: ubicación de ejemplo del pasajero, sobre el Jirón Miraflores de
// Bagua (más adelante vendrá del GPS del teléfono)
export const CENTRO_BAGUA: PuntoMapa = {
  latitude: -5.63966,
  longitude: -78.52748,
};

// TEMPORAL: mototaxis de ejemplo cerca del pasajero (más adelante vendrán del backend)
export const CONDUCTORES_CERCANOS: PuntoMapa[] = [
  { latitude: -5.63806, longitude: -78.52913 },
  { latitude: -5.64159, longitude: -78.52545 },
  { latitude: -5.63893, longitude: -78.53022 },
];

// TEMPORAL: usuario de ejemplo (más adelante vendrá del login)
export const USUARIO_EJEMPLO = {
  nombre: "Hellen",
};

// TEMPORAL: conductor de ejemplo (más adelante vendrá del backend)
export const CONDUCTOR_EJEMPLO = {
  nombre: "Juan Carlos Flores",
  calificacion: 4.9,
  viajes: 312,
  vehiculo: "Mototaxi",
  placa: "Sin placa",
  color: "Verde con amarillo",
};

export interface ViajeHistorial {
  id: string;
  fecha: Date;
  origen: string;
  destino: string;
  tarifa: number;
  estado: "completado" | "cancelado";
  /** Estrellas que el pasajero le dio al conductor (1 a 5), si calificó */
  calificacion?: number;
}

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

// TEMPORAL: lugares de ejemplo de Bagua (más adelante vendrán de un servicio
// de búsqueda de direcciones). Las coordenadas de la Plaza de Armas, el
// terminal, el hospital y la plaza Bolognesi salen de OpenStreetMap; las de
// Plaza Grau y Plazuela Bolívar están puestas sobre la calle de su dirección,
// y la de UNTRM es aproximada.
export const LUGARES_BAGUA: Lugar[] = [
  {
    id: "plaza-heroes-cenepa",
    nombre: "Plaza de Armas Héroes del Cenepa",
    detalle: "Jirón Ortiz Arrieta, Bagua",
    coordenadas: { latitude: -5.63661, longitude: -78.53236 },
  },
  {
    id: "plaza-armas-bagua",
    nombre: "Plaza de Armas de Bagua",
    detalle: "Centro de Bagua, Bagua",
    coordenadas: { latitude: -5.64311, longitude: -78.5257 },
  },
  {
    id: "plaza-grau",
    nombre: "Plaza Grau",
    detalle: "Jirón 28 de Julio, Bagua",
    coordenadas: { latitude: -5.63477, longitude: -78.53939 },
  },
  {
    id: "plazuela-bolivar",
    nombre: "Plazuela Simón Bolívar",
    detalle: "Jirón Miraflores, Bagua",
    coordenadas: { latitude: -5.64292, longitude: -78.524 },
  },
  {
    id: "terminal-terrestre",
    nombre: "Terminal Terrestre de Bagua",
    detalle: "Av. Héroes del Cenepa, Bagua",
    coordenadas: { latitude: -5.63893, longitude: -78.53022 },
  },
  {
    id: "hospital-gustavo-lanatta",
    nombre: "Hospital de Apoyo Gustavo Lanatta Luján",
    detalle: "Av. Héroes del Cenepa, Bagua",
    coordenadas: { latitude: -5.64296, longitude: -78.52683 },
  },
  {
    id: "untrm-bagua",
    nombre: "UNTRM Bagua",
    detalle: "Av. Universidad, Bagua",
    coordenadas: { latitude: -5.626, longitude: -78.5195 },
  },
];

// TEMPORAL: viajes anteriores de ejemplo, tomados del mockup de Actividad
// (más adelante vendrán del backend)
export const HISTORIAL_EJEMPLO: ViajeHistorial[] = [
  {
    id: "ejemplo-1",
    fecha: new Date(2025, 4, 12, 10, 24),
    origen: "Mercado Central, Bagua",
    destino: "Hospital Regional, Bagua",
    tarifa: 4.94,
    estado: "completado",
    calificacion: 5,
  },
  {
    id: "ejemplo-2",
    fecha: new Date(2025, 4, 10, 18, 15),
    origen: "Jr. Miraflores 1010",
    destino: "Plaza de Armas Héroes del Cenepa",
    tarifa: 5.2,
    estado: "completado",
    calificacion: 4,
  },
  {
    id: "ejemplo-3",
    fecha: new Date(2025, 4, 9, 8, 42),
    origen: "UNTRM Bagua",
    destino: "Av. Héroes del Cenepa",
    tarifa: 4.5,
    estado: "completado",
    calificacion: 5,
  },
  {
    id: "ejemplo-4",
    fecha: new Date(2025, 4, 7, 20, 5),
    origen: "Terminal Terrestre de Bagua",
    destino: "Jr. Miraflores 1010",
    tarifa: 3.8,
    estado: "cancelado",
  },
  {
    id: "ejemplo-5",
    fecha: new Date(2025, 4, 6, 16, 30),
    origen: "Bagua Grande Terminal",
    destino: "Mercado Central, Bagua",
    tarifa: 6.8,
    estado: "completado",
    calificacion: 5,
  },
];

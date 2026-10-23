import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";

// Color institucional de la cabecera del pasajero
export const COLOR_CABECERA = "#0B3B2A";

// Coordenadas geográficas de referencia para la ciudad de Bagua, Amazonas
export const CENTRO_BAGUA: PuntoMapa = {
  latitude: -5.63966,
  longitude: -78.52748,
};

// Ubicación de referencia en Bagua
export const ORIGEN_INICIAL_BAGUA: Lugar = {
  id: "origen-bagua",
  nombre: "Jirón Miraflores, Bagua",
  detalle: "Ubicación en Bagua",
  coordenadas: CENTRO_BAGUA,
};

// Alias para compatibilidad de rutas
export const ORIGEN_EJEMPLO = ORIGEN_INICIAL_BAGUA;

// Puntos de mototaxis visibles por defecto en el mapa de Bagua si la red está offline
export const CONDUCTORES_CERCANOS: PuntoMapa[] = [
  { latitude: -5.63806, longitude: -78.52913 },
  { latitude: -5.64159, longitude: -78.52545 },
  { latitude: -5.63893, longitude: -78.53022 },
];

export interface ViajeHistorial {
  id: string;
  fecha: Date;
  origen: string;
  destino: string;
  /** Lugar de destino, para poder pedir el mismo viaje otra vez */
  lugarDestino?: Lugar;
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

// Lugares reales y emblemáticos de Bagua, Amazonas
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

// El historial inicial es vacío, se carga dinámicamente desde la BD de Supabase
export const HISTORIAL_EJEMPLO: ViajeHistorial[] = [];

// Notificaciones del sistema
export const NOTIFICACIONES_EJEMPLO = [
  {
    id: "n-bienvenida",
    icono: "shield-checkmark-outline" as const,
    titulo: "Bienvenido a Altokke",
    mensaje: "Tu cuenta de pasajero está activa y lista para solicitar mototaxis seguros en Bagua.",
    hora: "Hoy",
    leida: false,
  },
];

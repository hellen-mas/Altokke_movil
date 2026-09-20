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

import type { PuntoMapa } from "@/components/pasajero/tiposMapa";
import { ORIGEN_EJEMPLO } from "@/constants/pasajero";
import { TipoServicio, useViaje } from "@/context/ViajeContext";
import { calcularMinutos, calcularTarifa, distanciaKm } from "@/utils/viaje";

export type ServicioViaje = Exclude<TipoServicio, "reserva">;

/**
 * Datos calculados del viaje que el pasajero está armando.
 * Devuelve null si todavía no eligió un destino.
 */
export function useResumenViaje() {
  const { destino, tipoServicio, metodoPago } = useViaje();

  if (!destino) return null;

  // "Reserva" todavía no se puede programar, así que se trata como Normal
  const servicio: ServicioViaje =
    tipoServicio === "reserva" ? "normal" : tipoServicio;

  const origen = ORIGEN_EJEMPLO.coordenadas;
  const kilometros = distanciaKm(origen, destino.coordenadas);

  // Ruta de ejemplo en forma de "L" siguiendo la cuadrícula de calles
  const ruta: PuntoMapa[] = [
    origen,
    { latitude: destino.coordenadas.latitude, longitude: origen.longitude },
    destino.coordenadas,
  ];

  return {
    origen,
    destino,
    servicio,
    metodoPago,
    kilometros,
    tarifa: calcularTarifa(kilometros, servicio),
    minutos: calcularMinutos(kilometros, servicio),
    ruta,
  };
}

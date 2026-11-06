import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";
import { TipoServicio, useViaje } from "@/features/viajes/context/ViajeContext";
import { calcularMinutos, calcularTarifa, distanciaKm } from "@/features/viajes/utils/viaje";

export type ServicioViaje = Exclude<TipoServicio, "reserva">;

export function useResumenViaje() {
  const { origen, destino, tipoServicio, metodoPago } = useViaje();

  if (!destino) return null;

  const servicio: ServicioViaje =
    tipoServicio === "reserva" ? "normal" : tipoServicio;

  const coordenadasOrigen = origen.coordenadas;
  const kilometros = distanciaKm(coordenadasOrigen, destino.coordenadas);

  const ruta: PuntoMapa[] = [
    coordenadasOrigen,
    { 
      latitude: destino.coordenadas.latitude, 
      longitude: coordenadasOrigen.longitude,
    },
    destino.coordenadas,
  ];

  return {
    origen: coordenadasOrigen,
    origenLugar: origen,
    destino,
    servicio,
    metodoPago,
    kilometros,
    tarifa: calcularTarifa(kilometros, servicio),
    minutos: calcularMinutos(kilometros, servicio),
    ruta,
  };
}

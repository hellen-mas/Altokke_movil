import type { RolUsuario } from "@/features/autenticacion/store/authStore";

import type {
  DatosNotificacionPush,
} from "../types/notificacionPush";

// Determina la pantalla correspondiente a una notificación. Solo permite destinos previamente definidos.
export function obtenerRutaNotificacion(
  datos: unknown,
  rol: RolUsuario
): string | null {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos) || 
    !rol
  ) {
    return null;
  }

  const contenido = datos as DatosNotificacionPush;
  const categoria = contenido.categoria;

  // Aprobación de cuenta del conductor.
  if (contenido.tipo === "solicitud_aprobada") {
    return rol === "conductor"
      ? "/(auth)/estado-solicitud"
      : null;
  }

  if (categoria === "aprobaciones") {
    return rol === "conductor"
      ? "/(auth)/estado-solicitud"
      : null;
  }

  // Notificaciones relacionadas con viajes
  if (categoria === "viajes") {
    if (rol === "conductor") {
      return contenido.destino === "viaje-activo"
        ? "/(conductor)/viaje-activo"
        : "/(conductor)/solicitudes";
    }

    if (rol === "pasajero") {
      return contenido.destino === "buscando-conductor"
        ? "/(pasajero)/buscando-conductor"
        : "/(pasajero)/viaje-activo";
    }
  }

  // Notificaciones de recargas OpenPay
  if (
    contenido.tipo === "recarga_aprobada" ||
    contenido.tipo === "recarga_fallida" 
  ) {
    return rol === "conductor"
      ? "/(conductor)/billetera"
      : null;
  }

  // Pagos y movimientos económicos
  if (categoria === "pagos") {
    return rol === "conductor"
      ? "/(conductor)/ganancias"
      : "/(pasajero)/notificaciones";
  }

  // Seguridad y cambios de cuenta
  if (categoria === "cuenta") {
    return rol === "conductor" 
      ? "/(conductor)/cuenta"
      : "/(pasajero)/(tabs)/cuenta";
  }

  return null;
}

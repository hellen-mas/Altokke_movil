import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { conductorService } from "./conductorService";

export const TAREA_RASTREO_GPS_CONDUCTOR = "ALTOKKE_RASTREO_GPS_CONDUCTOR";

let idConductorActivo: string | null = null;

/**
 * Configura las referencias en memoria para la tarea en segundo plano.
 */
export function configurarRastreoConductor(conductorId: string | null, _enViaje?: boolean) {
  idConductorActivo = conductorId;
}

// Registrar tarea global en segundo plano
if (!TaskManager.isTaskDefined(TAREA_RASTREO_GPS_CONDUCTOR)) {
  TaskManager.defineTask(TAREA_RASTREO_GPS_CONDUCTOR, async ({ data, error }) => {
    if (error) {
      console.warn("Aviso en tarea de rastreo GPS en segundo plano:", error.message);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      const ultimaUbicacion = locations?.[locations.length - 1];

      if (ultimaUbicacion && idConductorActivo) {
        try {
          await conductorService.actualizarUbicacion(
            idConductorActivo,
            ultimaUbicacion.coords.latitude,
            ultimaUbicacion.coords.longitude
          );
        } catch (err) {
          console.warn("No se pudo transmitir ubicación GPS en segundo plano:", err);
        }
      }
    }
  });
}

/**
 * Inicia el Foreground Service en Android / background updates en iOS durante un viaje activo.
 * Mantiene la telemetría viva incluso si el conductor minimiza la app para ver Waze o Google Maps.
 */
export async function iniciarRastreoSegundoPlano(conductorId: string): Promise<boolean> {
  if (!conductorId) return false;
  configurarRastreoConductor(conductorId, true);

  try {
    const estaRegistrada = await TaskManager.isTaskRegisteredAsync(TAREA_RASTREO_GPS_CONDUCTOR);
    if (estaRegistrada) return true;

    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== Location.PermissionStatus.GRANTED) return false;
    }

    const opciones: Location.LocationTaskOptions = {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 15,
      deferredUpdatesInterval: 5000,
      showsBackgroundLocationIndicator: true,
      foregroundService: Platform.OS === "android" ? {
        notificationTitle: "Altokke Conductor - Viaje en curso",
        notificationBody: "Compartiendo ubicación en tiempo real para tu seguridad.",
        notificationColor: "#047857",
      } : undefined,
    };

    await Location.startLocationUpdatesAsync(TAREA_RASTREO_GPS_CONDUCTOR, opciones);
    return true;
  } catch (error) {
    console.warn("No se pudo activar el servicio de ubicación en segundo plano:", error);
    return false;
  }
}

/**
 * Detiene el Foreground Service y la tarea de segundo plano de manera limpia.
 */
export async function detenerRastreoSegundoPlano(): Promise<void> {
  configurarRastreoConductor(null, false);
  try {
    const estaRegistrada = await TaskManager.isTaskRegisteredAsync(TAREA_RASTREO_GPS_CONDUCTOR);
    if (estaRegistrada) {
      await Location.stopLocationUpdatesAsync(TAREA_RASTREO_GPS_CONDUCTOR);
    }
  } catch (error) {
    console.warn("Aviso al detener la tarea de ubicación en segundo plano:", error);
  }
}

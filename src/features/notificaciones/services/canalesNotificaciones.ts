
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const CANALES_NOTIFICACIONES = {
  DEFAULT: "default",
  APROBACIONES: "aprobaciones_v2",
  VIAJES: "viajes_v3",
  PAGOS: "pagos_v2",
  CUENTA: "cuenta_v2",
} as const;

export async function configurarCanalesNotificacion(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Promise.all([
    // Canal de compatibilidad.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.DEFAULT,
      {
        name: "Notificaciones ALTOKKE",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#16A34A",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),

    // Aprobaciones de cuentas.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.APROBACIONES,
      {
        name: "Aprobaciones",
        description: "Avisos sobre la aprobación de tu cuenta.",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: "#16A34A",
        sound: "altokke_aprobacion.wav",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),

    // Solicitudes y actualizaciones de viajes.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.VIAJES,
      {
        name: "Solicitudes de viaje",
        description: "Nuevas solicitudes y actualizaciones de tus viajes.",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: "#16A34A",
        sound: "altokke_viajes.wav",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),

    // Movimientos económicos.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.PAGOS,
      {
        name: "Pagos y billetera",
        description: "Recargas, pagos y movimientos de tu billetera.",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 100, 150],
        lightColor: "#16A34A",
        sound: "altokke_pagos.wav",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),

    // Seguridad y cambios de cuenta.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.CUENTA,
      {
        name: "Cuenta y seguridad",
        description: "Avisos importantes sobre tu cuenta.",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: "#16A34A",
        sound: "altokke_aprobacion.wav",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),
  ]);

    // Diagnóstico temporal de sonidos registrados en Android.
  const ids = new Set<string>(
    Object.values(CANALES_NOTIFICACIONES)
  );

  const canales = await Notifications.getNotificationChannelsAsync();

  console.log(
    "[ALTOKKE] DIAGNÓSTICO DE SONIDOS:",
    (canales ?? [])
      .filter((canal) => ids.has(canal.id))
      .map((canal) => ({
        id: canal.id,
        nombre: canal.name,
        sonido: canal.sound,
      }))
  );
}

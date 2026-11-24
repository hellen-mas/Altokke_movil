import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";

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
        importance: AndroidImportance.MAX,
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
        importance: AndroidImportance.HIGH,
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
        name: "Viajes y solicitudes",
        description: "Alertas prioritarias de viajes solicitados o en curso.",
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 350, 150, 350],
        lightColor: "#16A34A",
        sound: "altokke_viajes.wav",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),

    // Pagos, comisiones y recargas.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.PAGOS,
      {
        name: "Pagos y comisiones",
        description: "Confirmación de pagos en efectivo o saldo acreditado.",
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: "#16A34A",
        sound: "altokke_pagos.wav",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      }
    ),

    // Avisos de seguridad y cuenta.
    Notifications.setNotificationChannelAsync(
      CANALES_NOTIFICACIONES.CUENTA,
      {
        name: "Cuenta y seguridad",
        description: "Alertas de soporte, seguridad y cambios en tu perfil.",
        importance: AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 100, 150],
        lightColor: "#16A34A",
        enableVibrate: true,
        enableLights: false,
        showBadge: true,
      }
    ),
  ]);
}

import { Alert, Linking } from "react-native";

// Acepta números como "987654321" o "+51987654321"
const TELEFONO_VALIDO = /^\+?\d{6,15}$/;

function abrirEnlace(enlace: string, mensajeError: string) {
  Linking.openURL(enlace).catch((err) => {
    console.warn("No se pudo abrir el enlace de contacto:", err);
    Alert.alert("No se pudo abrir", mensajeError);
  });
}

/** Abre la app de teléfono con el número del conductor */
export function llamarConductor(telefono: string | undefined) {
  if (!telefono || !TELEFONO_VALIDO.test(telefono)) {
    Alert.alert("Sin número", "Tu conductor no tiene un número de teléfono disponible.");
    return;
  }
  abrirEnlace(`tel:${telefono}`, "Tu celular no permite hacer llamadas desde la app.");
}

/** Abre la app de mensajes con el número del conductor */
export function escribirConductor(telefono: string | undefined) {
  if (!telefono || !TELEFONO_VALIDO.test(telefono)) {
    Alert.alert("Sin número", "Tu conductor no tiene un número de teléfono disponible.");
    return;
  }
  abrirEnlace(`sms:${telefono}`, "Tu celular no permite enviar mensajes desde la app.");
}
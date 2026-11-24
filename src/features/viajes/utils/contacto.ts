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

/** Abre el chat in-app seguro protegiendo la privacidad según LPDP Ley 29733 */
export function escribirConductor(
  _telefono?: string | undefined,
  onAbrirChat?: () => void
) {
  if (onAbrirChat) {
    onAbrirChat();
    return;
  }
  Alert.alert(
    "Mensajería privada",
    "La comunicación se realiza de forma segura mediante el chat dentro de la app para proteger tu número privado."
  );
}
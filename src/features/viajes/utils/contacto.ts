import { Alert, Linking } from "react-native";

export const NUMEROS_EMERGENCIA = {
  POLICIA: "105",
  SAMU: "106",
  BOMBEROS: "116",
} as const;

function abrirEnlace(enlace: string, mensajeError: string) {
  Linking.openURL(enlace).catch((err) => {
    console.warn("No se pudo abrir el enlace de contacto:", err);
    Alert.alert("No se pudo abrir", mensajeError);
  });
}

/** Abre la app de teléfono únicamente para números de emergencia autorizados */
export function llamarEmergencia(numero: string = NUMEROS_EMERGENCIA.POLICIA) {
  abrirEnlace(`tel:${numero}`, "Tu celular no permite realizar llamadas de emergencia.");
}

/**
 * Por privacidad y cumplimiento de la Ley 29733 (LPDP) y CP Art. 151-A,
 * no se exponen ni llaman números telefónicos personales directamente.
 * Toda la comunicación entre pasajero y conductor se canaliza por el chat in-app.
 */
export function llamarConductor(_telefono?: string | undefined, onAbrirChat?: () => void) {
  if (onAbrirChat) {
    onAbrirChat();
    return;
  }
  Alert.alert(
    "Llamadas protegidas",
    "Por seguridad y privacidad (Ley 29733), comunícate con tu conductor exclusivamente a través del chat dentro de la app.",
    [{ text: "Entendido" }]
  );
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
/**
 * Mapeo de códigos de error de verificación de identidad (DNI)
 * a mensajes claros, amigables y contextualizados en la interfaz de usuario.
 */

export const MAPA_MENSAJES_ERROR_DNI: Record<string, string> = {
  SIN_CONEXION:
    "No se pudo comprobar tu conexión a internet. Revisa tus datos móviles o red Wi-Fi e inténtalo nuevamente.",
  TIEMPO_AGOTADO:
    "La consulta de identidad tardó más de lo esperado. Por favor reintenta en unos instantes.",
  DNI_INVALIDO:
    "El DNI ingresado no es válido. Debe contener exactamente 8 dígitos numéricos.",
  DNI_NO_ENCONTRADO:
    "No se encontraron datos registrados para este DNI en el padrón oficial.",
  DNI_YA_REGISTRADO:
    "Este número de DNI ya se encuentra registrado en Altokke. Inicia sesión con tu cuenta.",
  ERROR_PROVEEDOR:
    "El servicio oficial de verificación de identidad no está disponible en este momento. Inténtalo más tarde.",
  NO_AUTORIZADO:
    "No fue posible autorizar la consulta de identidad. Contacta con soporte técnico de Altokke.",
};

export function obtenerMensajeErrorDni(
  codigo?: string | null,
  mensajeRespaldo = "No fue posible verificar el DNI. Inténtalo nuevamente."
): string {
  if (!codigo) return mensajeRespaldo;
  return MAPA_MENSAJES_ERROR_DNI[codigo] || mensajeRespaldo;
}

export default obtenerMensajeErrorDni;
